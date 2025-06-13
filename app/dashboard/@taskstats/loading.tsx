export default function Loading() {
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
      <div className="task-completion-stats">
        <h2 className="text-lg font-bold mb-4 text-gray-300">Task Completion Statistics</h2>
        
        {/* Time filter buttons - exactly matching actual button dimensions */}
        <div className="stats-time-filter flex gap-1 mb-4 text-sm">
          <button className="px-2 py-1 rounded bg-blue-600 text-white">
            This Week
          </button>
          <button className="px-2 py-1 rounded bg-gray-200">
            This Month
          </button>
          <button className="px-2 py-1 rounded bg-gray-200">
            This Year
          </button>
        </div>
      
        {/* Stats cards - exact match for dimensions */}
        <div className="stats-summary-grid grid grid-cols-1 gap-4 mb-6">
          <div className="stat-card p-3 bg-white rounded-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-300">Completion Rate</h3>
            <div className="text-2xl font-bold text-gray-200">--.--%</div>
            <div className="text-xs text-gray-300">-- of -- tasks</div>
          </div>
          
          <div className="stat-card p-3 bg-white rounded-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-300">Avg. Completion Time</h3>
            <div className="text-2xl font-bold text-gray-200">-- min</div>
            <div className="text-xs text-gray-300">Per task</div>
          </div>
        </div>
        
        {/* Charts - exact match for dimensions */}
        <div className="stats-charts-grid grid grid-cols-1 gap-4">
          <div className="chart-container bg-white p-3 rounded-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Task Progress</h3>
            <div className="h-48 bg-gray-50 flex items-center justify-center rounded">
              <div className="w-[60px] h-[60px] rounded-full border-6 border-gray-200"></div>
            </div>
          </div>
          
          <div className="chart-container bg-white p-3 rounded-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Tasks by Day of Week</h3>
            <div className="h-48 bg-gray-50 rounded flex items-end px-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 mx-1">
                  <div className="bg-gray-200 h-12 rounded-t"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container bg-white p-3 rounded-lg border border-gray-100 col-span-1">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Daily Task Completion</h3>
            <div className="h-48 bg-gray-50 flex items-center justify-center rounded">
              <svg width="80%" height="40%" viewBox="0 0 100 20">
                <path d="M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10" fill="none" stroke="#e5e7eb" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
