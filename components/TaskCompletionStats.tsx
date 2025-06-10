"use client";

import { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { TaskStats } from '../types/taskStats';
import { getDefaultTaskStats, getProgressData, getDailyCompletionData } from '../lib/utils/taskStatsUtils';

interface TaskCompletionStatsProps {
  stats?: TaskStats;
}

export function TaskCompletionStats({ stats }: TaskCompletionStatsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  const taskData = stats || getDefaultTaskStats();
  const progressData = getProgressData(taskData);
  
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
      
      <div className="stats-summary-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600">Completion Rate</h3>
          <div className="text-3xl font-bold">{taskData.completionRate}%</div>
          <div className="text-sm text-gray-500">{taskData.completedTasks} of {taskData.totalTasks} tasks</div>
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
          <h3 className="text-lg font-medium text-gray-600 mb-4">Tasks by Day of Week</h3>
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
              data={[{
                id: 'completed_tasks',
                data: getDailyCompletionData(taskData, timeRange).map(item => ({
                  x: item.date,
                  y: item.completed
                }))
              }]}
              margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
              xScale={{
                type: 'time',
                format: '%Y-%m-%d',
                precision: 'day',
                useUTC: false
              }}
              xFormat="time:%b %d"
              yScale={{
                type: 'linear',
                min: 0,
                max: 'auto',
                stacked: false,
                reverse: false
              }}
              curve="monotoneX"
              axisBottom={{
                format: '%b %d',
                tickValues: timeRange === 'week' 
                  ? 'every day' 
                  : timeRange === 'month' 
                  ? 'every 5 days' 
                  : 'every month',
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
              pointSize={6}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabel="y"
              pointLabelYOffset={-12}
              enableArea={true}
              areaOpacity={0.15}
              useMesh={true}
              enableSlices="x"
            />
          </div>
        </div>
      </div>
    </div>
  );
}