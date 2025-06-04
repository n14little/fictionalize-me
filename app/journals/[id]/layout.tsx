import { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { journalService } from '../../../lib/services/journalService';
import { authService } from '../../../lib/services/authService';

interface JournalDetailLayoutProps {
  children: ReactNode;
  entries: ReactNode;
  tasks: ReactNode;
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function JournalDetailLayout({
  entries,
  tasks,
  params,
}: JournalDetailLayoutProps) {
  const journalId = (await params).id;
  const user = await authService.getCurrentUser();
  const journal = await journalService.getJournalById(journalId, user?.id);
  
  if (!journal) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-7xl">
        <Link
          href="/journals" 
          className="text-blue-600 hover:text-blue-800 mb-4 block"
        >
          ← Back to Journals
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{journal.title}</h1>
          {journal.description && (
            <p className="text-gray-600">{journal.description}</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6  border-t border-gray-200">
          <div className="flex-1">{entries}</div>
          <div className="w-full lg:w-80 shrink-0">{tasks}</div>
        </div>
      </div>
    </div>
  );
}
