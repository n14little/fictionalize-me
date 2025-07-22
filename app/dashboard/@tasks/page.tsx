import { taskService } from '@/lib/services/taskService';
import { getCurrentUserId } from '../utils';
import { DashboardTasksList } from './DashboardTasksList';

export const dynamic = 'force-dynamic';

export default async function DashboardTasksSlot() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return null;
  }

  // Get all tasks for the user across all journals
  const allTasks = await taskService.getUserTasks(userId);

  // Separate pending and completed tasks
  const pendingTasks = allTasks.filter(task => !task.completed);
  const completedTasks = allTasks.filter(task => task.completed);

  return (
    <DashboardTasksList 
      pendingTasks={pendingTasks}
      completedTasks={completedTasks}
    />
  );
}
