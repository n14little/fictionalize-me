import Link from 'next/link';
import { notFound } from 'next/navigation';
import { journalService } from '../../../../lib/services/journalService';
import { taskService } from '../../../../lib/services/taskService';
import { authService } from '../../../../lib/services/authService';
import { QuickTaskButton } from '../../../../components/QuickTaskButton';
import { TaskItem } from './TaskItem';

export const dynamic = 'force-dynamic';

export default async function JournalTasks({ params: asyncParams }: { params: Promise<{ id: string }> }) {
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
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Link
            href={`/journals/${journalId}`} 
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to Journal
          </Link>
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold mb-2">Tasks for {journal.title}</h1>
            <QuickTaskButton journalId={journalId} />
          </div>
          
          {journal.description && (
            <p className="text-gray-600 mb-6">{journal.description}</p>
          )}
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold mb-4">Pending Tasks</h2>
            
            {pendingTasks.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-700">No pending tasks for this journal.</p>
              </div>
            ) : (
              <div className="w-full space-y-2">
                {pendingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} journalId={journalId} />
                ))}
              </div>
            )}
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Completed Tasks</h2>
            
            {completedTasks.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-700">No completed tasks for this journal.</p>
              </div>
            ) : (
              <div className="w-full space-y-2 opacity-80">
                {completedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} journalId={journalId} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
