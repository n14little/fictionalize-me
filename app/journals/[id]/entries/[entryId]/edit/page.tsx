import Link from 'next/link';
import { notFound } from 'next/navigation';
import { journalService } from '../../../../../../lib/services/journalService';
import { journalEntryService } from '../../../../../../lib/services/journalEntryService';
import { authService } from '../../../../../../lib/services/authService';
import { RichTextEditorWrapper } from './RichTextEditorWrapper';

export default async function EditJournalEntry({ 
  params 
}: { 
  params: { id: string; entryId: string } 
}) {
  const { id: journalId, entryId } = params;
  
  // Get the current user (if authenticated)
  const user = await authService.getCurrentUser();

  // Get the journal and entry to verify access
  const journal = await journalService.getJournalById(journalId, user?.id);
  const entry = await journalEntryService.getJournalEntryById(entryId, user?.id);
  
  // If journal or entry doesn't exist or user doesn't have access
  if (!journal || !entry) {
    notFound();
  }
  
  // Make sure the entry belongs to the specified journal
  if (entry.journal_id !== journalId) {
    notFound();
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
          
          <h1 className="text-3xl font-bold mb-8">Edit Journal Entry</h1>
          
          <RichTextEditorWrapper 
            journalId={journalId} 
            entry={entry} 
          />
        </div>
      </div>
    </main>
  );
}