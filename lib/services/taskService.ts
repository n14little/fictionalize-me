import { Task, CreateTask, UpdateTask } from '../models/Task';
import { taskRepository } from '../repositories/taskRepository';
import { journalRepository } from '../repositories/journalRepository';

export const taskService = {
  /**
   * Get all tasks for a user with hierarchical ordering
   */
  getUserTasks: async (userId: number): Promise<Task[]> => {
    return taskRepository.findHierarchyByUserId(userId);
  },

  /**
   * Get all tasks for a specific journal
   */
  getJournalTasks: async (
    journalId: string,
    userId?: number
  ): Promise<Task[]> => {
    const journal = await journalRepository.findById(journalId);

    if (!journal) {
      return [];
    }

    if (journal.public) {
      return taskRepository.findByJournalId(journalId);
    }

    if (userId && journal.user_id === userId) {
      return taskRepository.findByJournalId(journalId);
    }

    return [];
  },

  /**
   * Get a task by ID
   */
  getTaskById: async (id: string, userId?: number): Promise<Task | null> => {
    const task = await taskRepository.findById(id);

    if (!task) {
      return null;
    }

    const journal = await journalRepository.findById(task.journal_id);

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
    return taskRepository.createWithJournalValidation(
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
    return taskRepository.updateWithUserValidation(id, userId, data);
  },

  /**
   * Delete a task
   */
  deleteTask: async (id: string, userId: number): Promise<boolean> => {
    return taskRepository.deleteWithUserValidation(id, userId);
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
    const task = await taskRepository.findById(id);

    if (!task) {
      return { task: null, canComplete: false, error: 'Task not found' };
    }

    const journal = await journalRepository.findById(task.journal_id);

    if (!journal) {
      return { task: null, canComplete: false, error: 'Journal not found' };
    }

    if (journal.user_id !== userId) {
      return { task: null, canComplete: false, error: 'Unauthorized' };
    }

    // Use new validation method that checks for incomplete children
    const result = await taskRepository.completeTaskWithValidation(
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
    const subTask = await taskRepository.createSubTaskWithValidation(
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
    return taskRepository.getValidParentTasksForTask(taskId, userId);
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
    const result = await taskRepository.completeTaskWithValidation(
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
    return taskRepository.toggleTaskCompletionWithUserValidation(
      taskId,
      userId
    );
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
    const task = await taskRepository.findById(taskId);
    if (!task || task.user_id !== userId) {
      return null;
    }

    // Get the new priority based on the reference task and position
    const newPriority = await taskRepository.calculateNewPriority(
      userId,
      taskId,
      referenceTaskId,
      position
    );

    if (newPriority === null) {
      return null;
    }

    console.log('Reordering task:', {
      taskId,
      referenceTaskId,
      position,
      newPriority,
    });

    return taskRepository.updatePriority(taskId, newPriority);
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
    const task = await taskRepository.findById(taskId);
    if (!task || task.user_id !== userId) {
      return null;
    }

    // Ensure we're only reordering pending tasks
    if (task.completed) {
      console.log('Cannot reorder completed task:', taskId);
      return null;
    }

    // Get the new priority based on the reference task and position, considering only pending tasks
    const newPriority =
      await taskRepository.calculateNewPriorityForPendingTasks(
        userId,
        taskId,
        referenceTaskId,
        position
      );

    if (newPriority === null) {
      return null;
    }

    console.log('Reordering pending task:', {
      taskId,
      referenceTaskId,
      position,
      newPriority,
      taskTitle: task.title,
      oldPriority: task.priority,
    });

    return taskRepository.updatePriority(taskId, newPriority);
  },

  /**
   * Create tasks from reference tasks for a specific user and date
   * This processes all active reference tasks for the user that are due on the target date
   */
  createTasksFromReferenceTasksForUser: async (
    userId: number,
    targetDate: Date
  ): Promise<{ tasks_created: string; tasks_skipped: string }> => {
    return taskRepository.createTasksFromReferenceTasksForUser(
      userId,
      targetDate
    );
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
    return taskRepository.createTasksFromReferenceTasksForDate(targetDate);
  },

  /**
   * Get all reference tasks that need tasks created for a specific date (across all users)
   * This is useful for determining which users have tasks due on a given date
   */
  getReferenceTasksDueForDate: async (targetDate: Date) => {
    return taskRepository.getReferenceTasksDueForDate(targetDate);
  },
};
