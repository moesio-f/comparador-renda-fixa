import { addMonths } from '../data/business-days';
import { computeAsset, type AssetResult, type Outcome } from '../engine/result';
import type { Term } from '../engine/types';
import { validateAsset, hasErrors, type FieldErrors } from '../engine/validation';
import type { app as App } from './app.svelte';
import type { Asset } from './types';

export interface AssetRow {
  asset: Asset;
  /** Position in the list, which fixes the chart color. */
  index: number;
  days: number;
  errors: FieldErrors;
  term: Term | null;
  outcome: Outcome<AssetResult> | null;
}

type AppLike = typeof App;

function inputOf(asset: Asset) {
  return {
    type: asset.type,
    indexer: asset.indexer,
    rate: asset.rate! / 100,
    amount: asset.amount!,
    incentivized: asset.incentivized,
  };
}

export function assetRow(app: AppLike, asset: Asset, index: number): AssetRow {
  const days = app.daysTo(asset.maturity);
  const errors = validateAsset({ rate: asset.rate, amount: asset.amount, calendarDays: days });
  if (hasErrors(errors)) return { asset, index, days, errors, term: null, outcome: null };
  const term = app.termTo(asset.maturity);
  return { asset, index, days, errors, term, outcome: computeAsset(inputOf(asset), term, app.indicators) };
}

export interface SeriesPoint {
  date: string;
  net: number;
}

/** Net value if redeemed on each date: today, then monthly, then maturity. */
export function netSeries(app: AppLike, row: AssetRow): SeriesPoint[] {
  const { asset } = row;
  const points: SeriesPoint[] = [{ date: app.today, net: asset.amount! }];
  const dates: string[] = [];
  for (let k = 1; ; k++) {
    const d = addMonths(app.today, k);
    if (d >= asset.maturity) break;
    dates.push(d);
  }
  dates.push(asset.maturity);
  for (const date of dates) {
    const r = computeAsset(inputOf(asset), app.termTo(date), app.indicators);
    if (r.ok) points.push({ date, net: r.value.net });
  }
  return points;
}
