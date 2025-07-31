'use client';

import { Task } from '@/lib/models/Task';
import { Journal } from '@/lib/models/Journal';
import { TaskItem } from '@/app/tasks/TaskItem';

interface TasksListProps {
  tasks: Task[];
  journals: Journal[];
}

export function TasksList({ tasks, journals }: TasksListProps) {
  const getJournalTitle = (journalId: string) => {
    const journal = journals.find((j) => j.id === journalId);
    return journal?.title || 'Unknown Journal';
  };

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

  // Group tasks into pending and completed while preserving hierarchical order
  const groupedTasks = tasks.reduce(
    (acc, task) => {
      const level = getTaskLevel(task, tasks);
      const taskWithLevel = { ...task, level };

      if (task.completed) {
        acc.completed.push(taskWithLevel);
      } else {
        acc.pending.push(taskWithLevel);
      }

      return acc;
    },
    {
      pending: [] as (Task & { level: number })[],
      completed: [] as (Task & { level: number })[],
    }
  );

  const renderTaskSection = (
    sectionTasks: (Task & { level: number })[],
    sectionTitle: string,
    titleClass: string
  ) => {
    if (sectionTasks.length === 0) return null;

    return (
      <div>
        <h2 className={`text-xl font-semibold mb-4 ${titleClass}`}>
          {sectionTitle} ({sectionTasks.length})
        </h2>
        <div className="space-y-3">
          {sectionTasks.map((task) => {
            const isSubTask = task.level > 0;

            return (
              <div
                key={task.id}
                style={{ marginLeft: `${task.level * 20}px` }}
                className={isSubTask ? 'relative' : ''}
              >
                {isSubTask && (
                  <div className="absolute -left-4 top-6 w-3 h-0.5 bg-gray-300"></div>
                )}
                <TaskItem
                  task={task}
                  journalTitle={getJournalTitle(task.journal_id)}
                  isSubTask={isSubTask}
                  level={task.level}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderTaskSection(
        groupedTasks.pending,
        'Pending Tasks',
        'text-gray-800'
      )}
      {renderTaskSection(
        groupedTasks.completed,
        'Completed Tasks',
        'text-gray-500'
      )}
    </div>
  );
}
