'use client';

import { KeyboardNavigationProvider } from '@/components/KeyboardNavigation';
import { DailyWriteModalButton } from '@/components/EntryButtonAliases';

export default function DashboardLayout({
  streaks,
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

      <main className="flex min-h-screen flex-col p-4 md:p-12">
        <div className="w-full mx-auto">
          {/* Three column layout with header and content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 w-full gap-y-6 gap-x-6">
            {/* Left gutter - header row */}
            <div className="lg:col-span-2">
              <div className="hidden lg:block"></div>
            </div>

            {/* Header aligned with main content */}
            <div className="lg:col-span-8 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold">Journaling Dashboard</h1>
                  <p className="text-gray-600 mt-2">
                    Track your journaling progress and build your writing habit
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-2">
                    Keyboard shortcuts: E for entries, T for tasks, ↑↓ to
                    navigate, Enter to open/toggle, Ctrl+D for daily write
                  </div>
                </div>
              </div>
            </div>

            {/* Right gutter - header row */}
            <div className="lg:col-span-2">
              <div className="hidden lg:block"></div>
            </div>

            {/* Left gutter - content row */}
            <div className="lg:col-span-2">
              <div className="hidden lg:block h-full"></div>
            </div>

            {/* Main content area - streaks and recent entries */}
            <div className="lg:col-span-8 space-y-6">
              {streaks}
              {recententries}
            </div>

            {/* Right sidebar for task stats and tasks */}
            <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start space-y-6">
              {taskstats}
              {tasks}
            </div>
          </div>
        </div>
      </main>
    </KeyboardNavigationProvider>
  );
}
