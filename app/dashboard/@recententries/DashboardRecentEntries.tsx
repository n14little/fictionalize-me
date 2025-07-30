'use client';

import { useState, useTransition } from 'react';
import { JournalEntry } from '@/lib/models/JournalEntry';
import { RichTextContent } from '@/components/RichTextEditor/RichTextContent';
import { EntryButtonModal } from '@/components/EntryButtonModal';
import {
  NavigableItem,
  NavigableColumn,
} from '@/components/KeyboardNavigation';
import { updateEntryFromDashboard, getMoreEntriesForUser } from './actions';
import Link from 'next/link';
import { JSONContent } from '@tiptap/react';

interface DashboardRecentEntriesProps {
  entries: JournalEntry[];
}

function DashboardEntryCard({
  entry,
  onEntryUpdate,
}: {
  entry: JournalEntry;
  onEntryUpdate: (
    entryId: string,
    updatedData: {
      title: string;
      content: JSONContent;
      mood?: string;
      location?: string;
    }
  ) => void;
}) {
  const entryContent = (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
        {entry.title}
      </h3>
      <div
        className="text-sm text-gray-600 prose prose-sm max-w-none overflow-hidden"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        <RichTextContent content={entry.content} />
      </div>
      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
        <span>{new Date(entry.updated_at).toLocaleDateString()}</span>
        {entry.mood && (
          <span className="bg-gray-100 px-2 py-1 rounded">{entry.mood}</span>
        )}
      </div>
    </div>
  );

  return (
    <NavigableItem
      id={`entry-${entry.id}`}
      column="entries"
      className="block w-full bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-pointer text-left"
      ariaLabel={`Edit entry: ${entry.title}`}
    >
      <EntryButtonModal
        buttonClassName="block w-full text-left"
        buttonAriaLabel={`Edit entry: ${entry.title}`}
        buttonContent={entryContent}
        modalType="edit"
        journalId={entry.journal_id}
        entryId={entry.id}
        onSubmit={updateEntryFromDashboard}
        onSuccess={(updatedData) => onEntryUpdate(entry.id, updatedData)}
        showMoodField={true}
        showLocationField={true}
        initialContent={{
          title: entry.title,
          content: entry.content,
          mood: entry.mood || '',
          location: entry.location || '',
        }}
      />
    </NavigableItem>
  );
}

export function DashboardRecentEntries({
  entries: initialEntries,
}: DashboardRecentEntriesProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleEntryUpdate = (
    entryId: string,
    updatedData: {
      title: string;
      content: JSONContent;
      mood?: string;
      location?: string;
    }
  ) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              title: updatedData.title,
              content: updatedData.content,
              mood: updatedData.mood || null,
              location: updatedData.location || null,
              updated_at: new Date(),
            }
          : entry
      )
    );
  };

  const handleLoadMore = async () => {
    setIsLoading(true);

    startTransition(async () => {
      try {
        const result = await getMoreEntriesForUser(entries.length);
        if (result.success && result.entries.length > 0) {
          setEntries((prev) => [...prev, ...result.entries]);
        }
      } catch (error) {
        console.error('Error loading more entries:', error);
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <NavigableColumn
      column="entries"
      itemCount={entries.length + (entries.length >= 3 ? 1 : 0)}
    >
      <div className="bg-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Entries
          </h2>
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
              <DashboardEntryCard
                key={entry.id}
                entry={entry}
                onEntryUpdate={handleEntryUpdate}
              />
            ))}
            {entries.length >= 3 && (
              <div className="pt-2">
                <NavigableItem
                  id="load-more-entries"
                  column="entries"
                  className="block w-full text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-blue-600 hover:text-blue-700 text-sm font-medium py-3 px-4 rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:text-blue-600"
                  ariaLabel="Load more journal entries"
                  onClick={handleLoadMore}
                >
                  {isLoading || isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Load more entries →'
                  )}
                </NavigableItem>
              </div>
            )}
          </div>
        )}
      </div>
    </NavigableColumn>
  );
}
