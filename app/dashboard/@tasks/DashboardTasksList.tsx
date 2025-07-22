'use client';

import { useState } from 'react';
import { Task } from '@/lib/models/Task';
import { DashboardTaskItem } from './DashboardTaskItem';

interface DashboardTasksListProps {
  pendingTasks: Task[];
  completedTasks: Task[];
}

export function DashboardTasksList({ pendingTasks, completedTasks }: DashboardTasksListProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-bold mb-4">Your Tasks</h2>

      {/* Pending Tasks Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Pending ({pendingTasks.length})
        </h3>
        {pendingTasks.length === 0 ? (
          <div className="text-gray-500 text-xs py-2 text-center">
            No pending tasks
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <DashboardTaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks Section (Collapsible) */}
      {completedTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2 hover:text-gray-600 transition-colors"
          >
            <svg 
              className={`w-3 h-3 transition-transform ${showCompleted ? 'rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Completed ({completedTasks.length})
          </button>
          
          {showCompleted && (
            <div className="space-y-2">
              {completedTasks.slice(0, 3).map((task) => (
                <DashboardTaskItem key={task.id} task={task} />
              ))}
              {completedTasks.length > 3 && (
                <p className="text-xs text-gray-400 mt-2">
                  +{completedTasks.length - 3} more completed
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
