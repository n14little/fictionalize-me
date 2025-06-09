import { ReactNode } from 'react';

export default function DashboardLayout({
  streaks,
  writingstats,
  taskstats,
}: {
  children: ReactNode;
  streaks: ReactNode;
  writingstats: ReactNode;
  taskstats: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Journaling Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your journaling progress and build your writing habit</p>
        </div>
        {streaks}
        {writingstats}
        {taskstats}
      </div>
    </main>
  );
}