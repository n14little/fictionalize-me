export default function Loading() {
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="font-semibold text-lg mb-4 text-gray-300">Your Writing Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-indigo-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-indigo-200 opacity-0">--</div>
          <div className="text-sm text-gray-300">Total Entries</div>
        </div>

        <div className="bg-teal-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-teal-200 opacity-0">--</div>
          <div className="text-sm text-gray-300">Total Words</div>
        </div>

        <div className="bg-amber-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-amber-200 opacity-0">--</div>
          <div className="text-sm text-gray-300">Average Words per Entry</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-100 rounded-md">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Time Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">First Entry</span>
              <span className="text-gray-300">--/--/----</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Most Recent Entry</span>
              <span className="text-gray-300">--/--/----</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Weekly Average</span>
              <span className="text-gray-300">-- entries/week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
