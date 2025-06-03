import { notFound } from 'next/navigation';
import { journalService } from '../../../lib/services/journalService';
import { authService } from '../../../lib/services/authService';

export default async function JournalDetail({ params }: { params: Promise<{ id: string }> }) {
  const journalId = (await params).id;
  
  // Get the current user (if authenticated)
  const user = await authService.getCurrentUser();
  
  // Get the journal
  const journal = await journalService.getJournalById(journalId, user?.id);
  
  // If journal doesn't exist or user doesn't have access
  if (!journal) {
    notFound();
    return;
  }

  return <div className="sr-only">This page uses parallel routing. The actual content is provided by the @children and @tasks slots.</div>;
}