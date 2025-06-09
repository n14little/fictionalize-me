export default function Loading() {
  return (
    <div className="task-completion-stats mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-300">Task Completion Statistics</h2>
      
      {/* Time filter buttons - exactly matching actual button dimensions */}
      <div className="stats-time-filter flex gap-2 mb-6">
        <button className="px-4 py-2 rounded bg-blue-600 text-white">
          This Week
        </button>
        <button className="px-4 py-2 rounded bg-gray-200">
          This Month
        </button>
        <button className="px-4 py-2 rounded bg-gray-200">
          This Year
        </button>
      </div>
      
      {/* Stats cards - exact match for dimensions */}
      <div className="stats-summary-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-300">Completion Rate</h3>
          <div className="text-3xl font-bold text-gray-200">--.--%</div>
          <div className="text-sm text-gray-300">-- of -- tasks</div>
        </div>
        
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-300">Current Streak</h3>
          <div className="text-3xl font-bold text-gray-200">-- days</div>
          <div className="text-sm text-gray-300">Keep it going!</div>
        </div>
        
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-300">Avg. Completion Time</h3>
          <div className="text-3xl font-bold text-gray-200">-- min</div>
          <div className="text-sm text-gray-300">Per task</div>
        </div>
      </div>
      
      {/* Charts - exact match for dimensions */}
      <div className="stats-charts-grid grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="chart-container bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Task Progress</h3>
          <div className="h-64 bg-gray-50 flex items-center justify-center rounded">
            <div className="w-[100px] h-[100px] rounded-full border-8 border-gray-200"></div>
          </div>
        </div>
        
        <div className="chart-container bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Weekly Completion</h3>
          <div className="h-64 bg-gray-50 rounded flex items-end px-10">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 mx-1">
                <div className="bg-gray-200 h-16 rounded-t"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-container bg-white p-4 rounded-lg shadow col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Daily Task Completion</h3>
          <div className="h-64 bg-gray-50 flex items-center justify-center rounded">
            <svg width="80%" height="40%" viewBox="0 0 100 20">
              <path d="M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10" fill="none" stroke="#e5e7eb" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
