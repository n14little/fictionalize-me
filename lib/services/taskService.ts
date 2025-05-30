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
  getJournalTasks: async (journalId: string, userId?: number): Promise<Task[]> => {
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
  createTask: async (userId: number, data: Omit<CreateTask, 'user_id'>): Promise<Task | null> => {
    const journal = await journalRepository.findById(data.journal_id);
    
    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    return taskRepository.create({
      ...data,
      user_id: userId
    });
  },

  /**
   * Update a task
   */
  updateTask: async (id: string, userId: number, data: UpdateTask): Promise<Task | null> => {
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
  toggleTaskCompletion: async (id: string, userId: number): Promise<Task | null> => {
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
      completed_at: !task.completed ? new Date() : null
    });
  }
};
