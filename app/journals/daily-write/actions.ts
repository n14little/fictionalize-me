'use server';

import { redirect } from 'next/navigation';
import { authService } from '../../../lib/services/authService';
import { journalEntryService } from '../../../lib/services/journalEntryService';
import { journalService } from '../../../lib/services/journalService';
import { csrfModule } from '../../../lib/csrf/csrfModule';
import { revalidatePath } from 'next/cache';

// Helper function to validate JSON structure for Tiptap content
function isValidTiptapJSON(jsonString: string): boolean {
  try {
    const parsedJson = JSON.parse(jsonString);
    return parsedJson.type === 'doc' && Array.isArray(parsedJson.content);
  } catch {
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

  // Get form data values
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  // Note: journalId is no longer provided via form data

  let journalId;

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

    // Get the user's journals and use the first one as default
    const userJournals = await journalService.getUserJournals(user.id);
    
    if (!userJournals || userJournals.length === 0) {
      // No journals found, create one first
      throw new Error('Please create a journal first before adding entries');
    }
    
    // Use the first journal as the default
    const defaultJournal = userJournals[0];
    journalId = defaultJournal.id;

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

    // Redirect to the journal page
    redirect(`/journals/${journalId}`);
}