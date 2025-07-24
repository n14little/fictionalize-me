import { describe, it, expect } from 'vitest';
import {
  getUtcMidnight,
  getUtcToday,
  getUtcYesterday,
  formatUtcDate,
  isSameUtcDay,
  isConsecutiveUtcDay,
  getUtcDaysDifference,
} from '@/lib/utils/dateUtils';

describe('Date Utils', () => {
  // Note: TZ=UTC is set globally in tests/setup.ts

  describe('getUtcMidnight', () => {
    it('should return a date set to midnight UTC', () => {
      const testDate = new Date('2025-06-08T14:30:45.123Z');
      const midnight = getUtcMidnight(testDate);

      expect(midnight.getUTCHours()).toBe(0);
      expect(midnight.getUTCMinutes()).toBe(0);
      expect(midnight.getUTCSeconds()).toBe(0);
      expect(midnight.getUTCMilliseconds()).toBe(0);
      expect(midnight.getUTCFullYear()).toBe(2025);
      expect(midnight.getUTCMonth()).toBe(5); // June is 5 in JS (0-indexed)
      expect(midnight.getUTCDate()).toBe(8);
    });

    it('should use current date when no date is provided', () => {
      const now = new Date();
      const midnight = getUtcMidnight();

      expect(midnight.getUTCFullYear()).toBe(now.getUTCFullYear());
      expect(midnight.getUTCMonth()).toBe(now.getUTCMonth());
      expect(midnight.getUTCDate()).toBe(now.getUTCDate());
      expect(midnight.getUTCHours()).toBe(0);
      expect(midnight.getUTCMinutes()).toBe(0);
      expect(midnight.getUTCSeconds()).toBe(0);
      expect(midnight.getUTCMilliseconds()).toBe(0);
    });
  });

  describe('getUtcToday', () => {
    it('should return today at midnight UTC', () => {
      const today = getUtcToday();
      const now = new Date();

      expect(today.getUTCFullYear()).toBe(now.getUTCFullYear());
      expect(today.getUTCMonth()).toBe(now.getUTCMonth());
      expect(today.getUTCDate()).toBe(now.getUTCDate());
      expect(today.getUTCHours()).toBe(0);
      expect(today.getUTCMinutes()).toBe(0);
      expect(today.getUTCSeconds()).toBe(0);
      expect(today.getUTCMilliseconds()).toBe(0);
    });
  });

  describe('getUtcYesterday', () => {
    it('should return yesterday at midnight UTC', () => {
      const yesterday = getUtcYesterday();
      const now = new Date();

      // Create a date for yesterday to compare
      const expectedYesterday = new Date(now);
      expectedYesterday.setUTCDate(expectedYesterday.getUTCDate() - 1);

      expect(yesterday.getUTCFullYear()).toBe(
        expectedYesterday.getUTCFullYear()
      );
      expect(yesterday.getUTCMonth()).toBe(expectedYesterday.getUTCMonth());
      expect(yesterday.getUTCDate()).toBe(expectedYesterday.getUTCDate());
      expect(yesterday.getUTCHours()).toBe(0);
      expect(yesterday.getUTCMinutes()).toBe(0);
      expect(yesterday.getUTCSeconds()).toBe(0);
      expect(yesterday.getUTCMilliseconds()).toBe(0);
    });
  });

  describe('formatUtcDate', () => {
    it('should format date as YYYY-MM-DD in UTC', () => {
      const testDate = new Date('2025-06-08T14:30:45.123Z');
      const formatted = formatUtcDate(testDate);

      expect(formatted).toBe('2025-06-08');
    });

    it('should handle single-digit month and day', () => {
      const testDate = new Date('2025-01-01T00:00:00.000Z');
      const formatted = formatUtcDate(testDate);

      expect(formatted).toBe('2025-01-01');
    });
  });

  describe('isSameUtcDay', () => {
    it('should return true when dates are on the same UTC day', () => {
      const date1 = new Date('2025-06-08T00:00:00.000Z');
      const date2 = new Date('2025-06-08T23:59:59.999Z');

      expect(isSameUtcDay(date1, date2)).toBe(true);
    });

    it('should return false when dates are on different UTC days', () => {
      const date1 = new Date('2025-06-08T00:00:00.000Z');
      const date2 = new Date('2025-06-09T00:00:00.000Z');

      expect(isSameUtcDay(date1, date2)).toBe(false);
    });

    it('should handle dates that might be the same day in local time but different in UTC', () => {
      const date1 = new Date('2025-06-08T23:00:00.000Z');
      const date2 = new Date('2025-06-09T01:00:00.000Z');

      expect(isSameUtcDay(date1, date2)).toBe(false);
    });
  });

  describe('isConsecutiveUtcDay', () => {
    it('should return true when dates are consecutive UTC days', () => {
      const earlier = new Date('2025-06-08T12:00:00.000Z');
      const later = new Date('2025-06-09T12:00:00.000Z');

      expect(isConsecutiveUtcDay(earlier, later)).toBe(true);
    });

    it('should return false when dates are the same UTC day', () => {
      const date1 = new Date('2025-06-08T00:00:00.000Z');
      const date2 = new Date('2025-06-08T23:59:59.999Z');

      expect(isConsecutiveUtcDay(date1, date2)).toBe(false);
    });

    it('should return false when dates are more than one day apart', () => {
      const earlier = new Date('2025-06-08T12:00:00.000Z');
      const later = new Date('2025-06-10T12:00:00.000Z');

      expect(isConsecutiveUtcDay(earlier, later)).toBe(false);
    });

    it('should check correct order (earlier to later)', () => {
      const earlier = new Date('2025-06-08T12:00:00.000Z');
      const later = new Date('2025-06-09T12:00:00.000Z');

      // True when in correct order
      expect(isConsecutiveUtcDay(earlier, later)).toBe(true);
      // False when in reverse order
      expect(isConsecutiveUtcDay(later, earlier)).toBe(false);
    });
  });

  describe('getUtcDaysDifference', () => {
    it('should return 0 for same day', () => {
      const date1 = new Date('2025-06-08T00:00:00.000Z');
      const date2 = new Date('2025-06-08T23:59:59.999Z');

      expect(getUtcDaysDifference(date1, date2)).toBe(0);
    });

    it('should return 1 for consecutive days', () => {
      const date1 = new Date('2025-06-08T12:00:00.000Z');
      const date2 = new Date('2025-06-09T12:00:00.000Z');

      expect(getUtcDaysDifference(date1, date2)).toBe(1);
    });

    it('should handle larger day differences', () => {
      const date1 = new Date('2025-06-01T12:00:00.000Z');
      const date2 = new Date('2025-06-30T12:00:00.000Z');

      expect(getUtcDaysDifference(date1, date2)).toBe(29);
    });

    it('should return absolute difference regardless of date order', () => {
      const earlier = new Date('2025-06-08T12:00:00.000Z');
      const later = new Date('2025-06-10T12:00:00.000Z');

      expect(getUtcDaysDifference(earlier, later)).toBe(2);
      expect(getUtcDaysDifference(later, earlier)).toBe(2);
    });
  });
});
