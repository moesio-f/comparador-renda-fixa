export type AssetType = 'CDB' | 'LCI' | 'LCA' | 'LIG' | 'LF' | 'CRI' | 'CRA' | 'DEB' | 'TESOURO';

export type Indexer = 'PRE' | 'CDI_PCT' | 'CDI_PLUS' | 'IPCA_PLUS' | 'SELIC_PLUS';

export type TaxRegime = 'taxed' | 'exempt';

/** Rates as annual fractions (0.1365 = 13.65% p.a.). */
export interface Indicators {
  cdi: number | null;
  selic: number | null;
  /** IPCA projection per calendar year. */
  ipcaByYear: Record<number, number>;
}

export type DayCountMethod = 'exact' | 'approximate';

export interface Term {
  /** Calendar days, used for the IR and IOF brackets. */
  calendarDays: number;
  /** Business days, used to accrue rates. */
  businessDays: number;
  /** Business days per calendar year, used for the IPCA projection. */
  businessDaysByYear: Record<number, number>;
  method: DayCountMethod;
}
