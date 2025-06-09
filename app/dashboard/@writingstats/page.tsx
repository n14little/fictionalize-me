import { journalEntryService } from '@/lib/services/journalEntryService';
import { WritingStats } from '@/components/WritingStats';
import { getCurrentUserId } from '../utils';

export default async function WritingStatsSection() {
  const userId = await getCurrentUserId();
  
  // Fetch entry stats for the user if authenticated
  // If not authenticated, main page will handle redirect
  const defaultStats = {
    totalEntries: 0,
    totalWords: 0,
    firstEntryDate: null,
    mostRecentEntryDate: null
  };
  
  const entriesStats = userId 
    ? await journalEntryService.getUserEntriesStats(userId)
    : defaultStats;
  
  return <WritingStats entriesStats={entriesStats} />;
}
