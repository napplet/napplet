import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@napplet/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@napplet/shim': resolve(__dirname, 'packages/shim/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'packages/*/src/**/*.test.ts',
    ],
    exclude: [
      'node_modules/**',
    ],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['packages/*/src/**/*.test.ts', 'packages/*/dist/**'],
    },
  },
});
