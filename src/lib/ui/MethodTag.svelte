<script lang="ts">
  import type { DayCountMethod } from '../engine/types';
  import { href } from '../state/router.svelte';

  let { method }: { method: DayCountMethod } = $props();
</script>

<a class="method {method}" href={href('como-calculamos', 'dias-uteis')}>
  {method === 'exact' ? 'Dias úteis exatos (feriados nacionais)' : 'Dias úteis aproximados (252/365)'}
</a>

<style>
  .method {
    font-size: 12px;
    color: var(--text-3);
    text-decoration: none;
    white-space: nowrap;
  }

  .method:hover {
    color: var(--text);
    text-decoration: underline;
  }

  .approximate {
    color: var(--warning);
  }
</style>
