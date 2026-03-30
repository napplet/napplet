import { test, expect } from '@playwright/test';

test('AUTH handshake completes between shell and napplet', async ({ page }) => {
  // Capture console errors
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://localhost:4173/shell-host.html');

  // Wait for AUTH to complete (poll window.__TEST__.authCompleted getter)
  await expect(async () => {
    const result = await page.evaluate(() => (window as any).__TEST__.authCompleted);
    expect(result).toBe(true);
  }).toPass({ timeout: 10_000 });

  // Check no test errors
  const testErrors = await page.evaluate(() => (window as any).__TEST__.errors);
  expect(testErrors).toEqual([]);

  // Check no critical console errors (allow for expected warnings)
  const criticalErrors = consoleErrors.filter(e =>
    !e.includes('Autofocus') &&
    !e.includes('favicon') &&
    !e.includes('the server responded with a status of 404') &&
    !e.includes('Failed to load resource')
  );
  expect(criticalErrors).toEqual([]);
});
