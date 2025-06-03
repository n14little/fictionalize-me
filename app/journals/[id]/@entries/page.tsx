import { notFound } from 'next/navigation';
import Link from 'next/link';
import { journalService } from '../../../../lib/services/journalService';
import { journalEntryService } from '../../../../lib/services/journalEntryService';
import { authService } from '../../../../lib/services/authService';
import { NewEntryModalButton } from '../../../../components/NewEntryModal';
import { ClickableEntry } from '../ClickableEntry';

export default async function JournalDetail({ params }: { params: Promise<{ id: string }> }) {
  const journalId = (await params).id;
  
  // Get the current user (if authenticated)
  const user = await authService.getCurrentUser();
  
  // Get the journal and its entries
  const journalPromise = journalService.getJournalById(journalId, user?.id);
  const entriesPromise = journalEntryService.getJournalEntries(journalId, user?.id);
  
  // Fetch data in parallel
  const [journal, entries] = await Promise.all([journalPromise, entriesPromise]);
  
  // If journal doesn't exist or user doesn't have access
  if (!journal) {
    notFound();
  }

  return (
    <>
      <div className="mb-8">
        <Link
          href="/journals" 
          className="text-blue-600 hover:text-blue-800 mb-4 block"
        >
          ← Back to Journals
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">{journal.title}</h1>
        {journal.description && (
          <p className="text-gray-600 mb-6">{journal.description}</p>
        )}
        
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Journal Entries</h2>
            <div className="flex gap-2">
              <NewEntryModalButton journalId={journalId} />
            </div>
          </div>
          
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
      </div>
    </>
  );
}
