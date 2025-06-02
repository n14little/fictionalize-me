'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authService } from '../../../lib/services/authService';
import { journalEntryService } from '../../../lib/services/journalEntryService';
import { journalService } from '../../../lib/services/journalService';
import { journalStreakService } from '../../../lib/services/journalStreakService';
import { csrfModule } from '../../../lib/csrf/csrfModule';

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
  await csrfModule.validateFormData(formData);

  // Get form data values
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const skipStats = formData.get('skipStats') === 'true';

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

  let journalId: string;
  
  try {
    // Get or create the Daily Write journal
    const journal = await journalService.getOrCreateDailyWriteJournal(user.id);
    journalId = journal.id;

    // Create journal entry with parsed JSON object
    await journalEntryService.createJournalEntry(user.id, {
      journal_id: journal.id,
      title: title.trim(),
      content: JSON.parse(content), // Parse JSON string into object for JSONB column
      mood: 'Daily Write',
      location: new Date().toLocaleDateString()
    });
    
    // Record streak for today when user creates a daily entry
    await journalStreakService.recordJournalStreak(user.id);

    // Revalidate all relevant paths to ensure fresh data
    revalidatePath(`/journals/${journal.id}`);
    revalidatePath('/journals');
    revalidatePath('/dashboard');

    // If skipStats is true, just redirect without returning stats
    if (skipStats) {
      redirect(`/journals/${journalId}`);
    }

    // Get updated stats to return to the client
    const streakStats = await journalStreakService.getUserStreakStats(user.id);
    const entriesStats = await journalEntryService.getUserEntriesStats(user.id);

    return { 
      success: true, 
      journalId, 
      streakStats,
      entriesStats
    };
  } catch (error) {
    console.error('Error creating daily journal entry:', error);
    throw error;
  }
}