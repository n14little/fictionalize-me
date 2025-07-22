export default function Loading() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-gray-300">All Tasks</h2>
        <div className="text-xs text-gray-300">
          Loading...
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">
          Pending Tasks
        </h3>
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-2 border border-gray-200 rounded bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded border"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
