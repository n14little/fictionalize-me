'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TiptapEditor } from '../../../../../../components/RichTextEditor/TiptapEditor';
import { FormButton } from '../../../../../../components/FormButton';
import { CsrfTokenInput } from '../../../../../../components/CsrfTokenInput';
import { JournalEntry } from '../../../../../../lib/models/JournalEntry';
import { updateEntry } from '../../actions';
import { JSONContent, DEFAULT_DOCUMENT } from '../../../../../../lib/editor/types';

type RichTextEditorWrapperProps = {
  journalId: string;
  entry: JournalEntry;
};

export function RichTextEditorWrapper({ journalId, entry }: RichTextEditorWrapperProps) {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState<JSONContent>(parseContent(entry.content));
  const [mood, setMood] = useState(entry.mood || '');
  const [location, setLocation] = useState(entry.location || '');
  const [error, setError] = useState<string | null>(null);

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
    // Reset error state
    setError(null);

    // Get the form data values
    const title = formData.get('title') as string;
    const contentString = formData.get('content') as string;

    // Basic form validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!contentString || isContentEmpty(parseContent(contentString))) {
      setError('Content is required');
      return;
    }

    // Call the server action with the form data
    await updateEntry(formData);
  }

  return (
    <form action={clientAction} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <input type="hidden" name="journalId" value={journalId} />
      <input type="hidden" name="entryId" value={entry.id} />
      
      <CsrfTokenInput />
      
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
          value={content}
          onChange={(jsonString) => {
            const jsonContent = parseContent(jsonString);
            setContent(jsonContent);
            
            // Update hidden input field for form submission
            const hiddenInput = document.getElementById('content-hidden') as HTMLInputElement;
            if (hiddenInput) {
              hiddenInput.value = jsonString;
            }
          }} 
        />
        <input
          type="hidden"
          id="content-hidden"
          name="content"
          value={contentToString(content)}
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
        <FormButton >Save Changes</FormButton>
      </div>
    </form>
  );
}