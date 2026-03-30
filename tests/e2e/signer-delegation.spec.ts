/**
 * Signer Delegation Tests (SGN-01 through SGN-07)
 *
 * Proves that the signer proxy correctly delegates signing operations to the
 * host signer, enforces consent flow for destructive kinds, handles missing
 * signer gracefully, and resolves concurrent requests independently.
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

const MOCK_HOST_PUBKEY = 'a'.repeat(64);

// Helper: build a signer request event
function buildSignerRequest(
  pubkey: string,
  method: string,
  correlationId: string,
  extraTags?: string[][],
): Record<string, unknown> {
  return {
    id: Math.random().toString(36).slice(2).padEnd(64, '0'),
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 29001, // BusKind.SIGNER_REQUEST
    tags: [['method', method], ['id', correlationId], ...(extraTags ?? [])],
    content: '',
    sig: '0'.repeat(128),
  };
}

// Helper: wait for OK message with matching eventId
async function waitForOk(page: any, eventId: string): Promise<TappedMessage> {
  let ok: TappedMessage | undefined;
  await expect.poll(async () => {
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    ok = msgs.find((m: TappedMessage) =>
      m.verb === 'OK' &&
      m.direction === 'shell->napplet' &&
      m.raw[1] === eventId
    );
    return !!ok;
  }, { timeout: 5000 }).toBe(true);
  return ok!;
}

// Helper: wait for signer response event with matching correlationId
async function waitForSignerResponse(page: any, correlationId: string): Promise<TappedMessage> {
  let response: TappedMessage | undefined;
  await expect.poll(async () => {
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    response = msgs.find((m: TappedMessage) =>
      m.verb === 'EVENT' &&
      m.direction === 'shell->napplet' &&
      typeof m.raw[2] === 'object' &&
      (m.raw[2] as any)?.kind === 29002 &&
      (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === correlationId)
    );
    return !!response;
  }, { timeout: 5000 }).toBe(true);
  return response!;
}

test.describe('Signer Delegation', () => {
  let windowId: string;
  let nappEntry: { pubkey: string; dTag: string; aggregateHash: string };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__ === true, { timeout: 10000 });
    await page.evaluate(() => (window as any).__aclClear__());

    // Load auth-napplet and wait for AUTH OK
    windowId = await page.evaluate(() => (window as any).__loadNapplet__('auth-napplet'));
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === true);
    }, { timeout: 15000 }).toBe(true);

    // Get napplet identity
    nappEntry = await page.evaluate(
      (wid) => (window as any).__getNappEntry__(wid),
      windowId
    );

    // Create subscription for signer responses (kind 29002)
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'signer-sub', [{ kinds: [29002] }]),
      [windowId]
    );

    // Clear messages for clean test state
    await page.evaluate(() => (window as any).__clearMessages__());
  });

  test('SGN-01: getPublicKey returns host pubkey', async ({ page }) => {
    // Configure mock signer
    await page.evaluate((hostPk) => {
      (window as any).__setSigner__({
        getPublicKey: () => hostPk,
        signEvent: (e: any) => Promise.resolve(e),
        getRelays: () => ({}),
      });
    }, MOCK_HOST_PUBKEY);

    // Build and inject signer request
    const reqEvent = buildSignerRequest(nappEntry.pubkey, 'getPublicKey', 'corr-gpk-1');
    const eventId = reqEvent.id as string;

    await page.evaluate(
      ([wid, evt]) => (window as any).__publishEvent__(wid, evt),
      [windowId, reqEvent]
    );

    // Wait for OK true
    const ok = await waitForOk(page, eventId);
    expect(ok.parsed.success).toBe(true);

    // Wait for signer response
    const resp = await waitForSignerResponse(page, 'corr-gpk-1');
    const respEvt = resp.raw[2] as { tags?: string[][] };
    const resultTag = respEvt.tags?.find(t => t[0] === 'result');
    expect(resultTag).toBeTruthy();
    expect(JSON.parse(resultTag![1])).toBe(MOCK_HOST_PUBKEY);

    // Verify method tag
    const methodTag = respEvt.tags?.find(t => t[0] === 'method');
    expect(methodTag?.[1]).toBe('getPublicKey');
  });

  test('SGN-02: signEvent non-destructive kind returns signed event', async ({ page }) => {
    // Configure mock signer that adds a signature
    await page.evaluate(() => {
      (window as any).__setSigner__({
        getPublicKey: () => 'a'.repeat(64),
        signEvent: (e: any) => Promise.resolve({ ...e, sig: 'b'.repeat(128) }),
        getRelays: () => ({}),
      });
    });

    // Build event to sign (kind 1 = non-destructive)
    const eventToSign = {
      id: '0'.repeat(64),
      pubkey: '0'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [],
      content: 'test content',
      sig: '',
    };

    // Build signer request
    const reqEvent = buildSignerRequest(
      nappEntry.pubkey, 'signEvent', 'corr-sign-1',
      [['event', JSON.stringify(eventToSign)]]
    );
    const eventId = reqEvent.id as string;

    await page.evaluate(
      ([wid, evt]) => (window as any).__publishEvent__(wid, evt),
      [windowId, reqEvent]
    );

    // Wait for OK true
    const ok = await waitForOk(page, eventId);
    expect(ok.parsed.success).toBe(true);

    // Wait for signer response
    const resp = await waitForSignerResponse(page, 'corr-sign-1');
    const respEvt = resp.raw[2] as { tags?: string[][] };
    const resultTag = respEvt.tags?.find(t => t[0] === 'result');
    expect(resultTag).toBeTruthy();
    const signedEvent = JSON.parse(resultTag![1]);
    expect(signedEvent.sig).toBe('b'.repeat(128));
    expect(signedEvent.content).toBe('test content');
  });

  test('SGN-03: signEvent destructive kind approved -- returns signed event', async ({ page }) => {
    // Configure mock signer
    await page.evaluate(() => {
      (window as any).__setSigner__({
        getPublicKey: () => 'a'.repeat(64),
        signEvent: (e: any) => Promise.resolve({ ...e, sig: 'c'.repeat(128) }),
        getRelays: () => ({}),
      });
    });

    // Set consent to auto-approve
    await page.evaluate(() => (window as any).__setConsentHandler__('auto-approve'));

    // Build event to sign with kind 0 (destructive: profile metadata)
    const eventToSign = {
      id: '0'.repeat(64),
      pubkey: '0'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 0,
      tags: [],
      content: '{"name":"test"}',
      sig: '',
    };

    const reqEvent = buildSignerRequest(
      nappEntry.pubkey, 'signEvent', 'corr-consent-approve',
      [['event', JSON.stringify(eventToSign)]]
    );
    const eventId = reqEvent.id as string;

    await page.evaluate(
      ([wid, evt]) => (window as any).__publishEvent__(wid, evt),
      [windowId, reqEvent]
    );

    // Wait for OK true (consent approved)
    const ok = await waitForOk(page, eventId);
    expect(ok.parsed.success).toBe(true);

    // Wait for signer response
    const resp = await waitForSignerResponse(page, 'corr-consent-approve');
    const respEvt = resp.raw[2] as { tags?: string[][] };
    const resultTag = respEvt.tags?.find(t => t[0] === 'result');
    expect(resultTag).toBeTruthy();
    const signedEvent = JSON.parse(resultTag![1]);
    expect(signedEvent.sig).toBe('c'.repeat(128));
  });

  test('SGN-04: signEvent destructive kind denied -- returns error', async ({ page }) => {
    // Configure mock signer
    await page.evaluate(() => {
      (window as any).__setSigner__({
        getPublicKey: () => 'a'.repeat(64),
        signEvent: (e: any) => Promise.resolve({ ...e, sig: 'd'.repeat(128) }),
        getRelays: () => ({}),
      });
    });

    // Set consent to auto-deny
    await page.evaluate(() => (window as any).__setConsentHandler__('auto-deny'));

    // Build event to sign with kind 0 (destructive)
    const eventToSign = {
      id: '0'.repeat(64),
      pubkey: '0'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 0,
      tags: [],
      content: '{"name":"denied"}',
      sig: '',
    };

    const reqEvent = buildSignerRequest(
      nappEntry.pubkey, 'signEvent', 'corr-consent-deny',
      [['event', JSON.stringify(eventToSign)]]
    );
    const eventId = reqEvent.id as string;

    await page.evaluate(
      ([wid, evt]) => (window as any).__publishEvent__(wid, evt),
      [windowId, reqEvent]
    );

    // Wait for OK false (consent denied)
    const ok = await waitForOk(page, eventId);
    expect(ok.parsed.success).toBe(false);
    expect(ok.parsed.reason).toContain('user rejected');
  });

  test('SGN-05: no signer configured -- returns error', async ({ page }) => {
    // Explicitly clear signer (mockHooks defaults to null)
    await page.evaluate(() => (window as any).__setSigner__(null));

    // Build signer request
    const reqEvent = buildSignerRequest(nappEntry.pubkey, 'getPublicKey', 'corr-no-signer');
    const eventId = reqEvent.id as string;

    await page.evaluate(
      ([wid, evt]) => (window as any).__publishEvent__(wid, evt),
      [windowId, reqEvent]
    );

    // Wait for OK false
    const ok = await waitForOk(page, eventId);
    expect(ok.parsed.success).toBe(false);
    expect(ok.parsed.reason).toContain('no signer configured');
  });

  test('SGN-06: signer never resolves -- no premature OK sent', async ({ page }) => {
    // Configure a signer that never resolves
    await page.evaluate(() => {
      (window as any).__setSigner__({
        getPublicKey: () => 'a'.repeat(64),
        signEvent: () => new Promise(() => {}), // Never resolves
        getRelays: () => ({}),
      });
    });

    // Build signer request for signEvent (kind 1, non-destructive)
    const eventToSign = {
      id: '0'.repeat(64),
      pubkey: '0'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [],
      content: 'timeout test',
      sig: '',
    };

    const reqEvent = buildSignerRequest(
      nappEntry.pubkey, 'signEvent', 'corr-timeout',
      [['event', JSON.stringify(eventToSign)]]
    );
    const eventId = reqEvent.id as string;

    await page.evaluate(
      ([wid, evt]) => (window as any).__publishEvent__(wid, evt),
      [windowId, reqEvent]
    );

    // Wait 2 seconds for any premature response
    await page.waitForTimeout(2000);

    // Verify no OK message was sent for this eventId
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok).toBeUndefined();
  });

  test('SGN-07: concurrent requests with different IDs resolved independently', async ({ page }) => {
    // Configure mock signer with a small delay
    await page.evaluate(() => {
      (window as any).__setSigner__({
        getPublicKey: () => 'a'.repeat(64),
        signEvent: (e: any) => new Promise(resolve =>
          setTimeout(() => resolve({ ...e, sig: 'e'.repeat(128) }), 50)
        ),
        getRelays: () => ({}),
      });
    });

    // Build two signer requests with different correlation IDs
    const eventToSign1 = {
      id: '1'.repeat(64), pubkey: '0'.repeat(64),
      created_at: Math.floor(Date.now() / 1000), kind: 1,
      tags: [], content: 'concurrent-1', sig: '',
    };
    const eventToSign2 = {
      id: '2'.repeat(64), pubkey: '0'.repeat(64),
      created_at: Math.floor(Date.now() / 1000), kind: 1,
      tags: [], content: 'concurrent-2', sig: '',
    };

    const req1 = buildSignerRequest(
      nappEntry.pubkey, 'signEvent', 'corr-concurrent-1',
      [['event', JSON.stringify(eventToSign1)]]
    );
    const req2 = buildSignerRequest(
      nappEntry.pubkey, 'signEvent', 'corr-concurrent-2',
      [['event', JSON.stringify(eventToSign2)]]
    );
    const eventId1 = req1.id as string;
    const eventId2 = req2.id as string;

    // Inject both in quick succession
    await page.evaluate(
      ([wid, evt1, evt2]) => {
        (window as any).__publishEvent__(wid, evt1);
        (window as any).__publishEvent__(wid, evt2);
      },
      [windowId, req1, req2]
    );

    // Wait for BOTH OK messages
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      const ok1 = msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId1 && m.parsed.success === true);
      const ok2 = msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId2 && m.parsed.success === true);
      return ok1 && ok2;
    }, { timeout: 10000 }).toBe(true);

    // Wait for BOTH signer responses
    const resp1 = await waitForSignerResponse(page, 'corr-concurrent-1');
    const resp2 = await waitForSignerResponse(page, 'corr-concurrent-2');

    // Verify independent responses
    const evt1 = resp1.raw[2] as { tags?: string[][] };
    const evt2 = resp2.raw[2] as { tags?: string[][] };
    expect(evt1.tags?.find(t => t[0] === 'id')?.[1]).toBe('corr-concurrent-1');
    expect(evt2.tags?.find(t => t[0] === 'id')?.[1]).toBe('corr-concurrent-2');
  });
});
