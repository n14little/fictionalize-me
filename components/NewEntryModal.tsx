'use client';

import { useState } from 'react';
import { createEntry } from '../app/journals/[id]/@entries/actions';
import { JournalEntryModal } from './JournalEntryModal';

// Separate button component that handles its own modal state
export function NewEntryModalButton({ journalId }: { journalId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="w-full bg-gray-100 hover:bg-gray-200 hover:cursor-pointer text-gray-500 text-2xl px-4 py-2 rounded font-medium flex justify-center items-center gap-2"
        aria-label="Add new journal entry"
      >
        <span>+</span>
        <span className="sr-only">New Entry</span>
      </button>

      {isOpen && (
        <JournalEntryModal
          modalType="new"
          journalId={journalId}
          onClose={handleCloseModal}
          onSubmit={createEntry}
          showMoodField={true}
          showLocationField={true}
        />
      )}
    </>
  );
}
