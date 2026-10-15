<script lang="ts">
  import { formatNumber, parseNumber } from '../format';

  interface Props {
    value: number | null | undefined;
    onvalue: (value: number | null) => void;
    id?: string;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    invalid?: boolean;
    describedby?: string;
    placeholder?: string;
  }

  let { value, onvalue, id, decimals = 2, prefix, suffix, invalid = false, describedby, placeholder }: Props = $props();

  const show = (v: number | null | undefined) => (v === null || v === undefined ? '' : formatNumber(v, decimals));

  let text = $state('');
  let focused = $state(false);

  // Reflect outside changes, but never rewrite what the user is typing.
  $effect(() => {
    const v = value;
    if (!focused) text = show(v);
  });
</script>

<div class="number-input" class:invalid>
  {#if prefix}<span class="affix">{prefix}</span>{/if}
  <input
    {id}
    type="text"
    inputmode="decimal"
    autocomplete="off"
    {placeholder}
    bind:value={text}
    aria-invalid={invalid}
    aria-describedby={describedby}
    onfocus={() => (focused = true)}
    oninput={() => onvalue(parseNumber(text))}
    onblur={() => {
      focused = false;
      text = show(value);
    }}
  />
  {#if suffix}<span class="affix">{suffix}</span>{/if}
</div>

<style>
  .number-input {
    display: flex;
    align-items: center;
    min-height: 38px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
  }

  .number-input:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .number-input.invalid {
    border-color: var(--error);
  }

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    padding: 7px 10px;
    font-variant-numeric: tabular-nums;
    outline: none;
  }

  .affix {
    padding: 0 10px;
    color: var(--text-3);
    font-size: 13px;
    white-space: nowrap;
  }

  .affix:first-child {
    padding-right: 0;
  }

  .affix:last-child {
    padding-left: 0;
  }
</style>
