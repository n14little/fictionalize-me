'use client';

import { useEffect, useState } from 'react';

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
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  // Convert string dates to Date objects
  const activeDates = streakDates.map(dateStr => new Date(dateStr));
  
  useEffect(() => {
    // Generate calendar days for the current display month
    const days = generateCalendarDays(displayMonth, activeDates);
    setCalendarDays(days);
  }, [displayMonth, streakDates]);
  
  const previousMonth = () => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setDisplayMonth(newDate);
  };
  
  const nextMonth = () => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setDisplayMonth(newDate);
  };
  
  const monthName = displayMonth.toLocaleString('default', { month: 'long' });
  const year = displayMonth.getFullYear();
  
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Journaling Calendar</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={previousMonth}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <div className="font-medium text-gray-700">
            {monthName} {year}
          </div>
          
          <button 
            onClick={nextMonth}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Next month"
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
              ${day.isToday ? 'ring-2 ring-blue-500' : ''}
              ${day.isActive && day.isCurrentMonth ? 'bg-blue-500 text-white' : ''}
              ${!day.isActive && day.isCurrentMonth ? 'hover:bg-gray-100' : ''}
            `}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        Blue dates indicate days you journaled
      </div>
    </div>
  );
}

// Helper function to generate calendar days for a specific month
function generateCalendarDays(month: Date, activeDates: Date[]): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get the first day of the month
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  
  // Get the last day of the month
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  // Get day of the week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Add days from previous month to fill the first week
  const prevMonth = new Date(month);
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    const date = new Date(month.getFullYear(), month.getMonth() - 1, daysInPrevMonth - firstDayOfWeek + i + 1);
    days.push({
      date,
      isActive: isDateInArray(date, activeDates),
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: false
    });
  }
  
  // Add days for the current month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const date = new Date(month.getFullYear(), month.getMonth(), i);
    days.push({
      date,
      isActive: isDateInArray(date, activeDates),
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: true
    });
  }
  
  // Add days from next month to fill out the last week
  const remainingDays = 42 - days.length; // 6 rows of 7 days = 42 total spots
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(month.getFullYear(), month.getMonth() + 1, i);
    days.push({
      date,
      isActive: isDateInArray(date, activeDates),
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: false
    });
  }
  
  return days;
}

// Helper function to check if a date is in an array of dates (ignoring time)
function isDateInArray(date: Date, dateArray: Date[]): boolean {
  const dateString = date.toISOString().split('T')[0];
  return dateArray.some(d => d.toISOString().split('T')[0] === dateString);
}