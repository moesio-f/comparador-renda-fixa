<script lang="ts">
  import { equivalentRate, type EquivalenceIndexer } from '../lib/engine/equivalence';
  import { irBracketLabel } from '../lib/engine/tax-rules';
  import { formatPercent, formatPoints } from '../lib/format';
  import { EQUIVALENCE_INDEXERS, durationLabel, rateUnit } from '../lib/labels';
  import { app } from '../lib/state/app.svelte';
  import { href } from '../lib/state/router.svelte';
  import MethodTag from '../lib/ui/MethodTag.svelte';
  import NumberInput from '../lib/ui/NumberInput.svelte';

  const input = $derived(app.state.equivalence);
  const toExempt = $derived(input.direction === 'taxed-to-exempt');

  const STANDARD_TERMS = [180, 360, 720, 1080];

  function show(indexer: EquivalenceIndexer, rate: number): string {
    if (indexer === 'CDI_PCT') return `${formatPercent(rate)} do CDI`;
    if (indexer === 'IPCA_PLUS') return `IPCA + ${formatPercent(rate)}`;
    return `${formatPercent(rate)} a.a.`;
  }

  const rateError = $derived(
    input.rate === null ? 'Informe a taxa' : input.rate <= -100 ? 'A taxa deve ser maior que -100%' : null,
  );
  const daysError = $derived(input.days === null || input.days <= 0 ? 'O prazo deve ser maior que zero' : null);
  const valid = $derived(!rateError && !daysError);

  function compute(days: number) {
    const term = app.termOfDays(days);
    return { days, term, outcome: equivalentRate(input.direction, input.indexer, input.rate! / 100, term, app.indicators) };
  }

  const main = $derived(valid ? compute(input.days!) : null);
  const table = $derived(
    valid ? [...new Set([...STANDARD_TERMS, input.days!])].sort((a, b) => a - b).map(compute) : [],
  );
</script>

