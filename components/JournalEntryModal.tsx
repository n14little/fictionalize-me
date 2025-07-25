'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from './RichTextEditor/TiptapEditor';
import { CsrfTokenInput } from './CsrfTokenInput';
import { FormButton } from './FormButton';
import { Modal } from './Modal';
import { ConfirmationModal } from './ConfirmationModal';
import { EntrySuccessModal } from './EntrySuccessModal';
import { JSONContent, DEFAULT_DOCUMENT } from '../lib/editor/types';
import { UserStreakStats } from '../lib/models/JournalStreak';

export interface EntryStats {
  totalEntries: number;
}

export interface StatsData {
  entriesStats: EntryStats;
  streakStats: UserStreakStats;
  journalId?: string; // Optional - if missing, redirect to dashboard
  isNewEntry: boolean;
}

export interface EntryContent {
  title: string;
  content: JSONContent | string;
  mood?: string;
  location?: string;
}

export type ButtonVariant = 'new' | 'edit' | 'daily';

export interface EntrySubmitResult {
  success?: boolean;
  entriesStats?: EntryStats;
  streakStats?: UserStreakStats;
  journalId?: string;
  error?: string;
}

export interface JournalEntrySharedProps {
  modalType: ButtonVariant;
  journalId?: string;
  entryId?: string;
  initialContent?: EntryContent;
  onSubmit: (formData: FormData) => Promise<EntrySubmitResult | undefined>;
  onSuccess?: (updatedData: {
    title: string;
    content: JSONContent;
    mood?: string;
    location?: string;
  }) => void;
  showMoodField?: boolean;
  showLocationField?: boolean;
  showTimer?: boolean;
}

export interface JournalEntryModalProps extends JournalEntrySharedProps {
  onClose: () => void;
}

