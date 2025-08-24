import { taskService } from '@/lib/services/taskService';
import { getCurrentUserId } from '../utils';
import { DashboardTasksList } from '@/app/dashboard/@tasks/DashboardTasksList';

export const dynamic = 'force-dynamic';

export default async function DashboardTasksSlot() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  // Get bucketed tasks for the user with hierarchical ordering preserved
  const taskBuckets =
    await taskService.getUserTasksBucketedHierarchical(userId);

  // Get completed tasks from all buckets for the completed section
  const allTasks = [
    ...taskBuckets.daily,
    ...taskBuckets.weekly,
    ...taskBuckets.monthly,
    ...taskBuckets.yearly,
    ...taskBuckets.custom,
    ...taskBuckets.regular,
  ];

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
      taskBuckets={taskBuckets}
      completedTasks={completedTasks}
    />
  );
}
