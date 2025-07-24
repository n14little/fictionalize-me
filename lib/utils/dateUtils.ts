/**
 * Date utility functions that enforce UTC-first approach
 * All internal date operations should use UTC timestamps
 * Only localize for display when absolutely necessary
 */

/**
 * Get a Date object with UTC midnight (00:00:00.000) for the specified date
 * @param date Optional Date object (defaults to now)
 * @returns Date object set to UTC midnight
 */
export function getUtcMidnight(date: Date = new Date()): Date {
  // Create a new date to avoid mutating the input
  const utcDate = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  return utcDate;
}

/**
 * Get a Date object with UTC midnight (00:00:00.000) for today
 * @returns Date object set to today at UTC midnight
 */
export function getUtcToday(): Date {
  // Cache this value to improve performance when called multiple times
  return getUtcMidnight(new Date());
}

/**
 * Get a Date object with UTC midnight (00:00:00.000) for yesterday
 * @returns Date object set to yesterday at UTC midnight
 */
export function getUtcYesterday(): Date {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return getUtcMidnight(yesterday);
}

/**
 * Format date as YYYY-MM-DD in UTC timezone
 * @param date Date to format
 * @returns UTC date string in YYYY-MM-DD format
 */
export function formatUtcDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if two dates are the same UTC day
 * @param date1 First date to compare
 * @param date2 Second date to compare
 * @returns True if dates are on the same UTC day
 */
export function isSameUtcDay(date1: Date, date2: Date): boolean {
  return formatUtcDate(date1) === formatUtcDate(date2);
}

/**
 * Check if two dates are consecutive UTC days
 * @param earlierDate The earlier date
 * @param laterDate The later date
 * @returns True if dates are consecutive UTC days
 */
export function isConsecutiveUtcDay(
  earlierDate: Date,
  laterDate: Date
): boolean {
  const nextDay = new Date(earlierDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return isSameUtcDay(nextDay, laterDate);
}

/**
 * Calculate days difference between two UTC dates
 * @param date1 First date
 * @param date2 Second date
 * @returns Number of days between dates
 */
export function getUtcDaysDifference(date1: Date, date2: Date): number {
  const utcDate1 = getUtcMidnight(date1);
  const utcDate2 = getUtcMidnight(date2);

  const diffTime = Math.abs(utcDate2.getTime() - utcDate1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
