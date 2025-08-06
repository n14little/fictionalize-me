'use server';

import { revalidatePath } from 'next/cache';
import { authService } from '@/lib/services/authService';
import { taskService } from '@/lib/services/taskService';
import { csrfModule } from '@/lib/csrf/csrfModule';
import { taskRepository } from '@/lib/repositories/taskRepository';

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

    // Reorder the parent task first
    await taskService.reorderPendingTask(
      taskId,
      user.id,
      referenceTaskId,
      position
    );

    // If this parent task has descendants, we need to update their priorities too
    // to maintain the hierarchical grouping
    if (hasDescendants && descendantIds) {
      const descendantIdsList = descendantIds.split(',');

      // Get the updated parent task priority
      const parentTask = await taskService.getTaskById(taskId, user.id);
      if (parentTask) {
        // Update descendants to have priorities that follow the parent
        // This ensures they stay grouped together after the parent
        let priorityOffset = 1;
        for (const descendantId of descendantIdsList) {
          // Use a small increment to keep descendants close to parent
          const newPriority = parentTask.priority + priorityOffset;

          // Use repository method directly for priority update
          await taskRepository.updatePriority(descendantId, newPriority);

          priorityOffset++;
        }
      }
    }

    // Revalidate the dashboard
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error reordering task:', error);
    throw error;
  }

  return { success: true };
}
