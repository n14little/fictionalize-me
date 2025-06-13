import { TaskCompletionStats } from '@/components/TaskCompletionStats';
import { taskStatsService } from '@/lib/services/taskStatsService';
import { getCurrentUserId } from '../utils';

export default async function TaskStatsSection() {
  const userId = await getCurrentUserId();
  
  // Fetch task stats for the user if authenticated
  // If not authenticated, main page will handle redirect
  const taskStats = userId
    ? await taskStatsService.getUserTaskStats(userId)
    : undefined;
  
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
      <TaskCompletionStats stats={taskStats} />
    </div>
  );
}
