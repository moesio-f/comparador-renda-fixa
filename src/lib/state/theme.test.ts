import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let osDark: boolean;
let osListeners: (() => void)[];
let storage: Map<string, string>;
let root: { dataset: Record<string, string> };

function setOs(dark: boolean) {
  osDark = dark;
  osListeners.forEach((l) => l());
}

async function load() {
  vi.resetModules();
  return (await import('./theme.svelte')).theme;
}

beforeEach(() => {
  osDark = false;
  osListeners = [];
  storage = new Map();
  root = { dataset: {} };
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return osDark;
    },
    addEventListener: (_: string, l: () => void) => osListeners.push(l),
  }));
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  });
  vi.stubGlobal('document', { documentElement: root });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('theme', () => {
  it('follows the OS while nothing is stored', async () => {
    osDark = true;
    const theme = await load();
    expect(theme.current).toBe('dark');
    setOs(false);
    expect(theme.current).toBe('light');
  });

  it('toggle flips, stores the choice and sets data-theme', async () => {
    const theme = await load();
    theme.toggle();
    expect(theme.current).toBe('dark');
    expect(root.dataset.theme).toBe('dark');
    expect(JSON.parse(storage.get('renda-fixa:theme')!).value).toBe('dark');
  });

  it('stored choice wins over the OS', async () => {
    osDark = true;
    storage.set('renda-fixa:theme', JSON.stringify({ value: 'light', savedAt: 0 }));
    const theme = await load();
    expect(theme.current).toBe('light');
    setOs(false);
    setOs(true);
    expect(theme.current).toBe('light');
  });

  it('ignores an invalid stored value', async () => {
    osDark = true;
    storage.set('renda-fixa:theme', JSON.stringify({ value: 'blue', savedAt: 0 }));
    expect((await load()).current).toBe('dark');
  });

  it('toggles when storage is blocked', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    const theme = await load();
    theme.toggle();
    expect(theme.current).toBe('dark');
  });
});
