import { query } from '../db';
import { JournalStreak, CreateJournalStreak, UserStreakStats } from '../models/JournalStreak';
import { formatUtcDate, getUtcToday, getUtcYesterday, isSameUtcDay, isConsecutiveUtcDay, getUtcMidnight } from '../utils/dateUtils';

export const journalStreakRepository = {
  /**
   * Find streak records for a user
   */
  findByUserId: async (userId: number): Promise<JournalStreak[]> => {
    const result = await query(
      'SELECT * FROM journal_streaks WHERE user_id = $1 ORDER BY streak_date DESC',
      [userId]
    );
    return result.rows;
  },

  /**
   * Find a streak record by date and user
   */
  findByUserIdAndDate: async (userId: number, date: Date): Promise<JournalStreak | null> => {
    // Always convert to UTC date string for database operations
    const dateStr = formatUtcDate(date);
    const result = await query(
      'SELECT * FROM journal_streaks WHERE user_id = $1 AND streak_date::date = $2::date',
      [userId, dateStr]
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new streak record
   */
  create: async (streakData: CreateJournalStreak): Promise<JournalStreak> => {
    const result = await query(
      'INSERT INTO journal_streaks (user_id, streak_date) VALUES ($1, $2) RETURNING *',
      [streakData.user_id, streakData.streak_date]
    );
    return result.rows[0];
  },

  /**
   * Create a streak record if it doesn't exist for today
   */
  createIfNotExists: async (userId: number, date: Date = new Date()): Promise<JournalStreak> => {
    // Ensure we're working with UTC midnight
    const utcDate = getUtcMidnight(date);
    // Format date to YYYY-MM-DD in UTC
    const dateStr = formatUtcDate(utcDate);
    
    // Use an upsert to handle the "create if not exists" logic
    const result = await query(
      `INSERT INTO journal_streaks (user_id, streak_date) 
       VALUES ($1, $2::date) 
       ON CONFLICT (user_id, (streak_date::date)) DO NOTHING 
       RETURNING *`,
      [userId, dateStr]
    );
    
    // If row was inserted, return it, otherwise find and return the existing row
    if (result.rows[0]) {
      return result.rows[0];
    } else {
      const existing = await query(
        'SELECT * FROM journal_streaks WHERE user_id = $1 AND streak_date::date = $2::date',
        [userId, dateStr]
      );
      return existing.rows[0];
    }
  },

  /**
   * Get streak statistics for a user
   */
  getUserStreakStats: async (userId: number): Promise<UserStreakStats> => {
    // Get all streak dates for the user
    const result = await query(
      'SELECT streak_date FROM journal_streaks WHERE user_id = $1 ORDER BY streak_date',
      [userId]
    );
    
    const streakDates = result.rows.map(row => new Date(row.streak_date));
    
    if (streakDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        lastStreakDate: null,
        streakDates: []
      };
    }

    // Calculate total days journaled
    const totalDays = streakDates.length;

    // Get the last streak date
    const lastStreakDate = streakDates[streakDates.length - 1];
    
    // Calculate current streak
    let currentStreak = 0;
    const today = getUtcToday();
    const yesterday = getUtcYesterday();
    
    // Check if the last streak date is today or yesterday to maintain streak
    const lastDateUtc = getUtcMidnight(new Date(lastStreakDate));
    
    // Start counting the current streak from the most recent date
    if (isSameUtcDay(lastDateUtc, today) || isSameUtcDay(lastDateUtc, yesterday)) {
      currentStreak = 1;
      
      // Go backwards from second-most-recent date
      for (let i = streakDates.length - 2; i >= 0; i--) {
        const currentDate = getUtcMidnight(new Date(streakDates[i]));
        
        const expectedPrevDate = getUtcMidnight(new Date(streakDates[i + 1]));
        expectedPrevDate.setUTCDate(expectedPrevDate.getUTCDate() - 1);
        
        // Check if days are consecutive using UTC-based comparison
        if (isSameUtcDay(currentDate, expectedPrevDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // Calculate longest streak
    let longestStreak = 1;
    let currentRun = 1;
    
    // Sort dates chronologically for streak calculation
    const sortedDates = [...streakDates].sort((a, b) => a.getTime() - b.getTime());
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = getUtcMidnight(new Date(sortedDates[i]));
      const prevDate = getUtcMidnight(new Date(sortedDates[i - 1]));
      
      // Check if days are consecutive using our UTC helper
      if (isConsecutiveUtcDay(prevDate, currentDate)) {
        // Consecutive day
        currentRun++;
        longestStreak = Math.max(longestStreak, currentRun);
      } else {
        // Break in the streak
        currentRun = 1;
      }
    }
    
    return {
      currentStreak,
      longestStreak,
      totalDays,
      lastStreakDate,
      streakDates
    };
  }
};