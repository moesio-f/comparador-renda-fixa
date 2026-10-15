import { annualize, ipcaFactor } from './accrual';
import type { Term } from './types';

/** Annual inflation at which a fixed-rate asset and an IPCA+ asset with the same term end even. */
export function breakevenInflation(fixedRate: number, ipcaSpread: number): number {
  return (1 + fixedRate) / (1 + ipcaSpread) - 1;
}

/** Average annual IPCA projection over the term, weighted by business days per year. Null without projections. */
export function averageIpca(term: Term, ipcaByYear: Record<number, number>): number | null {
  if (Object.keys(ipcaByYear).length === 0) return null;
  return annualize(ipcaFactor(term, ipcaByYear), term.businessDays);
}
