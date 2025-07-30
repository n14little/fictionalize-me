'use client';

import { KeyboardNavigationProvider } from '@/components/KeyboardNavigation';
import { DailyWriteModalButton } from '@/components/EntryButtonAliases';

export default function DashboardLayout({
  streaks: _streaks,
  taskstats,
  recententries,
  tasks,
}: {
  children: React.ReactNode;
  streaks: React.ReactNode;
  taskstats: React.ReactNode;
  recententries: React.ReactNode;
  tasks: React.ReactNode;
}) {
  const handleDailyWrite = () => {
    // Trigger the daily write modal by simulating a click on the daily write button
    const dailyWriteButton = document.querySelector(
      '[aria-label="Quick daily write"]'
    ) as HTMLElement;
    if (dailyWriteButton) {
      dailyWriteButton.click();
    }
  };

  return (
    <KeyboardNavigationProvider onDailyWrite={handleDailyWrite}>
      {/* Hidden daily write button for keyboard shortcut */}
      <div className="hidden">
        <DailyWriteModalButton />
      </div>

      <main className="flex-1 flex flex-col">
        <div className="w-full flex-1 mx-auto">
          <div className="flex flex-col lg:flex-row w-full gap-y-6 lg:gap-x-0 h-full">
            <div className="lg:w-2/12 lg:pr-6 lg:border-r lg:border-gray-200">
              {taskstats}

              <div className="text-sm text-gray-500 mb-2">
                Keyboard shortcuts: E for entries, T for tasks, ↑↓ to navigate,
                Enter to open/toggle, Ctrl+D for daily write
              </div>
              <div className="flex gap-2">
                <a
                  href="/reference-tasks"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Manage Reference Tasks
                </a>
              </div>
            </div>

            <div className="lg:w-8/12 lg:px-6 lg:border-r lg:border-gray-200 space-y-6">
              {recententries}
            </div>

            <div className="lg:w-2/12 lg:pl-6 space-y-6">
              <div className="lg:sticky lg:top-6">{tasks}</div>
            </div>
          </div>
        </div>
      </main>
    </KeyboardNavigationProvider>
  );
}
