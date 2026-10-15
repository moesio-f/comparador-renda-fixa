import type { Indexer, Indicators, Term } from './types';

type IndicatorName = 'CDI' | 'Selic' | 'IPCA';

export class MissingIndicator extends Error {
  constructor(public readonly indicator: IndicatorName) {
    super(`Informe o ${indicator} para calcular`);
  }
}

/** Daily rate equivalent to an annual rate on a 252-day basis. */
export function dailyRate(annual: number): number {
  return (1 + annual) ** (1 / 252) - 1;
}

/** Growth factor of an annual rate over `businessDays`. */
export function annualFactor(annual: number, businessDays: number): number {
  return (1 + annual) ** (businessDays / 252);
}

/** Annual rate (252 basis) that produces `factor` over `businessDays`. */
export function annualize(factor: number, businessDays: number): number {
  return factor ** (252 / businessDays) - 1;
}

/** IPCA projection for a year. Years past the last projection reuse the last; years before the first reuse the first. */
export function ipcaForYear(ipcaByYear: Record<number, number>, year: number): number | null {
  const years = Object.keys(ipcaByYear).map(Number).sort((a, b) => a - b);
  if (years.length === 0) return null;
  const pick = ipcaByYear[year] !== undefined ? year : year > years.at(-1)! ? years.at(-1)! : years[0]!;
  return ipcaByYear[pick]!;
}

/** Projected inflation factor: each year's projection applies to the business days that fall in it. */
export function ipcaFactor(term: Term, ipcaByYear: Record<number, number>): number {
  let factor = 1;
  for (const [year, days] of Object.entries(term.businessDaysByYear)) {
    const ipca = ipcaForYear(ipcaByYear, Number(year));
    if (ipca === null) throw new MissingIndicator('IPCA');
    factor *= annualFactor(ipca, days);
  }
  return factor;
}

function need(value: number | null, name: IndicatorName): number {
  if (value === null) throw new MissingIndicator(name);
  return value;
}

/**
 * Gross growth factor over the term. `rate` is a fraction: 0.12 for 12% p.a. or 1.1 for 110% of CDI.
 * CDI and Selic stay constant at their current value for the whole term.
 */
export function grossFactor(indexer: Indexer, rate: number, term: Term, ind: Indicators): number {
  const du = term.businessDays;
  switch (indexer) {
    case 'PRE':
      return annualFactor(rate, du);
    case 'CDI_PCT':
      return (1 + rate * dailyRate(need(ind.cdi, 'CDI'))) ** du;
    case 'CDI_PLUS':
      return annualFactor(need(ind.cdi, 'CDI'), du) * annualFactor(rate, du);
    case 'SELIC_PLUS':
      return annualFactor(need(ind.selic, 'Selic'), du) * annualFactor(rate, du);
    case 'IPCA_PLUS':
      return ipcaFactor(term, ind.ipcaByYear) * annualFactor(rate, du);
  }
}

/** Inverse of `grossFactor`: the rate, in the same indexer, that produces `factor` over the term. */
export function rateForFactor(indexer: Indexer, factor: number, term: Term, ind: Indicators): number {
  const du = term.businessDays;
  switch (indexer) {
    case 'PRE':
      return annualize(factor, du);
    case 'CDI_PCT':
      return (factor ** (1 / du) - 1) / dailyRate(need(ind.cdi, 'CDI'));
    case 'CDI_PLUS':
      return annualize(factor / annualFactor(need(ind.cdi, 'CDI'), du), du);
    case 'SELIC_PLUS':
      return annualize(factor / annualFactor(need(ind.selic, 'Selic'), du), du);
    case 'IPCA_PLUS':
      return annualize(factor / ipcaFactor(term, ind.ipcaByYear), du);
  }
}
