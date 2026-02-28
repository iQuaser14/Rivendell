/**
 * Market hours detection per exchange.
 * Used to determine when to poll Yahoo Finance for live prices.
 */

export interface MarketSchedule {
  open: string;   // HH:MM in local exchange time
  close: string;  // HH:MM in local exchange time
  tz: string;     // IANA timezone
  days: number[]; // 1=Mon, 2=Tue, ... 5=Fri
}

export const MARKET_HOURS: Record<string, MarketSchedule> = {
  NYSE:  { open: '09:30', close: '16:00', tz: 'America/New_York', days: [1, 2, 3, 4, 5] },
  NASDAQ:{ open: '09:30', close: '16:00', tz: 'America/New_York', days: [1, 2, 3, 4, 5] },
  LSE:   { open: '08:00', close: '16:30', tz: 'Europe/London', days: [1, 2, 3, 4, 5] },
  MIL:   { open: '09:00', close: '17:30', tz: 'Europe/Rome', days: [1, 2, 3, 4, 5] },
  TSE:   { open: '09:00', close: '15:00', tz: 'Asia/Tokyo', days: [1, 2, 3, 4, 5] },
  SIX:   { open: '09:00', close: '17:30', tz: 'Europe/Zurich', days: [1, 2, 3, 4, 5] },
  ASX:   { open: '10:00', close: '16:00', tz: 'Australia/Sydney', days: [1, 2, 3, 4, 5] },
  ATH:   { open: '10:00', close: '17:20', tz: 'Europe/Athens', days: [1, 2, 3, 4, 5] },
  PAR:   { open: '09:00', close: '17:30', tz: 'Europe/Paris', days: [1, 2, 3, 4, 5] },
  FRA:   { open: '08:00', close: '22:00', tz: 'Europe/Berlin', days: [1, 2, 3, 4, 5] },
};

/** Parse "HH:MM" into hours and minutes. */
function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hours: h, minutes: m };
}

/**
 * Check if a specific exchange is currently open.
 * @param exchange Exchange code (e.g. "NYSE", "LSE", "MIL")
 * @param now Current time (defaults to new Date())
 */
export function isMarketOpen(exchange: string, now: Date = new Date()): boolean {
  const schedule = MARKET_HOURS[exchange.toUpperCase()];
  if (!schedule) return false;

  // Get current time in the exchange's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';

  // Map weekday name to number (1=Mon, ..., 5=Fri)
  const dayMap: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  const dayNum = dayMap[weekday] ?? 0;
  if (!schedule.days.includes(dayNum)) return false;

  const open = parseTime(schedule.open);
  const close = parseTime(schedule.close);
  const currentMinutes = hour * 60 + minute;
  const openMinutes = open.hours * 60 + open.minutes;
  const closeMinutes = close.hours * 60 + close.minutes;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Check if ANY market from a list of exchanges is currently open.
 * @param exchanges Array of exchange codes
 * @param now Current time
 */
export function isAnyMarketOpen(exchanges: string[], now: Date = new Date()): boolean {
  return exchanges.some((ex) => isMarketOpen(ex, now));
}

export type MarketStatus = 'open' | 'closed';

/**
 * Get the market status for a set of exchanges.
 */
export function getMarketStatus(exchanges: string[], now: Date = new Date()): MarketStatus {
  return isAnyMarketOpen(exchanges, now) ? 'open' : 'closed';
}

/**
 * Get all unique exchanges from position data.
 * Falls back to common exchanges if none provided.
 */
export function extractExchanges(positions: Array<{ exchange?: string | null }>): string[] {
  const exchanges = new Set<string>();
  for (const pos of positions) {
    if (pos.exchange) exchanges.add(pos.exchange.toUpperCase());
  }
  if (exchanges.size === 0) {
    // Default to major exchanges
    return ['NYSE', 'LSE', 'MIL'];
  }
  return Array.from(exchanges);
}
