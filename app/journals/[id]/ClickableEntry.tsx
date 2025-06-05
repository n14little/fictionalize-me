'use client';

import { JournalEntry } from '../../../lib/models/JournalEntry';
import { RichTextContent } from '../../../components/RichTextEditor/RichTextContent';
import { EntryButtonModal } from '@/components/EntryButtonModal';
import { updateEntry } from './@entries/actions';

interface ClickableEntryProps {
  entry: JournalEntry;
  journalId: string;
  lastEntry?: boolean;
}

export function ClickableEntry({ entry, journalId, lastEntry = false }: ClickableEntryProps) {
  // Prepare the content for the button
  const entryContent = (
    <div>
      <h3 className="text-2xl font-semibold text-gray-800 mt-0 mb-3 pb-1 border-b-2 border-gray-200">
        {entry.title}
      </h3>
      <div className="journal-entry-content prose prose-sm md:prose-base max-w-none">
        <RichTextContent content={entry.content} />
      </div>
    </div>
  );
  
  // Use the EditEntryModalButton directly
  return (
    <EntryButtonModal
      // Button props
      buttonClassName={`w-full py-6 px-4 hover:bg-gray-50 cursor-pointer transition-colors rounded-md text-left ${
        lastEntry ? 'border-b border-gray-200 mb-2' : ''
      }`}
      buttonAriaLabel={`Edit entry: ${entry.title}`}
      buttonContent={entryContent}
      
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
        location: entry.location || ''
      }}
    />
  );
}