<div class="page">
  <header class="intro">
    <h2>Taxa equivalente</h2>
    <p>
      Quanto uma LCI, LCA, CRI ou CRA precisa pagar para empatar com um CDB, uma LF ou o Tesouro, e o contrário.
      O resultado considera o IR da faixa do prazo.
    </p>
  </header>

  <div class="grid">
    <section class="card form" aria-label="Dados">
      <fieldset class="segmented">
        <legend class="field-label">Converter de</legend>
        <label class:active={toExempt}>
          <input type="radio" name="direcao" value="taxed-to-exempt" bind:group={input.direction} />
          Tributado para isento
        </label>
        <label class:active={!toExempt}>
          <input type="radio" name="direcao" value="exempt-to-taxed" bind:group={input.direction} />
          Isento para tributado
        </label>
      </fieldset>

      <label class="field">
        <span>Indexador</span>
        <select bind:value={input.indexer}>
          {#each EQUIVALENCE_INDEXERS as i (i.value)}<option value={i.value}>{i.label}</option>{/each}
        </select>
      </label>

      <label class="field">
        <span>Taxa do {toExempt ? 'tributado' : 'isento'}</span>
        <NumberInput
          value={input.rate}
          onvalue={(v) => (input.rate = v)}
          suffix={rateUnit(input.indexer)}
          invalid={!!rateError}
        />
        {#if rateError}<span class="error">{rateError}</span>{/if}
      </label>

      <label class="field">
        <span>Prazo em dias corridos</span>
        <NumberInput
          value={input.days}
          decimals={0}
          onvalue={(v) => (input.days = v === null ? null : Math.round(v))}
          suffix="dias"
          invalid={!!daysError}
        />
        {#if daysError}
          <span class="error">{daysError}</span>
        {:else}
          <span class="hint">{durationLabel(input.days!)}</span>
        {/if}
      </label>
    </section>

    <section class="card answer" aria-live="polite" aria-label="Resultado">
      {#if main?.outcome.ok}
        {@const e = main.outcome.value}
        <p class="section-label">{toExempt ? 'Isento equivalente' : 'Tributado equivalente'}</p>
        <p class="big num">{show(input.indexer, e.exact)}</p>
        <dl class="facts">
          <div>
            <dt><a href={href('como-calculamos', 'equivalencia')}>Pelo atalho</a></dt>
            <dd class="num">{show(input.indexer, e.shortcut)}</dd>
          </div>
          <div>
            <dt>Diferença</dt>
            <dd class="num">{formatPoints(Math.abs(e.exact - e.shortcut))}</dd>
          </div>
        </dl>
        <p class="bracket">
          <a href={href('como-calculamos', 'ir')}>{irBracketLabel(main.days)}</a>
          {#if e.iofRate > 0}
            <span class="warn">e IOF de {formatPercent(e.iofRate, 0)} do rendimento, por ser resgate antes de 30 dias</span>
          {/if}
        </p>
        <MethodTag method={main.term.method} />
      {:else if main && !main.outcome.ok}
        <p class="error">{main.outcome.error}</p>
      {:else}
        <p class="hint">Preencha a taxa e o prazo.</p>
      {/if}
    </section>
  </div>

  {#if table.length > 0 && table.every((r) => r.outcome.ok)}
    <section class="by-term" aria-labelledby="por-prazo">
      <h3 id="por-prazo" class="section-label">A mesma conversão em outros prazos</h3>
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th scope="col">Prazo</th>
              <th scope="col">IR</th>
              <th scope="col">Equivalente exato</th>
              <th scope="col">Atalho</th>
            </tr>
          </thead>
          <tbody>
            {#each table as row (row.days)}
              {#if row.outcome.ok}
                <tr class:current={row.days === input.days}>
                  <th scope="row">
                    {row.days} dias
                    {#if row.days >= 365}<span class="sub">{durationLabel(row.days)}</span>{/if}
                  </th>
                  <td>{formatPercent(row.outcome.value.irRate, 1)}</td>
                  <td class="strong">{show(input.indexer, row.outcome.value.exact)}</td>
                  <td>{show(input.indexer, row.outcome.value.shortcut)}</td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 880px;
  }

  .intro h2 {
    font-size: 20px;
  }

  .intro p {
    margin: 6px 0 0;
    color: var(--text-2);
    max-width: 64ch;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
  }

  @media (max-width: 720px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .form,
  .answer {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .segmented {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin: 0;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
  }

  .segmented legend {
    padding: 0;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-2);
    float: left;
    grid-column: 1 / -1;
  }

  .segmented label {
    padding: 6px 8px;
    border-radius: 6px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-2);
    cursor: pointer;
  }

  .segmented label.active {
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 0 0 1px var(--border);
  }

  .segmented label:focus-within {
    outline: 2px solid var(--accent);
  }

  .segmented input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .answer p {
    margin: 0;
  }

  .big {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--accent);
    line-height: 1.1;
  }

  .facts {
    display: flex;
    gap: 24px;
    margin: 0;
  }

  .facts dt {
    font-size: 12px;
    color: var(--text-3);
  }

  .facts dt a {
    color: inherit;
  }

  .facts dd {
    margin: 0;
    font-weight: 600;
  }

  .bracket {
    font-size: 14px;
    color: var(--text-2);
  }

  .bracket a {
    color: inherit;
  }

  .warn {
    display: block;
    color: var(--warning);
  }

  .hint {
    font-size: 13px;
    color: var(--text-3);
  }

  .by-term {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }

  th,
  td {
    padding: 10px 14px;
    text-align: right;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  thead th {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-3);
  }

  th:first-child {
    text-align: left;
  }

  tbody th {
    font-weight: 500;
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }

  tr.current > * {
    background: var(--accent-soft);
  }

  .sub {
    margin-left: 6px;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-3);
  }

  .strong {
    font-weight: 600;
  }
</style>
