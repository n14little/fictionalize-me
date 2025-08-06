'use server';

import { revalidatePath } from 'next/cache';
import { taskService } from '@/lib/services/taskService';
import { authService } from '@/lib/services/authService';
import { csrfModule } from '@/lib/csrf/csrfModule';

export async function toggleTaskCompletion(formData: FormData) {
  await csrfModule.validateFormData(formData);

  const taskId = formData.get('taskId') as string;

  try {
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error('You must be logged in to update a task');
    }

    const result = await taskService.toggleTaskCompletion(taskId, user.id);

    // Check if completion was prevented due to incomplete child tasks
    if (!result.canComplete && result.error) {
      throw new Error(result.error);
    }

    // Revalidate the dashboard and task stats
    revalidatePath('/dashboard');

    return { success: true, task: result.task };
  } catch (error) {
    console.error('Error toggling task completion:', error);
    throw error;
  }
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
  const referenceTaskId = formData.get('referenceTaskId') as string;
  const position = formData.get('position') as 'above' | 'below';
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

    // Revalidate the dashboard
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error reordering task:', error);
    throw error;
  }

  return { success: true };
}
