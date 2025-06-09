'use client';

import { useState, useMemo } from 'react';
import { UserStreakStats } from '../lib/models/JournalStreak';
import { Modal } from './Modal';
import { JournalCalendar } from './JournalCalendar';
import { JournalStreakWrapper } from './JournalStreakWrapper';
import { getUtcToday, getUtcMidnight, formatUtcDate } from '../lib/utils/dateUtils';

interface MiniJournalStreakCalendarProps {
  streakStats: UserStreakStats;
}

export function MiniJournalStreakCalendar({ streakStats }: MiniJournalStreakCalendarProps) {
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  // Use useMemo to calculate the calendar data only once per streakStats change
  // Optimized calculation with O(n+m) complexity instead of O(n*m)
  const last30Days = useMemo(() => {
    const today = getUtcToday();
    const days: { date: Date; hasJournaled: boolean }[] = [];
    
    // Pre-compute a lookup set of streak dates for O(1) lookups
    const streakDateSet = new Set<string>();
    streakStats.streakDates.forEach(date => {
      const utcDate = getUtcMidnight(new Date(date));
      streakDateSet.add(formatUtcDate(utcDate));
    });
    
    // Generate the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - i);
      const utcDate = getUtcMidnight(date);
      
      // O(1) lookup instead of O(n) search
      const hasJournaled = streakDateSet.has(formatUtcDate(utcDate));
      days.push({ date: utcDate, hasJournaled });
    }
    return days;
  }, [streakStats.streakDates]);
  
  // Safe to format dates here since we're rendering on client
  const formattedDates = useMemo(() => {
    return streakStats.streakDates.map(date => date.toISOString());
  }, [streakStats.streakDates]);

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
          {last30Days.map((day) => (
            <div 
              key={day.date.toISOString()} 
              className={`h-8 flex-grow rounded-sm ${day.hasJournaled ? 'bg-blue-500' : 'bg-gray-100'}`}
            />
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
