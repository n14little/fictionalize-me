'use client';

import { useMemo, useEffect, useState } from 'react';
import { TaskStats } from '../types/taskStats';
import {
  getDefaultTaskStats,
  getDailyCompletionData,
} from '../lib/utils/taskStatsUtils';

interface TaskCompletionStatsProps {
  stats?: TaskStats;
}

export function TaskCompletionStats({ stats }: TaskCompletionStatsProps) {
  const taskData = stats || getDefaultTaskStats();
  const [clientToday, setClientToday] = useState<string | null>(null);

  useEffect(() => {
    // Set today's date only on the client to avoid server/client mismatch
    const today = new Date();
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    setClientToday(todayString);
  }, []);

  // Get the last 30 days of task completion data
  const dailyData = useMemo(() => {
    return getDailyCompletionData(taskData, 'month');
  }, [taskData]);

  // Calculate intensity for each day (for color coding)
  const maxCompleted = Math.max(...dailyData.map((d) => d.completed), 1);

  const getSquareColor = (completed: number) => {
    if (completed === 0) return 'bg-gray-100';
    const intensity = completed / maxCompleted;
    if (intensity <= 0.25) return 'bg-blue-200';
    if (intensity <= 0.5) return 'bg-blue-300';
    if (intensity <= 0.75) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const getSquareTitle = (date: string, completed: number) => {
    // Parse the date string manually to avoid timezone issues
    // Assuming date is in YYYY-MM-DD format
    const [year, month, day] = date.split('-');
    const formattedDate = `${month}/${day}/${year}`;
    return `${formattedDate}: ${completed} task${
      completed !== 1 ? 's' : ''
    } completed`;
  };

  const isToday = (date: string) => {
    // Only highlight as today if we have the client-side date to avoid hydration mismatch
    return clientToday === date;
  };

  return (
    <div className="task-completion-stats">
      <h2 className="text-lg font-bold mb-4">Task Completion</h2>

      <div className="space-y-4">
        <div className="bg-white p-3 rounded-lg border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-medium text-gray-600">Last 30 Days</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Less</span>
              <div className="w-2 h-2 bg-gray-100 rounded-sm"></div>
              <div className="w-2 h-2 bg-blue-200 rounded-sm"></div>
              <div className="w-2 h-2 bg-blue-300 rounded-sm"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
              <span>More</span>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-1">
            {dailyData.map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${getSquareColor(
                  day.completed
                )} hover:ring-1 hover:ring-gray-400 cursor-default ${
                  isToday(day.date) ? 'ring-1 ring-blue-500' : ''
                }`}
                title={getSquareTitle(day.date, day.completed)}
              ></div>
            ))}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Daily task completion activity
          </div>
        </div>
      </div>
    </div>
  );
}
