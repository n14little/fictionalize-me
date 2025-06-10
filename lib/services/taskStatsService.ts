import { TaskStats } from '../../types/taskStats';
import { taskStatsRepository } from '../repositories/taskStatsRepository';

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

      // Transform data into the expected TaskStats format
      const taskStats: TaskStats = {
        completedTasks: rawStats.completedCount,
        pendingTasks: rawStats.pendingCount,
        totalTasks: rawStats.totalCount,
        completionRate,
        streakDays: 0, // Streak calculation removed as requested
        averageCompletionTime: rawStats.averageCompletionTime || 0,
        weeklyCompletion: rawStats.weeklyCompletions,
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

// Fallback function that provides default stats if needed
function getDefaultTaskStats(): TaskStats {
  return {
    completedTasks: 0,
    pendingTasks: 0,
    totalTasks: 0,
    completionRate: 0,
    streakDays: 0,
    weeklyCompletion: [
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 },
      { day: 'Sat', count: 0 },
      { day: 'Sun', count: 0 }
    ],
    dailyCompletion: [], // Empty array instead of mock data for real implementation
    averageCompletionTime: 0
  };
}
