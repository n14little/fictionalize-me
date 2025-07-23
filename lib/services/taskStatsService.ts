import { TaskStats } from '../../types/taskStats';
import { taskStatsRepository } from '../repositories/taskStatsRepository';
import { getDefaultTaskStats } from '../utils/taskStatsUtils';

export const taskStatsService = {
  /**
   * Get task statistics for a user
   */
  getUserTaskStats: async (userId: number): Promise<TaskStats> => {
    // If no user ID provided, return default mock data
    if (!userId) {
      return getDefaultTaskStats();
    }

    try {
      // Get raw task stats from repository
      const rawStats = await taskStatsRepository.getUserTaskStats(userId);
      
      // Transform data into the expected TaskStats format
      const taskStats: TaskStats = {
        dailyCompletion: rawStats.dailyCompletions
      };

      return taskStats;
    } catch (error) {
      console.error('Error getting user task stats:', error);
      // Return default stats on error
      return getDefaultTaskStats();
    }
  }
};
