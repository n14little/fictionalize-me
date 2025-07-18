'use client';

import { JournalEntry } from '@/lib/models/JournalEntry';
import { RichTextContent } from '@/components/RichTextEditor/RichTextContent';
import { EntryButtonModal } from '@/components/EntryButtonModal';
import { updateEntryFromDashboard } from './actions';
import Link from 'next/link';

interface DashboardRecentEntriesProps {
  entries: JournalEntry[];
}

function DashboardEntryCard({ entry }: { entry: JournalEntry }) {
  const entryContent = (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
        {entry.title}
      </h3>
      <div className="text-sm text-gray-600 prose prose-sm max-w-none overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
        <RichTextContent content={entry.content} />
      </div>
      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
        <span>{new Date(entry.updated_at).toLocaleDateString()}</span>
        {entry.mood && (
          <span className="bg-gray-100 px-2 py-1 rounded">
            {entry.mood}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <EntryButtonModal
      buttonClassName="block w-full bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-pointer text-left"
      buttonAriaLabel={`Edit entry: ${entry.title}`}
      buttonContent={entryContent}
      modalType="edit"
      journalId={entry.journal_id}
      entryId={entry.id}
      onSubmit={updateEntryFromDashboard}
      showMoodField={true}
      showLocationField={true}
      initialContent={{
        title: entry.title,
        content: entry.content,
        mood: entry.mood || '',
        location: entry.location || ''
      }}
    />
  );
}

export function DashboardRecentEntries({ entries }: DashboardRecentEntriesProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Entries</h2>
        <Link 
          href="/journals" 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View all journals →
        </Link>
      </div>
      
      {entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No journal entries yet</p>
          <Link 
            href="/journals" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create your first journal
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <DashboardEntryCard key={entry.id} entry={entry} />
          ))}
          {entries.length === 3 && (
            <div className="pt-2">
              <Link 
                href="/journals" 
                className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
              >
                View more entries →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
