'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from './RichTextEditor/TiptapEditor';
import { CsrfTokenInput } from './CsrfTokenInput';
import { FormButton } from './FormButton';
import { Modal } from './Modal';
import { ConfirmationModal } from './ConfirmationModal';
import { EntrySuccessModal } from './EntrySuccessModal';
import { updateEntry } from '../app/journals/[id]/entries/actions';
import { JournalEntry } from '../lib/models/JournalEntry';
import { JSONContent, DEFAULT_DOCUMENT } from '../lib/editor/types';
import { UserStreakStats } from '../lib/models/JournalStreak';

// Button component that opens the edit modal
export function EditEntryModalButton({ 
  entry, 
  journalId 
}: { 
  entry: JournalEntry; 
  journalId: string;
}) {
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
        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
        aria-label="Edit journal entry"
      >
        <span>Edit</span>
      </button>

      {isOpen && (
        <EditEntryModal
          entry={entry}
          journalId={journalId}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
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

interface EditEntryModalProps {
  entry: JournalEntry;
  journalId: string;
  onClose: () => void;
}

export function EditEntryModal({ entry, journalId, onClose }: EditEntryModalProps) {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState<JSONContent>(parseContent(entry.content));
  const [mood, setMood] = useState(entry.mood || '');
  const [location, setLocation] = useState(entry.location || '');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const router = useRouter();

  // Helper function to parse content into a JSONContent object
  function parseContent(contentValue: string | object | null | undefined): JSONContent {
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
  function isContentEmpty(contentObj: JSONContent): boolean {
    return (
      !contentObj.content ||
      contentObj.content.length === 0 ||
      (contentObj.content.length === 1 &&
        contentObj.content[0].type === 'paragraph' &&
        (!contentObj.content[0].content || contentObj.content[0].content.length === 0))
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
    setContent(parseContent(jsonString));
    setIsFormChanged(true);
    
    // Update hidden input field for form submission
    const hiddenInput = document.getElementById('content-hidden') as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.value = jsonString;
    }
  }

  // Handle input field changes
  function handleInputChange(setter: React.Dispatch<React.SetStateAction<string>>, value: string) {
    setter(value);
    setIsFormChanged(true);
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

    if (!contentValue || isContentEmpty(parseContent(contentValue))) {
      setError('Content is required');
      return;
    }

    try {
      // Call the server action which will return stats data instead of redirecting
      const result = await updateEntry(formData);
      
      if (result?.success) {
        // Show stats modal
        setStats({
          entriesStats: result.entriesStats,
          streakStats: result.streakStats,
          journalId: result.journalId,
          isNewEntry: false
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
      console.error("Error updating entry:", err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating your entry');
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
          <div className="flex-none mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Journal Entry</h2>
              <button 
                onClick={handleRequestClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mt-4">
                {error}
              </div>
            )}
          </div>
          
          <form action={clientAction} className="flex flex-col flex-grow h-0 min-h-0">
            <input type="hidden" name="journalId" value={journalId} />
            <input type="hidden" name="entryId" value={entry.id} />
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
            
            <div className="flex-grow min-h-0 mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-none mt-2">
              <div>
                <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1">
                  Mood (optional)
                </label>
                <input
                  id="mood"
                  name="mood"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="How are you feeling?"
                  value={mood}
                  onChange={(e) => handleInputChange(setMood, e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location (optional)
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Where are you?"
                  value={location}
                  onChange={(e) => handleInputChange(setLocation, e.target.value)}
                />
              </div>
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
                Save Changes
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