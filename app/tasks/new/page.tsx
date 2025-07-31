import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/authService';
import { journalService } from '@/lib/services/journalService';
import { TaskForm } from '@/app/tasks/TaskForm';

export const dynamic = 'force-dynamic';

export default async function NewTaskPage() {
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const journals = await journalService.getUserJournals(user.id);

  if (journals.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
        <div className="w-full max-w-2xl">
          <Link
            href="/tasks"
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to Tasks
          </Link>
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Create a Journal First</h1>
            <p className="text-gray-600 mb-6">
              You need to create a journal before you can create tasks.
            </p>
            <Link
              href="/journals/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Your First Journal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/tasks"
          className="text-blue-600 hover:text-blue-800 mb-4 block"
        >
          ← Back to Tasks
        </Link>
        <h1 className="text-2xl font-bold mb-8">Create New Task</h1>
        <TaskForm journals={journals} />
      </div>
    </main>
  );
}
