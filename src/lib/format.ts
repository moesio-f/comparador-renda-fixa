const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 10000 → "R$ 10.000,00" */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** 0.1171 → "11,71%" */
export function formatPercent(fraction: number, decimals = 2): string {
  return `${formatNumber(fraction * 100, decimals)}%`;
}

/** 0.0078 → "0,78 p.p." */
export function formatPoints(fraction: number): string {
  return `${formatNumber(fraction * 100, 2)} p.p.`;
}

/** "2026-10-14" → "14/10/2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Parses numbers typed in Brazilian format or with a dot decimal.
 * "10.000,50" → 10000.5, "13,65" → 13.65, "13.65" → 13.65, "10.000" → 10000.
 */
export function parseNumber(text: string): number | null {
  let t = text.trim().replace(/\s|R\$|%/g, '');
  if (t === '') return null;
  if (t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, '');
  }
  if (!/^-?\d*\.?\d+$/.test(t)) return null;
  return Number(t);
}
