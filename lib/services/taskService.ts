import { Task, CreateTask, UpdateTask } from '../models/Task';
import { taskRepository } from '../repositories/taskRepository';
import { journalRepository } from '../repositories/journalRepository';

export const taskService = {
  /**
   * Get all tasks for a user
   */
  getUserTasks: async (userId: number): Promise<Task[]> => {
    return taskRepository.findByUserId(userId);
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
    const journal = await journalRepository.findById(data.journal_id);

    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    return taskRepository.create({
      ...data,
      user_id: userId,
    });
  },

  /**
   * Update a task
   */
  updateTask: async (
    id: string,
    userId: number,
    data: UpdateTask
  ): Promise<Task | null> => {
    const task = await taskRepository.findById(id);

    if (!task) {
      return null;
    }

    const journal = await journalRepository.findById(task.journal_id);

    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    return taskRepository.update(id, data);
  },

  /**
   * Delete a task
   */
  deleteTask: async (id: string, userId: number): Promise<boolean> => {
    const task = await taskRepository.findById(id);

    if (!task) {
      return false;
    }

    const journal = await journalRepository.findById(task.journal_id);

    if (!journal) {
      return false;
    }

    if (journal.user_id !== userId) {
      return false;
    }

    return taskRepository.delete(id);
  },

  /**
   * Toggle task completion status
   */
  toggleTaskCompletion: async (
    id: string,
    userId: number
  ): Promise<Task | null> => {
    const task = await taskRepository.findById(id);

    if (!task) {
      return null;
    }

    const journal = await journalRepository.findById(task.journal_id);

    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    return taskRepository.update(id, {
      completed: !task.completed,
      completed_at: !task.completed ? new Date() : null,
    });
  },

  /**
   * Reorder a task by moving it between two other tasks
   */
  reorderTask: async (
    taskId: string,
    userId: number,
    afterTaskId?: string,
    beforeTaskId?: string
  ): Promise<Task | null> => {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      return null;
    }

    const journal = await journalRepository.findById(task.journal_id);
    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    // Get all tasks for this user to calculate new priority
    const allTasks = await taskRepository.getTasksForReordering(userId);
    
    let newPriority: number;

    if (!afterTaskId && !beforeTaskId) {
      // Move to the beginning
      const firstTask = allTasks.find(t => t.id !== taskId);
      newPriority = firstTask ? firstTask.priority - 1000 : 1000;
    } else if (afterTaskId && !beforeTaskId) {
      // Move after a specific task (to the end or before the next task)
      const afterTask = allTasks.find(t => t.id === afterTaskId);
      if (!afterTask) return null;
      
      const afterIndex = allTasks.findIndex(t => t.id === afterTaskId);
      const nextTask = allTasks[afterIndex + 1];
      
      if (nextTask && nextTask.id !== taskId) {
        // Calculate priority between afterTask and nextTask
        newPriority = (afterTask.priority + nextTask.priority) / 2;
      } else {
        // Move to the end
        newPriority = afterTask.priority + 1000;
      }
    } else if (!afterTaskId && beforeTaskId) {
      // Move before a specific task
      const beforeTask = allTasks.find(t => t.id === beforeTaskId);
      if (!beforeTask) return null;
      
      const beforeIndex = allTasks.findIndex(t => t.id === beforeTaskId);
      const prevTask = beforeIndex > 0 ? allTasks[beforeIndex - 1] : null;
      
      if (prevTask && prevTask.id !== taskId) {
        // Calculate priority between prevTask and beforeTask
        newPriority = (prevTask.priority + beforeTask.priority) / 2;
      } else {
        // Move to the beginning
        newPriority = beforeTask.priority - 1000;
      }
    } else {
      // Move between two specific tasks
      const afterTask = allTasks.find(t => t.id === afterTaskId);
      const beforeTask = allTasks.find(t => t.id === beforeTaskId);
      
      if (!afterTask || !beforeTask) return null;
      
      // Calculate priority between the two tasks
      newPriority = (afterTask.priority + beforeTask.priority) / 2;
    }

    return taskRepository.updatePriority(taskId, newPriority);
  },
};
