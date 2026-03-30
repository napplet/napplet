import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '*.spec.ts',
  timeout: 30_000,
  use: {
    browserName: 'chromium',
    headless: true,
  },
  webServer: {
    command: 'npx vite --config tests/e2e/vite.config.ts --port 4173',
    port: 4173,
    reuseExistingServer: true,
  },
});
