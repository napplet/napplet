/**
 * TEST-06: AUTH handshake integration test.
 *
 * Proves the full test infrastructure works end-to-end:
 * 1. Harness boots with mock hooks
 * 2. auth-napplet loads in sandboxed iframe
 * 3. AUTH challenge is sent by shell
 * 4. auth-napplet responds with signed AUTH event
 * 5. Shell verifies signature and accepts
 * 6. Message tap captures the entire flow
 *
 * This test validates TEST-06 (shell test harness) and implicitly validates
 * TEST-03 (mock hooks), TEST-04 (message tap), and TEST-05 (test napplets).
 */
import { test, expect } from '@playwright/test';

// Helper type matching TappedMessage from message-tap.ts
interface TappedMessage {
  index: number;
  timestamp: number;
  direction: 'napplet->shell' | 'shell->napplet';
  verb: string;
  raw: unknown[];
  parsed: {
    subId?: string;
    eventKind?: number;
    eventId?: string;
    topic?: string;
    success?: boolean;
    reason?: string;
    pubkey?: string;
  };
}

test.describe('TEST-06: AUTH handshake via test harness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => (window as any).__SHELL_READY__ === true,
      { timeout: 10000 }
    );
  });

  test('auth-napplet completes AUTH handshake', async ({ page }) => {
    // Load the auth-napplet
    const windowId = await page.evaluate(
      () => (window as any).__loadNapplet__('auth-napplet')
    );
    expect(windowId).toBeTruthy();

    // Wait for AUTH to complete (look for OK message with success=true)
    await expect.poll(async () => {
      const messages: TappedMessage[] = await page.evaluate(
        () => (window as any).__TEST_MESSAGES__
      );
      return messages.some(
        m => m.verb === 'OK' && m.parsed.success === true
      );
    }, {
      message: 'Expected OK with success=true in __TEST_MESSAGES__',
      timeout: 15000,
    }).toBe(true);

    // Verify the message sequence: AUTH challenge -> AUTH response -> OK
    const messages: TappedMessage[] = await page.evaluate(
      () => (window as any).__TEST_MESSAGES__
    );

    // Find AUTH challenge (shell->napplet)
    const challenge = messages.find(
      m => m.verb === 'AUTH' && m.direction === 'shell->napplet'
    );
    expect(challenge).toBeTruthy();
    expect(typeof challenge!.raw[1]).toBe('string'); // challenge is a string

    // Find AUTH response (napplet->shell)
    const response = messages.find(
      m => m.verb === 'AUTH' && m.direction === 'napplet->shell'
    );
    expect(response).toBeTruthy();
    expect(response!.parsed.eventKind).toBe(22242); // NIP-42 AUTH kind

    // Find OK (shell->napplet)
    const ok = messages.find(
      m => m.verb === 'OK' && m.direction === 'shell->napplet'
    );
    expect(ok).toBeTruthy();
    expect(ok!.parsed.success).toBe(true);

    // Verify message ordering: challenge before response, response before OK
    expect(challenge!.index).toBeLessThan(response!.index);
    expect(response!.index).toBeLessThan(ok!.index);
  });

  test('message tap captures all protocol messages', async ({ page }) => {
    // Load napplet
    await page.evaluate(
      () => (window as any).__loadNapplet__('auth-napplet')
    );

    // Wait for AUTH completion
    await expect.poll(async () => {
      const messages: TappedMessage[] = await page.evaluate(
        () => (window as any).__TEST_MESSAGES__
      );
      return messages.some(
        m => m.verb === 'OK' && m.parsed.success === true
      );
    }, { timeout: 15000 }).toBe(true);

    // Get all captured messages
    const messages: TappedMessage[] = await page.evaluate(
      () => (window as any).__TEST_MESSAGES__
    );

    // Verify we captured at least 3 messages (AUTH challenge, AUTH response, OK)
    expect(messages.length).toBeGreaterThanOrEqual(3);

    // Verify every message has required fields
    for (const msg of messages) {
      expect(msg.timestamp).toBeGreaterThan(0);
      expect(['napplet->shell', 'shell->napplet']).toContain(msg.direction);
      expect(msg.verb).toBeTruthy();
      expect(Array.isArray(msg.raw)).toBe(true);
      expect(typeof msg.parsed).toBe('object');
    }
  });

  test('clearMessages resets the message buffer', async ({ page }) => {
    // Load napplet and wait for AUTH
    await page.evaluate(
      () => (window as any).__loadNapplet__('auth-napplet')
    );

    await expect.poll(async () => {
      const messages: TappedMessage[] = await page.evaluate(
        () => (window as any).__TEST_MESSAGES__
      );
      return messages.length > 0;
    }, { timeout: 15000 }).toBe(true);

    // Clear messages
    await page.evaluate(() => (window as any).__clearMessages__());

    // Verify messages are cleared
    const messages: TappedMessage[] = await page.evaluate(
      () => (window as any).__TEST_MESSAGES__
    );
    expect(messages.length).toBe(0);
  });
});
