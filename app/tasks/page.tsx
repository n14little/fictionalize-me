import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/authService';
import { taskService } from '@/lib/services/taskService';
import { journalService } from '@/lib/services/journalService';
import { TasksList } from '@/app/tasks/TasksList';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const [tasks, journals] = await Promise.all([
    taskService.getUserTasks(user.id),
    journalService.getUserJournals(user.id),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Tasks</h1>
            <Link
              href="/tasks/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              New Task
            </Link>
          </div>
        </div>

        {journals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You need to create a journal before you can create tasks.
            </p>
            <Link
              href="/journals/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Your First Journal
            </Link>
          </div>
        ) : (
          <TasksList tasks={tasks} journals={journals} />
        )}
      </div>
    </main>
  );
}
