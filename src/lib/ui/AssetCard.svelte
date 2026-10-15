<script lang="ts">
  import { addDays } from '../data/business-days';
  import { taxRegime } from '../engine/tax-rules';
  import { formatCurrency, formatDate } from '../format';
  import { ASSET_TYPES, INDEXERS, assetLabel, durationLabel, rateUnit } from '../labels';
  import { app } from '../state/app.svelte';
  import type { AssetRow } from '../state/results';
  import NumberInput from './NumberInput.svelte';

  interface Props {
    row: AssetRow;
    expanded: boolean;
    ontoggle: () => void;
  }

  let { row, expanded, ontoggle }: Props = $props();

  const asset = $derived(row.asset);
  const id = $derived(`ativo-${asset.id}`);
  const exempt = $derived(taxRegime(asset.type, asset.incentivized) === 'exempt');
</script>

<article class="asset card" class:expanded style:--series={`var(--series-${(row.index % 8) + 1})`}>
  <button class="summary" aria-expanded={expanded} aria-controls={id} onclick={ontoggle}>
    <span class="swatch" aria-hidden="true"></span>
    <span class="main">
      <span class="name">{assetLabel(asset)}</span>
      <span class="meta num">
        {asset.amount === null ? 'Valor não informado' : formatCurrency(asset.amount)}
        · {row.days > 0 ? `${durationLabel(row.days)}, vence em ${formatDate(asset.maturity)}` : 'prazo inválido'}
      </span>
    </span>
    <span class="badge" class:exempt>{exempt ? 'Isento' : 'Tributado'}</span>
  </button>

  {#if expanded}
    <div class="form" {id}>
      <label class="field">
        <span>Tipo</span>
        <select bind:value={asset.type}>
          {#each ASSET_TYPES as t (t.value)}<option value={t.value}>{t.label}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Indexador</span>
        <select bind:value={asset.indexer}>
          {#each INDEXERS as i (i.value)}<option value={i.value}>{i.label}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Taxa</span>
        <NumberInput
          value={asset.rate}
          onvalue={(v) => (asset.rate = v)}
          suffix={rateUnit(asset.indexer)}
          invalid={!!row.errors.rate}
          describedby={row.errors.rate ? `${id}-taxa` : undefined}
        />
        {#if row.errors.rate}<span class="error" id={`${id}-taxa`}>{row.errors.rate}</span>{/if}
      </label>
      <label class="field">
        <span>Valor investido</span>
        <NumberInput
          value={asset.amount}
          onvalue={(v) => (asset.amount = v)}
          prefix="R$"
          invalid={!!row.errors.amount}
          describedby={row.errors.amount ? `${id}-valor` : undefined}
        />
        {#if row.errors.amount}<span class="error" id={`${id}-valor`}>{row.errors.amount}</span>{/if}
      </label>
      <label class="field">
        <span>Vencimento</span>
        <input
          type="date"
          value={asset.maturity}
          onchange={(e) => {
            const v = e.currentTarget.value;
            if (v) asset.maturity = v;
          }}
        />
      </label>
      <label class="field">
        <span>Prazo em dias corridos</span>
        <NumberInput
          value={row.days}
          decimals={0}
          onvalue={(v) => {
            if (v !== null) asset.maturity = addDays(app.today, Math.round(v));
          }}
          suffix="dias"
          invalid={!!row.errors.calendarDays}
          describedby={row.errors.calendarDays ? `${id}-prazo` : `${id}-duracao`}
        />
        {#if row.errors.calendarDays}
          <span class="error" id={`${id}-prazo`}>{row.errors.calendarDays}</span>
        {:else}
          <span class="hint" id={`${id}-duracao`}>{durationLabel(row.days)}</span>
        {/if}
      </label>
      <label class="field wide">
        <span>Nome (opcional)</span>
        <input type="text" bind:value={asset.name} placeholder={assetLabel({ ...asset, name: '' })} />
      </label>
      {#if asset.type === 'DEB'}
        <label class="check wide">
          <input type="checkbox" bind:checked={asset.incentivized} />
          Debênture incentivada (isenta de IR)
        </label>
      {/if}
      <div class="actions wide">
        <button class="btn ghost" onclick={() => app.duplicateAsset(asset.id)}>Duplicar</button>
        <button class="btn ghost danger" onclick={() => app.removeAsset(asset.id)}>Remover</button>
      </div>
    </div>
  {/if}
</article>

<style>
  .asset {
    overflow: hidden;
  }

  .summary {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .summary:hover {
    background: var(--surface-2);
  }

  .swatch {
    width: 4px;
    align-self: stretch;
    border-radius: 2px;
    background: var(--series);
    flex: none;
  }

  .main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    font-size: 13px;
    color: var(--text-3);
  }

  .badge {
    flex: none;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    color: var(--text-2);
    background: var(--surface-2);
  }

  .badge.exempt {
    color: var(--accent);
    background: var(--accent-soft);
  }

  .form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 4px 14px 14px;
    border-top: 1px solid var(--border);
    padding-top: 14px;
  }

  .wide {
    grid-column: 1 / -1;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
  }

  .danger:hover {
    color: var(--error);
  }

  @media (max-width: 420px) {
    .form {
      grid-template-columns: 1fr;
    }
  }
</style>
