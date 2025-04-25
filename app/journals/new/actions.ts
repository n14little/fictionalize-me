'use server';

import { redirect } from 'next/navigation';
import { journalService } from '../../../lib/services/journalService';
import { authService } from '../../../lib/services/authService';
import { csrfModule } from '../../../lib/csrf/csrfModule';

export async function createJournal(formData: FormData) {
  // Validate CSRF token
  const csrfToken = formData.get('csrf_token') as string;
  const csrfValidation = await csrfModule.validateTokenResponse(csrfToken);
  
  if (!csrfValidation.valid) {
    throw new Error(csrfValidation.error || 'Invalid CSRF token');
  }
  
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