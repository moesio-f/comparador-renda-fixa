<script lang="ts">
  import { averageIpca, breakevenInflation } from '../lib/engine/breakeven';
  import { formatPercent } from '../lib/format';
  import { durationLabel } from '../lib/labels';
  import { app } from '../lib/state/app.svelte';
  import { href } from '../lib/state/router.svelte';
  import NumberInput from '../lib/ui/NumberInput.svelte';

  const input = $derived(app.state.breakeven);

  const errors = $derived({
    fixedRate: input.fixedRate === null ? 'Informe a taxa' : input.fixedRate <= -100 ? 'A taxa deve ser maior que -100%' : null,
    ipcaSpread: input.ipcaSpread === null ? 'Informe a taxa' : input.ipcaSpread <= -100 ? 'A taxa deve ser maior que -100%' : null,
    days: input.days === null || input.days <= 0 ? 'O prazo deve ser maior que zero' : null,
  });

  const breakeven = $derived(
    errors.fixedRate || errors.ipcaSpread ? null : breakevenInflation(input.fixedRate! / 100, input.ipcaSpread! / 100),
  );
  const focus = $derived(errors.days ? null : averageIpca(app.termOfDays(input.days!), app.indicators.ipcaByYear));
</script>

<div class="page">
  <header class="intro">
    <h2>Inflação implícita</h2>
    <p>
      A inflação que deixa um prefixado e um IPCA+ de mesmo prazo empatados. Se o IPCA ficar abaixo dela, o prefixado
      rende mais. Acima, o IPCA+ rende mais.
    </p>
  </header>

  <div class="grid">
    <section class="card form" aria-label="Dados">
      <label class="field">
        <span>Taxa do prefixado</span>
        <NumberInput
          value={input.fixedRate}
          onvalue={(v) => (input.fixedRate = v)}
          suffix="% a.a."
          invalid={!!errors.fixedRate}
        />
        {#if errors.fixedRate}<span class="error">{errors.fixedRate}</span>{/if}
      </label>
      <label class="field">
        <span>Taxa real do IPCA+</span>
        <NumberInput
          value={input.ipcaSpread}
          onvalue={(v) => (input.ipcaSpread = v)}
          prefix="IPCA +"
          suffix="% a.a."
          invalid={!!errors.ipcaSpread}
        />
        {#if errors.ipcaSpread}<span class="error">{errors.ipcaSpread}</span>{/if}
      </label>
      <label class="field">
        <span>Prazo em dias corridos</span>
        <NumberInput
          value={input.days}
          decimals={0}
          onvalue={(v) => (input.days = v === null ? null : Math.round(v))}
          suffix="dias"
          invalid={!!errors.days}
        />
        {#if errors.days}
          <span class="error">{errors.days}</span>
        {:else}
          <span class="hint">{durationLabel(input.days!)}. O prazo só afeta a comparação com o Focus.</span>
        {/if}
      </label>
    </section>

    <section class="card answer" aria-live="polite" aria-label="Resultado">
      {#if breakeven !== null}
        <p class="section-label">Inflação implícita</p>
        <p class="big num">{formatPercent(breakeven)} a.a.</p>
        <ul class="rules">
          <li>Pré vence se o IPCA ficar abaixo de {formatPercent(breakeven)}</li>
          <li>IPCA+ vence se o IPCA ficar acima de {formatPercent(breakeven)}</li>
        </ul>
        <p class="note">
          Os dois títulos têm o mesmo prazo e pagam a mesma alíquota de IR, então o imposto não muda o ponto de
          empate.
        </p>

        <div class="focus">
          {#if focus === null}
            <p class="hint">
              Informe a projeção de IPCA para comparar.
              <a href={href('como-calculamos', 'fontes')}>De onde vem a projeção</a>
            </p>
          {:else}
            <p>
              Projeção média do Focus no prazo: <strong class="num">{formatPercent(focus)} a.a.</strong>
            </p>
            <p class="verdict">
              {#if Math.abs(focus - breakeven) < 0.00005}
                Pelo Focus, os dois empatam.
              {:else if focus < breakeven}
                Pelo Focus, o prefixado rende mais.
              {:else}
                Pelo Focus, o IPCA+ rende mais.
              {/if}
            </p>
          {/if}
        </div>
      {:else}
        <p class="hint">Preencha as duas taxas.</p>
      {/if}
    </section>
  </div>
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

  .rules {
    margin: 0;
    padding-left: 18px;
    color: var(--text-2);
    font-size: 14px;
  }

  .note,
  .hint {
    font-size: 13px;
    color: var(--text-3);
  }

  .focus {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    font-size: 14px;
  }

  .verdict {
    font-weight: 600;
  }
</style>
