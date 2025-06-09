import { journalStreakService } from '@/lib/services/journalStreakService';
import { JournalStreak } from '@/components/JournalStreak';
import { getCurrentUserId } from '../utils';

export default async function StreaksSection() {
  const userId = await getCurrentUserId();
  
  // Fetch streak stats for the user if authenticated
  // If not authenticated, main page will handle redirect
  const streakStats = userId 
    ? await journalStreakService.getUserStreakStats(userId) 
    : { currentStreak: 0, longestStreak: 0, totalDays: 0, lastStreakDate: null, streakDates: [] };
  
  // Force fresh rendering by adding a key with current timestamp
  // This ensures the component is completely re-rendered when data changes
  return <JournalStreak key={`streak-${Date.now()}`} streakStats={streakStats} />;
}
