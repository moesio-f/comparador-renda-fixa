import type { Term } from '../engine/types';

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 (UTC) for an ISO date. */
export function toDayNumber(iso: string): number {
  return Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);
}

export function fromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(toDayNumber(iso) + days);
}

export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** Today's date in the user's time zone, as ISO. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yearsSpanned(start: string, end: string): number[] {
  const years: number[] = [];
  for (let y = Number(start.slice(0, 4)); y <= Number(end.slice(0, 4)); y++) years.push(y);
  return years;
}

function isWeekend(day: number): boolean {
  // 1970-01-01 was a Thursday.
  const weekday = (day + 4) % 7;
  return weekday === 0 || weekday === 6;
}

/**
 * Term from `start` (excluded) to `end` (included).
 * Exact business days when every year has a holiday list, else calendar days × 252/365.
 */
export function buildTerm(start: string, end: string, holidaysByYear: Record<number, readonly string[]>): Term {
  const first = toDayNumber(start) + 1;
  const last = toDayNumber(end);
  const calendarDays = last - first + 1;
  const years = yearsSpanned(start, end);
  const exact = years.every((y) => holidaysByYear[y] !== undefined);

  const businessDaysByYear: Record<number, number> = {};
  for (const y of years) {
    const from = Math.max(first, toDayNumber(`${y}-01-01`));
    const to = Math.min(last, toDayNumber(`${y}-12-31`));
    if (to < from) continue;
    if (exact) {
      const holidays = new Set(holidaysByYear[y]!.map(toDayNumber));
      let count = 0;
      for (let d = from; d <= to; d++) if (!isWeekend(d) && !holidays.has(d)) count++;
      businessDaysByYear[y] = count;
    } else {
      businessDaysByYear[y] = ((to - from + 1) * 252) / 365;
    }
  }

  const businessDays = Object.values(businessDaysByYear).reduce((a, b) => a + b, 0);
  return { calendarDays, businessDays, businessDaysByYear, method: exact ? 'exact' : 'approximate' };
}

/** Same day `months` later, clamped to the month's last day. */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}
