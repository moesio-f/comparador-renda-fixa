import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { AppState } from './types';

const VERSION = 1;

export function encodeState(state: AppState): string {
  return compressToEncodedURIComponent(JSON.stringify({ v: VERSION, ...state }));
}

/** Null when the payload is corrupt or from an unknown version. */
export function decodeState(encoded: string): AppState | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const { v, ...state } = JSON.parse(json) as { v: unknown } & AppState;
    if (v !== VERSION || !Array.isArray(state.assets) || !state.equivalence || !state.breakeven) return null;
    return { ...state, overrides: state.overrides ?? {} };
  } catch {
    return null;
  }
}
