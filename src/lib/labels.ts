import type { EquivalenceIndexer } from './engine/equivalence';
import type { AssetType, Indexer } from './engine/types';
import { formatNumber } from './format';
import type { Asset } from './state/types';

export const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'CDB', label: 'CDB' },
  { value: 'LCI', label: 'LCI' },
  { value: 'LCA', label: 'LCA' },
  { value: 'LIG', label: 'LIG' },
  { value: 'LF', label: 'LF' },
  { value: 'CRI', label: 'CRI' },
  { value: 'CRA', label: 'CRA' },
  { value: 'DEB', label: 'Debênture' },
  { value: 'TESOURO', label: 'Tesouro Direto' },
];

export const INDEXERS: { value: Indexer; label: string }[] = [
  { value: 'CDI_PCT', label: '% do CDI' },
  { value: 'PRE', label: 'Prefixado' },
  { value: 'CDI_PLUS', label: 'CDI +' },
  { value: 'IPCA_PLUS', label: 'IPCA +' },
  { value: 'SELIC_PLUS', label: 'Selic +' },
];

export const EQUIVALENCE_INDEXERS: { value: EquivalenceIndexer; label: string }[] = [
  { value: 'CDI_PCT', label: '% do CDI' },
  { value: 'PRE', label: 'Prefixado' },
  { value: 'IPCA_PLUS', label: 'IPCA +' },
];

/** Suffix shown inside the rate input. */
export function rateUnit(indexer: Indexer): string {
  return indexer === 'CDI_PCT' ? '% do CDI' : '% a.a.';
}

/** Rate in percent → "110% do CDI", "12,50% a.a.", "IPCA + 6,80%". */
export function rateLabel(indexer: Indexer, ratePct: number): string {
  const n = formatNumber(ratePct, 2);
  switch (indexer) {
    case 'CDI_PCT':
      return `${n}% do CDI`;
    case 'PRE':
      return `${n}% a.a.`;
    case 'CDI_PLUS':
      return `CDI + ${n}%`;
    case 'IPCA_PLUS':
      return `IPCA + ${n}%`;
    case 'SELIC_PLUS':
      return `Selic + ${n}%`;
  }
}

export function typeLabel(type: AssetType): string {
  return ASSET_TYPES.find((t) => t.value === type)!.label;
}

export function assetLabel(asset: Asset): string {
  if (asset.name.trim()) return asset.name.trim();
  const rate = asset.rate === null ? '' : ` ${rateLabel(asset.indexer, asset.rate)}`;
  return `${typeLabel(asset.type)}${rate}`;
}

/** 730 → "2 anos", 400 → "1 ano e 35 dias", 90 → "90 dias". */
export function durationLabel(days: number): string {
  const years = Math.floor(days / 365);
  const rest = days % 365;
  const y = years === 1 ? '1 ano' : `${years} anos`;
  const d = rest === 1 ? '1 dia' : `${rest} dias`;
  if (years === 0) return d;
  return rest === 0 ? y : `${y} e ${d}`;
}
