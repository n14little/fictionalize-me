'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Journal } from '../../lib/models/Journal';

export default function PublicJournals() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        // For now, we'll use a stub implementation while auth is being implemented
        // Eventually this would call: /api/journals/public
        // Mock data to display the UI
        setJournals([
          {
            id: '1',
            user_id: 1,
            title: 'My Travel Adventures',
            description: 'A collection of my travels around the world.',
            slug: 'travel-adventures',
            public: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: '2',
            user_id: 1,
            title: 'Cooking Experiments',
            description: 'My journey learning to cook dishes from around the world.',
            slug: 'cooking-experiments',
            public: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]);
        setLoading(false);
      } catch (err) {
        setError('Failed to load journals');
        setLoading(false);
      }
    };

    fetchJournals();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Public Journals</h1>
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Home
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse text-lg">Loading journals...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        ) : journals.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-700 mb-2">No public journals available yet.</p>
            <p className="text-gray-500 text-sm">Check back later or create your own journal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journals.map((journal) => (
              <div 
                key={journal.id} 
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-bold mb-2">{journal.title}</h2>
                {journal.description && (
                  <p className="text-gray-600 mb-4">{journal.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Updated {new Date(journal.updated_at).toLocaleDateString()}
                  </span>
                  <Link 
                    href={`/journals/${journal.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Journal →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}