'use client';

import { Task } from '@/lib/models/Task';
import { DashboardTaskItem } from '@/app/dashboard/@tasks/DashboardTaskItem';
import { NavigableItem } from '@/components/KeyboardNavigation';

interface NavigableTaskItemProps {
  task: Task;
}

export function NavigableTaskItem({ task }: NavigableTaskItemProps) {
  return (
    <NavigableItem
      id={`task-${task.id}`}
      column="tasks"
      className="block w-full"
      ariaLabel={`Task: ${task.title}${task.completed ? ' (completed)' : ''}`}
    >
      <DashboardTaskItem task={task} />
    </NavigableItem>
  );
}
