import { grossFactor, rateForFactor } from './accrual';
import { type Outcome, attempt, taxes } from './result';
import type { Indexer, Indicators, Term } from './types';

export type Direction = 'taxed-to-exempt' | 'exempt-to-taxed';

export type EquivalenceIndexer = Extract<Indexer, 'PRE' | 'CDI_PCT' | 'IPCA_PLUS'>;

export interface Equivalence {
  /** Rate that delivers the same net value at maturity. */
  exact: number;
  /** rate × (1 − IR), or rate ÷ (1 − IR) in the other direction. */
  shortcut: number;
  irRate: number;
  iofRate: number;
}

export function equivalentRate(
  direction: Direction,
  indexer: EquivalenceIndexer,
  rate: number,
  term: Term,
  ind: Indicators,
): Outcome<Equivalence> {
  return attempt(() => {
    const factor = grossFactor(indexer, rate, term, ind);
    // A gain of 1 just reads the bracket rates for this term.
    const { irRate, iofRate } = taxes(1, term.calendarDays, 'taxed');
    const kept = (1 - iofRate) * (1 - irRate);

    const target = direction === 'taxed-to-exempt' ? 1 + (factor - 1) * kept : 1 + (factor - 1) / kept;
    return {
      exact: rateForFactor(indexer, target, term, ind),
      shortcut: direction === 'taxed-to-exempt' ? rate * kept : rate / kept,
      irRate,
      iofRate,
    };
  });
}
