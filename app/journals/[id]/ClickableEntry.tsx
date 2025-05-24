'use client';

import { useState } from 'react';
import { JournalEntry } from '../../../lib/models/JournalEntry';
import { RichTextContent } from '../../../components/RichTextEditor/RichTextContent';
import { EditEntryModal } from '../../../components/EditEntryModal';

interface ClickableEntryProps {
  entry: JournalEntry;
  journalId: string;
  lastEntry: boolean;
}

export function ClickableEntry({ entry, journalId, lastEntry = false }: ClickableEntryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div 
        onClick={(e) => {
          e.preventDefault();
          handleOpenModal();
        }}
        className={`w-full py-6 px-4 hover:bg-gray-50 cursor-pointer transition-colors rounded-md ${
          lastEntry ? 'border-b border-gray-200 mb-2' : ''
        }`}
        role="button"
        aria-label={`Edit entry: ${entry.title}`}
      >
        <h3 className="text-2xl font-semibold text-gray-800 mt-0 mb-3 pb-1 border-b-2 border-gray-200">
          {entry.title}
        </h3>
        <div className="journal-entry-content prose prose-sm md:prose-base max-w-none">
          <RichTextContent content={entry.content} />
        </div>
      </div>
      
      {isModalOpen && (
        <EditEntryModal
          entry={entry}
          journalId={journalId}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
