import { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="bg-white shadow rounded-lg border border-gray-200 p-6 mt-6">
        <h2 className="font-semibold text-lg mb-4">Tips for Building a Journaling Habit</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>Try to journal at the same time each day to establish a routine</li>
          <li>Start with just 2 minutes of writing.</li>
          <li>Keep your journal easily accessible</li>
          <li>Use prompts when you&apos;re not sure what to write about</li>
          <li>Don&apos;t worry about perfect writing - focus on getting your thoughts down</li>
          <li>Celebrate your streaks and progress!</li>
        </ul>
      </div>
    </div>
  );
}