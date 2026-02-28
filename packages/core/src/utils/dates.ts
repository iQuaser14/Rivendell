import {
  differenceInCalendarDays,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  eachDayOfInterval,
  isWeekend,
  format,
  parse,
} from 'date-fns';

/** Calendar days between two dates (inclusive of start, exclusive of end) */
export function calendarDaysBetween(start: Date, end: Date): number {
  return differenceInCalendarDays(end, start);
}

/** Get period start dates for week, month, year */
export function periodStart(
  date: Date,
  period: 'week' | 'month' | 'year',
): Date {
  switch (period) {
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case 'month':
      return startOfMonth(date);
    case 'year':
      return startOfYear(date);
  }
}

/** Get period end dates for week, month, year */
export function periodEnd(
  date: Date,
  period: 'week' | 'month' | 'year',
): Date {
  switch (period) {
    case 'week':
      return endOfWeek(date, { weekStartsOn: 1 }); // Sunday
    case 'month':
      return endOfMonth(date);
    case 'year':
      return endOfYear(date);
  }
}

/** Get all dates in a range (inclusive) */
export function dateRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

/** Check if a date is a business day (not weekend) */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

/** Format date as YYYY-MM-DD */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Format date as DD/MM/YYYY (Fineco format) */
export function formatDateFineco(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

/** Parse DD/MM/YYYY string to Date */
export function parseDateFineco(dateStr: string): Date {
  return parse(dateStr, 'dd/MM/yyyy', new Date());
}

/** Get YTD start (Jan 1 of current year) */
export function ytdStart(date: Date): Date {
  return startOfYear(date);
}
