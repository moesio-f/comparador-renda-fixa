<script lang="ts">
  import { assetLabel } from '../lib/labels';
  import { app } from '../lib/state/app.svelte';
  import { assetRow, netSeries } from '../lib/state/results';
  import AssetCard from '../lib/ui/AssetCard.svelte';
  import GrowthChart, { type Series } from '../lib/ui/GrowthChart.svelte';
  import ResultsTable from '../lib/ui/ResultsTable.svelte';

  const MAX_SERIES = 8;

  let expandedId = $state<string | null>(null);

  const rows = $derived(app.state.assets.map((a, i) => assetRow(app, a, i)));

  const series: Series[] = $derived(
    rows
      .filter((r) => r.outcome?.ok)
      .slice(0, MAX_SERIES)
      .map((r) => ({ label: assetLabel(r.asset), index: r.index, points: netSeries(app, r) })),
  );

  const chartable = $derived(rows.filter((r) => r.outcome?.ok).length);

  function add() {
    app.addAsset();
    expandedId = app.state.assets.at(-1)!.id;
  }
</script>

<div class="layout">
  <section class="assets" aria-labelledby="ativos-titulo">
    <header class="head">
      <h2 id="ativos-titulo">Ativos</h2>
      {#if rows.length > 0}
        <button class="btn primary" onclick={add}>Adicionar ativo</button>
      {/if}
    </header>

    {#if rows.length === 0}
      <div class="empty card">
        <p class="empty-title">Nenhum ativo na comparação</p>
        <p>Adicione os títulos que você está avaliando, com taxa, valor e vencimento. O resultado líquido aparece ao lado.</p>
        <button class="btn primary" onclick={add}>Adicionar ativo</button>
      </div>
    {:else}
      <div class="list">
        {#each rows as row (row.asset.id)}
          <AssetCard
            {row}
            expanded={expandedId === row.asset.id}
            ontoggle={() => (expandedId = expandedId === row.asset.id ? null : row.asset.id)}
          />
        {/each}
      </div>
    {/if}
  </section>

  {#if rows.length > 0}
    <section class="results" aria-labelledby="resultado-titulo">
      <header class="head">
        <h2 id="resultado-titulo">Resultado no vencimento</h2>
      </header>
      <ResultsTable {rows} />
      {#if series.length > 0}
        <GrowthChart {series} />
        {#if chartable > MAX_SERIES}
          <p class="note">O gráfico mostra os {MAX_SERIES} primeiros ativos. A tabela mostra todos.</p>
        {/if}
      {/if}
    </section>
  {/if}
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  @media (max-width: 960px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 36px;
  }

  .head h2 {
    font-size: 16px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .empty p {
    margin: 0;
    color: var(--text-2);
  }

  .empty .empty-title {
    color: var(--text);
    font-weight: 600;
  }

  .empty .btn {
    margin-top: 8px;
  }

  .note {
    margin: 0;
    font-size: 13px;
    color: var(--text-3);
  }
</style>
