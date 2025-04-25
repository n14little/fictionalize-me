import Link from 'next/link';
import { notFound } from 'next/navigation';
import { journalService } from '../../../lib/services/journalService';
import { journalEntryService } from '../../../lib/services/journalEntryService';
import { authService } from '../../../lib/services/authService';
import { RichTextContent } from '../../../components/RichTextEditor/RichTextContent';

// Client component for date formatting
import { ClientDateFormatter } from './ClientDateFormatter';

export default async function JournalDetail({ params }: { params: { id: string } }) {
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
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-4xl">
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Journal Entries</h2>
              <Link 
                href={`/journals/${journalId}/entries/new`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Add New Entry
              </Link>
            </div>
            
            {entries.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-700">This journal has no entries yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {entries.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{entry.title}</h3>
                      <div className="flex items-center space-x-3">
                        <ClientDateFormatter date={entry.created_at} />
                        <Link
                          href={`/journals/${journalId}/entries/${entry.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <RichTextContent content={entry.content} />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      {entry.mood && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          Mood: {entry.mood}
                        </span>
                      )}
                      {entry.location && (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                          Location: {entry.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}