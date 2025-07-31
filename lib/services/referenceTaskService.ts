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

      // Merge existing data with new data, giving precedence to new data
      const mergedData: CreateReferenceTask = {
        user_id: userId,
        journal_id: data.journal_id,
        title: data.title,
        description:
          data.description !== undefined
            ? data.description
            : existingTask.description || undefined,
        recurrence_type: data.recurrence_type,
        recurrence_interval:
          data.recurrence_interval !== undefined
            ? data.recurrence_interval
            : existingTask.recurrence_interval,
        recurrence_days_of_week:
          data.recurrence_days_of_week !== undefined
            ? data.recurrence_days_of_week
            : existingTask.recurrence_days_of_week || undefined,
        recurrence_day_of_month:
          data.recurrence_day_of_month !== undefined
            ? data.recurrence_day_of_month
            : existingTask.recurrence_day_of_month || undefined,
        recurrence_week_of_month:
          data.recurrence_week_of_month !== undefined
            ? data.recurrence_week_of_month
            : existingTask.recurrence_week_of_month || undefined,
        starts_on: data.starts_on,
        ends_on:
          data.ends_on !== undefined
            ? data.ends_on
            : existingTask.ends_on || undefined,
        is_active:
          data.is_active !== undefined
            ? data.is_active
            : existingTask.is_active,
      };

      return taskRepository.upsertReferenceTask({
        ...mergedData,
        id,
      });
    },
  };
};

// Create the default instance using the default query function
export const referenceTaskService = createReferenceTaskService(query);
