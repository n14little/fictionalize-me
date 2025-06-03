import { ReactNode } from 'react';

interface JournalDetailLayoutProps {
  children: ReactNode;
  entries: ReactNode;
  tasks: ReactNode;
}

export default function JournalDetailLayout({
  entries,
  tasks,
}: JournalDetailLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6">
        <div className="flex-1">{entries}</div>
        <div className="w-full lg:w-80 shrink-0">{tasks}</div>
      </div>
    </div>
  );
}
