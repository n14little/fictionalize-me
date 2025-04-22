'use server';

import { redirect } from 'next/navigation';
import { authService } from '../../../../lib/services/authService';
import { journalEntryService } from '../../../../lib/services/journalEntryService';

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

    // Create journal entry
    await journalEntryService.createJournalEntry(user.id, {
      journal_id: journalId,
      title: title.trim(),
      content: content.trim(),
      mood: mood.trim() || undefined,
      location: location.trim() || undefined
    });

    // Redirect back to the journal page on success
    redirect(`/journals/${journalId}`);
  } catch (error) {
    // In a real app, you would handle this error and show a user-friendly message
    console.error('Error creating journal entry:', error);
    throw error;
  }
}