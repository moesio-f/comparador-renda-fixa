import { MissingIndicator, annualize, grossFactor, rateForFactor } from './accrual';
import { TESOURO_CUSTODY_RATE, custodyExemption, hasCustodyFee, iofRate, irRate, taxRegime } from './tax-rules';
import type { AssetType, Indexer, Indicators, TaxRegime, Term } from './types';

export interface AssetInput {
  type: AssetType;
  indexer: Indexer;
  /** Fraction: 0.12 for 12% p.a., 1.1 for 110% of CDI. */
  rate: number;
  amount: number;
  incentivized?: boolean;
}

export interface AssetResult {
  regime: TaxRegime;
  invested: number;
  gross: number;
  grossGain: number;
  iofRate: number;
  iof: number;
  irRate: number;
  ir: number;
  custody: number;
  net: number;
  netGain: number;
  /** Net annual rate, 252 basis. */
  netAnnualRate: number;
  /** Net return expressed as a share of CDI (1 = 100%). Null without CDI. */
  netCdiShare: number | null;
}

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: string };

/** IOF and IR on a gross gain. A non-positive gain pays no tax. */
export function taxes(gain: number, calendarDays: number, regime: TaxRegime) {
  if (regime === 'exempt' || gain <= 0) return { iofRate: 0, iof: 0, irRate: 0, ir: 0 };
  const iofR = iofRate(calendarDays);
  const iof = gain * iofR;
  const irR = irRate(calendarDays);
  return { iofRate: iofR, iof, irRate: irR, ir: (gain - iof) * irR };
}

/** Runs `fn`, turning a missing indicator into an error outcome. */
export function attempt<T>(fn: () => T): Outcome<T> {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof MissingIndicator) return { ok: false, error: e.message };
    throw e;
  }
}

export function computeAsset(input: AssetInput, term: Term, ind: Indicators): Outcome<AssetResult> {
  return attempt(() => {
    const { type, indexer, rate, amount } = input;
    const regime = taxRegime(type, input.incentivized);
    const gross = amount * grossFactor(indexer, rate, term, ind);
    const grossGain = gross - amount;
    const tax = taxes(grossGain, term.calendarDays, regime);

    // Pro rata on the average balance, approximating B3's daily accrual of the fee.
    let custody = 0;
    if (hasCustodyFee(type)) {
      const base = Math.max(0, (amount + gross) / 2 - custodyExemption(type, indexer));
      custody = base * TESOURO_CUSTODY_RATE * (term.calendarDays / 365);
    }

    const net = gross - tax.iof - tax.ir - custody;
    return {
      regime,
      invested: amount,
      gross,
      grossGain,
      ...tax,
      custody,
      net,
      netGain: net - amount,
      netAnnualRate: annualize(net / amount, term.businessDays),
      netCdiShare: ind.cdi === null ? null : rateForFactor('CDI_PCT', net / amount, term, ind),
    };
  });
}
