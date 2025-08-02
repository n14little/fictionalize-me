'use client';

import { useState, useTransition } from 'react';
import { TaskBuckets, BucketedTask } from '@/lib/models/Task';
import {
  NavigableColumn,
  NavigableItem,
} from '@/components/KeyboardNavigation';
import { NavigableTaskItem } from '@/app/dashboard/@tasks/NavigableTaskItem';
import { DraggableTaskList } from '@/components/DraggableTaskList';
import { SortableTaskItem } from '@/components/SortableTaskItem';
import { reorderTask } from '@/app/dashboard/@tasks/actions';

interface DashboardTasksListProps {
  taskBuckets: TaskBuckets;
  completedTasks: BucketedTask[];
}

export function DashboardTasksList({
  taskBuckets,
  completedTasks,
}: DashboardTasksListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [, startTransition] = useTransition();

  const handleReorder = async (
    taskId: string,
    referenceTaskId: string,
    position: 'above' | 'below'
  ) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append('taskId', taskId);
          formData.append('referenceTaskId', referenceTaskId);
          formData.append('position', position);

          // Get CSRF token
          const csrfResponse = await fetch('/api/csrf');
          const csrfData = await csrfResponse.json();
          formData.append('csrf_token', csrfData.csrfToken);

          await reorderTask(formData);
          resolve();
        } catch (error) {
          // Check if this is a Next.js redirect error - if so, let it propagate
          if (
            error instanceof Error &&
            (error.message.includes('NEXT_REDIRECT') ||
              error.toString().includes('NEXT_REDIRECT') ||
              error.name === 'RedirectError')
          ) {
            throw error;
          }
          console.error('Error reordering task:', error);
          reject(error);
        }
      });
    });
  };

  const renderTask = (task: BucketedTask) => (
    <SortableTaskItem key={task.id} id={task.id}>
      <NavigableTaskItem task={task} />
    </SortableTaskItem>
  );

  // Calculate bucketed pending tasks
  const pendingBuckets = {
    daily: taskBuckets.daily.filter((task) => !task.completed),
    weekly: taskBuckets.weekly.filter((task) => !task.completed),
    monthly: taskBuckets.monthly.filter((task) => !task.completed),
    yearly: taskBuckets.yearly.filter((task) => !task.completed),
    custom: taskBuckets.custom.filter((task) => !task.completed),
    regular: taskBuckets.regular.filter((task) => !task.completed),
  };

  // Define bucket display order and labels
  const bucketOrder: Array<{ key: keyof TaskBuckets; label: string }> = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'custom', label: 'Custom' },
    { key: 'regular', label: 'Regular' },
  ];

  // Filter buckets to only show those with tasks
  const bucketsWithTasks = bucketOrder.filter(
    (bucket) => pendingBuckets[bucket.key].length > 0
  );

  return (
    <NavigableColumn column="tasks" itemCount={0}>
      <div className="bg-white p-6">
        <h2 className="text-lg font-bold mb-4">Your Tasks</h2>

        {/* Pending Tasks Section - Bucketed */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Pending</h3>
          {bucketsWithTasks.length === 0 ? (
            <div className="text-gray-500 text-xs py-2 text-center">
              No pending tasks
            </div>
          ) : (
            <div className="space-y-4">
              {bucketsWithTasks.map((bucket) => {
                const bucketTasks = pendingBuckets[bucket.key];
                return (
                  <div key={bucket.key} className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {bucket.label}
                    </h4>
                    <DraggableTaskList
                      tasks={bucketTasks}
                      onReorder={handleReorder}
                      renderTask={(task) => renderTask(task as BucketedTask)}
                      className="space-y-1"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Tasks Section (Collapsible) */}
        {completedTasks.length > 0 && (
          <div>
            <NavigableItem
              id="completed-toggle"
              column="tasks"
              className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2 hover:text-gray-600 transition-colors cursor-pointer"
              ariaLabel={`${showCompleted ? 'Collapse' : 'Expand'} completed tasks`}
              onClick={() => setShowCompleted(!showCompleted)}
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
              Completed
            </NavigableItem>

            {showCompleted && (
              <div className="space-y-2">
                {completedTasks.slice(0, 3).map((task) => (
                  <NavigableTaskItem key={task.id} task={task} />
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
    </NavigableColumn>
  );
}
