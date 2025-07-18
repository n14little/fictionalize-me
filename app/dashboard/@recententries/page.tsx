import { journalEntryService } from '@/lib/services/journalEntryService';
import { getCurrentUserId } from '../utils';
import { DashboardRecentEntries } from '@/app/dashboard/@recententries/DashboardRecentEntries';

export const dynamic = 'force-dynamic';

export default async function RecentEntriesSlot() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return null;
  }

  const recentEntries = await journalEntryService.getRecentEntriesForUser(userId, 3);

  return <DashboardRecentEntries entries={recentEntries} />;
}
