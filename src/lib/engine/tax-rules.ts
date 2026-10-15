import type { AssetType, Indexer, TaxRegime } from './types';

// Every tax rule lives in this file. When the law changes, change it here.

/** Regressive IR table by calendar days held. */
export const IR_BRACKETS = [
  { upTo: 180, rate: 0.225 },
  { upTo: 360, rate: 0.2 },
  { upTo: 720, rate: 0.175 },
  { upTo: Infinity, rate: 0.15 },
] as const;

/** IOF rate on the gain for days 1 to 29. Zero from day 30 on. */
export const IOF_TABLE = [
  0.96, 0.93, 0.9, 0.86, 0.83, 0.8, 0.76, 0.73, 0.7, 0.66, 0.63, 0.6, 0.56, 0.53, 0.5, 0.46, 0.43, 0.4, 0.36,
  0.33, 0.3, 0.26, 0.23, 0.2, 0.16, 0.13, 0.1, 0.06, 0.03,
] as const;

/** B3 custody fee on Tesouro Direto bonds, per year. */
export const TESOURO_CUSTODY_RATE = 0.002;

/** Tesouro Selic balance exempt from the custody fee. */
export const TESOURO_SELIC_CUSTODY_EXEMPTION = 10_000;

/** Types exempt from IR for individuals. DEB joins them only when incentivized. */
const EXEMPT_TYPES: ReadonlySet<AssetType> = new Set(['LCI', 'LCA', 'LIG', 'CRI', 'CRA']);

export function irRate(calendarDays: number): number {
  return IR_BRACKETS.find((b) => calendarDays <= b.upTo)!.rate;
}

export function iofRate(calendarDays: number): number {
  if (calendarDays >= 30) return 0;
  return IOF_TABLE[Math.max(1, Math.floor(calendarDays)) - 1]!;
}

export function taxRegime(type: AssetType, incentivized = false): TaxRegime {
  if (EXEMPT_TYPES.has(type)) return 'exempt';
  if (type === 'DEB' && incentivized) return 'exempt';
  return 'taxed';
}

export function hasCustodyFee(type: AssetType): boolean {
  return type === 'TESOURO';
}

/** Balance exempt from the custody fee. Only Tesouro Selic has one. */
export function custodyExemption(type: AssetType, indexer: Indexer): number {
  return type === 'TESOURO' && indexer === 'SELIC_PLUS' ? TESOURO_SELIC_CUSTODY_EXEMPTION : 0;
}

/** UI label for the IR bracket of a term, e.g. "IR de 17,5% (361 a 720 dias)". */
export function irBracketLabel(calendarDays: number): string {
  const i = IR_BRACKETS.findIndex((b) => calendarDays <= b.upTo);
  const bracket = IR_BRACKETS[i]!;
  const pct = `${(bracket.rate * 100).toLocaleString('pt-BR')}%`;
  if (i === 0) return `IR de ${pct} (até ${bracket.upTo} dias)`;
  const from = IR_BRACKETS[i - 1]!.upTo + 1;
  if (bracket.upTo === Infinity) return `IR de ${pct} (acima de ${from - 1} dias)`;
  return `IR de ${pct} (${from} a ${bracket.upTo} dias)`;
}
