import { buildTerm, daysBetween, today, yearsSpanned, addDays } from '../data/business-days';
import { readCache, writeCache } from '../data/cache';
import type { Indicators, Term } from '../engine/types';
import { market } from './market.svelte';
import { router } from './router.svelte';
import { defaultState, type AppState, type Asset } from './types';
import { decodeState, encodeState } from './url';

const STATE_KEY = 'state';

class App {
  state = $state<AppState>(defaultState());
  /** A shared link opened while the user had a saved comparison of their own. */
  pendingLink = $state<{ saved: AppState } | null>(null);
  toast = $state<string | null>(null);
  readonly today = today();

  /** Indicators used in calculations: manual overrides win over fetched values. */
  indicators: Indicators = $derived({
    cdi: this.state.overrides.cdi ?? market.cdi.value?.value ?? null,
    selic: this.state.overrides.selic ?? market.selic.value?.value ?? null,
    ipcaByYear: { ...market.focus.value?.byYear, ...this.state.overrides.ipcaByYear },
  });

  init() {
    const saved = readCache<AppState>(STATE_KEY)?.value ?? null;
    // URLSearchParams turns "+" into a space; lz-string output uses "+".
    const shared = router.params.get('s')?.replace(/ /g, '+');

    if (shared === undefined) {
      this.state = saved ?? defaultState();
      return;
    }

    router.removeParam('s');
    const linked = decodeState(shared);
    if (!linked) {
      this.state = saved ?? defaultState();
      this.notify('Link inválido');
      return;
    }

    this.state = linked;
    if (saved && JSON.stringify(saved) !== JSON.stringify(linked)) this.pendingLink = { saved };
    else this.save();
  }

  /** Answers the "replace your saved comparison?" prompt. */
  resolveLink(replace: boolean) {
    if (!this.pendingLink) return;
    if (!replace) this.state = this.pendingLink.saved;
    this.pendingLink = null;
    this.save();
  }

  save() {
    // Hold off while the user decides whether a shared link replaces their saved state.
    if (!this.pendingLink) writeCache(STATE_KEY, $state.snapshot(this.state));
  }

  shareUrl(): string {
    return `${location.origin}${location.pathname}#/${router.route}?s=${encodeState($state.snapshot(this.state))}`;
  }

  notify(message: string) {
    this.toast = message;
    setTimeout(() => {
      if (this.toast === message) this.toast = null;
    }, 2500);
  }

  /** Term from today to an ISO date, exact when that span's holidays are loaded. */
  termTo(end: string): Term {
    return buildTerm(this.today, end, market.holidays);
  }

  termOfDays(days: number): Term {
    return this.termTo(addDays(this.today, days));
  }

  daysTo(end: string): number {
    return daysBetween(this.today, end);
  }

  /** Every year that some input reaches, for holiday loading. */
  yearsInUse(): number[] {
    const ends = [
      ...this.state.assets.map((a) => a.maturity),
      addDays(this.today, Math.max(1080, this.state.equivalence.days ?? 0)),
      addDays(this.today, this.state.breakeven.days ?? 0),
    ];
    const years = new Set<number>();
    for (const end of ends) {
      if (end > this.today) yearsSpanned(this.today, end).forEach((y) => years.add(y));
    }
    return [...years];
  }

  addAsset(asset?: Partial<Asset>) {
    this.state.assets.push({
      id: crypto.randomUUID(),
      name: '',
      type: 'CDB',
      indexer: 'CDI_PCT',
      rate: 100,
      amount: 10_000,
      maturity: addDays(this.today, 730),
      incentivized: false,
      ...asset,
    });
  }

  duplicateAsset(id: string) {
    const i = this.state.assets.findIndex((a) => a.id === id);
    if (i < 0) return;
    const copy = { ...$state.snapshot(this.state.assets[i]!), id: crypto.randomUUID() };
    this.state.assets.splice(i + 1, 0, copy);
  }

  removeAsset(id: string) {
    this.state.assets = this.state.assets.filter((a) => a.id !== id);
  }
}

export const app = new App();
