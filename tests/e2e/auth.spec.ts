/**
 * Phase 3 -- Identity & Authentication behavioral tests.
 *
 * AUTH-01 through AUTH-09: Proves the NIP-42 AUTH handshake correctly
 * accepts valid credentials and rejects each failure mode.
 *
 * AUTH-01 uses auth-napplet (with @napplet/shim auto-AUTH).
 * AUTH-02 through AUTH-09 use pure-napplet (no shim) so the test has
 * full control over the AUTH response -- no race with auto-AUTH.
 */
import { test, expect } from '@playwright/test';
import { buildAuthEvent } from '../helpers/auth-event-builder.js';

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

/**
 * Helper: Load pure-napplet (no shim, no auto-AUTH) and wait for the
 * AUTH challenge to appear in tap messages.
 * Returns { windowId, challenge } ready for manual AUTH injection.
 */
async function loadPureNappletAndGetChallenge(page: any): Promise<{ windowId: string; challenge: string }> {
  const windowId = await page.evaluate(() => (window as any).__loadNapplet__('pure-napplet'));

  // Wait for the AUTH challenge to appear in tap (shell->napplet)
  await expect.poll(async () => {
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    return msgs.some(m => m.verb === 'AUTH' && m.direction === 'shell->napplet' && typeof m.raw[1] === 'string');
  }, { timeout: 10000 }).toBe(true);

  // Get the challenge string
  const challenge = await page.evaluate(({ wid }: { wid: string }) => {
    return (window as any).__getChallenge__(wid);
  }, { wid: windowId });
  expect(challenge).toBeTruthy();

  // Clear messages before the actual test
  await page.evaluate(() => (window as any).__clearMessages__());

  return { windowId, challenge: challenge! };
}

test.describe('Identity & Authentication', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__);
  });

  test('AUTH-01: Valid AUTH handshake -- correct challenge, valid signature, correct relay tag -> napp registered', async ({ page }) => {
    // Load auth-napplet which auto-completes AUTH via @napplet/shim
    await page.evaluate(() => (window as any).__loadNapplet__('auth-napplet'));

    // Wait for AUTH OK with success=true
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === true);
    }, { message: 'AUTH-01: Expected OK true', timeout: 15000 }).toBe(true);

    // Verify the full AUTH sequence
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);

    // Challenge sent (shell->napplet)
    const challenge = msgs.find(m => m.verb === 'AUTH' && m.direction === 'shell->napplet');
    expect(challenge).toBeTruthy();

    // AUTH response (napplet->shell) with kind 22242
    const response = msgs.find(m => m.verb === 'AUTH' && m.direction === 'napplet->shell');
    expect(response).toBeTruthy();
    expect(response!.parsed.eventKind).toBe(22242);

    // OK true (shell->napplet)
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === true);
    expect(ok).toBeTruthy();
    expect(ok!.parsed.reason).toBe('');
  });

  test('AUTH-02: Bad signature -> AUTH rejected with "invalid signature"', async ({ page }) => {
    const { windowId, challenge } = await loadPureNappletAndGetChallenge(page);

    const { event } = buildAuthEvent({ challenge, defect: 'bad-signature' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { message: 'AUTH-02: Expected OK false for bad signature', timeout: 10000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('invalid signature');
  });

  test('AUTH-03: Expired timestamp (>60s ago) -> AUTH rejected', async ({ page }) => {
    const { windowId, challenge } = await loadPureNappletAndGetChallenge(page);

    const { event } = buildAuthEvent({ challenge, defect: 'expired-timestamp' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { message: 'AUTH-03: Expected OK false for expired timestamp', timeout: 10000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('too far from now');
  });

  test('AUTH-04: Future timestamp (>now+60s) -> AUTH rejected', async ({ page }) => {
    const { windowId, challenge } = await loadPureNappletAndGetChallenge(page);

    const { event } = buildAuthEvent({ challenge, defect: 'future-timestamp' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { message: 'AUTH-04: Expected OK false for future timestamp', timeout: 10000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('too far from now');
  });

  test('AUTH-05: Wrong challenge value -> AUTH rejected with "challenge mismatch"', async ({ page }) => {
    const { windowId, challenge } = await loadPureNappletAndGetChallenge(page);

    const { event } = buildAuthEvent({ challenge, defect: 'wrong-challenge' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { message: 'AUTH-05: Expected OK false for wrong challenge', timeout: 10000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('challenge mismatch');
  });

  test('AUTH-06: Wrong relay tag -> AUTH rejected', async ({ page }) => {
    const { windowId, challenge } = await loadPureNappletAndGetChallenge(page);

    const { event } = buildAuthEvent({ challenge, defect: 'wrong-relay' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { message: 'AUTH-06: Expected OK false for wrong relay', timeout: 10000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('relay tag');
  });

  test('AUTH-07: Wrong event kind (!=22242) -> AUTH rejected', async ({ page }) => {
    const { windowId, challenge } = await loadPureNappletAndGetChallenge(page);

    const { event } = buildAuthEvent({ challenge, defect: 'wrong-kind' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { message: 'AUTH-07: Expected OK false for wrong kind', timeout: 10000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('22242');
  });

  test('AUTH-08: Missing type tag -> AUTH rejected (strict per CONTEXT D-02)', async ({ page }) => {
    const { windowId, challenge } = await loadPureNappletAndGetChallenge(page);

    const { event } = buildAuthEvent({ challenge, defect: 'missing-type-tag' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK');
    }, { message: 'AUTH-08: Expected OK response for missing type tag', timeout: 10000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK');
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('type');
  });

  test('AUTH-09: Missing aggregateHash tag -> AUTH rejected (strict per CONTEXT D-02)', async ({ page }) => {
    const { windowId, challenge } = await loadPureNappletAndGetChallenge(page);

    const { event } = buildAuthEvent({ challenge, defect: 'missing-aggregate-hash-tag' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK');
    }, { message: 'AUTH-09: Expected OK response for missing aggregateHash', timeout: 10000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK');
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('aggregateHash');
  });
});
