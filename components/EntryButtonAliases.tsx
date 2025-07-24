'use client';

import { ReactNode } from 'react';
import { EntryButtonModal } from './EntryButtonModal';
import { JournalEntry } from '../lib/models/JournalEntry';
import { createEntry } from '../app/journals/[id]/@entries/actions';
import { updateEntry } from '../app/journals/[id]/@entries/actions';
import { createDailyEntry } from '../app/journals/daily-write/actions';

// For backward compatibility - these components simply forward to our new unified component
// This allows gradual migration of the codebase without breaking existing integrations

export function NewEntryModalButton({
  journalId,
  children,
}: {
  journalId: string;
  children?: ReactNode;
}) {
  return (
    <EntryButtonModal
      // Button props
      buttonClassName="w-full bg-gray-100 hover:bg-gray-200 hover:cursor-pointer text-gray-500 text-2xl px-4 py-2 rounded font-medium flex justify-center items-center gap-2"
      buttonAriaLabel="Add new journal entry"
      buttonContent={
        children || (
          <>
            <span>+</span>
            <span className="sr-only">New Entry</span>
          </>
        )
      }
      // Modal props
      modalType="new"
      journalId={journalId}
      onSubmit={createEntry}
      showMoodField={true}
      showLocationField={true}
    />
  );
}

export function DailyWriteModalButton({
  children,
  buttonClassName = '',
}: {
  children?: ReactNode;
  buttonClassName?: string;
} = {}) {
  return (
    <EntryButtonModal
      // Button props
      buttonClassName={buttonClassName}
      buttonAriaLabel="Quick daily write"
      buttonContent={children}
      // Modal props
      modalType="daily"
      onSubmit={createDailyEntry}
      showMoodField={false}
      showLocationField={false}
      showTimer={true}
      initialContent={{
        title: `Journal Entry - ${new Date().toLocaleDateString()}`,
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      }}
    />
  );
}

export function EditEntryModalButton({
  entry,
  journalId,
  children,
  className,
}: {
  entry: JournalEntry;
  journalId: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <EntryButtonModal
      // Button props
      buttonClassName={
        className ||
        'text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1'
      }
      buttonAriaLabel={`Edit journal entry: ${entry.title || ''}`}
      buttonContent={children || <span>Edit</span>}
      // Modal props
      modalType="edit"
      journalId={journalId}
      entryId={entry.id}
      onSubmit={updateEntry}
      showMoodField={true}
      showLocationField={true}
      initialContent={{
        title: entry.title,
        content: entry.content,
        mood: entry.mood || '',
        location: entry.location || '',
      }}
    />
  );
}
