'use client';

import { useState, useEffect, useRef } from 'react';

const Timer: React.FC = () => {
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the timer
  const startTimer = () => {
    setIsActive(true);
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
          <div>
            <button
              onClick={startTimer}
              disabled={isActive}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isActive
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              Start
            </button>
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