import { readCache, writeCache } from '../data/cache';

export type ThemeName = 'light' | 'dark';

// index.html reads this key before first paint; keep both in sync.
const CACHE_KEY = 'theme';

function storedTheme(): ThemeName | null {
  const value = readCache<unknown>(CACHE_KEY)?.value;
  return value === 'light' || value === 'dark' ? value : null;
}

class Theme {
  /** The user's choice; null follows the OS. */
  private stored = $state<ThemeName | null>(storedTheme());
  private osDark = $state(false);

  constructor() {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    this.osDark = mq.matches;
    mq.addEventListener('change', () => (this.osDark = mq.matches));
  }

  get current(): ThemeName {
    return this.stored ?? (this.osDark ? 'dark' : 'light');
  }

  toggle() {
    const next = this.current === 'dark' ? 'light' : 'dark';
    // Set the attribute first so anything reacting to `current` reads the new tokens.
    document.documentElement.dataset.theme = next;
    this.stored = next;
    writeCache(CACHE_KEY, next);
  }
}

export const theme = new Theme();
