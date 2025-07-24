'use server';

import { revalidatePath } from 'next/cache';
import { authService } from '@/lib/services/authService';
import { taskService } from '@/lib/services/taskService';
import { csrfModule } from '@/lib/csrf/csrfModule';

export async function toggleTaskCompletion(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const taskId = formData.get('taskId') as string;

  try {
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error('You must be logged in to update a task');
    }

    await taskService.toggleTaskCompletion(taskId, user.id);

    // Revalidate the dashboard and task stats
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error toggling task completion:', error);
    throw error;
  }

  return { success: true };
}

export async function deleteTask(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const taskId = formData.get('taskId') as string;

  try {
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error('You must be logged in to delete a task');
    }

    await taskService.deleteTask(taskId, user.id);

    // Revalidate the dashboard and task stats
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }

  return { success: true };
}

export async function reorderTask(formData: FormData) {
  await csrfModule.validateFormData(formData);
  const taskId = formData.get('taskId') as string;
  const afterTaskId = (formData.get('afterTaskId') as string) || undefined;
  const beforeTaskId = (formData.get('beforeTaskId') as string) || undefined;

  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('You must be logged in to reorder tasks');
    }

    await taskService.reorderTask(taskId, user.id, afterTaskId, beforeTaskId);

    // Revalidate the dashboard
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error reordering task:', error);
    throw error;
  }

  return { success: true };
}
