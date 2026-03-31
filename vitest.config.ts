import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@napplet/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@napplet/acl': resolve(__dirname, 'packages/acl/src/index.ts'),
      '@napplet/runtime': resolve(__dirname, 'packages/runtime/src/index.ts'),
      '@napplet/shell': resolve(__dirname, 'packages/shell/src/index.ts'),
      '@napplet/shim': resolve(__dirname, 'packages/shim/src/index.ts'),
    },
  },
  test: {
    // Node mode for unit tests (no browser)
    environment: 'node',
    // Include test files from packages and tests directories
    include: [
      'packages/*/src/**/*.test.ts',
      'tests/unit/**/*.test.ts',
    ],
    // Exclude e2e tests (handled by Playwright)
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
    ],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['packages/*/src/**/*.test.ts', 'packages/*/dist/**'],
    },
  },
});
