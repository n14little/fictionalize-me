'use client';

import { useState, useEffect } from 'react';

export function CsrfTokenInput() {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf');
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCsrfToken();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-8">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-2 rounded-lg border border-red-200 text-sm">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 text-blue-600 hover:text-blue-800 text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <input type="hidden" name="csrf_token" value={csrfToken} />;
}
