'use server';

import { redirect } from 'next/navigation';
import { authService } from '../../../../lib/services/authService';
import { journalEntryService } from '../../../../lib/services/journalEntryService';
import { csrfModule } from '../../../../lib/csrf/csrfModule';
import { revalidatePath } from 'next/cache';

// Helper function to validate JSON structure for Tiptap content
function isValidTiptapJSON(jsonString: string): boolean {
  try {
    const parsedJson = JSON.parse(jsonString);
    return parsedJson.type === 'doc' && Array.isArray(parsedJson.content);
  } catch (error) {
    return false;
  }
}

export async function createDailyEntry(formData: FormData) {
  // Validate CSRF token
  const csrfToken = formData.get('csrf_token') as string;
  const csrfValidation = await csrfModule.validateTokenResponse(csrfToken);

  if (!csrfValidation.valid) {
    throw new Error(csrfValidation.error || 'Invalid CSRF token');
  }

  const journalId = formData.get('journalId') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

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
      mood: 'Daily Write',
      location: new Date().toLocaleDateString()
    });
  } catch (error) {
    console.error('Error creating daily journal entry:', error);
    throw error;
  }

  // Revalidate both paths to ensure fresh data
  revalidatePath(`/journals/${journalId}`);
  revalidatePath('/journals');
  
  // Use redirect from next/navigation
  // This throws a NEXT_REDIRECT error which must be allowed to bubble up to work correctly
  redirect(`/journals/${journalId}`);
}