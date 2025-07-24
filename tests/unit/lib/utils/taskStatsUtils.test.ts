import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDefaultTaskStats,
  getDailyCompletionData,
} from '@/lib/utils/taskStatsUtils';
import { TaskStats } from '@/types/taskStats';
import { format, subDays } from 'date-fns';

describe('Task Stats Utils', () => {
  describe('getDefaultTaskStats', () => {
    it('should return a TaskStats object with the correct structure', () => {
      const stats = getDefaultTaskStats();

      expect(stats).toHaveProperty('dailyCompletion');
    });

    it('should have 30 days in daily completion data', () => {
      const stats = getDefaultTaskStats();

      expect(stats.dailyCompletion.length).toBe(30);
      expect(stats.dailyCompletion[0].date).toMatch(/^2025-05-\d{2}$/);
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

          { date: '2024-06-30', completed: 4 },
          { date: '2024-06-15', completed: 7 },
        ],
      };
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function expectSequentialDatesFromToday(
      results: TaskStats['dailyCompletion'],
      n: number,
      expectedCounts: Record<string, number>
    ) {
      expect(results.length).toBe(n);

      const today = new Date();

      for (let i = 0; i < n; i++) {
        const date = subDays(today, i);
        const expectedDate = format(date, 'yyyy-MM-dd');
        const foundItem = results.find((item) => item.date === expectedDate);

        expect(foundItem).toBeDefined();
        expect(foundItem!.completed).toBe(expectedCounts[expectedDate] || 0);
      }
    }

    it('should fill in all dates for the past week', () => {
      const results = getDailyCompletionData(mockStats, 'week');

      const expectedDays = 7;

      const expectedCounts: Record<string, number> = {
        '2025-06-15': 3,
        '2025-06-14': 4,
        '2025-06-13': 2,
        '2025-06-12': 1,
        '2025-06-10': 5,
      };

      expectSequentialDatesFromToday(results, expectedDays, expectedCounts);
    });

    it('should fill in all dates for the past month', () => {
      const results = getDailyCompletionData(mockStats, 'month');

      const expectedDays = 30;
      const expectedCounts: Record<string, number> = {
        '2025-06-15': 3,
        '2025-06-14': 4,
        '2025-06-13': 2,
        '2025-06-12': 1,
        '2025-06-10': 5,
        '2025-06-05': 6,
        '2025-06-01': 3,
        '2025-05-20': 2,
      };

      expectSequentialDatesFromToday(results, expectedDays, expectedCounts);
    });

    it('should fill in all dates for the past year', () => {
      const results = getDailyCompletionData(mockStats, 'year');
      const expectedDays = 365;
      const expectedCounts: Record<string, number> = {
        '2025-06-15': 3,
        '2025-06-14': 4,
        '2025-06-13': 2,
        '2025-06-12': 1,
        '2025-06-10': 5,
        '2025-06-05': 6,
        '2025-06-01': 3,
        '2025-05-20': 2,
        '2025-05-01': 1,
        '2024-06-30': 4,
      };

      expectSequentialDatesFromToday(results, expectedDays, expectedCounts);
    });
  });
});
