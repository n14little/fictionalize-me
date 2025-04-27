'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface JournalEntry {
  id: string;
  journalId: string;
  title: string;
}

interface TimerProps {
  entries?: JournalEntry[];
}

const Timer: React.FC<TimerProps> = ({ entries = [] }) => {
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on an entry page
  const isEntryPage = pathname?.includes('/entries/') || false;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the timer
  const startTimer = () => {
    if (isEntryPage) {
      setIsActive(true);
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  // Close notification
  const closeNotification = () => {
    setShowNotification(false);
  };

  // Save the current date and time to local storage in UTC format
  const saveDateTimeToLocalStorage = () => {
    const now = new Date();

    // Store the time in ISO format (UTC)
    const utcTimestamp = now.toISOString();

    localStorage.setItem('timerCompletedUTC', utcTimestamp);
  };

  // Navigate to the selected entry
  const navigateToEntry = () => {
    if (selectedEntryId) {
      const entry = entries.find(e => e.id === selectedEntryId);
      if (entry) {
        router.push(`/journals/${entry.journalId}/entries/${entry.id}/edit`);
        setShowDropdown(false);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else if (isActive && timeRemaining === 0) {
      setIsActive(false);
      setShowNotification(true);
      saveDateTimeToLocalStorage();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  return (
    <div className="w-full max-w-800px mx-auto mb-4">
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="font-medium text-lg">
            <span className={timeRemaining === 0 ? 'text-red-600' : 'text-gray-700'}>
              {formatTime(timeRemaining)} remaining
            </span>
          </div>
          <div className="relative">
            <button
              onClick={startTimer}
              disabled={isEntryPage && isActive}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isEntryPage && isActive
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : isEntryPage
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isEntryPage ? 'Start' : entries.length > 0 ? 'Choose Entry' : 'No Entries Available'}
            </button>
            
            {!isEntryPage && showDropdown && entries.length > 0 && (
              <div 
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50"
              >
                <div className="p-2">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedEntryId}
                    onChange={(e) => setSelectedEntryId(e.target.value)}
                  >
                    <option value="">Select an entry</option>
                    {entries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="px-3 py-1 mr-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={navigateToEntry}
                      disabled={!selectedEntryId}
                      className={`px-3 py-1 rounded text-sm text-white ${
                        selectedEntryId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div
          className="fixed top-0 left-1/2 transform -translate-x-1/2 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 shadow-lg rounded mt-4 z-50 animate-slideDown"
          style={{
            maxWidth: '90%',
            width: '500px',
          }}
          role="alert"
        >
          <div className="flex">
            <div className="py-1">
              <svg
                className="h-6 w-6 text-blue-500 mr-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold">Time's up!</p>
              <p className="text-sm">Great job! Keep writing or save your entry.</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={closeNotification}
                className="text-blue-500 hover:text-blue-700"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;