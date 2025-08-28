'use client';

import { useState, useEffect } from 'react';

interface CsrfTokenInputProps {
  onTokenReady?: (ready: boolean) => void;
}

export function CsrfTokenInput({ onTokenReady }: CsrfTokenInputProps = {}) {
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
        onTokenReady?.(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form');
        onTokenReady?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCsrfToken();
  }, [onTokenReady]);

  if (isLoading) {
    return null;
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
