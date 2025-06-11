import { TaskStats } from '../../types/taskStats';
import { format, subDays, addDays } from 'date-fns';

export const getDefaultTaskStats = (): TaskStats => {
  return {
    completedTasks: 24,
    pendingTasks: 7,
    totalTasks: 31,
    completionRate: 77.42,
    streakDays: 5,
    weeklyCompletion: [
      { day: 'Mon', count: 5 },
      { day: 'Tue', count: 4 },
      { day: 'Wed', count: 6 },
      { day: 'Thu', count: 3 },
      { day: 'Fri', count: 2 },
      { day: 'Sat', count: 3 },
      { day: 'Sun', count: 1 }
    ],
    dailyCompletion: Array.from({ length: 30 }, (_, i) => ({
      date: `2025-05-${String(i + 1).padStart(2, '0')}`,
      completed: Math.floor(Math.random() * 8)
    })),
    averageCompletionTime: 45
  };
};

export const getProgressData = (taskData: TaskStats) => {
  return [
    { id: 'completed', label: 'Completed', value: taskData.completedTasks, color: '#4CAF50' },
    { id: 'pending', label: 'Pending', value: taskData.pendingTasks, color: '#FFC107' }
  ];
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

/**
 * Calculate weekly completion data from raw timestamps
 * This processes the data in the client timezone to ensure days are correctly calculated
 */
export const getWeeklyCompletionData = (timestamps: string[]): TaskStats['weeklyCompletion'] => {
  // Define standard day order
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Create a map to count tasks completed on each day of the week
  const dayCountMap: Record<string, number> = {};
  
  // Count tasks completed on each day
  timestamps.forEach(timestamp => {
    // Parse the timestamp in the client's timezone 
    const date = new Date(timestamp);
    
    // Get day of week abbreviation in standard format (Mon, Tue, etc.)
    // Use 'E' (1-letter) for single letter abbreviations or 'EEE' (3-letters) for standard abbreviations
    const day = format(date, 'EEE').substring(0, 3);
    
    // Increment count for this day
    dayCountMap[day] = (dayCountMap[day] || 0) + 1;
  });
  
  // Ensure all days of the week are represented in the result
  return dayOrder.map(day => {
    return {
      day,
      count: dayCountMap[day] || 0
    };
  });
};
