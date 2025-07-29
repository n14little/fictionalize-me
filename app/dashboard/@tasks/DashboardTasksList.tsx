'use client';

import { useState, useTransition } from 'react';
import { Task } from '@/lib/models/Task';
import {
  NavigableColumn,
  NavigableItem,
} from '@/components/KeyboardNavigation';
import { NavigableTaskItem } from '@/app/dashboard/@tasks/NavigableTaskItem';
import { DraggableTaskList } from '@/components/DraggableTaskList';
import { SortableTaskItem } from '@/components/SortableTaskItem';
import { reorderTask } from '@/app/dashboard/@tasks/actions';

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

  const renderTask = (task: Task) => (
    <SortableTaskItem key={task.id} id={task.id}>
      <NavigableTaskItem task={task} />
    </SortableTaskItem>
  );

  // Calculate total navigable items
  const displayedCompletedTasks = showCompleted
    ? Math.min(completedTasks.length, 3)
    : 0;
  const totalNavigableItems =
    pendingTasks.length +
    displayedCompletedTasks +
    (completedTasks.length > 0 ? 1 : 0); // +1 for expand/collapse button

  return (
    <NavigableColumn column="tasks" itemCount={totalNavigableItems}>
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
              renderTask={renderTask}
              className="space-y-2"
            />
          )}
        </div>

        {/* Completed Tasks Section (Collapsible) */}
        {completedTasks.length > 0 && (
          <div>
            <NavigableItem
              id="completed-toggle"
              column="tasks"
              className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2 hover:text-gray-600 transition-colors cursor-pointer"
              ariaLabel={`${showCompleted ? 'Collapse' : 'Expand'} completed tasks (${completedTasks.length})`}
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
              Completed ({completedTasks.length})
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
