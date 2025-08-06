'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authService } from '@/lib/services/authService';
import { taskService } from '@/lib/services/taskService';
import { csrfModule } from '@/lib/csrf/csrfModule';
import { journalService } from '@/lib/services/journalService';

export async function createTask(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const journalId = formData.get('journalId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const redirectUrl =
    (formData.get('redirectUrl') as string) || `/journals/${journalId}`;

  // Get the current user
  const user = await authService.getCurrentUser();

  if (!user) {
    throw new Error('You must be logged in to create a task');
  }

  // Validate form data
  if (!title.trim()) {
    throw new Error('Title is required');
  }

  // Verify that the journal exists and the user has access
  const journal = await journalService.getJournalById(journalId, user.id);
  if (!journal) {
    throw new Error('Journal not found or you do not have access');
  }

  // Create task
  await taskService.createTask(user.id, {
    journal_id: journalId,
    title: title.trim(),
    description: description?.trim() || undefined,
  });

  // Revalidate the journal page
  revalidatePath(`/journals/${journalId}`);

  // Redirect to the specified URL or tasks page
  // Next.js throws this as an error and will handle it automatically
  redirect(redirectUrl);
}

export async function toggleTaskCompletion(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const taskId = formData.get('taskId') as string;
  const journalId = formData.get('journalId') as string;

  try {
    // Get the current user
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error('You must be logged in to update a task');
    }

    // Toggle task completion
    await taskService.toggleTaskCompletion(taskId, user.id);

    // Revalidate the journal page
    revalidatePath(`/journals/${journalId}`);
  } catch (error) {
    console.error('Error toggling task completion:', error);
    throw error;
  }

  // Return success status for client-side update
  return { success: true };
}

export async function deleteTask(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const taskId = formData.get('taskId') as string;
  const journalId = formData.get('journalId') as string;

  try {
    // Get the current user
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error('You must be logged in to delete a task');
    }

    // Delete task
    await taskService.deleteTask(taskId, user.id);

    // Revalidate the journal page
    revalidatePath(`/journals/${journalId}`);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }

  // Return success status for client-side update
  return { success: true };
}

export async function createTaskWithoutRedirect(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const journalId = formData.get('journalId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  // Get the current user
  const user = await authService.getCurrentUser();

  if (!user) {
    throw new Error('You must be logged in to create a task');
  }

  // Validate form data
  if (!title.trim()) {
    throw new Error('Title is required');
  }

  // Verify that the journal exists and the user has access
  const journal = await journalService.getJournalById(journalId, user.id);
  if (!journal) {
    throw new Error('Journal not found or you do not have access');
  }

  // Create task
  await taskService.createTask(user.id, {
    journal_id: journalId,
    title: title.trim(),
    description: description?.trim() || undefined,
  });

  // Revalidate the journal page and tasks paths
  revalidatePath(`/journals/${journalId}`);

  // Return success object instead of redirecting
  return { success: true };
}

export async function reorderTask(formData: FormData) {
  await csrfModule.validateFormData(formData);
  const taskId = formData.get('taskId') as string;
  const referenceTaskId = formData.get('referenceTaskId') as string;
  const position = formData.get('position') as 'above' | 'below';
  const journalId = formData.get('journalId') as string;
  const hasDescendants = formData.get('hasDescendants') === 'true';
  const descendantIds = formData.get('descendantIds') as string;

  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('You must be logged in to reorder tasks');
    }

    // Use the optimized method that handles everything in a single transaction
    const descendantIdsList =
      hasDescendants && descendantIds ? descendantIds.split(',') : undefined;

    const result = await taskService.reorderPendingTaskWithDescendants(
      taskId,
      user.id,
      referenceTaskId,
      position,
      descendantIdsList
    );

    if (!result) {
      throw new Error('Failed to reorder task');
    }

    // Revalidate the journal page and dashboard
    revalidatePath(`/journals/${journalId}`);
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error reordering task:', error);
    throw error;
  }

  return { success: true };
}
