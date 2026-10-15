import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: '/comparador-renda-fixa/',
  plugins: [svelte()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
