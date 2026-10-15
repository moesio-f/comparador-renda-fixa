import type { Direction, EquivalenceIndexer } from '../engine/equivalence';
import type { AssetType, Indexer } from '../engine/types';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  indexer: Indexer;
  /** Percent as typed: 110 for 110% of CDI, 12.5 for 12,5% a.a. */
  rate: number | null;
  amount: number | null;
  /** ISO date. */
  maturity: string;
  incentivized: boolean;
}

export interface EquivalenceInputs {
  direction: Direction;
  indexer: EquivalenceIndexer;
  rate: number | null;
  days: number | null;
}

export interface BreakevenInputs {
  fixedRate: number | null;
  ipcaSpread: number | null;
  days: number | null;
}

/** Manual indicator values, as fractions. */
export interface Overrides {
  cdi?: number;
  selic?: number;
  ipcaByYear?: Record<number, number>;
}

export interface AppState {
  assets: Asset[];
  equivalence: EquivalenceInputs;
  breakeven: BreakevenInputs;
  overrides: Overrides;
}

export function defaultState(): AppState {
  return {
    assets: [],
    equivalence: { direction: 'taxed-to-exempt', indexer: 'CDI_PCT', rate: 100, days: 730 },
    breakeven: { fixedRate: 13, ipcaSpread: 7, days: 1095 },
    overrides: {},
  };
}
