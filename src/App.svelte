<script lang="ts">
  import { untrack } from 'svelte';
  import { app } from './lib/state/app.svelte';
  import { market } from './lib/state/market.svelte';
  import { href, router, type Route } from './lib/state/router.svelte';
  import IndicatorBar from './lib/ui/IndicatorBar.svelte';
  import Breakeven from './pages/Breakeven.svelte';
  import Comparator from './pages/Comparator.svelte';
  import Equivalence from './pages/Equivalence.svelte';
  import Help from './pages/Help.svelte';

  app.init();
  market.load();

  // A link pasted into a tab already on the app only changes the hash, so read it again.
  $effect(() => {
    if (router.params.has('s')) untrack(() => app.init());
  });

  // Save on every change.
  $effect(() => {
    JSON.stringify(app.state);
    app.save();
  });

  // Fetch holidays for every year the inputs reach.
  $effect(() => {
    market.ensureHolidays(app.yearsInUse());
  });

  const NAV: { route: Route; label: string }[] = [
    { route: 'comparador', label: 'Comparador' },
    { route: 'taxa-equivalente', label: 'Taxa equivalente' },
    { route: 'inflacao-implicita', label: 'Inflação implícita' },
    { route: 'como-calculamos', label: 'Como calculamos' },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(app.shareUrl());
      app.notify('Link copiado');
    } catch {
      app.notify('Não foi possível copiar o link');
    }
  }
</script>

<header class="top">
  <div class="inner">
    <a class="brand" href={href('comparador')}>
      <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <path d="M8 22l6-6 4 4 6-8" stroke="var(--accent-text)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Renda Fixa
    </a>
    <nav aria-label="Calculadoras">
      {#each NAV as item (item.route)}
        <a href={href(item.route)} aria-current={router.route === item.route ? 'page' : undefined}>{item.label}</a>
      {/each}
    </nav>
    <button class="btn" onclick={copyLink}>Copiar link</button>
  </div>
</header>

<main class="inner">
  {#if app.pendingLink}
    <div class="prompt card" role="alertdialog" aria-labelledby="prompt-text">
      <p id="prompt-text">Você abriu um link com outra comparação. Substituir sua comparação salva por esta?</p>
      <div class="prompt-actions">
        <button class="btn primary" onclick={() => app.resolveLink(true)}>Substituir</button>
        <button class="btn" onclick={() => app.resolveLink(false)}>Manter a minha</button>
      </div>
    </div>
  {/if}

  <IndicatorBar />

  <div class="page">
    {#if router.route === 'comparador'}
      <Comparator />
    {:else if router.route === 'taxa-equivalente'}
      <Equivalence />
    {:else if router.route === 'inflacao-implicita'}
      <Breakeven />
    {:else}
      <Help />
    {/if}
  </div>
</main>

<footer class="inner foot">
  Simulação para estudo, sem recomendação de investimento. Dados do Banco Central e da BrasilAPI.
  <a href={href('como-calculamos')}>Como calculamos</a>
</footer>

{#if app.toast}
  <div class="toast" role="status">{app.toast}</div>
{/if}

<style>
  .inner {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .top {
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .top .inner {
    display: flex;
    align-items: center;
    gap: 24px;
    min-height: 60px;
    flex-wrap: wrap;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
  }

  nav {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    flex: 1;
  }

  nav a {
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    color: var(--text-2);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
  }

  nav a:hover {
    color: var(--text);
    background: var(--surface-2);
  }

  nav a[aria-current='page'] {
    color: var(--text);
    background: var(--surface-2);
  }

  main.inner {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 20px;
    padding-bottom: 40px;
  }

  .prompt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 12px 16px;
    border-color: var(--accent);
  }

  .prompt p {
    margin: 0;
  }

  .prompt-actions {
    display: flex;
    gap: 8px;
  }

  .foot {
    padding-bottom: 32px;
    font-size: 13px;
    color: var(--text-3);
  }

  .toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    padding: 10px 16px;
    border-radius: var(--radius-sm);
    background: var(--text);
    color: var(--bg);
    font-size: 14px;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .top .inner {
      gap: 8px 12px;
    }

    nav {
      order: 3;
      flex-basis: 100%;
    }
  }
</style>
