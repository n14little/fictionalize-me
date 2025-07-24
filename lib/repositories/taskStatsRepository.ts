import { query } from '../db';

export const taskStatsRepository = {
  /**
   * Get task statistics for a user
   */
  getUserTaskStats: async (
    userId: number
  ): Promise<{
    dailyCompletions: { date: string; completed: number }[];
  }> => {
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

    return {
      dailyCompletions: dailyCompletionResult.rows.map((row) => ({
        date: row.completed_at,
        completed: parseInt(row.completed),
      })),
    };
  },
};
