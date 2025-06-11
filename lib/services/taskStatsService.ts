import { TaskStats } from '../../types/taskStats';
import { taskStatsRepository } from '../repositories/taskStatsRepository';
import { getWeeklyCompletionData, getDefaultTaskStats } from '../utils/taskStatsUtils';

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
      
      // Calculate completion rate
      const completionRate = rawStats.totalCount > 0
        ? parseFloat(((rawStats.completedCount / rawStats.totalCount) * 100).toFixed(2))
        : 0;

      // Use the raw data as is - the utility function will handle filling in missing dates
      const dailyCompletions = rawStats.dailyCompletions;

      // Calculate weekly completion data from raw timestamps in client timezone
      const weeklyCompletion = getWeeklyCompletionData(rawStats.weeklyCompletionTimes);
      
      // Transform data into the expected TaskStats format
      const taskStats: TaskStats = {
        completedTasks: rawStats.completedCount,
        pendingTasks: rawStats.pendingCount,
        totalTasks: rawStats.totalCount,
        completionRate,
        streakDays: 0, // Streak calculation removed as requested
        averageCompletionTime: rawStats.averageCompletionTime || 0,
        weeklyCompletion, // Now using client-side day calculation
        dailyCompletion: dailyCompletions
      };

      return taskStats;
    } catch (error) {
      console.error('Error getting user task stats:', error);
      // Return default stats on error
      return getDefaultTaskStats();
    }
  }
};
