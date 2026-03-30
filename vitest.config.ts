import { defineConfig } from 'vitest/config';

export default defineConfig({
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
