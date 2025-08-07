import { Task, CreateTask, UpdateTask, TaskBuckets } from '../models/Task';
import { QueryFunction } from '../db/types';
import { createTaskRepository } from '../repositories/taskRepository';
import { createJournalRepository } from '../repositories/journalRepository';
import { query } from '../db';

export const createTaskService = (queryFn: QueryFunction) => {
  const taskRepo = createTaskRepository(queryFn);
  const journalRepo = createJournalRepository(queryFn);

  return {
    /**
     * Get all tasks for a user with hierarchical ordering
     */
    getUserTasks: async (userId: number): Promise<Task[]> => {
      return taskRepo.findHierarchyByUserId(userId);
    },

    /**
     * Get all tasks for a user organized into buckets based on recurrence type
     */
    getUserTasksBucketed: async (
      userId: number,
      filters?: { completed?: boolean }
    ): Promise<TaskBuckets> => {
      const bucketedTasks = await taskRepo.findBucketedTasksByUserId(
        userId,
        filters
      );

      return {
        daily: bucketedTasks.filter((task) => task.task_bucket === 'daily'),
        weekly: bucketedTasks.filter((task) => task.task_bucket === 'weekly'),
        monthly: bucketedTasks.filter((task) => task.task_bucket === 'monthly'),
        yearly: bucketedTasks.filter((task) => task.task_bucket === 'yearly'),
        custom: bucketedTasks.filter((task) => task.task_bucket === 'custom'),
        regular: bucketedTasks.filter((task) => task.task_bucket === 'regular'),
      };
    },

    /**
     * Get all tasks for a user organized into buckets with hierarchical ordering preserved
     */
    getUserTasksBucketedHierarchical: async (
      userId: number,
      filters?: { completed?: boolean }
    ): Promise<TaskBuckets> => {
      const bucketedTasks =
        await taskRepo.findBucketedTasksByUserIdHierarchical(userId, filters);

      return {
        daily: bucketedTasks.filter((task) => task.task_bucket === 'daily'),
        weekly: bucketedTasks.filter((task) => task.task_bucket === 'weekly'),
        monthly: bucketedTasks.filter((task) => task.task_bucket === 'monthly'),
        yearly: bucketedTasks.filter((task) => task.task_bucket === 'yearly'),
        custom: bucketedTasks.filter((task) => task.task_bucket === 'custom'),
        regular: bucketedTasks.filter((task) => task.task_bucket === 'regular'),
      };
    },

    /**
     * Get all tasks for a user with bucketing information (flat array)
     * This returns the raw bucketed tasks in their proper order
     */
    getUserTasksBucketedFlat: async (
      userId: number,
      filters?: { completed?: boolean }
    ) => {
      return taskRepo.findBucketedTasksByUserId(userId, filters);
    },

    /**
     * Get all tasks for a specific journal
     */
    getJournalTasks: async (
      journalId: string,
      userId?: number
    ): Promise<Task[]> => {
      const journal = await journalRepo.findById(journalId);

      if (!journal) {
        return [];
      }

      if (journal.public) {
        return taskRepo.findByJournalIdHierarchical(journalId);
      }

      if (userId && journal.user_id === userId) {
        return taskRepo.findByJournalIdHierarchical(journalId);
      }

      return [];
    },

    /**
     * Get a task by ID
     */
    getTaskById: async (id: string, userId?: number): Promise<Task | null> => {
      const task = await taskRepo.findById(id);

      if (!task) {
        return null;
      }

      const journal = await journalRepo.findById(task.journal_id);

      if (!journal) {
        return null;
      }

      if (journal.public) {
        return task;
      }

      if (userId && journal.user_id === userId) {
        return task;
      }

      return null;
    },

    /**
     * Create a new task
     */
    createTask: async (
      userId: number,
      data: Omit<CreateTask, 'user_id'>
    ): Promise<Task | null> => {
      return taskRepo.createWithJournalValidation(
        userId,
        data.journal_id,
        data.title,
        data.description
      );
    },

    /**
     * Update a task
     */
    updateTask: async (
      id: string,
      userId: number,
      data: UpdateTask
    ): Promise<Task | null> => {
      return taskRepo.updateWithUserValidation(id, userId, data);
    },

    /**
     * Delete a task
     */
    deleteTask: async (id: string, userId: number): Promise<boolean> => {
      return taskRepo.deleteWithUserValidation(id, userId);
    },

    /**
     * Toggle task completion status
     */
    toggleTaskCompletion: async (
      id: string,
      userId: number
    ): Promise<{
      task: Task | null;
      canComplete: boolean;
      incompleteChildren?: Task[];
      error?: string;
    }> => {
      const task = await taskRepo.findById(id);

      if (!task) {
        return { task: null, canComplete: false, error: 'Task not found' };
      }

      const journal = await journalRepo.findById(task.journal_id);

      if (!journal) {
        return { task: null, canComplete: false, error: 'Journal not found' };
      }

      if (journal.user_id !== userId) {
        return { task: null, canComplete: false, error: 'Unauthorized' };
      }

      // Use new validation method that checks for incomplete children
      const result = await taskRepo.completeTaskWithValidation(
        id,
        !task.completed
      );

      return {
        task: result.task,
        canComplete: result.canComplete,
        incompleteChildren: result.incompleteChildren,
        error: result.error,
      };
    },

    // ===== TASK HIERARCHY METHODS =====

    /**
     * Create a sub-task under a parent task
     */
    createSubTask: async (
      userId: number,
      parentId: string,
      data: Omit<CreateTask, 'user_id' | 'parent_task_id'>
    ): Promise<Task | null> => {
      // Use single-trip repository method that validates and creates in one query
      const subTask = await taskRepo.createSubTaskWithValidation(
        userId,
        parentId,
        data.title,
        data.description
      );

      if (!subTask) {
        // Validation failed - either parent doesn't exist, doesn't belong to user, or depth limit exceeded
        return null;
      }

      return subTask;
    },

    /**
     * Get all possible parent tasks for a given task
     */
    getValidParentTasks: async (
      taskId: string,
      userId: number
    ): Promise<Task[]> => {
      // Use single-trip repository method that gets valid parents in one query
      return taskRepo.getValidParentTasksForTask(taskId, userId);
    },

    /**
     * Handle completion logic for tasks with sub-tasks
     * Returns information about sub-tasks that need attention
     */
    handleTaskCompletion: async (
      taskId: string,
      completed: boolean
    ): Promise<{
      task: Task | null;
      canComplete: boolean;
      incompleteChildren: Task[];
      error?: string;
    }> => {
      // Use validation method that checks for incomplete children
      const result = await taskRepo.completeTaskWithValidation(
        taskId,
        completed
      );
      return {
        task: result.task,
        canComplete: result.canComplete,
        incompleteChildren: result.incompleteChildren,
        error: result.error,
      };
    },

    /**
     * Toggle task completion with optimized database queries
     * Gets current state and validates user ownership in minimal trips
     */
    toggleTaskCompletionOptimized: async (
      taskId: string,
      userId: number
    ): Promise<{
      task: Task | null;
      canComplete: boolean;
      incompleteChildren: Task[];
      error?: string;
    }> => {
      return taskRepo.toggleTaskCompletionWithUserValidation(taskId, userId);
    },

    /**
     * Reorder a task relative to another task
     */
    reorderTask: async (
      taskId: string,
      userId: number,
      referenceTaskId: string,
      position: 'above' | 'below'
    ): Promise<Task | null> => {
      const task = await taskRepo.findById(taskId);
      if (!task || task.user_id !== userId) {
        return null;
      }

      // Get the new priority based on the reference task and position
      const newPriority = await taskRepo.calculateNewPriority(
        userId,
        taskId,
        referenceTaskId,
        position
      );

      if (newPriority === null) {
        return null;
      }

      return taskRepo.updatePriority(taskId, newPriority);
    },

    /**
     * Reorder a pending task relative to another task, considering only pending tasks
     * This is used specifically for dashboard drag-and-drop where only pending tasks are shown
     */
    reorderPendingTask: async (
      taskId: string,
      userId: number,
      referenceTaskId: string,
      position: 'above' | 'below'
    ): Promise<Task | null> => {
      const task = await taskRepo.findById(taskId);
      if (!task || task.user_id !== userId) {
        return null;
      }

      // Ensure we're only reordering pending tasks
      if (task.completed) {
        return null;
      }

      // Get the new priority based on the reference task and position, considering only pending tasks
      const newPriority = await taskRepo.calculateNewPriorityForPendingTasks(
        userId,
        taskId,
        referenceTaskId,
        position
      );

      if (newPriority === null) {
        return null;
      }

      return taskRepo.updatePriority(taskId, newPriority);
    },

    /**
     * Reorder a pending task with descendants in a single transaction
     * This handles the entire hierarchical reorder operation atomically
     */
    reorderPendingTaskWithDescendants: async (
      taskId: string,
      userId: number,
      referenceTaskId: string,
      position: 'above' | 'below',
      descendantIds?: string[]
    ): Promise<Task | null> => {
      return taskRepo.reorderPendingTaskWithDescendants(
        taskId,
        userId,
        referenceTaskId,
        position,
        descendantIds
      );
    },

    /**
     * Create tasks from reference tasks for a specific user and date
     * This processes all active reference tasks for the user that are due on the target date
     */
    createTasksFromReferenceTasksForUser: async (
      userId: number,
      targetDate: Date
    ): Promise<{ tasks_created: string; tasks_skipped: string }> => {
      return taskRepo.createTasksFromReferenceTasksForUser(userId, targetDate);
    },

    /**
     * Create tasks from reference tasks for a specific date (all users)
     * This processes all active reference tasks across all users that are due on the target date
     */
    createTasksFromReferenceTasksForDate: async (
      targetDate: Date
    ): Promise<{
      tasks_created: string;
      tasks_skipped: string;
      users_processed: string;
      reference_tasks_processed: string;
    }> => {
      return taskRepo.createTasksFromReferenceTasksForDate(targetDate);
    },

    /**
     * Get all reference tasks that need tasks created for a specific date (across all users)
     * This is useful for determining which users have tasks due on a given date
     */
    getReferenceTasksDueForDate: async (targetDate: Date) => {
      return taskRepo.getReferenceTasksDueForDate(targetDate);
    },
  };
};

// Create the default instance using the default query function
export const taskService = createTaskService(query);
