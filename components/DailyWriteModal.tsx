'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from './RichTextEditor/TiptapEditor';
import { CsrfTokenInput } from './CsrfTokenInput';
import { FormButton } from './FormButton';
import { Modal } from './Modal';
import { ConfirmationModal } from './ConfirmationModal';
import { EntrySuccessModal } from './EntrySuccessModal';
import { createDailyEntry } from '../app/journals/daily-write/actions';
import { UserStreakStats } from '../lib/models/JournalStreak';

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
        <DailyWriteModal
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

interface DailyWriteModalProps {
  onClose: () => void;
}

interface StatsData {
  entriesStats: {
    totalEntries: number;
    totalWords: number;
    firstEntryDate: Date | null;
    mostRecentEntryDate: Date | null;
  };
  streakStats: UserStreakStats;
  journalId: string;
  isNewEntry: boolean;
}

export function DailyWriteModal({ onClose }: DailyWriteModalProps) {
  const [title, setTitle] = useState(`Journal Entry - ${new Date().toLocaleDateString()}`);
  const [content, setContent] = useState('{"type":"doc","content":[{"type":"paragraph"}]}');
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the timer
  const startTimer = () => {
    setIsActive(true);
    setIsFormChanged(true);
  };

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else if (isActive && timeRemaining === 0) {
      setIsActive(false);
      setIsCompleted(true);
      
      // Save completion time to local storage
      const now = new Date();
      localStorage.setItem('timerCompletedUTC', now.toISOString());
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  // Check if content is empty (only contains an empty paragraph)
  function isContentEmpty(contentStr: string): boolean {
    try {
      const contentObj = JSON.parse(contentStr);
      if (!contentObj.content || !Array.isArray(contentObj.content)) return true;
      if (contentObj.content.length === 0) return true;
      if (contentObj.content.length === 1 && 
          contentObj.content[0].type === 'paragraph' && 
          (!contentObj.content[0].content || contentObj.content[0].content.length === 0)) {
        return true;
      }
      return false;
    } catch {
      return true;
    }
  }

  // Handle confirmation for modal closing
  function handleRequestClose() {
    if (isFormChanged) {
      setIsConfirmingClose(true);
    } else {
      onClose();
    }
  }

  // Handle input field changes
  function handleInputChange(setter: React.Dispatch<React.SetStateAction<string>>, value: string) {
    setter(value);
    setIsFormChanged(true);
  }

  // Handle content change
  function handleContentChange(jsonString: string) {
    setContent(jsonString);
    setIsFormChanged(true);
    
    // Update hidden input field for form submission
    const hiddenInput = document.getElementById('content-hidden') as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.value = jsonString;
    }
  }

  async function clientAction(formData: FormData) {
    // Reset error state
    setError(null);
    
    // Get the form data values
    const titleValue = formData.get('title') as string;
    const contentValue = formData.get('content') as string;

    // Basic form validation
    if (!titleValue.trim()) {
      setError('Title is required');
      return;
    }

    if (!contentValue || isContentEmpty(contentValue)) {
      setError('Content is required');
      return;
    }

    try {
      // Call the server action which will return stats data instead of redirecting
      const result = await createDailyEntry(formData);
      
      if (result?.success) {
        // Show stats modal
        setStats({
          entriesStats: result.entriesStats,
          streakStats: result.streakStats,
          journalId: result.journalId,
          isNewEntry: true
        });
        setShowStatsModal(true);
      } else {
        // Fall back to closing modal and refreshing page
        onClose();
        router.refresh();
      }
    } catch (err) {
      // If this is a redirect error from Next.js, let it propagate
      if (err instanceof Error && 
          (err.message.includes('NEXT_REDIRECT') || 
           err.toString().includes('NEXT_REDIRECT') ||
           err.name === 'RedirectError')) {
        throw err;
      }
      
      // Handle other errors
      console.error("Error submitting entry:", err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving your entry');
    }
  }

  return (
    <>
      {showStatsModal && stats && (
        <EntrySuccessModal
          onClose={() => {
            setShowStatsModal(false);
            onClose();
          }}
          entriesStats={stats.entriesStats}
          streakStats={stats.streakStats}
          journalId={stats.journalId}
          isNewEntry={stats.isNewEntry}
        />
      )}
      
      <Modal onClose={handleRequestClose} isFullscreen={true} disableAutoClose={true}>
        <div className="flex flex-col h-full max-w-4xl mx-auto">
          <div className="flex-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Daily Write</h2>
              <div className="flex items-center gap-2">
                <div className={`font-medium text-lg ${timeRemaining === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)} {timeRemaining > 0 ? 'remaining' : 'completed!'}
                </div>
                {!isActive && timeRemaining > 0 && (
                  <button
                    onClick={startTimer}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600"
                  >
                    Start Timer
                  </button>
                )}
                <button 
                  onClick={handleRequestClose}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none ml-2"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            {!isActive && !isCompleted && timeRemaining === 120 && (
              <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
                <p>Click &quot;Start Timer&quot; when you&apos;re ready to begin your 2-minute journaling session.</p>
              </div>
            )}
            
            {isCompleted && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4">
                <p className="font-bold">Great job completing your daily writing session!</p>
                <p>You can continue writing or submit your entry.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
          </div>
          
          <form action={clientAction} className="flex flex-col flex-grow h-0 min-h-0">
            <CsrfTokenInput />
            
            <div className="mb-4 flex-none">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a title for your entry"
                value={title}
                onChange={(e) => handleInputChange(setTitle, e.target.value)}
                required
              />
            </div>
            
            <div className="flex-grow min-h-0 mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <div className="h-full">
                <TiptapEditor 
                  value={content}
                  onChange={handleContentChange}
                />
              </div>
              <input
                type="hidden"
                id="content-hidden"
                name="content"
                value={content}
              />
            </div>
            
            <div className="flex justify-end space-x-4 mt-4 flex-none">
              <button
                type="button"
                onClick={handleRequestClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <FormButton>
                Save Entry
              </FormButton>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmingClose}
        onClose={() => setIsConfirmingClose(false)}
        onConfirm={onClose}
        title="Discard changes?"
        message="You have unsaved changes that will be lost if you close this editor. Are you sure you want to discard these changes?"
        confirmButtonText="Discard changes"
        cancelButtonText="Keep editing"
      />
    </>
  );
}