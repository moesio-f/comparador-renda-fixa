<script lang="ts">
  import type { AssetResult } from '../engine/result';
  import { formatCurrency, formatPercent } from '../format';
  import { assetLabel } from '../labels';
  import { href } from '../state/router.svelte';
  import type { AssetRow } from '../state/results';
  import MethodTag from './MethodTag.svelte';

  let { rows }: { rows: AssetRow[] } = $props();

  type SortKey = 'net' | 'netGain' | 'ir' | 'iof' | 'custody' | 'netAnnualRate' | 'netCdiShare';

  const allColumns: { key: SortKey; label: string }[] = [
    { key: 'netAnnualRate', label: 'Líquido a.a.' },
    { key: 'netCdiShare', label: '% do CDI' },
    { key: 'net', label: 'Valor líquido' },
    { key: 'netGain', label: 'Rendimento' },
    { key: 'ir', label: 'IR' },
    { key: 'iof', label: 'IOF' },
    { key: 'custody', label: 'Custódia' },
  ];

  const pays = (key: 'iof' | 'custody') => rows.some((r) => r.outcome?.ok && r.outcome.value[key] > 0);
  const showIof = $derived(pays('iof'));
  const showCustody = $derived(pays('custody'));
  const columns = $derived(
    allColumns.filter((c) => (c.key !== 'iof' || showIof) && (c.key !== 'custody' || showCustody)),
  );
  const hiddenNote = $derived(
    !showIof && !showCustody
      ? 'Nenhum ativo paga IOF ou taxa de custódia.'
      : !showIof
        ? 'Nenhum ativo paga IOF.'
        : !showCustody
          ? 'Nenhum ativo paga taxa de custódia.'
          : null,
  );

  let sortKey = $state<SortKey | null>(null);
  let descending = $state(true);

  function sortValue(row: AssetRow, key: SortKey): number {
    if (!row.outcome?.ok) return -Infinity;
    return (row.outcome.value[key] as number | null) ?? -Infinity;
  }

  function sortBy(key: SortKey) {
    if (sortKey === key) descending = !descending;
    else {
      sortKey = key;
      descending = true;
    }
  }

  const sorted = $derived.by(() => {
    if (!sortKey) return rows;
    const key = sortKey;
    const dir = descending ? -1 : 1;
    return [...rows].sort((a, b) => dir * (sortValue(a, key) - sortValue(b, key)));
  });

  const best = $derived.by(() => {
    let top: AssetRow | null = null;
    for (const r of rows) {
      if (r.outcome?.ok && (!top || r.outcome.value.netAnnualRate > (top.outcome as { value: AssetResult }).value.netAnnualRate)) top = r;
    }
    return rows.filter((r) => r.outcome?.ok).length > 1 ? top : null;
  });

  function money(v: number) {
    return v === 0 ? 'R$ 0,00' : formatCurrency(v);
  }
</script>

<div class="wrap">
  <table>
    <thead>
      <tr>
        <th scope="col" class="asset-col">Ativo</th>
        {#each columns as col (col.key)}
          <th scope="col" aria-sort={sortKey === col.key ? (descending ? 'descending' : 'ascending') : 'none'}>
            <button class="sort" onclick={() => sortBy(col.key)}>
              {col.label}
              <span class="arrow" aria-hidden="true">{sortKey === col.key ? (descending ? '↓' : '↑') : ''}</span>
            </button>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each sorted as row (row.asset.id)}
        <tr class:best={row === best} style:--series={`var(--series-${(row.index % 8) + 1})`}>
          <th scope="row" class="asset-col">
            <div class="cell">
              <span class="name"><span class="swatch" aria-hidden="true"></span>{assetLabel(row.asset)}</span>
              {#if row === best}<span class="best-tag">Maior rendimento líquido</span>{/if}
              {#if row.term}<MethodTag method={row.term.method} />{/if}
            </div>
          </th>
          {#if row.outcome?.ok}
            {@const r = row.outcome.value}
            <td class="strong">{formatPercent(r.netAnnualRate)}</td>
            <td>{r.netCdiShare === null ? 'n/d' : formatPercent(r.netCdiShare)}</td>
            <td>{formatCurrency(r.net)}</td>
            <td>{formatCurrency(r.netGain)}</td>
            <td>
              <a class="quiet" href={href('como-calculamos', 'ir')}>{money(r.ir)}</a>
              {#if r.irRate > 0}<span class="sub">{formatPercent(r.irRate, 1)}</span>{/if}
            </td>
            {#if showIof}<td>{money(r.iof)}</td>{/if}
            {#if showCustody}<td>{money(r.custody)}</td>{/if}
          {:else}
            <td colspan={columns.length} class="problem">
              {row.outcome ? row.outcome.error : 'Corrija os campos do ativo para calcular'}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
{#if hiddenNote}<p class="note">{hiddenNote}</p>{/if}

<style>
  .wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }

  th,
  td {
    padding: 10px;
    text-align: right;
    white-space: nowrap;
    border-bottom: 1px solid var(--border);
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }

  thead th {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-3);
    padding: 0;
  }

  thead th.asset-col {
    padding: 10px 12px;
  }

  .sort {
    width: 100%;
    padding: 10px 12px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: right;
    cursor: pointer;
  }

  .sort:hover {
    color: var(--text);
  }

  .arrow {
    display: inline-block;
    width: 0.8em;
  }

  .asset-col {
    text-align: left;
    position: sticky;
    left: 0;
    background: var(--surface);
  }

  .cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font-weight: 500;
  }

  .name {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: var(--series);
  }

  tr.best td,
  tr.best .asset-col {
    background: var(--accent-soft);
  }

  .cell :global(.method) {
    white-space: normal;
    max-width: 180px;
  }

  .note {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--text-3);
  }

  .best-tag {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
  }

  .strong {
    font-weight: 600;
  }

  .sub {
    display: block;
    font-size: 12px;
    color: var(--text-3);
  }

  .quiet {
    color: inherit;
    text-decoration: none;
  }

  .quiet:hover {
    text-decoration: underline;
  }

  .problem {
    text-align: left;
    color: var(--error);
  }
</style>
