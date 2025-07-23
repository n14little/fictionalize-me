"use client";

import { ResponsivePie } from '@nivo/pie';
import { TaskStats } from '../types/taskStats';
import { getDefaultTaskStats, getProgressData } from '../lib/utils/taskStatsUtils';

interface TaskCompletionStatsProps {
  stats?: TaskStats;
}

export function TaskCompletionStats({ stats }: TaskCompletionStatsProps) {
  const taskData = stats || getDefaultTaskStats();
  const progressData = getProgressData(taskData);

  return (
    <div className="task-completion-stats">
      <h2 className="text-lg font-bold mb-4">Task Completion Statistics</h2>

      <div className="stats-charts-grid grid grid-cols-1 gap-4">
        <div className="chart-container bg-white p-3 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Task Progress</h3>
          <div className="h-48">
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
      </div>
    </div>
  );
}
