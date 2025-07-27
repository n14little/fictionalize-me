import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/authService';
import { referenceTaskService } from '@/lib/services/referenceTaskService';
import { journalService } from '@/lib/services/journalService';

export const dynamic = 'force-dynamic';

export default async function ReferenceTasksPage() {
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const [referenceTasks, journals] = await Promise.all([
    referenceTaskService.getUserReferenceTasks(user.id),
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

          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Reference Tasks</h1>
            <Link
              href="/reference-tasks/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Create Reference Task
            </Link>
          </div>
          <p className="text-gray-600">
            Manage your recurring task templates that can generate tasks
            automatically.
          </p>
        </div>

        {referenceTasks.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-700 mb-2">
              You don&apos;t have any reference tasks yet.
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Create reference tasks to automatically generate recurring tasks.
            </p>
            <Link
              href="/reference-tasks/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Create Your First Reference Task
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {referenceTasks.map((task) => {
              const journal = journals.find((j) => j.id === task.journal_id);
              return (
                <div
                  key={task.id}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {task.recurrence_type}
                          {task.recurrence_interval > 1 &&
                            ` (every ${task.recurrence_interval})`}
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {journal?.title || 'Unknown Journal'}
                        </span>
                        {!task.is_active && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/reference-tasks/${task.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
