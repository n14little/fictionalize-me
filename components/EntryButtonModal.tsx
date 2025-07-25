'use client';

import { useState, ReactNode } from 'react';
import {
  JournalEntryModal,
  JournalEntrySharedProps,
} from './JournalEntryModal';

export interface EntryButtonModalProps extends JournalEntrySharedProps {
  // Button props
  buttonClassName: string;
  buttonAriaLabel: string;
  buttonContent: ReactNode;
}

/**
 * A declarative button component that opens a modal for journal entry operations.
 * All configuration is passed directly as props, allowing for a clean, declarative usage.
 */
export function EntryButtonModal({
  // Button props
  buttonClassName,
  buttonAriaLabel,
  buttonContent,

  // Modal props - inherited from JournalEntrySharedProps
  modalType,
  journalId,
  entryId,
  onSubmit,
  onSuccess,
  showMoodField = true,
  showLocationField = true,
  showTimer = false,
  initialContent,
}: EntryButtonModalProps) {
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
        className={buttonClassName}
        aria-label={buttonAriaLabel}
      >
        {buttonContent}
      </button>

      {isOpen && (
        <JournalEntryModal
          modalType={modalType}
          journalId={journalId}
          entryId={entryId}
          onClose={handleCloseModal}
          onSubmit={onSubmit}
          onSuccess={onSuccess}
          showMoodField={showMoodField}
          showLocationField={showLocationField}
          showTimer={showTimer}
          initialContent={initialContent}
        />
      )}
    </>
  );
}
