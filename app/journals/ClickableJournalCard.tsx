import Link from 'next/link';
import { Journal } from '../../lib/models/Journal';
import { ClientJournalDate } from './ClientJournalDate';

interface ClickableJournalCardProps {
  journal: Journal;
}

export function ClickableJournalCard({ journal }: ClickableJournalCardProps) {
  return (
    <Link
      href={`/journals/${journal.id}`}
      className="block border border-gray-200 rounded-lg p-5 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
      aria-label={`View ${journal.title} journal`}
      prefetch={true}
    >
      <h2 className="text-xl font-bold mb-2">{journal.title}</h2>
      {journal.description && (
        <p className="text-gray-600 mb-4">{journal.description}</p>
      )}
      <div className="flex justify-between items-center">
        <ClientJournalDate label="Updated" date={journal.updated_at} />
      </div>
    </Link>
  );
}
