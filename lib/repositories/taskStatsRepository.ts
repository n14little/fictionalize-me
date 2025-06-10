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
    weeklyCompletions: { day: string; count: number }[];
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
        TO_CHAR(DATE_TRUNC('day', completed_at), 'YYYY-MM-DD') as date,
        COUNT(*) as completed
      FROM tasks
      WHERE 
        user_id = $1 
        AND completed = true 
        AND completed_at IS NOT NULL
        AND completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', completed_at), TO_CHAR(DATE_TRUNC('day', completed_at), 'YYYY-MM-DD')
      ORDER BY date ASC`,
      [userId]
    );

    // Get weekly completion data (by day of week)
    const weeklyCompletionResult = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('day', completed_at), 'Dy') as day,
        COUNT(*) as count
      FROM tasks
      WHERE 
        user_id = $1 
        AND completed = true 
        AND completed_at IS NOT NULL
        AND completed_at > NOW() - INTERVAL '7 days'
      GROUP BY day
      ORDER BY MIN(completed_at)`,
      [userId]
    );

    // Define day order and ensure all days are present
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Ensure all days of the week are represented in weekly completion
    const weeklyCompletions = dayOrder.map(day => {
      const found = weeklyCompletionResult.rows.find(r => r.day === day);
      return {
        day,
        count: found ? parseInt(found.count) : 0
      };
    });

    return {
      completedCount: parseInt(taskCountsResult.rows[0]?.completed_count || '0'),
      pendingCount: parseInt(taskCountsResult.rows[0]?.pending_count || '0'),
      totalCount: parseInt(taskCountsResult.rows[0]?.total_count || '0'),
      averageCompletionTime: Math.round(parseFloat(avgCompletionResult.rows[0]?.avg_completion_time || '0')),
      dailyCompletions: dailyCompletionResult.rows.map(row => ({
        date: row.date,
        completed: parseInt(row.completed)
      })),
      weeklyCompletions
    };
  }
};
