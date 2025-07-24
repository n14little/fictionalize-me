export interface JournalStreak {
  id: number;
  user_id: number;
  streak_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJournalStreak {
  user_id: number;
  streak_date: Date;
}

export interface UserStreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastStreakDate: Date | null;
  streakDates: Date[];
}
