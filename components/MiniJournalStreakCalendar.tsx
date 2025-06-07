'use client';

import { useState } from 'react';
import { UserStreakStats } from '../lib/models/JournalStreak';
import { Modal } from './Modal';
import { JournalCalendar } from './JournalCalendar';
import { JournalStreakWrapper } from './JournalStreakWrapper';

interface MiniJournalStreakCalendarProps {
  streakStats: UserStreakStats;
}

export function MiniJournalStreakCalendar({ streakStats }: MiniJournalStreakCalendarProps) {
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  
  // Get last 7 days
  const today = new Date();
  const last7Days: { date: Date; hasJournaled: boolean }[] = [];
  
  // Create array of the last 7 days with journaling status
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Check if user journaled on this day
    const hasJournaled = streakStats.streakDates.some(streakDate => {
      const streakDay = new Date(streakDate);
      streakDay.setHours(0, 0, 0, 0);
      return streakDay.getTime() === date.getTime();
    });
    
    last7Days.push({ date, hasJournaled });
  }
  
  // Format dates to strings for the full calendar component
  const formattedDates = streakStats.streakDates.map(date => date.toISOString());
  
  // Day name abbreviations
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mb-4">
      {/* Mini 7-day calendar */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Last 7 Days</h3>
          <button 
            onClick={() => setShowFullCalendar(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Full Calendar
          </button>
        </div>
        
        {/* Display days of week and streak status */}
        <div className="flex justify-between">
          {last7Days.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">{dayNames[day.date.getDay()]}</div>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs
                  ${day.hasJournaled 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-400'}`}
              >
                {day.date.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full calendar modal */}
      {showFullCalendar && (
        <Modal onClose={() => setShowFullCalendar(false)} isFullscreen={false}>
          <div className="p-4">
            <JournalStreakWrapper streakStats={streakStats}>
              <JournalCalendar streakDates={formattedDates} />
            </JournalStreakWrapper>
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowFullCalendar(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
