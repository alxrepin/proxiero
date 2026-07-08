import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [svelte(), WxtVitest()],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    include: ['**/*.{test,spec}.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    coverage: {
      provider: 'v8',
      include: ['utils/**', 'stores/**', 'entrypoints/background/**'],
      exclude: ['**/*.svelte', 'entrypoints/background/index.ts', 'utils/links.ts'],
    },
  },
});
