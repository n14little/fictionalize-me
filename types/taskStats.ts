export interface TaskStats {
  completedTasks: number;
  pendingTasks: number;
  totalTasks: number;
  completionRate: number;
  streakDays: number;
  weeklyCompletion: {
    day: string;
    count: number;
  }[];
  dailyCompletion: {
    date: string;
    completed: number;
  }[];
  averageCompletionTime: number; // in minutes
}
