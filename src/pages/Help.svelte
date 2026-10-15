<script lang="ts">
  import { tick } from 'svelte';
  import { dailyRate, grossFactor } from '../lib/engine/accrual';
  import { equivalentRate } from '../lib/engine/equivalence';
  import { IOF_TABLE, IR_BRACKETS, TESOURO_CUSTODY_RATE, TESOURO_SELIC_CUSTODY_EXEMPTION } from '../lib/engine/tax-rules';
  import { formatCurrency, formatDate, formatNumber, formatPercent } from '../lib/format';
  import { FOCUS_URL, SGS, sgsUrl } from '../lib/data/bcb';
  import { app } from '../lib/state/app.svelte';
  import { market, type Fetched } from '../lib/state/market.svelte';
  import { router } from '../lib/state/router.svelte';

  $effect(() => {
    const section = router.params.get('secao');
    if (!section) return;
    tick().then(() => document.getElementById(section)?.scrollIntoView({ block: 'start' }));
  });

  const cdi = $derived(app.indicators.cdi);
  const example = $derived.by(() => {
    if (cdi === null) return null;
    const term = app.termOfDays(730);
    const eq = equivalentRate('taxed-to-exempt', 'CDI_PCT', 1, term, app.indicators);
    return {
      daily: dailyRate(cdi),
      factor110: grossFactor('CDI_PCT', 1.1, term, app.indicators),
      businessDays: term.businessDays,
      equivalent: eq.ok ? eq.value : null,
    };
  });

  function sourceText(f: Fetched<{ date: string }>, manual: boolean): string {
    if (manual) return 'Valor manual';
    switch (f.source) {
      case 'loading':
        return 'Carregando';
      case 'bcb':
        return f.value ? `Atualizado, referência ${formatDate(f.value.date)}` : 'Atualizado';
      case 'cache':
        return `Sem resposta. Usando valor salvo em ${formatDate(new Date(f.savedAt!).toISOString().slice(0, 10))}`;
      case 'unavailable':
        return 'Sem resposta e sem valor salvo';
    }
  }

  const sources = $derived([
    { name: 'CDI', series: `SGS ${SGS.cdi}`, url: sgsUrl(SGS.cdi), status: sourceText(market.cdi, app.state.overrides.cdi !== undefined) },
    { name: 'Selic efetiva', series: `SGS ${SGS.selic}`, url: sgsUrl(SGS.selic), status: sourceText(market.selic, app.state.overrides.selic !== undefined) },
    { name: 'Selic meta', series: `SGS ${SGS.selicTarget}`, url: sgsUrl(SGS.selicTarget), status: sourceText(market.selicTarget, false) },
    { name: 'IPCA 12 meses', series: `SGS ${SGS.ipca12m}`, url: sgsUrl(SGS.ipca12m), status: sourceText(market.ipca12m, false) },
    {
      name: 'Projeção de IPCA',
      series: 'Focus, mediana anual',
      url: FOCUS_URL,
      status: sourceText(market.focus, Object.keys(app.state.overrides.ipcaByYear ?? {}).length > 0),
    },
  ]);

  const failedYears = $derived([...market.holidayFailures].sort());
  const loadedYears = $derived(Object.keys(market.holidays).sort());
</script>

