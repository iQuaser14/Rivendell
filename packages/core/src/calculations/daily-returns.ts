import Decimal from 'decimal.js';
import { compoundReturns } from './modified-dietz.js';
import { periodStart } from '../utils/dates.js';
import { d } from '../utils/math.js';

interface DailyReturn {
  date: Date;
  return: Decimal;
}

/**
 * Compute weekly return by compounding daily returns within the current week.
 */
export function weekToDateReturn(
  dailyReturns: DailyReturn[],
  referenceDate: Date,
): Decimal {
  const weekStart = periodStart(referenceDate, 'week');
  const returns = dailyReturns
    .filter((r) => r.date >= weekStart && r.date <= referenceDate)
    .map((r) => r.return);
  return compoundReturns(returns);
}

/**
 * Compute month-to-date return by compounding daily returns.
 */
export function monthToDateReturn(
  dailyReturns: DailyReturn[],
  referenceDate: Date,
): Decimal {
  const monthStart = periodStart(referenceDate, 'month');
  const returns = dailyReturns
    .filter((r) => r.date >= monthStart && r.date <= referenceDate)
    .map((r) => r.return);
  return compoundReturns(returns);
}

/**
 * Compute year-to-date return by compounding daily returns.
 */
export function yearToDateReturn(
  dailyReturns: DailyReturn[],
  referenceDate: Date,
): Decimal {
  const yearStart = periodStart(referenceDate, 'year');
  const returns = dailyReturns
    .filter((r) => r.date >= yearStart && r.date <= referenceDate)
    .map((r) => r.return);
  return compoundReturns(returns);
}

/**
 * Compute return for an arbitrary date range by compounding daily returns.
 */
export function periodReturn(
  dailyReturns: DailyReturn[],
  start: Date,
  end: Date,
): Decimal {
  const returns = dailyReturns
    .filter((r) => r.date >= start && r.date <= end)
    .map((r) => r.return);
  return compoundReturns(returns);
}

/**
 * Aggregate daily returns into monthly returns.
 * Returns an array of { month: 'YYYY-MM', return: Decimal }.
 */
export function monthlyReturns(
  dailyReturns: DailyReturn[],
): Array<{ month: string; return: Decimal }> {
  const byMonth = new Map<string, Decimal[]>();

  for (const dr of dailyReturns) {
    const key = `${dr.date.getFullYear()}-${String(dr.date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(dr.return);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, returns]) => ({
      month,
      return: compoundReturns(returns),
    }));
}
