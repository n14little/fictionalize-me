import { TaskStats } from '../../types/taskStats';
import { format, subDays, addDays } from 'date-fns';

export const getDefaultTaskStats = (): TaskStats => {
  // Use deterministic data to avoid hydration mismatches from Math.random()
  const completedCounts = [0, 2, 1, 3, 4, 0, 1, 5, 2, 3, 1, 0, 2, 4, 1, 3, 0, 2, 5, 1, 2, 0, 3, 1, 4, 2, 0, 1, 3, 2];
  
  return {
    dailyCompletion: Array.from({ length: 30 }, (_, i) => ({
      date: `2025-05-${String(i + 1).padStart(2, '0')}`,
      completed: completedCounts[i]
    }))
  };
};

export const getDailyCompletionData = (taskData: TaskStats, timeRange: 'week' | 'month' | 'year'): TaskStats['dailyCompletion'] => {
  const today = new Date();

  // we start with today so we only need to
  // subtract n-1 days in order get the correct range
  const daysToSubtract = {
    week: 6,
    month: 29,
    year: 364
  };
  const startDate = subDays(today, daysToSubtract[timeRange]);

  const dateMap: Record<string, number> = {};
  taskData.dailyCompletion.forEach(item => {
    // Parse the full timestamp
    const timestamp = new Date(item.date);

    // Format to YYYY-MM-DD for grouping by day
    const formattedDate = format(timestamp, 'yyyy-MM-dd');
    
    if (timestamp >= startDate && timestamp <= today) {
      // Aggregate tasks completed on the same day
      dateMap[formattedDate] = (dateMap[formattedDate] || 0) + item.completed;
    }
  });

  const allDates: TaskStats['dailyCompletion'] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= today) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    allDates.push({
      date: dateStr,
      completed: dateMap[dateStr] || 0
    });
    currentDate = addDays(currentDate, 1);
  }

  return allDates.sort((a, b) => a.date.localeCompare(b.date));
};
