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
    referenceTaskId: string,
    position: 'above' | 'below'
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
  const [isDragging, setIsDragging] = useState(false);

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

  // Update local tasks when props change, but only if not currently dragging
  // This prevents the jitter during drag operations
  if (
    !isDragging &&
    JSON.stringify(tasks.map((t) => t.id)) !==
      JSON.stringify(localTasks.map((t) => t.id))
  ) {
    setLocalTasks(tasks);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setIsDragging(false);

    if (over && active.id !== over.id) {
      const oldIndex = localTasks.findIndex((task) => task.id === active.id);
      const newIndex = localTasks.findIndex((task) => task.id === over.id);

      // Optimistically update the UI
      const newTasks = arrayMove(localTasks, oldIndex, newIndex);
      setLocalTasks(newTasks);

      // Determine reference task and position based on the drop scenario
      let referenceTaskId: string;
      let position: 'above' | 'below';

      if (oldIndex < newIndex) {
        // Moving down: we want to place BELOW the target task
        referenceTaskId = over.id as string;
        position = 'below';
      } else {
        // Moving up: we want to place ABOVE the target task
        referenceTaskId = over.id as string;
        position = 'above';
      }

      try {
        await onReorder(active.id as string, referenceTaskId, position);
      } catch (error) {
        // Revert on error
        setLocalTasks(tasks);
        console.error('Failed to reorder task:', error);
      }
    }
  }

  function handleDragStart() {
    setIsDragging(true);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
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
