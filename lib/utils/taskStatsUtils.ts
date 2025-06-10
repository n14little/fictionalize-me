import { TaskStats } from '../../types/taskStats';

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
  const filtered = taskData.dailyCompletion.filter(item => {
    const date = new Date(item.date);
    if (timeRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return date >= weekAgo;
    } else if (timeRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return date >= monthAgo;
    } else {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      return date >= yearAgo;
    }
  });
  
  return filtered;
};
