'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { Task } from '@/lib/models/Task';

interface DraggableTaskListProps {
  tasks: Task[];
  onReorder: (
    taskId: string,
    afterTaskId?: string,
    beforeTaskId?: string
  ) => Promise<void>;
  renderTask: (
    task: Task,
    dragHandleProps?: Record<string, unknown>
  ) => React.ReactNode;
  className?: string;
}

export function DraggableTaskList({
  tasks,
  onReorder,
  renderTask,
  className = '',
}: DraggableTaskListProps) {
  const [localTasks, setLocalTasks] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local tasks when props change
  if (
    JSON.stringify(tasks.map((t) => t.id)) !==
    JSON.stringify(localTasks.map((t) => t.id))
  ) {
    setLocalTasks(tasks);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localTasks.findIndex((task) => task.id === active.id);
      const newIndex = localTasks.findIndex((task) => task.id === over.id);

      // Optimistically update the UI
      const newTasks = arrayMove(localTasks, oldIndex, newIndex);
      setLocalTasks(newTasks);

      // Calculate afterTaskId and beforeTaskId
      let afterTaskId: string | undefined;
      let beforeTaskId: string | undefined;

      if (newIndex > 0) {
        afterTaskId = newTasks[newIndex - 1].id;
      }
      if (newIndex < newTasks.length - 1) {
        beforeTaskId = newTasks[newIndex + 1].id;
      }

      try {
        await onReorder(active.id as string, afterTaskId, beforeTaskId);
      } catch (error) {
        // Revert on error
        setLocalTasks(tasks);
        console.error('Failed to reorder task:', error);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={localTasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {localTasks.map((task) => renderTask(task))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
