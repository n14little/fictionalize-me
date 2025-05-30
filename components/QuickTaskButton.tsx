'use client';

import { useState, useTransition } from 'react';
import { createTask } from '../app/journals/[id]/tasks/actions';
import { CsrfTokenInput } from './CsrfTokenInput';
import { FormButton } from './FormButton';

interface QuickTaskButtonProps {
  journalId: string;
  onTaskCreated?: () => void;
  insideForm?: boolean;
}

export function QuickTaskButton({ journalId, onTaskCreated, insideForm = false }: QuickTaskButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setError(null);
  };

  async function clientAction(formData: FormData) {
    // Reset error state
    setError(null);
    
    // Get the form data value
    const titleValue = formData.get('title') as string;

    // Basic form validation
    if (!titleValue.trim()) {
      setError('Task title is required');
      return;
    }

    // Add current URL as redirect to return to the current page
    formData.append('redirectUrl', window.location.pathname);
    
    // Call the server action
    // Let Next.js handle redirects through errors - don't catch them
    await createTask(formData);
    
    // This will only run if no redirect happens
    // Close modal and notify parent if successful
    handleCloseModal();
    if (onTaskCreated) {
      onTaskCreated();
    }
  }

  // For handling task creation when inside another form
  const handleManualSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    // Use FormData to simulate a form submission
    const formData = new FormData();
    formData.append('journalId', journalId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('redirectUrl', window.location.pathname);

    // Fetch CSRF token and then submit
    fetch('/api/csrf')
      .then(response => response.json())
      .then(data => {
        formData.append('csrf_token', data.csrfToken);
        
        startTransition(async () => {
          // Don't wrap in try/catch - let Next.js handle redirects naturally
          // The createTask function will throw a redirect which Next.js will handle
          await createTask(formData);
          
          // This code will only run if no redirect happens
          handleCloseModal();
          if (onTaskCreated) {
            onTaskCreated();
          }
        });
      })
      .catch(() => {
        // This will only catch fetch errors, not redirect errors
        setError('Failed to get CSRF token');
      });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="flex items-center gap-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition-colors"
        title="Create a task from this journal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v10M2 12h20M12 22v-8M19 15l-7 7-7-7" />
        </svg>
        Task
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Quick Task</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {insideForm ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="task-description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add details about this task..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseModal();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Task'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form action={clientAction} className="space-y-4">
                <input type="hidden" name="journalId" value={journalId} />
                <CsrfTokenInput />
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add details about this task..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseModal();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <FormButton>
                    Create Task
                  </FormButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
