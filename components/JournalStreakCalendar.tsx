import { journalStreakService } from '../lib/services/journalStreakService';
import { JournalCalendar } from './JournalCalendar';
import { JournalStreakWrapper } from './JournalStreakWrapper';

interface JournalStreakCalendarProps {
  userId: number;
}

export async function JournalStreakCalendar({ userId }: JournalStreakCalendarProps) {
  // Get the user's streak data
  const streakStats = await journalStreakService.getUserStreakStats(userId);
  
  // Format dates to strings for the calendar component
  const formattedDates = streakStats.streakDates.map(date => date.toISOString());
  
  return (
    <div className="mb-6">
      <JournalStreakWrapper streakStats={streakStats}>
        <JournalCalendar streakDates={formattedDates} />
      </JournalStreakWrapper>
    </div>
  );
}