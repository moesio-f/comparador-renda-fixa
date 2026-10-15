import { fetchJson } from './fetch';

/** A single indicator reading. `value` is a fraction (0.1365 = 13,65%), `date` is ISO. */
export interface Reading {
  value: number;
  date: string;
}

/** Focus survey: median IPCA expectation per calendar year. */
export interface FocusIpca {
  date: string;
  byYear: Record<number, number>;
}

export const SGS = {
  cdi: 4389,
  selicTarget: 432,
  selic: 1178,
  ipca12m: 13522,
} as const;

export type SgsKey = keyof typeof SGS;

export function sgsUrl(code: number): string {
  return `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/1?formato=json`;
}

// Olinda (OData) rejects "+" for spaces, so the query is encoded by hand.
export const FOCUS_URL =
  'https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?' +
  [
    ['$top', '20'],
    ['$filter', "Indicador eq 'IPCA' and baseCalculo eq 0"],
    ['$orderby', 'Data desc'],
    ['$select', 'Data,DataReferencia,Mediana'],
    ['$format', 'json'],
  ]
    .map(([k, v]) => `${encodeURIComponent(k!)}=${encodeURIComponent(v!)}`)
    .join('&');

/** "14/10/2026" → "2026-10-14" */
function brDateToIso(br: string): string {
  const [d, m, y] = br.split('/');
  return `${y}-${m}-${d}`;
}

export function parseSgs(json: unknown): Reading {
  if (!Array.isArray(json) || json.length === 0) throw new Error('Resposta do SGS sem dados');
  const last = json.at(-1) as { data: string; valor: string };
  const pct = Number(last.valor);
  if (!Number.isFinite(pct)) throw new Error('Valor do SGS inválido');
  return { value: pct / 100, date: brDateToIso(last.data) };
}

export function parseFocus(json: unknown): FocusIpca {
  const rows = (json as { value?: { Data: string; DataReferencia: string; Mediana: number }[] }).value;
  if (!rows || rows.length === 0) throw new Error('Resposta do Focus sem dados');
  const latest = rows.reduce((max, r) => (r.Data > max ? r.Data : max), rows[0]!.Data);
  const byYear: Record<number, number> = {};
  for (const r of rows) {
    if (r.Data === latest) byYear[Number(r.DataReferencia)] = r.Mediana / 100;
  }
  return { date: latest, byYear };
}

export async function fetchSgs(key: SgsKey): Promise<Reading> {
  return parseSgs(await fetchJson(sgsUrl(SGS[key])));
}

export async function fetchFocus(): Promise<FocusIpca> {
  return parseFocus(await fetchJson(FOCUS_URL));
}
