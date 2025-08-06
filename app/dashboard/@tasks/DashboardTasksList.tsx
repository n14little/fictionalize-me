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

  // Calculate indentation level for hierarchical display
  const getTaskLevel = (
    task: BucketedTask,
    allTasks: BucketedTask[]
  ): number => {
    let level = 0;
    let currentTask = task;

    while (currentTask.parent_task_id) {
      level++;
      const parent = allTasks.find((t) => t.id === currentTask.parent_task_id);
      if (!parent) break; // Safety check
      currentTask = parent;
    }

    return level;
  };

  const handleReorder = async (
    taskId: string,
    referenceTaskId: string,
    position: 'above' | 'below'
  ) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          // Get all tasks from all buckets to find hierarchical relationships
          const allTasks = [
            ...taskBuckets.daily,
            ...taskBuckets.weekly,
            ...taskBuckets.monthly,
            ...taskBuckets.yearly,
            ...taskBuckets.custom,
            ...taskBuckets.regular,
          ];

          // Find the task being moved
          const draggedTask = allTasks.find((t) => t.id === taskId);
          if (!draggedTask) {
            reject(new Error('Dragged task not found'));
            return;
          }

          // If dragging a parent task, we need to move all its descendants too
          const getDescendants = (parentId: string): BucketedTask[] => {
            const descendants: BucketedTask[] = [];
            const children = allTasks.filter(
              (t) => t.parent_task_id === parentId
            );

            for (const child of children) {
              descendants.push(child);
              descendants.push(...getDescendants(child.id));
            }

            return descendants;
          };

          const descendants = getDescendants(taskId);

          const formData = new FormData();
          formData.append('taskId', taskId);
          formData.append('referenceTaskId', referenceTaskId);
          formData.append('position', position);

          // Get CSRF token
          const csrfResponse = await fetch('/api/csrf');
          const csrfData = await csrfResponse.json();
          formData.append('csrf_token', csrfData.csrfToken);

          // If there are descendants, we need to handle them specially
          if (descendants.length > 0) {
            formData.append('hasDescendants', 'true');
            formData.append(
              'descendantIds',
              descendants.map((d) => d.id).join(',')
            );
          }

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

  const renderTask = (task: BucketedTask, allBucketTasks: BucketedTask[]) => {
    const level = getTaskLevel(task, allBucketTasks);
    const isSubTask = level > 0;

    return (
      <SortableTaskItem
        key={task.id}
        id={task.id}
        className={isSubTask ? 'relative' : ''}
        style={{ marginLeft: `${level * 12}px` }}
      >
        {isSubTask && (
          <div className="absolute -left-3 top-4 w-2 h-0.5 bg-gray-300"></div>
        )}
        <NavigableTaskItem task={task} />
      </SortableTaskItem>
    );
  };

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
                      renderTask={(task) =>
                        renderTask(task as BucketedTask, bucketTasks)
                      }
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
