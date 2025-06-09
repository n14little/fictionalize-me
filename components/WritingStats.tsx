interface EntriesStats {
  totalEntries: number;
  totalWords: number;
  firstEntryDate: Date | null;
  mostRecentEntryDate: Date | null;
}

interface WritingStatsProps {
  entriesStats: EntriesStats;
}

export function WritingStats({ entriesStats }: WritingStatsProps) {
  // Calculate average words per entry
  const averageWords = entriesStats.totalEntries > 0 
    ? Math.round(entriesStats.totalWords / entriesStats.totalEntries) 
    : 0;
  
  // Calculate weekly average entries
  const weeksSinceFirstEntry = entriesStats.firstEntryDate 
    ? Math.max(1, Math.round((Date.now() - entriesStats.firstEntryDate.getTime()) / (7 * 24 * 60 * 60 * 1000))) 
    : 1;
  const weeklyAverage = Math.round((entriesStats.totalEntries / weeksSinceFirstEntry) * 10) / 10;
  
  // Format dates
  const firstEntryDate = entriesStats.firstEntryDate 
    ? new Date(entriesStats.firstEntryDate).toLocaleDateString() 
    : 'No entries yet';
  
  const mostRecentEntryDate = entriesStats.mostRecentEntryDate 
    ? new Date(entriesStats.mostRecentEntryDate).toLocaleDateString() 
    : 'No entries yet';
  
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="font-semibold text-lg mb-4">Your Writing Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-indigo-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-indigo-600">{entriesStats.totalEntries}</div>
          <div className="text-sm text-gray-600">Total Entries</div>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-teal-600">{entriesStats.totalWords}</div>
          <div className="text-sm text-gray-600">Total Words</div>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-amber-600">{averageWords}</div>
          <div className="text-sm text-gray-600">Average Words per Entry</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-100 rounded-md">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Time Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">First Entry</span>
              <span className="text-gray-800">{firstEntryDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most Recent Entry</span>
              <span className="text-gray-800">{mostRecentEntryDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly Average</span>
              <span className="text-gray-800">{weeklyAverage} entries/week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}