import { redirect } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { journalStreakService } from '@/lib/services/journalStreakService';
import { JournalStreak } from '@/components/JournalStreak';

export default async function StreaksSection() {
  // Get the current user
  const user = await authService.getCurrentUser();
  
  // If not logged in, redirect to sign-in
  if (!user) {
    redirect('/auth/signin');
  }
  
  // Fetch streak stats for the user
  const streakStats = await journalStreakService.getUserStreakStats(user.id);
  
  return <JournalStreak streakStats={streakStats} />;
}
