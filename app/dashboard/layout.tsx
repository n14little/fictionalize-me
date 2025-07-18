export default function DashboardLayout({
  streaks,
  taskstats,
  recententries,
}: {
  children: React.ReactNode;
  streaks: React.ReactNode;
  taskstats: React.ReactNode;
  recententries: React.ReactNode;
}) {
  return (
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
            <h1 className="text-3xl font-bold">Journaling Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your journaling progress and build your writing habit</p>
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

          {/* Right sidebar for task stats */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            {taskstats}
          </div>
        </div>
      </div>
    </main>
  );
}