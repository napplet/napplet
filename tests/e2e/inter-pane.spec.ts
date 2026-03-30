/**
 * Inter-Pane Communication Tests (IPC-01 through IPC-06)
 *
 * Proves that the pseudo-relay's subscription-based event routing correctly
 * delivers events between napplets by topic, excludes senders from self-delivery,
 * handles multiple subscribers, respects unsubscribe, passes through arbitrary
 * content, and supports shell-injected events.
 */
import { test, expect } from '@playwright/test';

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

// Helper: load a napplet and wait for AUTH to complete
async function loadAndAuth(page: any): Promise<{ windowId: string; pubkey: string }> {
  const existingOks: number = await page.evaluate(
    () => (window as any).__TEST_MESSAGES__.filter(
      (m: any) => m.verb === 'OK' && m.parsed.success === true
    ).length
  );

  const windowId: string = await page.evaluate(
    () => (window as any).__loadNapplet__('auth-napplet')
  );

  await expect.poll(async () => {
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const oks = msgs.filter(m => m.verb === 'OK' && m.parsed.success === true);
    return oks.length;
  }, { timeout: 15000 }).toBeGreaterThan(existingOks);

  const pubkey: string = await page.evaluate(
    (wid: string) => (window as any).__getNappPubkey__(wid),
    windowId
  );

  return { windowId, pubkey };
}

// Helper: create a topic subscription for a napplet
async function subscribeTopic(page: any, windowId: string, subId: string, topic: string): Promise<void> {
  await page.evaluate(
    ([wid, sid, t]: string[]) => (window as any).__createSubscription__(wid, sid, [{ kinds: [29003], '#t': [t] }]),
    [windowId, subId, topic]
  );
}

// Helper: emit an inter-pane event from a napplet
async function emitIpc(page: any, windowId: string, pubkey: string, topic: string, content: string): Promise<void> {
  const event = {
    id: Math.random().toString(36).slice(2).padEnd(64, '0'),
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 29003, // BusKind.INTER_PANE
    tags: [['t', topic]],
    content,
    sig: '0'.repeat(128),
  };
  await page.evaluate(
    ([wid, evt]: [string, Record<string, unknown>]) => (window as any).__publishEvent__(wid, evt),
    [windowId, event]
  );
}

// Helper: find IPC delivery messages for a given topic
function findIpcDeliveries(
  messages: TappedMessage[],
  topic: string,
): TappedMessage[] {
  return messages.filter(m =>
    m.verb === 'EVENT' &&
    m.direction === 'shell->napplet' &&
    typeof m.raw[2] === 'object' &&
    (m.raw[2] as any)?.kind === 29003 &&
    (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 't' && t[1] === topic)
  );
}

