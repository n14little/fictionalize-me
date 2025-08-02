'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/lib/models/Task';
import { toggleTaskCompletion, deleteTask } from '@/app/tasks/actions';
import { CsrfTokenInput } from '@/components/CsrfTokenInput';
import {
  formatTaskDate,
  formatScheduledDate,
  formatCompletedDate,
} from '@/lib/utils/dateUtils';

interface TaskItemProps {
  task: Task;
  journalTitle: string;
  isSubTask?: boolean;
  level?: number;
}

export function TaskItem({
  task,
  journalTitle,
  isSubTask = false,
  level = 0,
}: TaskItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleToggleCompletion(formData: FormData) {
    setIsToggling(true);
    try {
      await toggleTaskCompletion(formData);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      // Show user-friendly error message
      if (
        error instanceof Error &&
        error.message.includes('child tasks remain incomplete')
      ) {
        alert(
          'Cannot complete this task while child tasks remain incomplete. Please complete all sub-tasks first.'
        );
      } else {
        alert('Failed to update task. Please try again.');
      }
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDelete(formData: FormData) {
    setIsDeleting(true);
    try {
      await deleteTask(formData);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div
        className={`bg-white border rounded-lg p-4 shadow-sm ${
          task.completed ? 'opacity-75' : ''
        } ${isSubTask ? 'border-l-4 border-l-blue-200' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Hierarchy indicator */}
            {isSubTask && (
              <div className="flex items-center text-gray-400 mt-1">
                <span className="text-sm">└─</span>
              </div>
            )}

            <form action={handleToggleCompletion}>
              <CsrfTokenInput />
              <input type="hidden" name="taskId" value={task.id} />
              <button
                type="submit"
                disabled={isToggling}
                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                  task.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                } ${isToggling ? 'opacity-50' : ''}`}
              >
                {task.completed && (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </form>

            <div className="flex-1">
              <h3
                className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p
                  className={`text-sm mt-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}
                >
                  {task.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>Journal: {journalTitle}</span>
                {task.scheduled_date && (
                  <span>Due: {formatScheduledDate(task.scheduled_date)}</span>
                )}
                {task.completed_at && (
                  <span>
                    Completed: {formatCompletedDate(task.completed_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* Add Sub-task button - only show if under depth limit */}
            {level < 2 && (
              <Link
                href={`/tasks/new?parent=${task.id}`}
                className="text-green-600 hover:text-green-800 text-sm"
                title="Add sub-task"
              >
                + Sub-task
              </Link>
            )}
            <Link
              href={`/tasks/${task.id}/edit`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </Link>
            <form action={handleDelete} className="inline">
              <CsrfTokenInput />
              <input type="hidden" name="taskId" value={task.id} />
              <button
                type="submit"
                className="text-red-600 hover:text-red-800 text-sm"
                disabled={isDeleting}
                onClick={(e) => {
                  if (
                    !confirm(
                      'Are you sure you want to delete this task? This action cannot be undone.'
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
