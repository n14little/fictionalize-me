"use client";

import { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';

interface TaskStats {
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

interface TaskCompletionStatsProps {
  stats?: TaskStats;
}

export function TaskCompletionStats({ stats }: TaskCompletionStatsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  // Use mock data if no stats are provided
  const defaultStats: TaskStats = {
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
  
  const taskData = stats || defaultStats;
  
  const progressData = [
    { id: 'completed', label: 'Completed', value: taskData.completedTasks, color: '#4CAF50' },
    { id: 'pending', label: 'Pending', value: taskData.pendingTasks, color: '#FFC107' }
  ];
  
  // Filter daily completion data based on selected time range
  const getDailyCompletionData = () => {
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
    
    return [
      {
        id: 'completed tasks',
        data: filtered.map(item => ({
          x: item.date,
          y: item.completed
        }))
      }
    ];
  };
  
  return (
    <div className="task-completion-stats">
      <h2 className="text-2xl font-bold mb-4">Task Completion Statistics</h2>
      
      <div className="stats-time-filter flex gap-2 mb-6">
        <button 
          className={`px-4 py-2 rounded ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTimeRange('week')}
        >
          This Week
        </button>
        <button 
          className={`px-4 py-2 rounded ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTimeRange('month')}
        >
          This Month
        </button>
        <button 
          className={`px-4 py-2 rounded ${timeRange === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTimeRange('year')}
        >
          This Year
        </button>
      </div>
      
      <div className="stats-summary-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600">Completion Rate</h3>
          <div className="text-3xl font-bold">{taskData.completionRate}%</div>
          <div className="text-sm text-gray-500">{taskData.completedTasks} of {taskData.totalTasks} tasks</div>
        </div>
        
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600">Current Streak</h3>
          <div className="text-3xl font-bold">{taskData.streakDays} days</div>
          <div className="text-sm text-gray-500">Keep it going!</div>
        </div>
        
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600">Avg. Completion Time</h3>
          <div className="text-3xl font-bold">{taskData.averageCompletionTime} min</div>
          <div className="text-sm text-gray-500">Per task</div>
        </div>
      </div>
      
      <div className="stats-charts-grid grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="chart-container bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600 mb-4">Task Progress</h3>
          <div className="h-64">
            <ResponsivePie
              data={progressData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              colors={{ datum: 'data.color' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              layers={[
                'arcs',
                'arcLabels',
                'arcLinkLabels',
                'legends',
                ({ centerX, centerY }) => (
                  <g>
                    <text
                      x={centerX}
                      y={centerY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        fill: '#333'
                      }}
                    >
                      {taskData.totalTasks}
                    </text>
                  </g>
                )
              ]}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle'
                }
              ]}
            />
          </div>
        </div>
        
        <div className="chart-container bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600 mb-4">Weekly Completion</h3>
          <div className="h-64">
            <ResponsiveBar
              data={taskData.weeklyCompletion}
              keys={['count']}
              indexBy="day"
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              padding={0.3}
              colors="#2196F3"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              animate={true}
              motionConfig="gentle"
            />
          </div>
        </div>
        
        <div className="chart-container bg-white p-4 rounded-lg shadow col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-600 mb-4">Daily Task Completion</h3>
          <div className="h-64">
            <ResponsiveLine
              data={getDailyCompletionData()}
              margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
              xScale={{
                type: 'time',
                format: '%Y-%m-%d',
                precision: 'day',
              }}
              xFormat="time:%Y-%m-%d"
              yScale={{
                type: 'linear',
                min: 0,
                max: 'auto',
                stacked: false,
                reverse: false
              }}
              curve="natural"
              axisBottom={{
                format: '%b %d',
                tickValues: 'every 2 days',
                legend: 'Date',
                legendOffset: 36,
                legendPosition: 'middle'
              }}
              axisLeft={{
                legend: 'Tasks',
                legendOffset: -40,
                legendPosition: 'middle'
              }}
              colors="#3182CE"
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabel="y"
              pointLabelYOffset={-12}
              areaOpacity={0.15}
              useMesh={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}