export function JournalEntryModal({
  modalType,
  journalId,
  entryId,
  initialContent,
  onClose,
  onSubmit,
  onSuccess,
  showMoodField = true,
  showLocationField = true,
  showTimer = false,
}: JournalEntryModalProps) {
  // Default title based on modal type
  const defaultTitle =
    modalType === 'daily'
      ? `Journal Entry - ${new Date().toLocaleDateString()}`
      : '';

  // States for form fields
  const [title, setTitle] = useState(initialContent?.title || defaultTitle);
  const [content, setContent] = useState<JSONContent>(
    parseContent(initialContent?.content) || DEFAULT_DOCUMENT
  );
  const [mood, setMood] = useState(initialContent?.mood || '');
  const [location, setLocation] = useState(initialContent?.location || '');

  // States for UI management
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  // States for timer (daily write mode)
  const [timeRemaining, setTimeRemaining] = useState(showTimer ? 120 : 0); // 2 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
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

  // Timer logic for daily write mode
  useEffect(() => {
    if (!showTimer) return;

    if (isActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
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
  }, [isActive, timeRemaining, showTimer]);

  // Helper function to parse content into a JSONContent object
  function parseContent(
    contentValue: string | object | JSONContent | null | undefined
  ): JSONContent {
    if (!contentValue) {
      return DEFAULT_DOCUMENT;
    }

    if (typeof contentValue === 'object') {
      return contentValue as JSONContent;
    }

    try {
      return JSON.parse(contentValue as string) as JSONContent;
    } catch (e) {
      console.warn('Invalid content format, using empty document', e);
      return DEFAULT_DOCUMENT;
    }
  }

  // Convert the content object to a string for form submission
  function contentToString(contentObj: JSONContent): string {
    return JSON.stringify(contentObj);
  }

  // Check if content is empty (only contains an empty paragraph)
  function isContentEmpty(contentObj: JSONContent | string): boolean {
    const parsedContent =
      typeof contentObj === 'string' ? parseContent(contentObj) : contentObj;

    return (
      !parsedContent.content ||
      parsedContent.content.length === 0 ||
      (parsedContent.content.length === 1 &&
        parsedContent.content[0].type === 'paragraph' &&
        (!parsedContent.content[0].content ||
          parsedContent.content[0].content.length === 0))
    );
  }

  // Handle confirmation for modal closing
  function handleRequestClose() {
    if (isFormChanged) {
      setIsConfirmingClose(true);
    } else {
      onClose();
    }
  }

  // Handle content or form changes
  function handleContentChange(jsonString: string) {
    const parsedContent = parseContent(jsonString);
    setContent(parsedContent);
    setIsFormChanged(true);

    // Update hidden input field for form submission
    const hiddenInput = document.getElementById(
      'content-hidden'
    ) as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.value = jsonString;
    }
  }

  // Handle input field changes
  function handleInputChange(
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) {
    setter(value);
    setIsFormChanged(true);
  }

  // Client-side form submission handler
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
      const result = await onSubmit(formData);

      if (
        result?.success &&
        result.entriesStats &&
        result.streakStats &&
        result.journalId
      ) {
        // Call the success callback with updated data
        if (onSuccess) {
          onSuccess({
            title,
            content,
            mood,
            location,
          });
        }

        // Show stats modal
        setStats({
          entriesStats: result.entriesStats,
          streakStats: result.streakStats,
          journalId: result.journalId,
          isNewEntry: modalType !== 'edit',
        });
        setShowStatsModal(true);
      } else {
        // Call the success callback even for simple success without stats
        if (result?.success && onSuccess) {
          onSuccess({
            title,
            content,
            mood,
            location,
          });
        }

        // Fall back to closing modal and refreshing page
        onClose();
        router.refresh();
      }
    } catch (err) {
      // If this is a redirect error from Next.js, let it propagate
      if (
        err instanceof Error &&
        (err.message.includes('NEXT_REDIRECT') ||
          err.toString().includes('NEXT_REDIRECT') ||
          err.name === 'RedirectError')
      ) {
        throw err;
      }

      // Handle other errors
      console.error('Error submitting entry:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while saving your entry'
      );
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

      <Modal
        onClose={handleRequestClose}
        isFullscreen={true}
        disableAutoClose={true}
      >
        <div className="flex flex-col h-full max-w-4xl mx-auto">
          <div className="flex-none mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {modalType === 'new' && 'Add New Entry'}
                {modalType === 'edit' && 'Edit Entry'}
                {modalType === 'daily' && 'Daily Write'}
              </h2>

              {showTimer && (
                <div className="flex items-center gap-2">
                  <div
                    className={`font-medium text-lg ${timeRemaining === 0 ? 'text-green-600' : 'text-gray-700'}`}
                  >
                    {formatTime(timeRemaining)}{' '}
                    {timeRemaining > 0 ? 'remaining' : 'completed!'}
                  </div>
                  {!isActive && timeRemaining > 0 && (
                    <button
                      onClick={startTimer}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600"
                    >
                      Start Timer
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleRequestClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            {showTimer &&
              !isActive &&
              !isCompleted &&
              timeRemaining === 120 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 mt-4">
                  <p>
                    Click &quot;Start Timer&quot; when you&apos;re ready to
                    begin your 2-minute journaling session.
                  </p>
                </div>
              )}

            {showTimer && isCompleted && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 mt-4">
                <p className="font-bold">
                  Great job completing your daily writing session!
                </p>
                <p>You can continue writing or submit your entry.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mt-4">
                {error}
              </div>
            )}
          </div>

          <form
            action={clientAction}
            className="flex flex-col flex-grow h-0 min-h-0"
          >
            {journalId && (
              <input type="hidden" name="journalId" value={journalId} />
            )}
            {entryId && <input type="hidden" name="entryId" value={entryId} />}
            <CsrfTokenInput />

            <div className="mb-4 flex-none">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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

            <div className="flex-grow min-h-0 mb-6">
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Content
              </label>
              <div className="h-full mb-2">
                <TiptapEditor
                  value={content}
                  onChange={handleContentChange}
                  journalId={journalId}
                />
              </div>
              <input
                type="hidden"
                id="content-hidden"
                name="content"
                value={contentToString(content)}
              />
            </div>

            {(showMoodField || showLocationField) && (
              <div
                className={`grid grid-cols-1 ${showMoodField && showLocationField ? 'md:grid-cols-2' : ''} gap-4 mb-4 flex-none mt-2`}
              >
                {showMoodField && (
                  <div>
                    <label
                      htmlFor="mood"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Mood (optional)
                    </label>
                    <input
                      id="mood"
                      name="mood"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="How are you feeling?"
                      value={mood}
                      onChange={(e) =>
                        handleInputChange(setMood, e.target.value)
                      }
                    />
                  </div>
                )}

                {showLocationField && (
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Location (optional)
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Where are you?"
                      value={location}
                      onChange={(e) =>
                        handleInputChange(setLocation, e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-4 flex-none">
              <button
                type="button"
                onClick={handleRequestClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <FormButton>
                {modalType === 'edit' ? 'Update Entry' : 'Save Entry'}
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
