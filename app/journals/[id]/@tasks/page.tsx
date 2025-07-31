import { taskService } from '../../../../lib/services/taskService';
import { authService } from '../../../../lib/services/authService';
import { QuickTaskButton } from '../../../../components/QuickTaskButton';
import { JournalTasksList } from './JournalTasksList';

export const dynamic = 'force-dynamic';

export default async function JournalTasksSidebar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const journalId = (await params).id;

  // Get the current user (if authenticated)
  const user = await authService.getCurrentUser();

  // Get tasks for this journal - they will be ordered by priority
  const tasks = await taskService.getJournalTasks(journalId, user?.id);

  return (
    <div className="bg-white p-4 rounded-lg text-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <QuickTaskButton journalId={journalId} />
      </div>

      <JournalTasksList tasks={tasks} journalId={journalId} />
    </div>
  );
}
