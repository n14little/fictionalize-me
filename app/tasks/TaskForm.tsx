'use client';

import { useState } from 'react';
import { Journal } from '@/lib/models/Journal';
import { Task } from '@/lib/models/Task';
import { createTask, updateTask, createSubTask } from '@/app/tasks/actions';
import { FormButton } from '@/components/FormButton';
import { CsrfTokenInput } from '@/components/CsrfTokenInput';

interface TaskFormProps {
  journals: Journal[];
  task?: Task;
  isEditing?: boolean;
  validParentTasks?: Task[];
  defaultParentId?: string;
}

export function TaskForm({
  journals,
  task,
  isEditing = false,
  validParentTasks = [],
  defaultParentId,
}: TaskFormProps) {
  const [selectedParentId, setSelectedParentId] = useState(
    task?.parent_task_id || defaultParentId || ''
  );

  // When creating a sub-task, we use a different action
  const isCreatingSubTask = !isEditing && defaultParentId;
  const formAction = isEditing
    ? updateTask
    : isCreatingSubTask
      ? createSubTask
      : createTask;

  return (
    <form action={formAction} className="space-y-6">
      <CsrfTokenInput />

      {isEditing && task && (
        <input type="hidden" name="taskId" value={task.id} />
      )}

      {isCreatingSubTask && (
        <input type="hidden" name="parentId" value={defaultParentId} />
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={task?.title || ''}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={task?.description || ''}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter task description (optional)"
        />
      </div>

      <div>
        <label
          htmlFor="journalId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Journal *
        </label>
        <select
          id="journalId"
          name="journalId"
          defaultValue={task?.journal_id || ''}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a journal</option>
          {journals.map((journal) => (
            <option key={journal.id} value={journal.id}>
              {journal.title}
            </option>
          ))}
        </select>
      </div>

      {/* Parent Task Selection - only show if not creating a sub-task and we have valid parents */}
      {!isCreatingSubTask && validParentTasks.length > 0 && (
        <div>
          <label
            htmlFor="parentTaskId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Parent Task (Optional)
          </label>
          <select
            id="parentTaskId"
            name="parentTaskId"
            value={selectedParentId}
            onChange={(e) => setSelectedParentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No parent (top-level task)</option>
            {validParentTasks.map((parentTask) => (
              <option key={parentTask.id} value={parentTask.id}>
                {parentTask.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Make this task a sub-task of another task
          </p>
        </div>
      )}

      {/* Show parent task info when creating sub-task */}
      {isCreatingSubTask && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-1">
            Creating Sub-task
          </h3>
          <p className="text-sm text-blue-700">
            This task will be created as a sub-task under the selected parent
            task.
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <a
          href="/tasks"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </a>
        <FormButton className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          {isEditing ? 'Update Task' : 'Create Task'}
        </FormButton>
      </div>
    </form>
  );
}
