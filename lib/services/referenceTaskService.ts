import { query } from '../db';
import { QueryFunction } from '../db/types';
import { ReferenceTask, CreateReferenceTask } from '../models/ReferenceTask';
import { createTaskRepository } from '../repositories/taskRepository';

export const createReferenceTaskService = (query: QueryFunction) => {
  const taskRepository = createTaskRepository(query);

  return {
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
};

// Create the default instance using the default query function
export const referenceTaskService = createReferenceTaskService(query);
