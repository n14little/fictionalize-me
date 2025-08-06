'use client';

import { useTransition } from 'react';
import { Task } from '@/lib/models/Task';
import { TaskItem } from './TaskItem';
import { DraggableTaskList } from '@/components/DraggableTaskList';
import { SortableTaskItem } from '@/components/SortableTaskItem';
import { reorderTask } from './actions';

interface JournalTasksListProps {
  tasks: Task[];
  journalId: string;
}

export function JournalTasksList({ tasks, journalId }: JournalTasksListProps) {
  const [, startTransition] = useTransition();

  // Separate pending and completed tasks and apply priority-based ordering
  // Since we're getting tasks in priority order from the database,
  // we only need to separate completed from pending
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // Calculate indentation level for hierarchical display
  const getTaskLevel = (task: Task, allTasks: Task[]): number => {
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
          // Find the task being moved
          const draggedTask = tasks.find((t) => t.id === taskId);
          if (!draggedTask) {
            reject(new Error('Dragged task not found'));
            return;
          }

          // If dragging a parent task, we need to move all its descendants too
          const getDescendants = (parentId: string): Task[] => {
            const descendants: Task[] = [];
            const children = tasks.filter((t) => t.parent_task_id === parentId);

            for (const child of children) {
              descendants.push(child);
              descendants.push(...getDescendants(child.id));
            }

            return descendants;
          };

          const descendants = getDescendants(taskId);

          // Create form data for the server action
          const formData = new FormData();
          formData.append('taskId', taskId);
          formData.append('journalId', journalId);
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
          reject(error);
        }
      });
    });
  };

  const renderTask = (task: Task) => {
    const level = getTaskLevel(task, pendingTasks);
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
        <TaskItem task={task} journalId={journalId} />
      </SortableTaskItem>
    );
  };

  if (tasks.length === 0) {
    return <div className="text-gray-400 text-sm">No tasks</div>;
  }

  return (
    <div className="space-y-4">
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Pending ({pendingTasks.length})
          </h3>
          <DraggableTaskList
            tasks={pendingTasks}
            onReorder={handleReorder}
            renderTask={renderTask}
            className="space-y-2"
          />
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} journalId={journalId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
