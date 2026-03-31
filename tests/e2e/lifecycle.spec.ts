/**
 * Phase 3 -- Lifecycle & Edge Cases behavioral tests.
 *
 * LCY-01 through LCY-05: Proves that the protocol handles its lifecycle
 * correctly: pre-AUTH message queuing and replay, AUTH rejection queue
 * clearing, cleanup of all state, and graceful handling of malformed
 * or sourceless messages.
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

test.describe('Lifecycle & Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__);
  });

  test('LCY-01: Messages queued during AUTH -- replayed after AUTH succeeds', async ({ page }) => {
    // Load pure-napplet (no auto-AUTH) to control AUTH timing
    const windowId = await page.evaluate(() => (window as any).__loadNapplet__('pure-napplet'));

    // Wait for the AUTH challenge
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'AUTH' && m.direction === 'shell->napplet' && typeof m.raw[1] === 'string');
    }, { timeout: 10000 }).toBe(true);

    const challenge = await page.evaluate(({ wid }: { wid: string }) => {
      return (window as any).__getChallenge__(wid);
    }, { wid: windowId });
    expect(challenge).toBeTruthy();

    // BEFORE AUTH: inject a REQ -- should be queued
    await page.evaluate(
      ({ wid }) => (window as any).__injectMessage__(wid, ['REQ', 'sub-queued', { kinds: [29003] }]),
      { wid: windowId }
    );

    // Complete AUTH with a valid event
    const { event } = buildAuthEvent({ challenge: challenge!, defect: 'none' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    // Wait for AUTH OK success
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === true);
    }, { timeout: 15000 }).toBe(true);

    // After AUTH, the queued REQ should have been replayed.
    // Inject an event to test if the subscription is active.
    await page.evaluate(() => {
      (window as any).__getRelay__().injectEvent('test:lcy01', { queued: true });
    });

    // The subscription should receive the event
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'EVENT' && m.parsed.subId === 'sub-queued');
    }, { message: 'LCY-01: Expected queued REQ to be active after AUTH', timeout: 10000 }).toBe(true);
  });

  test('LCY-02: AUTH rejection clears queue -- queued messages not processed', async ({ page }) => {
    // Load pure-napplet (no auto-AUTH)
    const windowId = await page.evaluate(() => (window as any).__loadNapplet__('pure-napplet'));

    // Wait for challenge
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'AUTH' && m.direction === 'shell->napplet' && typeof m.raw[1] === 'string');
    }, { timeout: 10000 }).toBe(true);

    const challenge = await page.evaluate(({ wid }: { wid: string }) => {
      return (window as any).__getChallenge__(wid);
    }, { wid: windowId });
    expect(challenge).toBeTruthy();

    // Inject a REQ before AUTH completes (gets queued)
    await page.evaluate(
      ({ wid }) => (window as any).__injectMessage__(wid, ['REQ', 'sub-rejected', { kinds: [29003] }]),
      { wid: windowId }
    );

    // Clear messages before injecting bad AUTH
    await page.evaluate(() => (window as any).__clearMessages__());

    // Inject a BAD AUTH (bad signature) -- will be rejected
    const { event } = buildAuthEvent({ challenge: challenge!, defect: 'bad-signature' });
    await page.evaluate(
      ({ wid, evt }) => (window as any).__injectMessage__(wid, ['AUTH', evt]),
      { wid: windowId, evt: event }
    );

    // Wait for the rejection OK
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { message: 'LCY-02: Expected AUTH rejection', timeout: 10000 }).toBe(true);

    // Verify NOTICE about dropped messages was sent
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const notice = msgs.find(m => m.verb === 'NOTICE');
    expect(notice).toBeTruthy();
    // The NOTICE format is: "N queued message(s) dropped due to auth failure"
    const noticeReason = notice!.raw[1] as string;
    expect(noticeReason).toContain('queued');
    expect(noticeReason).toContain('dropped');

    // Now try injecting an event -- the subscription should NOT be active
    // (queue was cleared, REQ was never processed)
    await page.evaluate(() => {
      (window as any).__getRelay__().injectEvent('test:lcy02', { shouldNotDeliver: true });
    });

    await page.waitForTimeout(500);
    const postMsgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const delivered = postMsgs.filter(m => m.verb === 'EVENT' && m.parsed.subId === 'sub-rejected');
    expect(delivered.length).toBe(0);
  });

  test('LCY-03: destroy() removes all subscriptions, buffers, registries', async ({ page }) => {
    // Load and auth a napplet
    const windowId = await page.evaluate(() => (window as any).__loadNapplet__('auth-napplet'));
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === true);
    }, { timeout: 15000 }).toBe(true);

    // Create a subscription
    await page.evaluate(
      ({ wid }) => (window as any).__createSubscription__(wid, 'sub-cleanup', [{ kinds: [29003] }]),
      { wid: windowId }
    );

    // Inject an event to populate the buffer
    await page.evaluate(() => {
      (window as any).__getRelay__().injectEvent('test:lcy03-pre', { before: 'cleanup' });
    });

    await page.waitForTimeout(200);
    await page.evaluate(() => (window as any).__clearMessages__());

    // Call destroy()
    await page.evaluate(() => {
      (window as any).__getRelay__().destroy();
    });

    // Try to deliver an event -- subscription should be gone
    await page.evaluate(() => {
      (window as any).__getRelay__().injectEvent('test:lcy03-post', { after: 'cleanup' });
    });

    await page.waitForTimeout(500);
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);

    // No EVENT should be delivered to sub-cleanup (subscription was removed)
    const delivered = msgs.filter(m => m.verb === 'EVENT' && m.parsed.subId === 'sub-cleanup');
    expect(delivered.length).toBe(0);
  });

  test('LCY-04: Non-array postMessage silently ignored', async ({ page }) => {
    // Load a napplet so we have a registered source window
    const windowId = await page.evaluate(() => (window as any).__loadNapplet__('auth-napplet'));
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'AUTH' && m.direction === 'shell->napplet');
    }, { timeout: 10000 }).toBe(true);

    await page.evaluate(() => (window as any).__clearMessages__());

    // Send a non-array message from the registered iframe
    // We need to dispatch a MessageEvent with the iframe's contentWindow
    // but with non-array data
    await page.evaluate(({ wid }) => {
      const frames = document.querySelectorAll('iframe');
      for (const frame of frames) {
        if (frame.id === wid && frame.contentWindow) {
          const event = new MessageEvent('message', {
            data: 'this is not an array',
            source: frame.contentWindow,
            origin: 'null',
          });
          window.dispatchEvent(event);
          break;
        }
      }
    }, { wid: windowId });

    // Wait a bit to ensure no crash
    await page.waitForTimeout(500);

    // Verify: no OK, no error, no NOTICE -- message was silently ignored
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const processed = msgs.filter(m => m.verb === 'OK' || m.verb === 'NOTICE' || m.verb === 'CLOSED');
    expect(processed.length).toBe(0);

    // Verify the page is still functional (no crash)
    const ready = await page.evaluate(() => (window as any).__SHELL_READY__);
    expect(ready).toBe(true);
  });

  test('LCY-05: Null source window silently ignored', async ({ page }) => {
    await page.evaluate(() => (window as any).__clearMessages__());

    // Dispatch a MessageEvent with null source
    await page.evaluate(() => {
      const event = new MessageEvent('message', {
        data: ['EVENT', {
          id: '0'.repeat(64),
          pubkey: '0'.repeat(64),
          created_at: Math.floor(Date.now() / 1000),
          kind: 1,
          tags: [],
          content: 'null source',
          sig: '0'.repeat(128),
        }],
        source: null,
        origin: 'null',
      });
      window.dispatchEvent(event);
    });

    // Wait a bit
    await page.waitForTimeout(500);

    // Verify: no OK, no error -- message was silently ignored
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const processed = msgs.filter(m => m.verb === 'OK' || m.verb === 'NOTICE' || m.verb === 'CLOSED');
    expect(processed.length).toBe(0);

    // Verify shell is still functional
    const ready = await page.evaluate(() => (window as any).__SHELL_READY__);
    expect(ready).toBe(true);
  });
});
