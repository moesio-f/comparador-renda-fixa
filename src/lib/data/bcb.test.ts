import { describe, expect, it } from 'vitest';
import { FOCUS_URL, parseFocus, parseSgs } from './bcb';
import focus from './fixtures/focus-ipca.json';
import sgs from './fixtures/sgs-4389.json';

describe('BCB parsers', () => {
  it('parses an SGS reading', () => {
    expect(parseSgs(sgs)).toEqual({ value: 0.1365, date: '2026-10-14' });
  });

  it('rejects an empty SGS response', () => {
    expect(() => parseSgs([])).toThrow();
  });

  it('keeps only the latest Focus survey', () => {
    const f = parseFocus(focus);
    expect(f.date).toBe('2026-10-09');
    expect(f.byYear[2026]).toBeCloseTo(0.052245, 8);
    expect(f.byYear[2027]).toBeCloseTo(0.043, 8);
    expect(Object.keys(f.byYear)).toEqual(['2026', '2027', '2028', '2029', '2030']);
  });

  it('encodes spaces in the Focus query as %20', () => {
    expect(FOCUS_URL).not.toContain('+');
    expect(FOCUS_URL).toContain('Indicador%20eq%20');
  });
});
