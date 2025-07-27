import { ReferenceTask, CreateReferenceTask } from '../models/ReferenceTask';
import { taskRepository } from '../repositories/taskRepository';

export const referenceTaskService = {
  /**
   * Get all reference tasks for a user
   */
  getUserReferenceTasks: async (userId: number): Promise<ReferenceTask[]> => {
    return taskRepository.findReferenceTasksByUserId(userId);
  },

  /**
   * Get a reference task by ID
   */
  getReferenceTaskById: async (id: string): Promise<ReferenceTask | null> => {
    return taskRepository.findReferenceTaskById(id);
  },

  /**
   * Create a new reference task
   */
  createReferenceTask: async (
    userId: number,
    data: Omit<CreateReferenceTask, 'user_id'>
  ): Promise<ReferenceTask> => {
    return taskRepository.upsertReferenceTask({
      ...data,
      user_id: userId,
    });
  },

  /**
   * Update an existing reference task
   */
  updateReferenceTask: async (
    id: string,
    userId: number,
    data: Omit<CreateReferenceTask, 'user_id'>
  ): Promise<ReferenceTask> => {
    // First check if the reference task exists and belongs to the user
    const existingTask = await taskRepository.findReferenceTaskById(id);
    if (!existingTask || existingTask.user_id !== userId) {
      throw new Error('Reference task not found or access denied');
    }

    return taskRepository.upsertReferenceTask({
      ...data,
      user_id: userId,
      id,
    });
  },
};
