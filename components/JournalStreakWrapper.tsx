'use client';

import { useEffect, useState } from 'react';
import { UserStreakStats } from '../lib/models/JournalStreak';
import { StreakMilestone } from './StreakMilestone';

interface JournalStreakWrapperProps {
  streakStats: UserStreakStats;
  children: React.ReactNode;
}

export function JournalStreakWrapper({ streakStats, children }: JournalStreakWrapperProps) {
  const [showMilestone, setShowMilestone] = useState(false);

  // Check for milestone achievements on component mount and streak updates
  useEffect(() => {
    // Avoid localStorage during SSR/hydration
    if (typeof window === 'undefined') {
      return;
    }
    
    // Store current stats in local storage to compare on future visits
    const storedStats = localStorage.getItem('journalStreakStats');
    let previousStats = { currentStreak: 0, totalDays: 0 };
    
    if (storedStats) {
      try {
        previousStats = JSON.parse(storedStats);
      } catch (e) {
        console.error('Error parsing stored streak stats:', e);
      }
    }
    
    // Check if we should show milestone celebration
    const significantStreakMilestones = [3, 7, 14, 21, 30, 50, 100];
    const significantTotalMilestones = [10, 25, 50, 100];
    
    // Also check for multiples of 100 after 100
    const isSignificantStreak = 
      streakStats.currentStreak > 100 && streakStats.currentStreak % 100 === 0 ||
      significantStreakMilestones.includes(streakStats.currentStreak);
      
    const isSignificantTotal = 
      streakStats.totalDays > 100 && streakStats.totalDays % 100 === 0 ||
      significantTotalMilestones.includes(streakStats.totalDays);
    
    // Only show milestone if the current streak or total is higher than before
    // and it's a significant milestone
    const shouldShowMilestone = 
      (isSignificantStreak && streakStats.currentStreak > previousStats.currentStreak) ||
      (isSignificantTotal && streakStats.totalDays > previousStats.totalDays);
      
    if (shouldShowMilestone) {
      setShowMilestone(true);
    }
    
    // Save current stats for future comparison
    // Safe to use localStorage here since we've already checked for window
    localStorage.setItem('journalStreakStats', JSON.stringify({
      currentStreak: streakStats.currentStreak,
      totalDays: streakStats.totalDays
    }));
  }, [streakStats]);
  
  return (
    <>
      {children}
      
      {showMilestone && (
        <StreakMilestone
          currentStreak={streakStats.currentStreak}
          longestStreak={streakStats.longestStreak}
          totalDays={streakStats.totalDays}
          isVisible={showMilestone}
          onClose={() => setShowMilestone(false)}
        />
      )}
    </>
  );
}