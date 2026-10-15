import { describe, expect, it } from 'vitest';
import { grossFactor, ipcaFactor } from './accrual';
import { averageIpca, breakevenInflation } from './breakeven';
import { equivalentRate } from './equivalence';
import { computeAsset, type AssetInput } from './result';
import { iofRate, irBracketLabel, irRate, taxRegime } from './tax-rules';
import type { Indicators, Term } from './types';
import { validateAsset } from './validation';

const ind: Indicators = { cdi: 0.1365, selic: 0.1365, ipcaByYear: { 2026: 0.0522, 2027: 0.043 } };

/** Term with the 252/365 approximation, all in one year unless split is given. */
function term(calendarDays: number, byYear?: Record<number, number>): Term {
  const businessDays = (calendarDays * 252) / 365;
  return { calendarDays, businessDays, businessDaysByYear: byYear ?? { 2027: businessDays }, method: 'approximate' };
}

function compute(input: Partial<AssetInput>, t: Term, indicators = ind) {
  const outcome = computeAsset({ type: 'CDB', indexer: 'CDI_PCT', rate: 1, amount: 10_000, ...input }, t, indicators);
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
}

describe('tax regime', () => {
  it.each(['LCI', 'LCA', 'LIG', 'CRI', 'CRA'] as const)('%s is exempt', (type) => {
    expect(taxRegime(type)).toBe('exempt');
  });

  it.each(['CDB', 'LF', 'TESOURO', 'DEB'] as const)('%s is taxed', (type) => {
    expect(taxRegime(type)).toBe('taxed');
  });

  it('incentivized DEB is exempt', () => {
    expect(taxRegime('DEB', true)).toBe('exempt');
  });

  it('LCA pays no IR or IOF', () => {
    const r = compute({ type: 'LCA' }, term(10));
    expect(r.ir).toBe(0);
    expect(r.iof).toBe(0);
  });
});

describe('gross accrual', () => {
  it('100% of CDI over 504 business days', () => {
    expect(grossFactor('CDI_PCT', 1, term(730), ind)).toBeCloseTo(1.291632, 6);
  });

  it('110% of CDI compounds daily', () => {
    const f = grossFactor('CDI_PCT', 1.1, term(730), ind);
    expect(f).toBeCloseTo(1.325103, 6);
    expect(f).toBeGreaterThan(1 + 1.1 * 0.291632);
  });

  it('fixed rate', () => {
    expect(grossFactor('PRE', 0.12, term(365), ind)).toBeCloseTo(1.12, 10);
  });

  it('CDI plus spread multiplies the factors', () => {
    expect(grossFactor('CDI_PLUS', 0.01, term(365), ind)).toBeCloseTo(1.1365 * 1.01, 10);
  });

  it('IPCA uses each year projection on its own business days', () => {
    const t = term(730, { 2026: 50, 2027: 454 });
    const expected = 1.0522 ** (50 / 252) * 1.043 ** (454 / 252);
    expect(ipcaFactor(t, ind.ipcaByYear)).toBeCloseTo(expected, 12);
  });

  it('IPCA repeats the last projection past the horizon', () => {
    const t = term(365, { 2030: 252 });
    expect(ipcaFactor(t, ind.ipcaByYear)).toBeCloseTo(1.043, 12);
  });

  it('missing CDI produces an error outcome', () => {
    const outcome = computeAsset(
      { type: 'CDB', indexer: 'CDI_PCT', rate: 1, amount: 1000 },
      term(365),
      { ...ind, cdi: null },
    );
    expect(outcome).toEqual({ ok: false, error: 'Informe o CDI para calcular' });
  });
});

