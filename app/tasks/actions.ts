'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { taskService } from '@/lib/services/taskService';
import { csrfModule } from '@/lib/csrf/csrfModule';

export async function toggleTaskCompletion(formData: FormData) {
  await csrfModule.validateFormData(formData);
  const taskId = formData.get('taskId') as string;

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to toggle task completion');
  }

  // Get current task state to determine what operation we're doing
  const currentTask = await taskService.getTaskById(taskId, user.id);
  if (!currentTask) {
    throw new Error('Task not found');
  }

  const newCompletedState = !currentTask.completed;

  // Use the enhanced completion logic that validates child tasks
  const result = await taskService.handleTaskCompletion(taskId, newCompletedState);

  // Check if completion was prevented due to incomplete child tasks
  if (!result.canComplete && result.error) {
    throw new Error(result.error);
  }

  revalidatePath('/tasks');
  return result;
}

export async function deleteTask(formData: FormData) {
  await csrfModule.validateFormData(formData);
  const taskId = formData.get('taskId') as string;

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to delete tasks');
  }

  await taskService.deleteTask(taskId, user.id);
  revalidatePath('/tasks');
}

export async function createTask(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const journalId = formData.get('journalId') as string;

  if (!title?.trim()) {
    throw new Error('Title is required');
  }

  if (!journalId) {
    throw new Error('Journal is required');
  }

  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to create tasks');
  }

  await taskService.createTask(user.id, {
    title: title.trim(),
    description: description?.trim() || undefined,
    journal_id: journalId,
  });

  redirect('/tasks');
}

export async function updateTask(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const taskId = formData.get('taskId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const journalId = formData.get('journalId') as string;

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  if (!title?.trim()) {
    throw new Error('Title is required');
  }

  if (!journalId) {
    throw new Error('Journal is required');
  }

  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to update tasks');
  }

  await taskService.updateTask(taskId, user.id, {
    title: title.trim(),
    description: description?.trim() || undefined,
  });

  redirect('/tasks');
}

export async function createSubTask(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const parentId = formData.get('parentId') as string;

  if (!title?.trim()) {
    throw new Error('Title is required');
  }

  if (!parentId) {
    throw new Error('Parent task is required');
  }

  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to create sub-tasks');
  }

  try {
    await taskService.createSubTask(user.id, parentId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      journal_id: '', // Will be inherited from parent
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to create sub-task');
  }

  revalidatePath('/tasks');
}
