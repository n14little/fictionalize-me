import { journalEntryService } from '../../../../lib/services/journalEntryService';
import { authService } from '../../../../lib/services/authService';
import { ClickableEntry } from '../ClickableEntry';
import { NewEntryModalButton } from '@/components/EntryButtonAliases';

export const dynamic = 'force-dynamic';

export default async function JournalEntries({
  params,
}: {
  params: { id: string };
}) {
  const journalId = (await params).id;

  // Get the current user (if authenticated)
  const user = await authService.getCurrentUser();

  // Get journal entries
  const entries = await journalEntryService.getJournalEntries(
    journalId,
    user?.id
  );

  return (
    <div className="pt-6 flex flex-col gap-2">
      <NewEntryModalButton journalId={journalId} />

      {entries.length === 0 ? (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-700">This journal has no entries yet.</p>
        </div>
      ) : (
        <div className="w-full">
          {entries.map((entry, index) => (
            <ClickableEntry
              key={entry.id}
              entry={entry}
              journalId={journalId}
              lastEntry={entries.length - index > 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
