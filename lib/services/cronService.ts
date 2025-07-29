import { taskService } from './taskService';

export interface CronJobResult {
  success: boolean;
  date: string;
  tasksCreated: string;
  tasksSkipped: string;
  usersProcessed: string;
  referenceTasksProcessed: string;
  errors?: string[];
}

export interface UserCronJobResult {
  success: boolean;
  date: string;
  userId: number;
  tasksCreated: string;
  tasksSkipped: string;
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
        await taskService.createTasksFromReferenceTasksForDate(date);

      return {
        success: true,
        date: date.toISOString().split('T')[0],
        tasksCreated: result.tasks_created,
        tasksSkipped: result.tasks_skipped,
        usersProcessed: result.users_processed,
        referenceTasksProcessed: result.reference_tasks_processed,
      };
    } catch (error) {
      const errorMessage = `Critical error in daily task processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage, error);

      return {
        success: false,
        date: date.toISOString().split('T')[0],
        tasksCreated: '0',
        tasksSkipped: '0',
        usersProcessed: '0',
        referenceTasksProcessed: '0',
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
      const result = await taskService.createTasksFromReferenceTasksForUser(
        userId,
        date
      );

      return {
        success: true,
        date: date.toISOString().split('T')[0],
        userId,
        tasksCreated: result.tasks_created,
        tasksSkipped: result.tasks_skipped,
      };
    } catch (error) {
      const errorMessage = `Error processing tasks for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage, error);

      return {
        success: false,
        date: date.toISOString().split('T')[0],
        userId,
        tasksCreated: '0',
        tasksSkipped: '0',
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
        await taskService.getReferenceTasksDueForDate(date);
      const userIds = [...new Set(referenceTasks.map((task) => task.user_id))];
      return userIds;
    } catch (error) {
      console.error('Error getting users with tasks due:', error);
      return [];
    }
  },
};
