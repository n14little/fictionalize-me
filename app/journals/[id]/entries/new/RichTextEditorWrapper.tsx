'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { TiptapEditor } from '../../../../../components/RichTextEditor/TiptapEditor';
import { FormButton } from '../../../../../components/FormButton';
import { createEntry } from '../actions';

type RichTextEditorWrapperProps = {
  journalId: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <FormButton disabled={pending}>{pending ? 'Saving...' : 'Save Entry'}</FormButton>;
}

export function RichTextEditorWrapper({ journalId }: RichTextEditorWrapperProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Default empty document JSON structure
  const emptyDocument = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph' }]
  });

  // Initialize with empty JSON document
  const initialContent = emptyDocument;

  async function clientAction(formData: FormData) {
    try {
      // Reset error state
      setError(null);
      
      // Get the form data values
      const title = formData.get('title') as string;
      const content = formData.get('content') as string;
      
      // Basic form validation
      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      if (!content) {
        setError('Content is required');
        return;
      }
      
      // Call the server action with the form data
      await createEntry(formData);
    } catch (err) {
      // Handle any errors from the server action
      setError(err instanceof Error ? err.message : 'An error occurred while saving the entry');
    }
  }

  return (
    <form action={clientAction} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <input type="hidden" name="journalId" value={journalId} />
      
      <div>
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
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <TiptapEditor 
          value={content || initialContent}
          onChange={(json) => {
            setContent(json);
            const hiddenInput = document.getElementById('content-hidden') as HTMLInputElement;
            if (hiddenInput) {
              hiddenInput.value = json;
            }
          }} 
        />
        <input 
          type="hidden" 
          id="content-hidden" 
          name="content" 
          value={content || initialContent} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      
      <div className="flex justify-end space-x-4">
        <Link
          href={`/journals/${journalId}`}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}