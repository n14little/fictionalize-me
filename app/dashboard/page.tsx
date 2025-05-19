import { redirect } from 'next/navigation';
import { authService } from '../../lib/services/authService';
import { journalStreakService } from '../../lib/services/journalStreakService';
import { journalEntryService } from '../../lib/services/journalEntryService';
import { JournalStreak } from '../../components/JournalStreak';
import { JournalStreakCalendar } from '../../components/JournalStreakCalendar';
import { WritingStats } from '@/components/WritingStats';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // Get the current user
  const user = await authService.getCurrentUser();
  
  // If not logged in, redirect to sign-in
  if (!user) {
    redirect('/auth/signin');
  }
  
  // Fetch streak stats for the user
  const streakStats = await journalStreakService.getUserStreakStats(user.id);
  
  // Fetch entry stats for the user
  const entriesStats = await journalEntryService.getUserEntriesStats(user.id);
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Journaling Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your journaling progress and build your writing habit</p>
        </div>
        
        {/* Journal Streak Stats */}
        <JournalStreak streakStats={streakStats} />
        
        {/* Writing Statistics */}
        <WritingStats entriesStats={entriesStats} streakStats={streakStats} />
        
        {/* Journal Streak Calendar */}
        <JournalStreakCalendar streakStats={streakStats} />
      </div>
    </main>
  );
}