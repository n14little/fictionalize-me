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
          formData.append('journalId', journalId);
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

  const renderTask = (task: Task) => (
    <SortableTaskItem key={task.id} id={task.id}>
      <TaskItem task={task} journalId={journalId} />
    </SortableTaskItem>
  );

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