describe('IR and IOF', () => {
  it.each([
    [180, 0.225],
    [181, 0.2],
    [360, 0.2],
    [361, 0.175],
    [720, 0.175],
    [721, 0.15],
  ])('%i days → %f', (days, rate) => {
    expect(irRate(days)).toBe(rate);
  });

  it('IOF table edges', () => {
    expect(iofRate(1)).toBe(0.96);
    expect(iofRate(10)).toBe(0.66);
    expect(iofRate(29)).toBe(0.03);
    expect(iofRate(30)).toBe(0);
  });

  it('ten-day redemption: IOF 66% then IR 22.5% on the rest', () => {
    const r = compute({}, term(10));
    expect(r.iof).toBeCloseTo(r.grossGain * 0.66, 10);
    expect(r.ir).toBeCloseTo((r.grossGain - r.iof) * 0.225, 10);
  });

  it('thirty-day redemption has no IOF', () => {
    expect(compute({}, term(30)).iof).toBe(0);
  });

  it('bracket labels', () => {
    expect(irBracketLabel(100)).toBe('IR de 22,5% (até 180 dias)');
    expect(irBracketLabel(400)).toBe('IR de 17,5% (361 a 720 dias)');
    expect(irBracketLabel(800)).toBe('IR de 15% (acima de 720 dias)');
  });
});

describe('Tesouro custody', () => {
  it('Tesouro Selic under R$ 10.000 pays no custody', () => {
    const r = compute({ type: 'TESOURO', indexer: 'SELIC_PLUS', rate: 0.001, amount: 5_000 }, term(365));
    expect(r.custody).toBe(0);
  });

  it('Tesouro Prefixado pays 0.20% p.a. on the average balance', () => {
    const r = compute({ type: 'TESOURO', indexer: 'PRE', rate: 0.13, amount: 5_000 }, term(365));
    expect(r.custody).toBeCloseTo(((5_000 + 5_650) / 2) * 0.002, 6);
  });

  it('CDB pays no custody', () => {
    expect(compute({}, term(365)).custody).toBe(0);
  });
});

describe('asset result', () => {
  it('taxed CDB at 100% of CDI over two years', () => {
    const r = compute({}, term(730));
    expect(r.netGain / r.invested).toBeCloseTo(0.247887, 6);
    expect(r.netAnnualRate).toBeCloseTo(0.1171, 4);
    expect(r.netCdiShare!).toBeCloseTo(0.8653, 4);
  });

  it('exempt asset keeps its own CDI share', () => {
    expect(compute({ type: 'LCI', rate: 0.9 }, term(400)).netCdiShare!).toBeCloseTo(0.9, 10);
  });
});

describe('equivalence', () => {
  it('CDB 100% of CDI to exempt over two years', () => {
    const e = equivalentRate('taxed-to-exempt', 'CDI_PCT', 1, term(730), ind);
    if (!e.ok) throw new Error(e.error);
    expect(e.value.exact).toBeCloseTo(0.8653, 4);
    expect(e.value.shortcut).toBeCloseTo(0.85, 10);
  });

  it('round trip returns 100% of CDI', () => {
    const there = equivalentRate('taxed-to-exempt', 'CDI_PCT', 1, term(730), ind);
    if (!there.ok) throw new Error(there.error);
    const back = equivalentRate('exempt-to-taxed', 'CDI_PCT', there.value.exact, term(730), ind);
    if (!back.ok) throw new Error(back.error);
    expect(back.value.exact).toBeCloseTo(1, 10);
  });

  it('fixed rate over one year matches the shortcut', () => {
    const e = equivalentRate('taxed-to-exempt', 'PRE', 0.12, term(365), ind);
    if (!e.ok) throw new Error(e.error);
    expect(e.value.exact).toBeCloseTo(0.12 * 0.825, 10);
  });
});

describe('breakeven inflation', () => {
  it('13% fixed vs IPCA + 7%', () => {
    expect(breakevenInflation(0.13, 0.07)).toBeCloseTo(0.0561, 4);
  });

  it('average IPCA over the term', () => {
    expect(averageIpca(term(365, { 2027: 252 }), ind.ipcaByYear)).toBeCloseTo(0.043, 10);
    expect(averageIpca(term(365), {})).toBeNull();
  });
});

describe('validation', () => {
  it('zero term', () => {
    expect(validateAsset({ rate: 100, amount: 1000, calendarDays: 0 }).calendarDays).toBe(
      'O prazo deve ser maior que zero',
    );
  });

  it('valid input has no errors', () => {
    expect(validateAsset({ rate: 100, amount: 1000, calendarDays: 30 })).toEqual({});
  });

  it('rate at -100% or below', () => {
    expect(validateAsset({ rate: -100, amount: 1000, calendarDays: 30 }).rate).toBeDefined();
  });
});
