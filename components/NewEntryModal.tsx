'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from './RichTextEditor/TiptapEditor';
import { CsrfTokenInput } from './CsrfTokenInput';
import { FormButton } from './FormButton';
import { Modal } from './Modal';
import { createEntry } from '../app/journals/[id]/entries/actions';
import { JSONContent, DEFAULT_DOCUMENT } from '../lib/editor/types';

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
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
        aria-label="Add new journal entry"
      >
        <span>+</span>
        <span>New Entry</span>
      </button>

      {isOpen && (
        <NewEntryModal
          journalId={journalId}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

interface NewEntryModalProps {
  journalId: string;
  onClose: () => void;
}

export function NewEntryModal({ journalId, onClose }: NewEntryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent>(DEFAULT_DOCUMENT);
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function clientAction(formData: FormData) {
    // Reset error state and set submitting state
    setError(null);
    setIsSubmitting(true);
    
    // Get the form data values
    const titleValue = formData.get('title') as string;
    const contentValue = formData.get('content') as string;

    // Basic form validation
    if (!titleValue.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }

    if (!contentValue || isContentEmpty(parseContent(contentValue))) {
      setError('Content is required');
      setIsSubmitting(false);
      return;
    }

    try {
      // Call the server action - let any redirect errors bubble up naturally
      await createEntry(formData);
      
      // If execution reaches here without a redirect, use client-side navigation as fallback
      onClose();
      router.refresh(); // Refresh the current page data
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
      setIsSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="flex-none">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Add New Entry</h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>
        
        <form action={clientAction} className="flex flex-col flex-grow h-0 min-h-0">
          <input type="hidden" name="journalId" value={journalId} />
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
              onChange={(e) => setTitle(e.target.value)}
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
                onChange={(jsonString) => {
                  setContent(parseContent(jsonString));
                  
                  // Update hidden input field for form submission
                  const hiddenInput = document.getElementById('content-hidden') as HTMLInputElement;
                  if (hiddenInput) {
                    hiddenInput.value = jsonString;
                  }
                }} 
              />
            </div>
            <input
              type="hidden"
              id="content-hidden"
              name="content"
              value={contentToString(content)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-none">
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
                onChange={(e) => setMood(e.target.value)}
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
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-4 flex-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <FormButton>
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </FormButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}