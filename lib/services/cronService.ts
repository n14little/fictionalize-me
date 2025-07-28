import { taskRepository } from '../repositories/taskRepository';

export interface CronJobResult {
  success: boolean;
  date: string;
  tasksCreated: number;
  tasksSkipped: number;
  usersProcessed: number;
  referenceTasksProcessed: number;
  errors?: string[];
}

export interface UserCronJobResult {
  success: boolean;
  date: string;
  userId: number;
  tasksCreated: number;
  tasksSkipped: number;
  errors?: string[];
}

export const cronService = {
  /**
   * Process daily task creation for all users (SQL-optimized)
   * Uses indexed next_scheduled_date column for maximum performance
   */
  processDailyTasks: async (targetDate?: Date): Promise<CronJobResult> => {
    const date = targetDate || new Date();
    date.setHours(0, 0, 0, 0);

    try {
      const result =
        await taskRepository.createTasksFromReferenceTasksForDate(date);

      return {
        success: true,
        date: date.toISOString().split('T')[0],
        tasksCreated: result.tasksCreated,
        tasksSkipped: result.tasksSkipped,
        usersProcessed: result.usersProcessed,
        referenceTasksProcessed: result.referenceTasksProcessed,
      };
    } catch (error) {
      const errorMessage = `Critical error in daily task processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage, error);

      return {
        success: false,
        date: date.toISOString().split('T')[0],
        tasksCreated: 0,
        tasksSkipped: 0,
        usersProcessed: 0,
        referenceTasksProcessed: 0,
        errors: [errorMessage],
      };
    }
  },

  /**
   * Process daily task creation for a specific user (SQL-optimized)
   * Useful for queue-based processing per user
   */
  processDailyTasksForUser: async (
    userId: number,
    targetDate?: Date
  ): Promise<UserCronJobResult> => {
    const date = targetDate || new Date();
    date.setHours(0, 0, 0, 0);

    try {
      const result = await taskRepository.createTasksFromReferenceTasksForUser(
        userId,
        date
      );

      return {
        success: true,
        date: date.toISOString().split('T')[0],
        userId,
        tasksCreated: result.tasksCreated,
        tasksSkipped: result.tasksSkipped,
      };
    } catch (error) {
      const errorMessage = `Error processing tasks for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage, error);

      return {
        success: false,
        date: date.toISOString().split('T')[0],
        userId,
        tasksCreated: 0,
        tasksSkipped: 0,
        errors: [errorMessage],
      };
    }
  },

  /**
   * Get users who have reference tasks due for a specific date
   * Useful for queue-based processing to know which users to process
   */
  getUsersWithTasksDueForDate: async (targetDate?: Date): Promise<number[]> => {
    const date = targetDate || new Date();
    date.setHours(0, 0, 0, 0);

    try {
      const referenceTasks =
        await taskRepository.getReferenceTasksDueForDate(date);
      const userIds = [...new Set(referenceTasks.map((task) => task.user_id))];
      return userIds;
    } catch (error) {
      console.error('Error getting users with tasks due:', error);
      return [];
    }
  },
};
