<script lang="ts" module>
  export type Status = 'loading' | 'bcb' | 'focus' | 'cache' | 'manual' | 'unavailable';
</script>

<script lang="ts">
  import { formatDate } from '../format';
  import { href } from '../state/router.svelte';

  interface Props {
    status: Status;
    /** ISO reference date of the value. */
    date?: string;
    /** When a cached value was saved, in ms. */
    savedAt?: number;
    compact?: boolean;
  }

  let { status, date, savedAt, compact = false }: Props = $props();

  const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  const text = $derived.by(() => {
    switch (status) {
      case 'loading':
        return 'Carregando';
      case 'bcb':
        return date ? `Banco Central, ${formatDate(date)}` : 'Banco Central';
      case 'focus':
        return date ? `Focus, ${formatDate(date)}` : 'Focus';
      case 'cache':
        return savedAt ? `valor salvo em ${formatDate(isoOf(savedAt))}` : 'valor salvo';
      case 'manual':
        return 'manual';
      case 'unavailable':
        return 'indisponível';
    }
  });
</script>

<a class="tag {status}" href={href('como-calculamos', 'fontes')} title={text}>
  <span class="mark" aria-hidden="true"></span>
  <span class:sr-only={compact}>{text}</span>
</a>

<style>
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--text-3);
    text-decoration: none;
  }

  .tag:hover {
    color: var(--text);
  }

  .mark {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
    background: var(--accent);
  }

  .focus .mark {
    background: var(--accent);
  }

  .cache .mark {
    background: transparent;
    border: 1.5px solid var(--accent);
  }

  .manual .mark {
    border-radius: 2px;
    background: var(--warning);
  }

  .unavailable .mark {
    background: var(--error);
  }

  .loading .mark {
    background: var(--border-strong);
  }
</style>
