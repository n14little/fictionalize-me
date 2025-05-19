import { journalStreakService } from '../lib/services/journalStreakService';
import { authService } from '../lib/services/authService';

// TODO: React Components should not be async functions. Only pages, layouts, and other NextJS specifics
// just pass the streak stats to the component

export async function JournalStreak() {
  // Get the current user
  const user = await authService.getCurrentUser();
  
  // If not logged in, don't display streak information
  if (!user) {
    return null;
  }
  
  // Get the user's streak stats
  const streakStats = await journalStreakService.getUserStreakStats(user.id);
  
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="font-semibold text-lg mb-4">Your Journaling Habit</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-blue-600">{streakStats.currentStreak}</div>
          <div className="text-sm text-gray-600">Current Streak</div>
          <div className="text-xs mt-1 text-gray-500">days in a row</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-green-600">{streakStats.longestStreak}</div>
          <div className="text-sm text-gray-600">Longest Streak</div>
          <div className="text-xs mt-1 text-gray-500">days in a row</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-md text-center">
          <div className="text-3xl font-bold text-purple-600">{streakStats.totalDays}</div>
          <div className="text-sm text-gray-600">Total Days</div>
          <div className="text-xs mt-1 text-gray-500">journaling</div>
        </div>
      </div>
      
      {streakStats.lastStreakDate && (
        <div className="mt-4 text-sm text-center text-gray-500">
          Last journaled: {new Date(streakStats.lastStreakDate).toLocaleDateString()}
        </div>
      )}
      
      {streakStats.currentStreak > 0 ? (
        <div className="mt-4 text-center bg-blue-100 text-blue-700 p-2 rounded">
          {streakStats.currentStreak === 1 ? (
            "Great start! You've journaled today."
          ) : (
            `Keep going! You've journaled ${streakStats.currentStreak} days in a row.`
          )}
        </div>
      ) : (
        <div className="mt-4 text-center bg-gray-100 text-gray-700 p-2 rounded">
          Start your streak by journaling today!
        </div>
      )}
    </div>
  );
}