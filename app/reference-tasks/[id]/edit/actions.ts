'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authService } from '@/lib/services/authService';
import { referenceTaskService } from '@/lib/services/referenceTaskService';
import { csrfModule } from '@/lib/csrf/csrfModule';
import { RecurrenceType } from '@/lib/models/ReferenceTask';

export async function updateReferenceTask(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const user = await authService.getCurrentUser();

  if (!user) {
    throw new Error('You must be logged in to update reference tasks');
  }

  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const journal_id = formData.get('journal_id') as string;
  const recurrence_type = formData.get('recurrence_type') as RecurrenceType;
  const recurrence_interval =
    parseInt(formData.get('recurrence_interval') as string) || 1;
  const starts_on = formData.get('starts_on') as string;
  const ends_on = formData.get('ends_on') as string;
  const is_active = formData.get('is_active') === 'on';

  if (!id) {
    throw new Error('Reference task ID is required');
  }

  if (!title?.trim()) {
    throw new Error('Title is required');
  }

  if (!journal_id) {
    throw new Error('Journal is required');
  }

  if (!recurrence_type) {
    throw new Error('Recurrence type is required');
  }

  if (!starts_on) {
    throw new Error('Start date is required');
  }

  try {
    await referenceTaskService.updateReferenceTask(id, user.id, {
      journal_id,
      title: title.trim(),
      description: description?.trim() || undefined,
      recurrence_type,
      recurrence_interval,
      starts_on: new Date(starts_on),
      ends_on: ends_on ? new Date(ends_on) : undefined,
      is_active,
    });

    revalidatePath('/reference-tasks');
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error updating reference task:', error);
    throw error;
  }

  redirect('/reference-tasks');
}
