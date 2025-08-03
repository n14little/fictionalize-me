import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { referenceTaskService } from '@/lib/services/referenceTaskService';
import { journalService } from '@/lib/services/journalService';
import { FormButton } from '@/components/FormButton';
import { CsrfTokenInput } from '@/components/CsrfTokenInput';
import { updateReferenceTask } from './actions';
import { RECURRENCE_TYPE_TO_BUCKET } from '@/lib/models/Task';

export const dynamic = 'force-dynamic';

export default async function EditReferenceTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const { id } = await params;

  const [referenceTask, journals] = await Promise.all([
    referenceTaskService.getReferenceTaskById(id),
    journalService.getUserJournals(user.id),
  ]);

  if (!referenceTask || referenceTask.user_id !== user.id) {
    notFound();
  }

  if (journals.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
        <div className="w-full max-w-4xl">
          <Link
            href="/reference-tasks"
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to Reference Tasks
          </Link>
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              No Journals Found
            </h2>
            <p className="text-yellow-700 mb-4">
              You need to have at least one journal to edit reference tasks.
            </p>
            <Link
              href="/journals/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
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
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Link
            href="/reference-tasks"
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to Reference Tasks
          </Link>

          <h1 className="text-3xl font-bold mb-6">Edit Reference Task</h1>
          <p className="text-gray-600">Update your recurring task template.</p>
        </div>

        <form action={updateReferenceTask} className="space-y-6 max-w-2xl">
          <input type="hidden" name="id" value={referenceTask.id} />

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              defaultValue={referenceTask.title}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="e.g., Daily Exercise"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={referenceTask.description || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Optional description for this recurring task"
            />
          </div>

          <div>
            <label
              htmlFor="journal_id"
              className="block text-sm font-medium text-gray-700"
            >
              Journal *
            </label>
            <select
              id="journal_id"
              name="journal_id"
              required
              defaultValue={referenceTask.journal_id}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select a journal</option>
              {journals.map((journal) => (
                <option key={journal.id} value={journal.id}>
                  {journal.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="recurrence_type"
              className="block text-sm font-medium text-gray-700"
            >
              Recurrence Type *
            </label>
            <select
              id="recurrence_type"
              name="recurrence_type"
              required
              defaultValue={
                RECURRENCE_TYPE_TO_BUCKET[referenceTask.recurrence_type] || ''
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="recurrence_interval"
              className="block text-sm font-medium text-gray-700"
            >
              Recurrence Interval
            </label>
            <input
              type="number"
              id="recurrence_interval"
              name="recurrence_interval"
              min="1"
              defaultValue={referenceTask.recurrence_interval}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              How often to repeat (e.g., every 2 days, every 3 weeks)
            </p>
          </div>

          <div>
            <label
              htmlFor="starts_on"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date *
            </label>
            <input
              type="date"
              id="starts_on"
              name="starts_on"
              required
              defaultValue={referenceTask.starts_on.toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="ends_on"
              className="block text-sm font-medium text-gray-700"
            >
              End Date (Optional)
            </label>
            <input
              type="date"
              id="ends_on"
              name="ends_on"
              defaultValue={
                referenceTask.ends_on
                  ? referenceTask.ends_on.toISOString().split('T')[0]
                  : ''
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty for indefinite recurrence
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={referenceTask.is_active}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Inactive reference tasks won&apos;t generate new tasks
            </p>
          </div>

          <CsrfTokenInput />

          <div className="flex gap-4">
            <FormButton>Update Reference Task</FormButton>
            <Link
              href="/reference-tasks"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
