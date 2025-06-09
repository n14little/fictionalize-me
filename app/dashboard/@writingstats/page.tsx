import { redirect } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { journalEntryService } from '@/lib/services/journalEntryService';
import { WritingStats } from '@/components/WritingStats';

export default async function WritingStatsSection() {
  // Get the current user
  const user = await authService.getCurrentUser();
  
  // If not logged in, redirect to sign-in
  if (!user) {
    redirect('/auth/signin');
  }
  
  // Fetch entry stats for the user
  const entriesStats = await journalEntryService.getUserEntriesStats(user.id);
  
  return <WritingStats entriesStats={entriesStats} />;
}
