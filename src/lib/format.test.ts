import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatPercent, formatPoints, parseNumber } from './format';

const nbsp = ' ';

describe('pt-BR formatting', () => {
  it('formats currency', () => {
    expect(formatCurrency(10000)).toBe(`R$${nbsp}10.000,00`);
  });

  it('formats percent', () => {
    expect(formatPercent(0.1171)).toBe('11,71%');
  });

  it('formats percentage points', () => {
    expect(formatPoints(0.0078)).toBe('0,78 p.p.');
  });

  it('formats dates', () => {
    expect(formatDate('2026-10-14')).toBe('14/10/2026');
  });
});

describe('parseNumber', () => {
  it.each([
    ['10.000,50', 10000.5],
    ['13,65', 13.65],
    ['13.65', 13.65],
    ['10.000', 10000],
    ['R$ 1.234,56', 1234.56],
    ['110%', 110],
    ['-2,5', -2.5],
  ])('parses %s', (text, expected) => {
    expect(parseNumber(text)).toBe(expected);
  });

  it.each(['', 'abc', '1,2,3'])('rejects %j', (text) => {
    expect(parseNumber(text)).toBeNull();
  });
});
