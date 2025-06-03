import { notFound } from 'next/navigation';
import { journalService } from '../../../../lib/services/journalService';
import { taskService } from '../../../../lib/services/taskService';
import { authService } from '../../../../lib/services/authService';
import { QuickTaskButton } from '../../../../components/QuickTaskButton';
import { TaskItem } from './TaskItem';

export const dynamic = 'force-dynamic';

export default async function JournalTasksSidebar({ params: asyncParams }: { params: Promise<{ id: string }> }) {
  const params = await asyncParams;
  const journalId = params.id;
  
  // Get the current user (if authenticated)
  const user = await authService.getCurrentUser();
  
  // Get the journal and its tasks
  const journalPromise = journalService.getJournalById(journalId, user?.id);
  const tasksPromise = taskService.getJournalTasks(journalId, user?.id);
  
  // Fetch data in parallel
  const [journal, tasks] = await Promise.all([journalPromise, tasksPromise]);
  
  // If journal doesn't exist or user doesn't have access
  if (!journal) {
    notFound();
  }

  // Separate completed and pending tasks
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <QuickTaskButton journalId={journalId} />
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">PENDING</h3>
          {pendingTasks.length === 0 ? (
            <div className="text-gray-400 text-sm">No pending tasks</div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <TaskItem key={task.id} task={task} journalId={journalId} />
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">COMPLETED</h3>
          {completedTasks.length === 0 ? (
            <div className="text-gray-400 text-sm">No completed tasks</div>
          ) : (
            <div className="space-y-2 opacity-80">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} journalId={journalId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
