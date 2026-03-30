/**
 * ACL Matrix — Signer Capabilities (sign:event, sign:nip04, sign:nip44)
 *
 * Tests every capability × action cell for signer operations.
 *
 * NOTE: The current enforce.ts resolveCapabilities() maps ALL signer requests
 * (kind 29001) to sign:event — there is no separate enforcement for
 * sign:nip04 or sign:nip44 at the enforce gate level. These tests verify
 * the ACTUAL behavior: sign:event controls all signer access. If future
 * phases add per-method capability checks, these tests will document that.
 *
 * Cells:
 * - sign:event × getPublicKey
 * - sign:event × signEvent
 * - sign:event × revoke
 * - sign:event × block/unblock
 * - sign:event for nip04/nip44 methods (all routed through sign:event)
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

async function loadAndAuth(page: any): Promise<{
  windowId: string;
  pubkey: string;
  nappEntry: { pubkey: string; dTag: string; aggregateHash: string };
}> {
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
    return msgs.filter(m => m.verb === 'OK' && m.parsed.success === true).length;
  }, { timeout: 15000 }).toBeGreaterThan(existingOks);
  const nappEntry = await page.evaluate(
    (wid: string) => (window as any).__getNappEntry__(wid), windowId
  );
  return { windowId, pubkey: nappEntry.pubkey, nappEntry };
}

async function sendSignerRequest(
  page: any, windowId: string, pubkey: string, method: string, corrId: string,
  extraTags: string[][] = []
): Promise<string> {
  const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
  await page.evaluate(
    ([wid, pk, eid, meth, cid, tagsJson]: string[]) => {
      const event = {
        id: eid,
        pubkey: pk,
        created_at: Math.floor(Date.now() / 1000),
        kind: 29001,
        tags: [['method', meth], ['id', cid], ...JSON.parse(tagsJson)],
        content: '',
        sig: '0'.repeat(128),
      };
      (window as any).__publishEvent__(wid, event);
    },
    [windowId, pubkey, eventId, method, corrId, JSON.stringify(extraTags)]
  );
  return eventId;
}

test.describe('ACL Matrix — Signer Capabilities', () => {
  let windowId: string;
  let pubkey: string;
  let nappEntry: { pubkey: string; dTag: string; aggregateHash: string };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__ === true, { timeout: 10000 });
    await page.evaluate(() => (window as any).__aclClear__());
    await page.evaluate(() => (window as any).__clearLocalStorage__());

    const result = await loadAndAuth(page);
    windowId = result.windowId;
    pubkey = result.pubkey;
    nappEntry = result.nappEntry;

    // Configure mock signer with nip04 and nip44 methods
    await page.evaluate(() => {
      (window as any).__setSigner__({
        getPublicKey: () => 'a'.repeat(64),
        signEvent: (e: any) => Promise.resolve({ ...e, sig: 'b'.repeat(128) }),
        getRelays: () => ({}),
        nip04: {
          encrypt: (_pubkey: string, _plaintext: string) => Promise.resolve('nip04-encrypted'),
          decrypt: (_pubkey: string, _ciphertext: string) => Promise.resolve('nip04-decrypted'),
        },
        nip44: {
          encrypt: (_pubkey: string, _plaintext: string) => Promise.resolve('nip44-encrypted'),
          decrypt: (_pubkey: string, _ciphertext: string) => Promise.resolve('nip44-decrypted'),
        },
      });
    });

    await page.evaluate(() => (window as any).__clearMessages__());
  });

  // ─── sign:event × getPublicKey ─────────────────────────────────────────────

  test('sign:event × getPublicKey — grant succeeds', async ({ page }) => {
    // sign:event is granted by default (permissive policy)
    const eventId = await sendSignerRequest(page, windowId, pubkey, 'getPublicKey', 'corr-se-01');

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  test('sign:event × signEvent — grant succeeds', async ({ page }) => {
    const testEvent = {
      kind: 1, content: 'test', tags: [],
      pubkey: 'a'.repeat(64), created_at: Math.floor(Date.now() / 1000),
      id: 'c'.repeat(64), sig: 'd'.repeat(128),
    };
    const eventId = await sendSignerRequest(
      page, windowId, pubkey, 'signEvent', 'corr-se-02',
      [['event', JSON.stringify(testEvent)]]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  test('sign:event × sign — revoke denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'sign:event'),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = await sendSignerRequest(page, windowId, pubkey, 'getPublicKey', 'corr-se-03');

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('sign:event');
  });

  test('sign:event × sign — block denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = await sendSignerRequest(page, windowId, pubkey, 'getPublicKey', 'corr-se-04');

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
  });

  test('sign:event × sign — unblock restores', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclBlock__(p, d, h);
        (window as any).__aclUnblock__(p, d, h);
      },
      [pubkey, dTag, aggregateHash]
    );

    const eventId = await sendSignerRequest(page, windowId, pubkey, 'getPublicKey', 'corr-se-05');

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  // ─── sign:event covers nip04 methods ───────────────────────────────────────
  // NOTE: resolveCapabilities() maps ALL kind 29001 to sign:event.
  // sign:nip04 revoke has no effect at the enforce gate because the gate checks sign:event.

  test('sign:event × nip04.encrypt — grant succeeds', async ({ page }) => {
    const eventId = await sendSignerRequest(
      page, windowId, pubkey, 'nip04.encrypt', 'corr-n04-01',
      [['params', 'a'.repeat(64), 'hello']]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  test('sign:event revoke blocks nip04.encrypt', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    // Revoke sign:event (which controls all signer access)
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'sign:event'),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = await sendSignerRequest(
      page, windowId, pubkey, 'nip04.encrypt', 'corr-n04-02',
      [['params', 'a'.repeat(64), 'hello']]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    // Denial comes from sign:event check (the enforce gate capability for signer requests)
    expect(ok!.parsed.reason).toContain('sign:event');
  });

  // ─── sign:event covers nip44 methods ───────────────────────────────────────

  test('sign:event × nip44.encrypt — grant succeeds', async ({ page }) => {
    const eventId = await sendSignerRequest(
      page, windowId, pubkey, 'nip44.encrypt', 'corr-n44-01',
      [['params', 'a'.repeat(64), 'hello']]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  test('sign:event revoke blocks nip44.encrypt', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'sign:event'),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = await sendSignerRequest(
      page, windowId, pubkey, 'nip44.encrypt', 'corr-n44-02',
      [['params', 'a'.repeat(64), 'hello']]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('sign:event');
  });

  // ─── Block/unblock for all signer methods ─────────────────────────────────

  test('sign:* × block denies all signer methods', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = await sendSignerRequest(page, windowId, pubkey, 'getPublicKey', 'corr-blk-01');

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
  });

  test('sign:* × unblock restores signer access', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclBlock__(p, d, h);
        (window as any).__aclUnblock__(p, d, h);
      },
      [pubkey, dTag, aggregateHash]
    );

    const eventId = await sendSignerRequest(page, windowId, pubkey, 'getPublicKey', 'corr-ublk-01');

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });
});
