import { taskService } from '@/lib/services/taskService';
import { getCurrentUserId } from '../utils';
import { DashboardTasksList } from '@/app/dashboard/@tasks/DashboardTasksList';

export const dynamic = 'force-dynamic';

export default async function DashboardTasksSlot() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  // Get all tasks for the user across all journals
  const allTasks = await taskService.getUserTasks(userId);

  // Separate pending and completed tasks
  const pendingTasks = allTasks.filter((task) => !task.completed);
  const completedTasks = allTasks
    .filter((task) => task.completed)
    .sort((a, b) => {
      // Sort completed tasks by completion date (most recent first)
      if (!a.completed_at && !b.completed_at) return 0;
      if (!a.completed_at) return 1;
      if (!b.completed_at) return -1;
      return (
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );
    });

  return (
    <DashboardTasksList
      pendingTasks={pendingTasks}
      completedTasks={completedTasks}
    />
  );
}
