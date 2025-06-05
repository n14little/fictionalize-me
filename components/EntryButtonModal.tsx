'use client';

import { useState, ReactNode } from 'react';
import { JournalEntryModal, EntryContent } from './JournalEntryModal';

export type ButtonVariant = 'new' | 'edit' | 'daily';

interface EntryButtonModalProps {
  // Button props
  buttonClassName: string;
  buttonAriaLabel: string;
  buttonContent: ReactNode;
  
  // Modal props
  modalType: ButtonVariant;
  journalId?: string;
  entryId?: string;
  onSubmit: (formData: FormData) => Promise<{
    success?: boolean;
    entriesStats?: {
      totalEntries: number;
      totalWords: number;
      firstEntryDate: Date | null;
      mostRecentEntryDate: Date | null;
    };
    streakStats?: {
      currentStreak: number;
      longestStreak: number;
    };
    journalId?: string;
    error?: string;
  } | undefined>;
  showMoodField?: boolean;
  showLocationField?: boolean;
  showTimer?: boolean;
  initialContent?: EntryContent;
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
  
  // Modal props
  modalType,
  journalId,
  entryId,
  onSubmit,
  showMoodField = true,
  showLocationField = true,
  showTimer = false,
  initialContent
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
          showMoodField={showMoodField}
          showLocationField={showLocationField}
          showTimer={showTimer}
          initialContent={initialContent}
        />
      )}
    </>
  );
}
