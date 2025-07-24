'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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
  await csrfModule.validateFormData(formData);

  const journalId = formData.get('journalId') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const mood = formData.get('mood') as string;
  const location = formData.get('location') as string;
  const skipStats = formData.get('skipStats') === 'true';

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
      location: location?.trim() || undefined,
    });

    // Record streak for today when user creates an entry
    await journalStreakService.recordJournalStreak(user.id);

    // Revalidate the journal page and dashboard paths
    revalidatePath(`/journals/${journalId}`);
    revalidatePath('/dashboard');
    revalidatePath('/', 'layout');

    // If skipStats is true, just redirect without returning stats
    if (skipStats) {
      redirect(`/journals/${journalId}`);
    }

    // Get updated stats to return to the client
    const streakStats = await journalStreakService.getUserStreakStats(user.id);
    const entriesStats = await journalEntryService.getTotalEntriesForUser(
      user.id
    );

    return {
      success: true,
      journalId,
      streakStats,
      entriesStats,
    };
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
}

export async function updateEntry(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const journalId = formData.get('journalId') as string;
  const entryId = formData.get('entryId') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const mood = formData.get('mood') as string;
  const location = formData.get('location') as string;
  const skipStats = formData.get('skipStats') === 'true';

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
      location: location?.trim() || undefined,
    });

    // Record streak for today when user updates an entry
    await journalStreakService.recordJournalStreak(user.id);

    // Revalidate the journal page and dashboard paths
    revalidatePath(`/journals/${journalId}`);
    revalidatePath('/dashboard');
    revalidatePath('/', 'layout');

    // If skipStats is true, just redirect without returning stats
    if (skipStats) {
      redirect(`/journals/${journalId}`);
    }

    // Get updated stats to return to the client
    const streakStats = await journalStreakService.getUserStreakStats(user.id);
    const entriesStats = await journalEntryService.getTotalEntriesForUser(
      user.id
    );

    return {
      success: true,
      journalId,
      streakStats,
      entriesStats,
    };
  } catch (error) {
    console.error('Error updating journal entry:', error);
    // Instead of returning an error object, throw the error
    // This ensures it propagates properly to the client
    throw new Error('Failed to update journal entry');
  }
}
