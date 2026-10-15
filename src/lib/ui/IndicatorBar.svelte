<script lang="ts">
  import { formatPercent } from '../format';
  import { app } from '../state/app.svelte';
  import { market, type Fetched } from '../state/market.svelte';
  import { href } from '../state/router.svelte';
  import type { Reading } from '../data/bcb';
  import IndicatorEditor from './IndicatorEditor.svelte';
  import SourceTag, { type Status } from './SourceTag.svelte';

  let editing = $state(false);

  const overrides = $derived(app.state.overrides);

  function statusOf(f: Fetched<unknown>, overridden: boolean): Status {
    return overridden ? 'manual' : f.source;
  }

  interface Chip {
    label: string;
    value: number | null;
    fetched: Fetched<Reading>;
    status: Status;
  }

  const chips: Chip[] = $derived([
    { label: 'CDI', value: app.indicators.cdi, fetched: market.cdi, status: statusOf(market.cdi, overrides.cdi !== undefined) },
    {
      label: 'Selic',
      value: app.indicators.selic,
      fetched: market.selic,
      status: statusOf(market.selic, overrides.selic !== undefined),
    },
    { label: 'Selic meta', value: market.selicTarget.value?.value ?? null, fetched: market.selicTarget, status: market.selicTarget.source },
    { label: 'IPCA 12m', value: market.ipca12m.value?.value ?? null, fetched: market.ipca12m, status: market.ipca12m.source },
  ]);

  const focusYears = $derived(
    Object.entries(app.indicators.ipcaByYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .slice(0, 2),
  );
  const focusStatus: Status = $derived(
    overrides.ipcaByYear && Object.keys(overrides.ipcaByYear).length > 0
      ? 'manual'
      : market.focus.source === 'bcb'
        ? 'focus'
        : market.focus.source,
  );
  const calendarExact = $derived(market.holidayFailures.length === 0);
</script>

<section class="bar" aria-label="Indicadores">
  <div class="chips">
    {#each chips as chip (chip.label)}
      <div class="chip">
        <span class="label">{chip.label}</span>
        <span class="value num">{chip.value === null ? 'n/d' : formatPercent(chip.value)}</span>
        <SourceTag
          status={chip.status}
          date={chip.fetched.value?.date}
          savedAt={chip.fetched.savedAt}
          compact
        />
      </div>
    {/each}
    <div class="chip">
      <span class="label">IPCA proj.</span>
      <span class="value num">
        {#if focusYears.length === 0}n/d{:else}{focusYears.map(([y, v]) => `${y}: ${formatPercent(v)}`).join(' · ')}{/if}
      </span>
      <SourceTag status={focusStatus} date={market.focus.value?.date} savedAt={market.focus.savedAt} compact />
    </div>
    <a class="chip calendar" href={href('como-calculamos', 'dias-uteis')}>
      <span class="label">Dias úteis</span>
      <span class="value">{calendarExact ? 'exatos' : 'aproximados em parte'}</span>
    </a>
  </div>
  <button class="btn ghost" aria-expanded={editing} onclick={() => (editing = !editing)}>
    {editing ? 'Fechar' : 'Editar valores'}
  </button>
</section>

{#if editing}
  <IndicatorEditor />
{/if}

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface);
    font-size: 13px;
    color: inherit;
    text-decoration: none;
  }

  .label {
    color: var(--text-3);
  }

  .value {
    font-weight: 600;
  }

  .calendar .value {
    font-weight: 500;
  }
</style>