test.describe('Inter-Pane Communication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__ === true, { timeout: 10000 });
    await page.evaluate(() => (window as any).__aclClear__());
    await page.evaluate(() => (window as any).__clearMessages__());
  });

  test('IPC-01: emit + subscribe -- subscriber receives event with correct payload', async ({ page }) => {
    // Load two napplets
    const nappA = await loadAndAuth(page);
    const nappB = await loadAndAuth(page);

    // Subscribe nappB to 'test-topic'
    await subscribeTopic(page, nappB.windowId, 'ipc-sub-1', 'test-topic');

    // Clear messages
    await page.evaluate(() => (window as any).__clearMessages__());

    // NappA emits on 'test-topic'
    await emitIpc(page, nappA.windowId, nappA.pubkey, 'test-topic', JSON.stringify({ data: 'hello from A' }));

    // Wait for delivery
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return findIpcDeliveries(msgs, 'test-topic').length;
    }, { timeout: 5000 }).toBeGreaterThanOrEqual(1);

    // Verify the delivered event
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const deliveries = findIpcDeliveries(msgs, 'test-topic');

    // Should have exactly 1 delivery (to nappB, not nappA - sender exclusion)
    expect(deliveries.length).toBe(1);

    const deliveredEvent = deliveries[0].raw[2] as { kind?: number; content?: string; tags?: string[][] };
    expect(deliveredEvent.kind).toBe(29003);
    expect(deliveredEvent.content).toBe(JSON.stringify({ data: 'hello from A' }));
    expect(deliveredEvent.tags?.some(t => t[0] === 't' && t[1] === 'test-topic')).toBe(true);
  });

  test('IPC-02: topic filtering -- unsubscribed topic does not fire callback', async ({ page }) => {
    const nappA = await loadAndAuth(page);
    const nappB = await loadAndAuth(page);

    // Subscribe nappB to 'alpha'
    await subscribeTopic(page, nappB.windowId, 'ipc-sub-alpha', 'alpha');

    await page.evaluate(() => (window as any).__clearMessages__());

    // NappA emits on 'beta' (different topic)
    await emitIpc(page, nappA.windowId, nappA.pubkey, 'beta', '{"msg":"wrong topic"}');

    // Wait briefly for any potential delivery
    await page.waitForTimeout(500);

    // Verify nappB did NOT receive the event
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const betaDeliveries = findIpcDeliveries(msgs, 'beta');
    expect(betaDeliveries.length).toBe(0);

    // Also verify no alpha delivery (nothing was emitted on alpha)
    const alphaDeliveries = findIpcDeliveries(msgs, 'alpha');
    expect(alphaDeliveries.length).toBe(0);
  });

  test('IPC-03: multiple subscribers -- all receive event', async ({ page }) => {
    const nappA = await loadAndAuth(page);
    const nappB = await loadAndAuth(page);
    const nappC = await loadAndAuth(page);

    // Subscribe B and C to 'broadcast'
    await subscribeTopic(page, nappB.windowId, 'ipc-sub-bc-1', 'broadcast');
    await subscribeTopic(page, nappC.windowId, 'ipc-sub-bc-2', 'broadcast');

    await page.evaluate(() => (window as any).__clearMessages__());

    // NappA emits on 'broadcast'
    await emitIpc(page, nappA.windowId, nappA.pubkey, 'broadcast', '{"msg":"to all"}');

    // Wait for 2 deliveries (one to B, one to C)
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return findIpcDeliveries(msgs, 'broadcast').length;
    }, { timeout: 5000 }).toBe(2);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const deliveries = findIpcDeliveries(msgs, 'broadcast');
    expect(deliveries.length).toBe(2);

    // Both should have the correct content
    for (const d of deliveries) {
      const evt = d.raw[2] as { content?: string };
      expect(evt.content).toBe('{"msg":"to all"}');
    }
  });

  test('IPC-04: unsubscribe -- no further events received after CLOSE', async ({ page }) => {
    const nappA = await loadAndAuth(page);
    const nappB = await loadAndAuth(page);

    // Subscribe B to 'unsub-test'
    await subscribeTopic(page, nappB.windowId, 'ipc-unsub', 'unsub-test');

    await page.evaluate(() => (window as any).__clearMessages__());

    // First emit from A -- B should receive
    await emitIpc(page, nappA.windowId, nappA.pubkey, 'unsub-test', '{"seq":1}');

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return findIpcDeliveries(msgs, 'unsub-test').length;
    }, { timeout: 5000 }).toBeGreaterThanOrEqual(1);

    // B closes subscription
    await page.evaluate(
      ([wid, sid]: string[]) => (window as any).__closeSubscription__(wid, sid),
      [nappB.windowId, 'ipc-unsub']
    );

    await page.evaluate(() => (window as any).__clearMessages__());

    // Second emit from A -- B should NOT receive
    await emitIpc(page, nappA.windowId, nappA.pubkey, 'unsub-test', '{"seq":2}');

    // Wait briefly for any potential delivery
    await page.waitForTimeout(500);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const deliveries = findIpcDeliveries(msgs, 'unsub-test');
    expect(deliveries.length).toBe(0);
  });

  test('IPC-05: malformed content -- on() callback receives raw content', async ({ page }) => {
    const nappA = await loadAndAuth(page);
    const nappB = await loadAndAuth(page);

    // Subscribe B to 'malformed-test'
    await subscribeTopic(page, nappB.windowId, 'ipc-sub-malformed', 'malformed-test');

    await page.evaluate(() => (window as any).__clearMessages__());

    // A emits with non-JSON content
    await emitIpc(page, nappA.windowId, nappA.pubkey, 'malformed-test', 'this is not JSON {{{}');

    // Wait for delivery
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return findIpcDeliveries(msgs, 'malformed-test').length;
    }, { timeout: 5000 }).toBeGreaterThanOrEqual(1);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const delivery = findIpcDeliveries(msgs, 'malformed-test')[0];
    const deliveredEvent = delivery.raw[2] as { content?: string };

    // Content should pass through as-is, not parsed or rejected
    expect(deliveredEvent.content).toBe('this is not JSON {{{}');
  });

  test('IPC-06: shell-injected events -- injectEvent delivered to matching subscribers', async ({ page }) => {
    const nappB = await loadAndAuth(page);

    // Subscribe B to 'shell-notify'
    await subscribeTopic(page, nappB.windowId, 'ipc-shell-inject', 'shell-notify');

    await page.evaluate(() => (window as any).__clearMessages__());

    // Shell injects event
    await page.evaluate(
      () => (window as any).__injectShellEvent__('shell-notify', { alert: 'update available' })
    );

    // Wait for delivery
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return findIpcDeliveries(msgs, 'shell-notify').length;
    }, { timeout: 5000 }).toBeGreaterThanOrEqual(1);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const delivery = findIpcDeliveries(msgs, 'shell-notify')[0];
    const deliveredEvent = delivery.raw[2] as { kind?: number; content?: string; pubkey?: string; tags?: string[][] };

    expect(deliveredEvent.kind).toBe(29003);
    expect(deliveredEvent.tags?.some(t => t[0] === 't' && t[1] === 'shell-notify')).toBe(true);
    expect(deliveredEvent.content).toBe(JSON.stringify({ alert: 'update available' }));
    // Shell-injected events use zero pubkey
    expect(deliveredEvent.pubkey).toBe('0'.repeat(64));
  });
});
