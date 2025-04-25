'use server';

import { redirect } from 'next/navigation';
import { journalService } from '../../../lib/services/journalService';
import { authService } from '../../../lib/services/authService';

export async function createJournal(formData: FormData) {
  // Get the current user
  const user = await authService.getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  
  if (!title) {
    throw new Error('Title is required');
  }
  
  // Create the journal
  const journal = await journalService.createJournal(user.id, {
    title,
    description,
  });
  
  // Redirect to the new journal
  redirect(`/journals/${journal.id}`);
} 