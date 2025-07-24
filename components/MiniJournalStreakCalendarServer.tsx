/**
 * Server component that pre-processes the streak data for the MiniJournalStreakCalendar
 * This helps eliminate layout jitter by ensuring the data is ready during initial render
 */

import { UserStreakStats } from '../lib/models/JournalStreak';
import { MiniJournalStreakCalendar } from './MiniJournalStreakCalendar';

interface MiniJournalStreakCalendarServerProps {
  streakStats: UserStreakStats;
}

export function MiniJournalStreakCalendarServer({
  streakStats,
}: MiniJournalStreakCalendarServerProps) {
  // Pre-process the streak data on the server
  // This ensures that when the client component receives the props,
  // the data is already in the expected format for immediate rendering

  // Create a copy of the streakStats object with properly serialized dates
  const processedStreakStats: UserStreakStats = {
    ...streakStats,
    // Ensure all dates are properly serialized so they can be transmitted to the client
    streakDates: streakStats.streakDates.map((date) => new Date(date)),
    lastStreakDate: streakStats.lastStreakDate
      ? new Date(streakStats.lastStreakDate)
      : null,
  };

  return <MiniJournalStreakCalendar streakStats={processedStreakStats} />;
}
