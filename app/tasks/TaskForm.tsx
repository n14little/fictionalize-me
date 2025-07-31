'use client';

import { Journal } from '@/lib/models/Journal';
import { Task } from '@/lib/models/Task';
import { createTask, updateTask } from '@/app/tasks/actions';
import { FormButton } from '@/components/FormButton';
import { CsrfTokenInput } from '@/components/CsrfTokenInput';

interface TaskFormProps {
  journals: Journal[];
  task?: Task;
  isEditing?: boolean;
}

export function TaskForm({ journals, task, isEditing = false }: TaskFormProps) {
  return (
    <form action={isEditing ? updateTask : createTask} className="space-y-6">
      <CsrfTokenInput />

      {isEditing && task && (
        <input type="hidden" name="taskId" value={task.id} />
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
