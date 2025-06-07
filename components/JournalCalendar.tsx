'use client';

import { useEffect, useState, useMemo } from 'react';

interface CalendarDay {
  date: Date;
  isActive: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface JournalCalendarProps {
  streakDates: string[];
}

export function JournalCalendar({ streakDates }: JournalCalendarProps) {
  const [centerDate, setCenterDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [dateRange, setDateRange] = useState<string>('');
  
  // Convert string dates to Date objects
  const activeDates = useMemo(() => {
    return streakDates.map(dateStr => new Date(dateStr));
  }, [streakDates]);
  
  // Navigate forward 35 days
  const goForward = () => {
    const newDate = new Date(centerDate);
    newDate.setDate(centerDate.getDate() + 35);
    setCenterDate(newDate);
  };
  
  // Navigate backward 35 days
  const goBackward = () => {
    const newDate = new Date(centerDate);
    newDate.setDate(centerDate.getDate() - 35);
    setCenterDate(newDate);
  };
  
  // Reset to today
  const goToToday = () => {
    setCenterDate(new Date());
  };
  
  useEffect(() => {
    // Generate centered calendar days using the center date
    const days = generateCenteredCalendarDays(centerDate, activeDates);
    setCalendarDays(days);
    
    // Calculate date range only when days change
    if (days.length > 0) {
      setDateRange(getDateRangeLabel(days));
    }
  }, [centerDate, activeDates]);
  
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Journaling Calendar</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={goBackward}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Previous 35 days"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <button
            onClick={goToToday}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
          >
            Today
          </button>
          
          <div className="font-medium text-gray-700">
            {dateRange}
          </div>
          
          <button 
            onClick={goForward}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Next 35 days"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div 
            key={index}
            className={`
              aspect-square flex items-center justify-center text-sm rounded-md
              ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
              ${day.isToday ? 'ring-2 ring-blue-500 font-bold' : ''}
              ${day.isActive ? 'bg-blue-500 text-white' : ''}
              ${!day.isActive ? 'hover:bg-gray-100' : ''}
            `}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        Blue dates indicate days you journaled • Today is highlighted with a blue ring
      </div>
    </div>
  );
}

// Helper function to generate a date range label
function getDateRangeLabel(days: CalendarDay[]): string {
  if (days.length === 0) return '';
  
  const firstDate = days[0].date;
  const lastDate = days[days.length - 1].date;
  
  const firstMonth = firstDate.toLocaleString('default', { month: 'short' });
  const lastMonth = lastDate.toLocaleString('default', { month: 'short' });
  
  const firstDay = firstDate.getDate();
  const lastDay = lastDate.getDate();
  const year = lastDate.getFullYear();
  
  if (firstMonth === lastMonth) {
    return `${firstMonth} ${firstDay}-${lastDay}, ${year}`;
  } else {
    return `${firstMonth} ${firstDay} - ${lastMonth} ${lastDay}, ${year}`;
  }
}

// Helper function to generate centered calendar days with today in the middle
function generateCenteredCalendarDays(centerDate: Date, activeDates: Date[]): CalendarDay[] {
  const days: CalendarDay[] = [];
  
  // Clone and normalize the center date to avoid time-based discrepancies
  const center = new Date(centerDate);
  center.setHours(0, 0, 0, 0);
  
  // Get the real today for "isToday" comparison
  const realToday = new Date();
  realToday.setHours(0, 0, 0, 0);
  
  // Get day of week (0-6, where 0 is Sunday)
  const dayOfWeek = center.getDay();
  
  // For a 5x7 calendar (35 days), we need to position the center date in the middle row (3rd row)
  // and in the correct weekday position within that row.
  
  // Here's our approach for perfect positioning:
  // 1. We know the center date falls on a specific day of week (0-6)
  // 2. The middle row (3rd row) of our 5-row calendar is row 2 (0-indexed)
  // 3. For the center date to be in the middle row, we need the first day of our calendar
  //    to be exactly 2 weeks + dayOfWeek days before the center date
  
  // Calculate days to start date:
  // - 2 full weeks (14 days) to get to the beginning of the middle week
  // - Plus the day of week offset (0-6) to position the center date correctly in that week
  const daysToGoBack = 14 + dayOfWeek;
  
  // Create the start date by going back the calculated number of days
  const startDate = new Date(center);
  startDate.setDate(center.getDate() - daysToGoBack);
  
  // Generate 35 days (5 rows of 7 days)
  for (let i = 0; i < 35; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Determine if this date is in the "current" month (the month containing the center date)
    const isCurrentMonth = currentDate.getMonth() === center.getMonth() && 
                         currentDate.getFullYear() === center.getFullYear();
    
    // Compare dates without time components to determine if this is today
    const isToday = currentDate.getDate() === realToday.getDate() && 
                   currentDate.getMonth() === realToday.getMonth() && 
                   currentDate.getFullYear() === realToday.getFullYear();
    
    days.push({
      date: currentDate,
      isActive: isDateInArray(currentDate, activeDates),
      isToday,
      isCurrentMonth
    });
  }
  
  return days;
}

// Helper function to check if a date is in an array of dates (ignoring time)
function isDateInArray(date: Date, dateArray: Date[]): boolean {
  // Extract year, month, and day for comparison
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Check if any date in the array matches year, month, and day
  return dateArray.some(d => 
    d.getFullYear() === year && 
    d.getMonth() === month && 
    d.getDate() === day
  );
}