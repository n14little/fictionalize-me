'use server';

import { redirect } from 'next/navigation';
import { authService } from '../../../../lib/services/authService';
import { journalEntryService } from '../../../../lib/services/journalEntryService';

// Helper function to validate JSON structure for Tiptap content
function isValidTiptapJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Basic structure validation for ProseMirror JSON
    return (
      parsed &&
      typeof parsed === 'object' &&
      parsed.type === 'doc' &&
      Array.isArray(parsed.content)
    );
  } catch (e) {
    return false;
  }
}

export async function createEntry(formData: FormData) {
  const journalId = formData.get('journalId') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const mood = formData.get('mood') as string;
  const location = formData.get('location') as string;

  try {
    // Get the current user
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error('You must be logged in to create a journal entry');
    }

    // Validate form data
    if (!title.trim()) {
      throw new Error('Title is required');
    }

    if (!content.trim()) {
      throw new Error('Content is required');
    }

    // Validate the JSON structure
    if (!isValidTiptapJSON(content)) {
      throw new Error('Invalid content format');
    }

    // Create journal entry with parsed JSON object
    await journalEntryService.createJournalEntry(user.id, {
      journal_id: journalId,
      title: title.trim(),
      content: JSON.parse(content), // Parse JSON string into object for JSONB column
      mood: mood?.trim() || undefined,
      location: location?.trim() || undefined
    });

    // Redirect back to the journal page on success
    redirect(`/journals/${journalId}`);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
}

export async function updateEntry(formData: FormData) {
  const journalId = formData.get('journalId') as string;
  const entryId = formData.get('entryId') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const mood = formData.get('mood') as string;
  const location = formData.get('location') as string;

  try {
    // Get the current user
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error('You must be logged in to update a journal entry');
    }

    // Validate form data
    if (!title.trim()) {
      throw new Error('Title is required');
    }

    if (!content.trim()) {
      throw new Error('Content is required');
    }

    // Validate the JSON structure
    if (!isValidTiptapJSON(content)) {
      throw new Error('Invalid content format');
    }

    // Update journal entry with parsed JSON object
    await journalEntryService.updateJournalEntry(entryId, user.id, {
      title: title.trim(),
      content: JSON.parse(content), // Parse JSON string into object for JSONB column
      mood: mood?.trim() || undefined,
      location: location?.trim() || undefined
    });

    // Redirect back to the journal page on success
    redirect(`/journals/${journalId}`);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
}