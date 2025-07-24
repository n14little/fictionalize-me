import { taskService } from '../../../../lib/services/taskService';
import { authService } from '../../../../lib/services/authService';
import { QuickTaskButton } from '../../../../components/QuickTaskButton';
import { TaskItem } from './TaskItem';

export const dynamic = 'force-dynamic';

export default async function JournalTasksSidebar({
  params,
}: {
  params: { id: string };
}) {
  const journalId = (await params).id;

  // Get the current user (if authenticated)
  const user = await authService.getCurrentUser();

  // Get tasks for this journal
  const tasks = await taskService.getJournalTasks(journalId, user?.id);

  // Separate completed and pending tasks
  const sortedTasks = [
    ...tasks.sort((a, b) => {
      if (a.completed_at && b.completed_at) {
        return (
          new Date(b.completed_at).getTime() -
          new Date(a.completed_at).getTime()
        );
      }
      return a.completed ? 1 : -1; // Completed tasks go to the end
    }),
  ];

  return (
    <div className="bg-white p-4 rounded-lg text-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <QuickTaskButton journalId={journalId} />
      </div>

      <div className="space-y-4">
        <div>
          {sortedTasks.length === 0 ? (
            <div className="text-gray-400 text-sm">No tasks</div>
          ) : (
            <div className="space-y-2">
              {sortedTasks.map((task) => (
                <TaskItem key={task.id} task={task} journalId={journalId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
