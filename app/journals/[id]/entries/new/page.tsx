import Link from 'next/link';
import { redirect } from 'next/navigation';
import { journalService } from '../../../../../lib/services/journalService';
import { authService } from '../../../../../lib/services/authService';
import { FormButton } from '../../../../../components/FormButton';
import { createEntry } from '../actions';

export default async function NewJournalEntry({ params }: { params: { id: string } }) {
  const journalId = params.id;
  
  // Get the current user (if authenticated)
  const user = await authService.getCurrentUser();
  
  // Get the journal to verify access and show journal name
  const journal = await journalService.getJournalById(journalId, user?.id);
  
  // If journal doesn't exist or user doesn't have access, this will handle it
  if (!journal) {
    redirect('/journals');
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link
            href={`/journals/${journalId}`}
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to {journal.title}
          </Link>
          
          <h1 className="text-3xl font-bold mb-8">Add New Entry</h1>
          
          <form action={createEntry} className="space-y-6">
            {/* Hidden input for the journal ID */}
            <input type="hidden" name="journalId" value={journalId} />
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a title for your entry"
                required
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write your journal entry here..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1">
                  Mood (optional)
                </label>
                <input
                  id="mood"
                  name="mood"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="How are you feeling?"
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location (optional)
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Where are you?"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link
                href={`/journals/${journalId}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <FormButton>Save Entry</FormButton>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}