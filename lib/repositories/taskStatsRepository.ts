import { query } from '../db';
// Task stats repository

export const taskStatsRepository = {
  /**
   * Get task statistics for a user
   */
  getUserTaskStats: async (userId: number): Promise<{
    completedCount: number;
    pendingCount: number;
    totalCount: number;
    averageCompletionTime: number;
    dailyCompletions: { date: string; completed: number }[];
    weeklyCompletionTimes: string[]; // Raw completion timestamps for all completed tasks
  }> => {
    // Get completed and pending task counts
    const taskCountsResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE completed = true) as completed_count,
        COUNT(*) FILTER (WHERE completed = false) as pending_count,
        COUNT(*) as total_count
      FROM tasks 
      WHERE user_id = $1`,
      [userId]
    );

    // Get average completion time in minutes
    // Calculation: average time between task creation and completion (in minutes)
    const avgCompletionResult = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) as avg_completion_time
      FROM tasks
      WHERE user_id = $1 AND completed = true AND completed_at IS NOT NULL`,
      [userId]
    );

    // Get daily task completion data for the last 30 days
    const dailyCompletionResult = await query(
      `SELECT 
        completed_at,
        COUNT(*) as completed
      FROM tasks
      WHERE
        user_id = $1 
        AND completed = true 
        AND completed_at IS NOT NULL
        AND completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY completed_at
      ORDER BY completed_at ASC`,
      [userId]
    );

    // Get raw completion timestamps for all completed tasks
    // We'll calculate days in the frontend to respect user's timezone
    const weeklyCompletionResult = await query(
      `SELECT
        completed_at
      FROM tasks
      WHERE
        user_id = $1 
        AND completed = true
        AND completed_at IS NOT NULL
      ORDER BY completed_at`,
      [userId]
    );

    // Return raw completion timestamps for all completed tasks
    // The service layer will handle formatting based on user's timezone
    const weeklyCompletionTimes = weeklyCompletionResult.rows.map(row => row.completed_at);

    return {
      completedCount: parseInt(taskCountsResult.rows[0]?.completed_count || '0'),
      pendingCount: parseInt(taskCountsResult.rows[0]?.pending_count || '0'),
      totalCount: parseInt(taskCountsResult.rows[0]?.total_count || '0'),
      averageCompletionTime: Math.round(parseFloat(avgCompletionResult.rows[0]?.avg_completion_time || '0')),
      dailyCompletions: dailyCompletionResult.rows.map(row => ({
        date: row.completed_at,
        completed: parseInt(row.completed)
      })),
      weeklyCompletionTimes // Return timestamps for all completed tasks
    };
  }
};
