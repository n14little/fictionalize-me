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
              <div className="flex">
                {/* Left side metadata column - fixed width */}
                <div className="w-1/5 pr-3 flex-shrink-0">
                  {entries.map((entry, index) => (
                    <div 
                      key={`meta-${entry.id}`} 
                      className="pb-4 mb-4 text-sm text-gray-500"
                      id={`meta-${entry.id}`} // Add ID for height matching with JavaScript
                    >
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
                      {index < entries.length - 1 && (
                        <div className="pt-4 border-b border-gray-100"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Continuous vertical divider */}
                <div className="w-px bg-gray-100 mr-4 self-stretch"></div>
                
                {/* Right side content column - flexible width */}
                <div className="flex-1 prose max-w-none">
                  {entries.map((entry, index) => (
                    <article 
                      key={entry.id} 
                      className="mb-4" 
                      id={`content-${entry.id}`} // Add ID for height matching with JavaScript
                    >
                      <h3 className="font-medium text-gray-700 mt-0 mb-2">{entry.title}</h3>
                      <div className="journal-entry-content">
                        <RichTextContent content={entry.content} />
                      </div>
                      {index < entries.length - 1 && (
                        <hr className="my-4 border-t border-gray-100" />
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Client-side script to match heights */}
      {entries.length > 0 && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', function() {
                function matchHeights() {
                  ${entries.map(entry => `
                    const content${entry.id} = document.getElementById('content-${entry.id}');
                    const meta${entry.id} = document.getElementById('meta-${entry.id}');
                    if (content${entry.id} && meta${entry.id}) {
                      meta${entry.id}.style.minHeight = content${entry.id}.offsetHeight + 'px';
                    }
                  `).join('\n')}
                }
                
                // Initial matching
                matchHeights();
                
                // Re-match on window resize
                window.addEventListener('resize', matchHeights);
                
                // Re-match when images might have loaded
                window.addEventListener('load', matchHeights);
                
                // For any dynamic content changes
                const observer = new MutationObserver(matchHeights);
                const container = document.querySelector('.prose');
                if (container) {
                  observer.observe(container, { subtree: true, childList: true, attributes: true });
                }
              });
            `
          }}
        />
      )}
    </main>
  );
}