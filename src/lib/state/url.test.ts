import { compressToEncodedURIComponent } from 'lz-string';
import { describe, expect, it } from 'vitest';
import { defaultState, type AppState } from './types';
import { decodeState, encodeState } from './url';

const state: AppState = {
  ...defaultState(),
  assets: [
    {
      id: 'a1',
      name: '',
      type: 'CDB',
      indexer: 'CDI_PCT',
      rate: 110,
      amount: 10000,
      maturity: '2028-10-14',
      incentivized: false,
    },
  ],
  overrides: { cdi: 0.12 },
};

describe('shareable URL state', () => {
  it('round-trips', () => {
    expect(decodeState(encodeState(state))).toEqual(state);
  });

  it('stays URL-safe', () => {
    expect(encodeState(state)).toMatch(/^[A-Za-z0-9+\-$]+$/);
  });

  it('rejects garbage', () => {
    expect(decodeState('not-a-payload')).toBeNull();
  });

  it('rejects unknown versions', () => {
    expect(decodeState(compressToEncodedURIComponent(JSON.stringify({ ...state, v: 99 })))).toBeNull();
  });
});
