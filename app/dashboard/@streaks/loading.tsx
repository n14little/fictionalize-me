export default function Loading() {
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="font-semibold text-lg mb-4 invisible">
        Your Journaling Habit
      </h2>

      {/* Calendar placeholder - matches exact structure of MiniJournalStreakCalendar */}
      <div className="mb-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-400">Last 30 Days</h3>
            <div className="text-blue-300 text-sm font-medium">
              View Full Calendar
            </div>
          </div>

          <div className="flex w-full">
            {Array.from({ length: 30 }).map((_, index) => (
              <div
                key={index}
                className="h-8 flex-grow rounded-sm bg-gray-100"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats cards - exact matches for the actual cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-blue-200 opacity-0">--</div>
          <div className="text-sm text-gray-300">Current Streak</div>
          <div className="text-xs mt-1 text-gray-300">days in a row</div>
        </div>

        <div className="bg-green-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-green-200 opacity-0">--</div>
          <div className="text-sm text-gray-300">Longest Streak</div>
          <div className="text-xs mt-1 text-gray-300">days in a row</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-purple-200 opacity-0">--</div>
          <div className="text-sm text-gray-300">Total Days</div>
          <div className="text-xs mt-1 text-gray-300">journaling</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-center text-gray-300">
        Last journaled: --/--/----
      </div>
    </div>
  );
}
