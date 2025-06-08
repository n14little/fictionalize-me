'use client';

import { useState, useEffect } from 'react';
import { UserStreakStats } from '../lib/models/JournalStreak';
import { Modal } from './Modal';
import { JournalCalendar } from './JournalCalendar';
import { JournalStreakWrapper } from './JournalStreakWrapper';

interface MiniJournalStreakCalendarProps {
  streakStats: UserStreakStats;
}

export function MiniJournalStreakCalendar({ streakStats }: MiniJournalStreakCalendarProps) {
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [last30Days, setLast30Days] = useState<{ date: Date; hasJournaled: boolean }[]>([]);
  
  // Move date calculations to useEffect to avoid hydration mismatches
  useEffect(() => {
    const today = new Date();
    const calculatedDays: { date: Date; hasJournaled: boolean }[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const hasJournaled = streakStats.streakDates.some(streakDate => {
        const streakDay = new Date(streakDate);
        streakDay.setHours(0, 0, 0, 0);
        return streakDay.getTime() === date.getTime();
      });

      calculatedDays.push({ date, hasJournaled });
    }
    
    setLast30Days(calculatedDays);
  }, [streakStats.streakDates]);

  // Safe to format dates here since we're rendering on client after hydration
  const formattedDates = streakStats.streakDates.map(date => date.toISOString());

  return (
    <div className="mb-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Last 30 Days</h3>
          <button 
            onClick={() => setShowFullCalendar(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Full Calendar
          </button>
        </div>
        
        <div className="flex w-full">
          {last30Days.length > 0 && last30Days.map((day) => (
            <div key={day.date.toISOString()} className={`h-8 flex-grow rounded-sm
                  ${day.hasJournaled
                    ? 'bg-blue-500'
                    : 'bg-gray-100'}`}>
            </div>
          ))}
        </div>
      </div>

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
