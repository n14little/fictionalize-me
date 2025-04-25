import Link from 'next/link';
import { redirect } from 'next/navigation';
import { journalService } from '../../../../../lib/services/journalService';
import { authService } from '../../../../../lib/services/authService';
import { RichTextEditorWrapper } from './RichTextEditorWrapper';

export default async function NewJournalEntry({ params }: { params: { id: string } }) {
  const journalId = (await params).id;

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
          
          <RichTextEditorWrapper journalId={journalId} />
        </div>
      </div>
    </main>
  );
}