/**
 * TEST-06: Shell test harness smoke test.
 *
 * Verifies that the test harness boots correctly:
 * - Shell initializes with mock hooks
 * - __SHELL_READY__ flag is set
 * - __loadNapplet__ function is exposed
 * - __TEST_MESSAGES__ array is accessible
 */
import { test, expect } from '@playwright/test';

test.describe('TEST-06: Shell test harness', () => {
  test('shell boots and sets __SHELL_READY__ flag', async ({ page }) => {
    await page.goto('/');

    // Wait for shell to initialize
    await page.waitForFunction(
      () => (window as any).__SHELL_READY__ === true,
      { timeout: 10000 }
    );

    const ready = await page.evaluate(() => (window as any).__SHELL_READY__);
    expect(ready).toBe(true);
  });

  test('exposes __loadNapplet__ function', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__);

    const hasLoadNapplet = await page.evaluate(
      () => typeof (window as any).__loadNapplet__ === 'function'
    );
    expect(hasLoadNapplet).toBe(true);
  });

  test('exposes __TEST_MESSAGES__ array', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__);

    const messages = await page.evaluate(
      () => (window as any).__TEST_MESSAGES__
    );
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(0); // No messages yet
  });

  test('exposes __clearMessages__ function', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__);

    const hasClearMessages = await page.evaluate(
      () => typeof (window as any).__clearMessages__ === 'function'
    );
    expect(hasClearMessages).toBe(true);
  });
});
