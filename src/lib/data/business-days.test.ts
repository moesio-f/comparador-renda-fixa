import { describe, expect, it } from 'vitest';
import { addDays, addMonths, buildTerm, daysBetween } from './business-days';
import holidays2027 from './fixtures/holidays-2027.json';
import { parseHolidays } from './holidays';

const h2027 = parseHolidays(holidays2027);

describe('business days', () => {
  it('excludes Carnaval when holidays are loaded', () => {
    const t = buildTerm('2027-02-05', '2027-02-12', { 2027: h2027 });
    expect(t.method).toBe('exact');
    expect(t.businessDays).toBe(3);
    expect(t.calendarDays).toBe(7);
  });

  it('falls back to 252/365 when a year is missing', () => {
    const t = buildTerm('2027-06-01', '2028-06-01', { 2027: h2027 });
    expect(t.method).toBe('approximate');
    expect(t.businessDays).toBeCloseTo((366 * 252) / 365, 10);
  });

  it('approximates 730 calendar days as 504 business days', () => {
    const t = buildTerm('2026-10-15', addDays('2026-10-15', 730), {});
    expect(t.calendarDays).toBe(730);
    expect(t.businessDays).toBeCloseTo(504, 10);
  });

  it('splits business days per calendar year', () => {
    const t = buildTerm('2026-12-30', '2027-01-05', {});
    expect(Object.keys(t.businessDaysByYear)).toEqual(['2026', '2027']);
    expect(t.businessDaysByYear[2026]).toBeCloseTo((1 * 252) / 365, 10);
    expect(t.businessDaysByYear[2027]).toBeCloseTo((5 * 252) / 365, 10);
  });

  it('counts calendar days', () => {
    expect(daysBetween('2026-10-15', '2028-10-14')).toBe(730);
  });

  it('keeps only national holidays from BrasilAPI', () => {
    expect(h2027).toContain('2027-02-08');
    expect(h2027).toHaveLength(14);
  });
});

describe('addMonths', () => {
  it('clamps to the end of shorter months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-10-15', 3)).toBe('2027-01-15');
  });
});
