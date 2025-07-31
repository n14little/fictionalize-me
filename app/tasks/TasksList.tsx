'use client';

import { Task } from '@/lib/models/Task';
import { Journal } from '@/lib/models/Journal';
import { TaskItem } from '@/app/tasks/TaskItem';

interface TasksListProps {
  tasks: Task[];
  journals: Journal[];
}

export function TasksList({ tasks, journals }: TasksListProps) {
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  const getJournalTitle = (journalId: string) => {
    const journal = journals.find((j) => j.id === journalId);
    return journal?.title || 'Unknown Journal';
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">You don&apos;t have any tasks yet.</p>
        <p className="text-sm text-gray-500">
          Create your first task to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pendingTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Pending Tasks ({pendingTasks.length})
          </h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                journalTitle={getJournalTitle(task.journal_id)}
              />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-500">
            Completed Tasks ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                journalTitle={getJournalTitle(task.journal_id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
