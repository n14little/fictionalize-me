import { TaskCompletionStats } from '@/components/TaskCompletionStats';

export default function TaskStatsSection() {
  // No need to fetch user data as TaskCompletionStats uses mock data
  // Later when real task data is implemented, you can use getCurrentUserId() here
  
  return (
    <div className="mt-8">
      <TaskCompletionStats />
    </div>
  );
}
