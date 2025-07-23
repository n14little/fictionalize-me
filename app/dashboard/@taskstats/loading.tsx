export default function Loading() {
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
      <div className="task-completion-stats">
        <h2 className="text-lg font-bold mb-4 text-gray-300">
          Task Completion
        </h2>

        <div className="space-y-4">
          {/* Summary stats loading */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <h3 className="text-xs font-medium text-gray-300">
                Completion Rate
              </h3>
              <div className="text-lg font-bold text-gray-200">--.--%</div>
              <div className="text-xs text-gray-300">-- of -- tasks</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <h3 className="text-xs font-medium text-gray-300">Avg. Time</h3>
              <div className="text-lg font-bold text-gray-200">--m</div>
              <div className="text-xs text-gray-300">Per task</div>
            </div>
          </div>

          {/* Task completion calendar loading */}
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-medium text-gray-300">
                Last 30 Days
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-300">
                <span>Less</span>
                <div className="w-2 h-2 bg-gray-100 rounded-sm"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-sm"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-sm"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-sm"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-sm"></div>
                <span>More</span>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm bg-gray-100 animate-pulse"
                ></div>
              ))}
            </div>

            <div className="mt-2 text-xs text-gray-300">
              Daily task completion activity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
