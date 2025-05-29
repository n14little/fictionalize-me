import Link from 'next/link';
import { journalService } from '../../lib/services/journalService';
import { authService } from '../../lib/services/authService';
import { ClickableJournalCard } from './ClickableJournalCard';

export const dynamic = 'force-dynamic';

export default async function MyJournals() {
  // Get the current user
  const currentUser = await authService.getCurrentUser();

  // Fetch journals for the current user instead of public journals
  const journals = currentUser
    ? await journalService.getUserJournals(currentUser.id)
    : [];

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-5xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">My Journals</h1>
            <Link
              href="/journals/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Create New Journal
            </Link>
          </div>
        </div>

        {journals.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-700 mb-2">You don&apos;t have any journals yet.</p>
            <p className="text-gray-500 text-sm">Create your first journal to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journals.map((journal) => (
              <ClickableJournalCard key={journal.id} journal={journal} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}