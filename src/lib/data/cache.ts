// localStorage access can throw (private mode, blocked storage). Every access goes through here.

const PREFIX = 'renda-fixa:';

export interface Cached<T> {
  value: T;
  savedAt: number;
}

export function readCache<T>(key: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T, now = Date.now()): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ value, savedAt: now } satisfies Cached<T>));
  } catch {
    // Storage unavailable: run without persistence.
  }
}

export function isFresh(entry: Cached<unknown>, ttlMs: number, now = Date.now()): boolean {
  return now - entry.savedAt < ttlMs;
}
