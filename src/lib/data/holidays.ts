import { readCache, writeCache } from './cache';
import { fetchJson } from './fetch';

export function holidaysUrl(year: number): string {
  return `https://brasilapi.com.br/api/feriados/v1/${year}`;
}

/** National holiday dates (ISO) from a BrasilAPI response. */
export function parseHolidays(json: unknown): string[] {
  if (!Array.isArray(json)) throw new Error('Resposta de feriados inválida');
  return (json as { date: string; type: string }[]).filter((h) => h.type === 'national').map((h) => h.date);
}

/** Holidays for a year: from the cache when stored (national holidays rarely change), else from BrasilAPI. Null on failure. */
export async function loadHolidays(year: number): Promise<string[] | null> {
  const key = `holidays:${year}`;
  const cached = readCache<string[]>(key);
  if (cached) return cached.value;
  try {
    const dates = parseHolidays(await fetchJson(holidaysUrl(year)));
    writeCache(key, dates);
    return dates;
  } catch {
    return null;
  }
}
