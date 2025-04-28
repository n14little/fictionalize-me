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
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold">Journal Entries</h2>
              <div className="flex gap-2">
                <Link
                  href={`/journals/${journalId}/entries/new`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Add New Entry
                </Link>
              </div>
            </div>
            
            {entries.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-700">This journal has no entries yet.</p>
              </div>
            ) : (
              <div className="w-full">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="flex w-full">
                    {/* Left side: Metadata with right border */}
                    <div className={`w-1/8 flex-shrink-0 pr-4 text-sm text-gray-500 border-r border-gray-100 ${
                      index < entries.length - 1 ? 'border-b border-gray-100' : ''
                    }`}>
                      <div className="py-4">
                        <div>
                          <ClientDateFormatter date={entry.created_at} />
                        </div>
                        <div className="mt-2 flex flex-col gap-1">
                          {entry.mood && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                              {entry.mood}
                            </span>
                          )}
                          {entry.location && (
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">
                              {entry.location}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/journals/${journalId}/entries/${entry.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium no-underline"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side: Content without borders between entries */}
                    <div className="flex-1 pl-4 py-4 prose prose-sm md:prose-base max-w-none">
                      <h3 className="font-medium text-gray-700 mt-0 mb-2">{entry.title}</h3>
                      <div className="journal-entry-content">
                        <RichTextContent content={entry.content} />
                      </div>
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