<script lang="ts">
  import { formatPercent } from '../format';
  import { app } from '../state/app.svelte';
  import { market } from '../state/market.svelte';
  import NumberInput from './NumberInput.svelte';

  const overrides = $derived(app.state.overrides);

  function setRate(key: 'cdi' | 'selic', pct: number | null) {
    if (pct === null) delete app.state.overrides[key];
    else app.state.overrides[key] = pct / 100;
  }

  function setIpca(year: number, pct: number | null) {
    const byYear = { ...app.state.overrides.ipcaByYear };
    if (pct === null) delete byYear[year];
    else byYear[year] = pct / 100;
    app.state.overrides.ipcaByYear = byYear;
  }

  function restoreIpca(year: number) {
    setIpca(year, null);
  }

  const rows = $derived([
    { key: 'cdi' as const, label: 'CDI', hint: 'Usado em % do CDI e CDI +', fetched: market.cdi.value?.value ?? null },
    { key: 'selic' as const, label: 'Selic efetiva', hint: 'Usada em Selic +', fetched: market.selic.value?.value ?? null },
  ]);

  const years = $derived.by(() => {
    const all = new Set([
      ...Object.keys(market.focus.value?.byYear ?? {}),
      ...Object.keys(overrides.ipcaByYear ?? {}),
    ]);
    if (all.size === 0) {
      const y = Number(app.today.slice(0, 4));
      [y, y + 1, y + 2].forEach((v) => all.add(String(v)));
    }
    return [...all].map(Number).sort((a, b) => a - b);
  });
</script>

<section class="editor card" aria-label="Editar indicadores">
  <div class="group">
    <h2 class="section-label">Taxas usadas no cálculo (% a.a.)</h2>
    {#each rows as row (row.key)}
      {@const overridden = overrides[row.key] !== undefined}
      <div class="row">
        <label class="field">
          <span>{row.label}</span>
          <NumberInput
            value={(overrides[row.key] ?? row.fetched) === null ? null : (overrides[row.key] ?? row.fetched)! * 100}
            onvalue={(v) => setRate(row.key, v)}
            suffix="% a.a."
            invalid={overrides[row.key] === undefined && row.fetched === null}
          />
          {#if overrides[row.key] === undefined && row.fetched === null}
            <span class="error">Não foi possível buscar o {row.label}. Informe o valor.</span>
          {:else}
            <span class="hint">{row.hint}</span>
          {/if}
        </label>
        {#if overridden && row.fetched !== null}
          <button class="btn ghost" onclick={() => setRate(row.key, null)}>
            restaurar {formatPercent(row.fetched)}
          </button>
        {/if}
      </div>
    {/each}
  </div>

  <div class="group">
    <h2 class="section-label">Projeção de IPCA por ano (% a.a.)</h2>
    {#if market.focus.value === null && market.focus.source !== 'loading'}
      <p class="hint">O Focus não respondeu. Preencha a projeção para usar ativos IPCA +.</p>
    {/if}
    <div class="years">
      {#each years as year (year)}
        {@const fetched = market.focus.value?.byYear[year]}
        {@const manual = overrides.ipcaByYear?.[year]}
        <div class="year">
          <label class="field">
            <span>{year}</span>
            <NumberInput
              value={(manual ?? fetched) === undefined ? null : (manual ?? fetched)! * 100}
              onvalue={(v) => setIpca(year, v)}
              suffix="%"
            />
          </label>
          {#if manual !== undefined && fetched !== undefined}
            <button class="btn ghost small" onclick={() => restoreIpca(year)}>restaurar</button>
          {/if}
        </div>
      {/each}
    </div>
    <p class="hint">Anos depois do último repetem a última projeção.</p>
  </div>
</section>

<style>
  .editor {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 24px;
    padding: 16px;
    margin-top: 10px;
  }

  @media (max-width: 720px) {
    .editor {
      grid-template-columns: 1fr;
    }
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .row .field {
    flex: 1;
  }

  .row .btn {
    margin-top: 22px;
  }

  .years {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 10px;
  }

  .year {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .small {
    font-size: 12px;
    min-height: 26px;
    align-self: flex-start;
  }

  .hint {
    margin: 0;
    font-size: 12px;
    color: var(--text-3);
  }
</style>
