'use client';

import { useState } from 'react';
import { createDailyEntry } from '../app/journals/daily-write/actions';
import { JournalEntryModal } from './JournalEntryModal';

// Separate button component that handles its own modal state
export function DailyWriteModalButton() {
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
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-1"
        aria-label="Quick daily write"
      >
        <span>✍️</span>
        <span>Daily Write</span>
      </button>

      {isOpen && (
        <JournalEntryModal
          modalType="daily"
          onClose={handleCloseModal}
          onSubmit={createDailyEntry}
          showMoodField={false}
          showLocationField={false}
          showTimer={true}
          initialContent={{
            title: `Journal Entry - ${new Date().toLocaleDateString()}`,
            content: {"type":"doc","content":[{"type":"paragraph"}]}
          }}
        />
      )}
    </>
  );
}
