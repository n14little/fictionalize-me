'use server';

import { redirect } from 'next/navigation';
import { authService } from '../../../../lib/services/authService';
import { journalEntryService } from '../../../../lib/services/journalEntryService';
import { journalStreakService } from '../../../../lib/services/journalStreakService';
import { csrfModule } from '../../../../lib/csrf/csrfModule';

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
  } catch {
    return false;
  }
}

export async function createEntry(formData: FormData) {
  // Validate CSRF token
  const csrfToken = formData.get('csrf_token') as string;
  const csrfValidation = await csrfModule.validateTokenResponse(csrfToken);

  if (!csrfValidation.valid) {
    throw new Error(csrfValidation.error || 'Invalid CSRF token');
  }

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
    
    // Record streak for today when user creates an entry
    await journalStreakService.recordJournalStreak(user.id);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }

  // Redirect back to the journal page on success
  redirect(`/journals/${journalId}`);
}

export async function updateEntry(
  formData: FormData
) {
  // Validate CSRF token
  const csrfToken = formData.get('csrf_token') as string;
  const csrfValidation = await csrfModule.validateTokenResponse(csrfToken);

  if (!csrfValidation.valid) {
    throw new Error(csrfValidation.error || 'Invalid CSRF token');
  }

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
    
    // Record streak for today when user updates an entry
    await journalStreakService.recordJournalStreak(user.id);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    // Instead of returning an error object, throw the error
    // This ensures it propagates properly to the client
    throw new Error('Failed to update journal entry');
  }

  // Redirect outside the try/catch block so Next.js can handle it properly
  redirect(`/journals/${journalId}`);
}