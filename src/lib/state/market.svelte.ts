import { fetchFocus, fetchSgs, type FocusIpca, type Reading, type SgsKey } from '../data/bcb';
import { isFresh, readCache, writeCache } from '../data/cache';
import { loadHolidays } from '../data/holidays';

export type Source = 'loading' | 'bcb' | 'cache' | 'unavailable';

export interface Fetched<T> {
  value: T | null;
  source: Source;
  /** When the value was fetched, for cached values. */
  savedAt?: number;
}

type IndicatorCache = Partial<Record<SgsKey, Reading>> & { focus?: FocusIpca };

const CACHE_KEY = 'indicators';
const TTL_MS = 12 * 60 * 60 * 1000;

const loading = <T>(): Fetched<T> => ({ value: null, source: 'loading' });

class Market {
  cdi = $state<Fetched<Reading>>(loading());
  selicTarget = $state<Fetched<Reading>>(loading());
  selic = $state<Fetched<Reading>>(loading());
  ipca12m = $state<Fetched<Reading>>(loading());
  focus = $state<Fetched<FocusIpca>>(loading());

  /** Holiday lists per year that loaded. */
  holidays = $state<Record<number, string[]>>({});
  /** Years whose holidays failed to load. */
  holidayFailures = $state<number[]>([]);
  private requestedYears = new Set<number>();

  async load() {
    const cached = readCache<IndicatorCache>(CACHE_KEY);
    if (cached && isFresh(cached, TTL_MS)) {
      this.apply(cached.value, 'bcb', cached.savedAt);
      return;
    }

    const keys: SgsKey[] = ['cdi', 'selicTarget', 'selic', 'ipca12m'];
    const results = await Promise.allSettled([...keys.map((k) => fetchSgs(k)), fetchFocus()]);
    const fresh: IndicatorCache = {};
    results.forEach((r, i) => {
      if (r.status !== 'fulfilled') return;
      if (i < keys.length) fresh[keys[i]!] = r.value as Reading;
      else fresh.focus = r.value as FocusIpca;
    });

    // Keep stale values for whatever failed, so the next visit still has them.
    writeCache(CACHE_KEY, { ...cached?.value, ...fresh });
    this.apply(fresh, 'bcb');
    if (cached) this.apply(omit(cached.value, Object.keys(fresh)), 'cache', cached.savedAt);
    for (const k of [...keys, 'focus'] as const) {
      if (this[k].source === 'loading') this[k] = { value: null, source: 'unavailable' };
    }
  }

  private apply(values: IndicatorCache, source: Source, savedAt?: number) {
    for (const k of ['cdi', 'selicTarget', 'selic', 'ipca12m'] as const) {
      const v = values[k];
      if (v) this[k] = { value: v, source, savedAt };
    }
    if (values.focus) this.focus = { value: values.focus, source, savedAt };
  }

  /** Loads holidays for any year not requested yet. */
  async ensureHolidays(years: number[]) {
    const missing = years.filter((y) => !this.requestedYears.has(y));
    missing.forEach((y) => this.requestedYears.add(y));
    await Promise.all(
      missing.map(async (y) => {
        const dates = await loadHolidays(y);
        if (dates) this.holidays[y] = dates;
        else this.holidayFailures.push(y);
      }),
    );
  }
}

function omit<T extends object>(obj: T, keys: string[]): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k))) as Partial<T>;
}

export const market = new Market();
