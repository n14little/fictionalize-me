import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDefaultTaskStats, getProgressData, getDailyCompletionData } from '@/lib/utils/taskStatsUtils';
import { TaskStats } from '@/types/taskStats';

describe('Task Stats Utils', () => {
  describe('getDefaultTaskStats', () => {
    it('should return a TaskStats object with the correct structure', () => {
      const stats = getDefaultTaskStats();
      
      expect(stats).toHaveProperty('completedTasks');
      expect(stats).toHaveProperty('pendingTasks');
      expect(stats).toHaveProperty('totalTasks');
      expect(stats).toHaveProperty('completionRate');
      expect(stats).toHaveProperty('streakDays');
      expect(stats).toHaveProperty('weeklyCompletion');
      expect(stats).toHaveProperty('dailyCompletion');
      expect(stats).toHaveProperty('averageCompletionTime');
    });
    
    it('should have predefined values', () => {
      const stats = getDefaultTaskStats();
      
      expect(stats.completedTasks).toBe(24);
      expect(stats.pendingTasks).toBe(7);
      expect(stats.totalTasks).toBe(31);
      expect(stats.completionRate).toBe(77.42);
      expect(stats.streakDays).toBe(5);
      expect(stats.averageCompletionTime).toBe(45);
    });
    
    it('should have 7 days in weekly completion data', () => {
      const stats = getDefaultTaskStats();
      
      expect(stats.weeklyCompletion.length).toBe(7);
      expect(stats.weeklyCompletion.map(item => item.day)).toEqual([
        'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
      ]);
    });
    
    it('should have 30 days in daily completion data', () => {
      const stats = getDefaultTaskStats();
      
      expect(stats.dailyCompletion.length).toBe(30);
      expect(stats.dailyCompletion[0].date).toMatch(/^2025-05-\d{2}$/);
    });
  });
  
  describe('getProgressData', () => {
    it('should transform task stats into progress chart format', () => {
      const mockStats: TaskStats = {
        completedTasks: 10,
        pendingTasks: 5,
        totalTasks: 15,
        completionRate: 66.67,
        streakDays: 3,
        weeklyCompletion: [],
        dailyCompletion: [],
        averageCompletionTime: 30
      };
      
      const progressData = getProgressData(mockStats);
      
      expect(progressData).toHaveLength(2);
      expect(progressData[0].id).toBe('completed');
      expect(progressData[0].label).toBe('Completed');
      expect(progressData[0].value).toBe(10);
      expect(progressData[0].color).toBe('#4CAF50');
      
      expect(progressData[1].id).toBe('pending');
      expect(progressData[1].label).toBe('Pending');
      expect(progressData[1].value).toBe(5);
      expect(progressData[1].color).toBe('#FFC107');
    });
  });
  
  describe('getDailyCompletionData', () => {
    let mockToday: Date;
    let mockStats: TaskStats;
    
    beforeEach(() => {
      mockToday = new Date('2025-06-15T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockToday);
      
      mockStats = {
        completedTasks: 20,
        pendingTasks: 10,
        totalTasks: 30,
        completionRate: 66.67,
        streakDays: 4,
        weeklyCompletion: [],
        dailyCompletion: [
          { date: '2025-06-15', completed: 3 },
          { date: '2025-06-14', completed: 4 },
          { date: '2025-06-13', completed: 2 },
          { date: '2025-06-12', completed: 1 },
          { date: '2025-06-10', completed: 5 },

          { date: '2025-06-05', completed: 6 },
          { date: '2025-06-01', completed: 3 },

          { date: '2025-05-20', completed: 2 },
          { date: '2025-05-01', completed: 1 },

          { date: '2024-06-30', completed: 4},
          { date: '2024-06-15', completed: 7 }
        ],
        averageCompletionTime: 35
      };
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });

    function expectResultsToContainDates(results: TaskStats['dailyCompletion'], expectedDates: string[]) {
      const dates = results.map(item => item.date);
      expectedDates.forEach(date => {
        expect(dates).toContain(date);
      });
    }

    function expectResultsNotToContainDates(results: TaskStats['dailyCompletion'], unexpectedDates: string[]) {
      const dates = results.map(item => item.date);
      unexpectedDates.forEach(date => {
        expect(dates).not.toContain(date);
      });
    }

    it('should fill in all dates for the past week', () => {
      const results = getDailyCompletionData(mockStats, 'week');
      
      // Should contain 8 days (today + 7 previous days)
      expect(results).toHaveLength(8);

      // Should contain the dates with data
      expectResultsToContainDates(results, [
        '2025-06-15',
        '2025-06-14',
        '2025-06-13',
        '2025-06-12',
        '2025-06-10'
      ]);
      
      // Should also contain days with no completions (filled with zeros)
      expectResultsToContainDates(results, [
        '2025-06-11',
        '2025-06-09',
        '2025-06-08'
      ]);
      
      // Should not contain dates outside the range
      expectResultsNotToContainDates(results, [
        '2025-06-05',
        '2025-06-01',
        '2025-05-20',
        '2025-05-01',
        '2024-06-30',
        '2024-06-15'
      ]);
      
      // Days with no completions should have a completed count of 0
      const june11Data = results.find(item => item.date === '2025-06-11');
      expect(june11Data?.completed).toBe(0);
    });
    
    it('should fill in all dates for the past month', () => {
      const results = getDailyCompletionData(mockStats, 'month');

      // Should have data for roughly 30-31 days depending on the month
      expect(results.length).toBeGreaterThanOrEqual(30);
      
      // Should contain the dates with data
      expectResultsToContainDates(results, [
        '2025-06-15',
        '2025-06-14',
        '2025-06-13',
        '2025-06-12',
        '2025-06-10',
        '2025-06-05',
        '2025-06-01',
        '2025-05-20'
      ]);
      
      // Should not contain dates outside the range
      expectResultsNotToContainDates(results, [
        '2025-05-01',
        '2024-06-30',
        '2024-06-15'
      ]);
      
      // Check that dates with no entries are filled with zeros
      const june07Data = results.find(item => item.date === '2025-06-07');
      expect(june07Data?.completed).toBe(0);
    });
    
    it('should fill in all dates for the past year', () => {
      const results = getDailyCompletionData(mockStats, 'year');

      // A year should have roughly 365 days
      expect(results.length).toBeGreaterThanOrEqual(364);
      expect(results.length).toBeLessThanOrEqual(366);

      // Should contain the dates with data
      expectResultsToContainDates(results, [
        '2025-06-15',
        '2025-06-14',
        '2025-06-13',
        '2025-06-12',
        '2025-06-10',
        '2025-06-05',
        '2025-06-01',
        '2025-05-20',
        '2025-05-01',
        '2024-06-30'
      ]);
      
      // Check that a random date in the middle with no entries is filled with zero
      const jan15Data = results.find(item => item.date === '2025-01-15');
      expect(jan15Data?.completed).toBe(0);
      
      // The test data includes 2024-06-15 but our filter start date 
      // should exclude it because it's exactly one day older than the cutoff
      const shouldBeExcluded = results.find(item => item.date === '2024-06-15');
      expect(shouldBeExcluded).toBeUndefined();
    });
  });
});
