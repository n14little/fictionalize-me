import { UserStreakStats } from '../lib/models/JournalStreak';
import { JournalCalendar } from './JournalCalendar';
import { JournalStreakWrapper } from './JournalStreakWrapper';

interface JournalStreakCalendarProps {
  streakStats: UserStreakStats;
}

export function JournalStreakCalendar({
  streakStats,
}: JournalStreakCalendarProps) {
  // Format dates to strings for the calendar component
  const formattedDates = streakStats.streakDates.map((date) =>
    date.toISOString()
  );

  return (
    <div className="mb-6">
      <JournalStreakWrapper streakStats={streakStats}>
        <JournalCalendar streakDates={formattedDates} />
      </JournalStreakWrapper>
    </div>
  );
}
