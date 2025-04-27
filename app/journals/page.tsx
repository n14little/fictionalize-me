import Link from 'next/link';
import { journalService } from '../../lib/services/journalService';
import { authService } from '../../lib/services/authService';
import { ClientJournalDate } from './ClientJournalDate';

export default async function MyJournals() {
  // Get the current user
  const currentUser = await authService.getCurrentUser();
  
  // Fetch journals for the current user instead of public journals
  const journals = currentUser 
    ? await journalService.getUserJournals(currentUser.id)
    : [];

  // Get the user's default or first journal for Daily Write
  const defaultJournal = journals.length > 0 ? journals[0] : null;

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

          {journals.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-green-800">Ready for your daily journaling habit?</h2>
                <p className="text-green-700 text-sm">Take just 2 minutes to complete today's entry</p>
              </div>
              <Link
                href={`/journals/daily-write?journalId=${defaultJournal?.id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <span className="mr-1">Daily Write</span>
                <span className="text-sm">✍️</span>
              </Link>
            </div>
          )}
        </div>

        {journals.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-700 mb-2">You don't have any journals yet.</p>
            <p className="text-gray-500 text-sm">Create your first journal to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journals.map((journal) => (
              <div
                key={journal.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-bold mb-2">{journal.title}</h2>
                {journal.description && (
                  <p className="text-gray-600 mb-4">{journal.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <ClientJournalDate label="Updated" date={journal.updated_at} />
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/journals/daily-write?journalId=${journal.id}`}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Daily Write
                    </Link>
                    <Link
                      href={`/journals/${journal.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Journal →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}