import { JournalStreak, UserStreakStats } from '../models/JournalStreak';
import { journalStreakRepository } from '../repositories/journalStreakRepository';

export const journalStreakService = {
  /**
   * Record a journal streak for a user for today's date
   */
  recordJournalStreak: async (userId: number): Promise<JournalStreak> => {
    const today = new Date();
    return journalStreakRepository.createIfNotExists(userId, today);
  },

  /**
   * Get a user's streak statistics
   */
  getUserStreakStats: async (userId: number): Promise<UserStreakStats> => {
    return journalStreakRepository.getUserStreakStats(userId);
  },

  /**
   * Get all streak records for a user
   */
  getUserStreaks: async (userId: number): Promise<JournalStreak[]> => {
    return journalStreakRepository.findByUserId(userId);
  }
};