<article class="help">
  <header class="intro">
    <h2>Como calculamos</h2>
    <p>Cada número do app sai das fórmulas abaixo. Os exemplos usam o CDI em vigor na calculadora.</p>
    <nav aria-label="Seções">
      <a href="#/como-calculamos?secao=indexadores">Indexadores</a>
      <a href="#/como-calculamos?secao=ir">IR</a>
      <a href="#/como-calculamos?secao=iof">IOF</a>
      <a href="#/como-calculamos?secao=custodia">Custódia</a>
      <a href="#/como-calculamos?secao=equivalencia">Taxa equivalente</a>
      <a href="#/como-calculamos?secao=inflacao-implicita">Inflação implícita</a>
      <a href="#/como-calculamos?secao=grafico">Gráfico</a>
      <a href="#/como-calculamos?secao=dias-uteis">Dias úteis</a>
      <a href="#/como-calculamos?secao=fontes">Fontes</a>
    </nav>
  </header>

  <section id="indexadores" class="card">
    <h3>Indexadores</h3>
    <p>
      As taxas anuais viram diárias na base de 252 dias úteis. <code>du</code> é o número de dias úteis do prazo.
    </p>
    <dl>
      <dt>Prefixado</dt>
      <dd><code>fator = (1 + taxa)<sup>du/252</sup></code></dd>
      <dt>% do CDI</dt>
      <dd>
        <code>fator = [1 + p × ((1 + CDI)<sup>1/252</sup> − 1)]<sup>du</sup></code>
        {#if example && cdi !== null}
          <p class="example">
            Com CDI de {formatPercent(cdi)} a.a., o CDI diário é {formatPercent(example.daily, 4)}. Um título a 110% do
            CDI rende {formatPercent(example.daily * 1.1, 4)} por dia útil e, em {formatNumber(example.businessDays, 0)}
            dias úteis, acumula {formatPercent(example.factor110 - 1)}.
          </p>
        {/if}
      </dd>
      <dt>CDI + e Selic +</dt>
      <dd><code>fator = [(1 + CDI) × (1 + spread)]<sup>du/252</sup></code>, com a Selic efetiva no lugar do CDI.</dd>
      <dt>IPCA +</dt>
      <dd>
        <code>fator = Π (1 + IPCA<sub>ano</sub>)<sup>du<sub>ano</sub>/252</sup> × (1 + spread)<sup>du/252</sup></code>.
        Cada ano usa a projeção do Focus sobre os dias úteis que caem nele. Anos depois da última projeção repetem a
        última.
      </dd>
    </dl>
    <p class="caveat">
      Premissas: CDI e Selic ficam no valor atual durante todo o prazo. A projeção do ano corrente vale para o ano
      inteiro, e o app a aplica só aos dias úteis que faltam. O IPCA+ ignora a sazonalidade mensal e a defasagem do
      índice.
    </p>
  </section>

  <section id="ir" class="card">
    <h3>Imposto de Renda</h3>
    <p>
      Incide uma vez, no resgate, sobre o rendimento. A alíquota depende dos dias corridos desde a aplicação.
    </p>
    <table>
      <thead><tr><th scope="col">Prazo</th><th scope="col">Alíquota</th></tr></thead>
      <tbody>
        {#each IR_BRACKETS as b, i (b.upTo)}
          <tr>
            <td>
              {#if i === 0}Até {b.upTo} dias{:else if b.upTo === Infinity}Acima de {IR_BRACKETS[i - 1]!.upTo} dias{:else}De {IR_BRACKETS[i - 1]!.upTo + 1} a {b.upTo} dias{/if}
            </td>
            <td class="num">{formatPercent(b.rate, 1)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p>
      São isentos para pessoa física: LCI, LCA, LIG, CRI, CRA e debêntures incentivadas. CDB, LF, debêntures comuns e
      Tesouro Direto pagam IR.
    </p>
  </section>

  <section id="iof" class="card">
    <h3>IOF</h3>
    <p>
      Resgates de ativos tributados antes de 30 dias pagam IOF sobre o rendimento: {formatPercent(IOF_TABLE[0], 0)} no
      primeiro dia, caindo até {formatPercent(IOF_TABLE.at(-1)!, 0)} no 29º. O IR incide sobre o que sobra depois do
      IOF.
    </p>
  </section>

  <section id="custodia" class="card">
    <h3>Taxa de custódia do Tesouro Direto</h3>
    <p>
      A B3 cobra {formatPercent(TESOURO_CUSTODY_RATE)} ao ano sobre o saldo, proporcional aos dias. No Tesouro Selic, os
      primeiros {formatCurrency(TESOURO_SELIC_CUSTODY_EXEMPTION)} são isentos. O app calcula a taxa sobre o saldo médio
      entre a aplicação e o resgate, uma aproximação da cobrança diária. A taxa sai do valor líquido e não reduz a base
      do IR.
    </p>
  </section>

  <section id="equivalencia" class="card">
    <h3>Taxa equivalente</h3>
    <p>
      <strong>Exata.</strong> Calcula o rendimento do tributado no prazo, desconta o IR uma vez sobre o ganho acumulado
      e encontra a taxa do isento que chega ao mesmo valor. No sentido contrário, divide o ganho por
      <code>(1 − IR)</code>.
    </p>
    <p>
      <strong>Atalho.</strong> <code>taxa × (1 − IR)</code>, a conta que a maioria dos simuladores usa. Ela trata o
      imposto como se saísse a cada ano, e por isso erra mais quanto maior o prazo.
    </p>
    {#if example?.equivalent}
      <p class="example">
        Com CDI de {formatPercent(cdi!)} a.a., um CDB a 100% do CDI por 730 dias equivale a uma LCI a
        {formatPercent(example.equivalent.exact)} do CDI. O atalho diz {formatPercent(example.equivalent.shortcut)}.
      </p>
    {/if}
  </section>

  <section id="inflacao-implicita" class="card">
    <h3>Inflação implícita</h3>
    <p>
      <code>inflação implícita = (1 + prefixado) / (1 + taxa real) − 1</code>. Com o mesmo prazo, os dois títulos pagam
      a mesma alíquota de IR, então o imposto não muda o ponto de empate. A comparação com o Focus usa a média das
      projeções anuais no prazo, ponderada pelos dias úteis de cada ano.
    </p>
  </section>

  <section id="grafico" class="card">
    <h3>Gráfico do comparador</h3>
    <p>
      Cada ponto mostra quanto você receberia se resgatasse naquela data, com IR, IOF e custódia daquela data. Por isso
      as linhas dos tributados sobem em degraus quando mudam de faixa de IR. LCI, LCA e outros títulos com carência
      não permitem resgate antes do vencimento, e nesses casos a curva é só uma referência.
    </p>
  </section>

  <section id="dias-uteis" class="card">
    <h3>Dias úteis</h3>
    <p>
      <strong>Exatos.</strong> Conta os dias de segunda a sexta entre a aplicação (excluída) e o vencimento (incluído),
      tirando os feriados nacionais publicados pela BrasilAPI.
    </p>
    <p>
      <strong>Aproximados.</strong> Quando os feriados de algum ano do prazo não carregam, o app usa
      <code>dias corridos × 252 / 365</code> para o prazo inteiro e marca o resultado.
    </p>
    <p class="status">
      {#if failedYears.length > 0}
        Os feriados de {failedYears.join(', ')} não carregaram. Prazos que chegam a {failedYears.length === 1 ? 'esse ano' : 'esses anos'}
        usam a aproximação 252/365.
      {:else if loadedYears.length > 0}
        Feriados carregados para {loadedYears.join(', ')}. Todos os prazos em uso têm contagem exata.
      {:else}
        Carregando feriados.
      {/if}
    </p>
  </section>

  <section id="fontes" class="card">
    <h3>Fontes</h3>
    <p>
      Os dados vêm direto do Banco Central, sem servidor intermediário, e ficam salvos no navegador por 12 horas.
      Qualquer valor pode ser trocado em “Editar valores”.
    </p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th scope="col">Indicador</th><th scope="col">Série</th><th scope="col">Situação</th></tr>
        </thead>
        <tbody>
          {#each sources as s (s.name)}
            <tr>
              <td>{s.name}</td>
              <td><a href={s.url} target="_blank" rel="noreferrer">{s.series}</a></td>
              <td>{s.status}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      Feriados: <a href="https://brasilapi.com.br/docs#tag/Feriados-Nacionais" target="_blank" rel="noreferrer">BrasilAPI</a>.
      Os preços do Tesouro Direto não têm API pública, então as taxas dos títulos são digitadas por você.
    </p>
  </section>
</article>

<style>
  .help {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 760px;
  }

  .intro h2 {
    font-size: 20px;
  }

  .intro p {
    margin: 6px 0 12px;
    color: var(--text-2);
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    font-size: 14px;
  }

  section {
    padding: 18px 20px;
    scroll-margin-top: 16px;
  }

  h3 {
    font-size: 16px;
    margin-bottom: 8px;
  }

  p {
    margin: 0 0 10px;
    color: var(--text-2);
  }

  p:last-child {
    margin-bottom: 0;
  }

  dl {
    margin: 0 0 10px;
  }

  dt {
    font-weight: 600;
    margin-top: 10px;
  }

  dd {
    margin: 4px 0 0;
    color: var(--text-2);
  }

  code {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 13px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--surface-2);
    color: var(--text);
  }

  .example {
    margin-top: 8px;
    padding: 10px 12px;
    border-left: 3px solid var(--accent);
    background: var(--accent-soft);
    border-radius: 0 6px 6px 0;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .caveat,
  .status {
    font-size: 13px;
    color: var(--text-3);
  }

  .table-wrap {
    overflow-x: auto;
    margin-bottom: 10px;
  }

  table {
    border-collapse: collapse;
    font-size: 14px;
    margin-bottom: 10px;
    width: 100%;
  }

  th,
  td {
    padding: 8px 12px 8px 0;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  thead th {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-3);
  }
</style>
