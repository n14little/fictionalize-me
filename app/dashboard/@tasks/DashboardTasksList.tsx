'use client';

import { useState, useTransition } from 'react';
import { Task } from '@/lib/models/Task';
import { DashboardTaskItem } from '@/app/dashboard/@tasks/DashboardTaskItem';
import { DraggableTaskList } from '@/components/DraggableTaskList';
import { SortableTaskItem } from '@/components/SortableTaskItem';
import { reorderTask } from './actions';

interface DashboardTasksListProps {
  pendingTasks: Task[];
  completedTasks: Task[];
}

export function DashboardTasksList({
  pendingTasks,
  completedTasks,
}: DashboardTasksListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [, startTransition] = useTransition();

  const handleReorder = async (
    taskId: string,
    afterTaskId?: string,
    beforeTaskId?: string
  ) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          // Create form data for the server action
          const formData = new FormData();
          formData.append('taskId', taskId);
          if (afterTaskId) formData.append('afterTaskId', afterTaskId);
          if (beforeTaskId) formData.append('beforeTaskId', beforeTaskId);

          // Get CSRF token
          const csrfResponse = await fetch('/api/csrf');
          const csrfData = await csrfResponse.json();
          formData.append('csrf_token', csrfData.csrfToken);

          await reorderTask(formData);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  const renderPendingTask = (task: Task) => (
    <SortableTaskItem key={task.id} id={task.id}>
      <DashboardTaskItem task={task} />
    </SortableTaskItem>
  );

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
          <DraggableTaskList
            tasks={pendingTasks}
            onReorder={handleReorder}
            renderTask={renderPendingTask}
            className="space-y-2"
          />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
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
