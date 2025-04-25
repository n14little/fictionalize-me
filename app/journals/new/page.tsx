import Link from 'next/link';
import { authService } from '../../../lib/services/authService';
import { FormButton } from '../../../components/FormButton';
import { createJournal } from './actions';

export default async function CreateJournal() {
  // Ensure user is authenticated
  await authService.getCurrentUser();
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/journals" 
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to Journals
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">Create New Journal</h1>
          
          <form action={createJournal} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <FormButton>Create Journal</FormButton>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
