'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Journal } from '../../../lib/models/Journal';
import { JournalEntry } from '../../../lib/models/JournalEntry';
import { useParams } from 'next/navigation';

export default function JournalDetail() {
  const params = useParams();
  const journalId = params.id as string;
  
  const [journal, setJournal] = useState<Journal | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        // For now, we'll use a stub implementation while auth is being implemented
        // Eventually this would call: /api/journals/${journalId}
        // Mock data to display the UI
        setJournal({
          id: journalId,
          user_id: 1,
          title: 'My Travel Adventures',
          description: 'A collection of my travels around the world.',
          slug: 'travel-adventures',
          public: true,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        // Mock entries
        setEntries([
          {
            id: '1',
            journal_id: journalId,
            title: 'First Day in Paris',
            content: 'Today I visited the Eiffel Tower and it was magnificent. The view from the top was breathtaking and the city sprawled out beneath me in all directions.',
            mood: 'Excited',
            location: 'Paris, France',
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: '2',
            journal_id: journalId,
            title: 'Italian Cuisine Adventures',
            content: 'I spent the day exploring Rome and trying different pasta dishes. The carbonara was incredible and unlike anything I\'ve had before.',
            mood: 'Happy',
            location: 'Rome, Italy',
            created_at: new Date(),
            updated_at: new Date()
          }
        ]);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load journal');
        setLoading(false);
      }
    };

    fetchJournal();
  }, [journalId]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/journals" 
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to Journals
          </Link>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          ) : journal ? (
            <>
              <h1 className="text-3xl font-bold mb-2">{journal.title}</h1>
              {journal.description && (
                <p className="text-gray-600 mb-6">{journal.description}</p>
              )}
              
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold mb-4">Journal Entries</h2>
                
                {entries.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-700">This journal has no entries yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {entries.map((entry) => (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium">{entry.title}</h3>
                          <span className="text-sm text-gray-500">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4 whitespace-pre-line">{entry.content}</p>
                        
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          {entry.mood && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              Mood: {entry.mood}
                            </span>
                          )}
                          {entry.location && (
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                              Location: {entry.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}