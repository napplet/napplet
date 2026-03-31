/**
 * ACL Matrix — Relay Capabilities (relay:read, relay:write)
 *
 * Tests every capability × action cell for relay operations:
 * - relay:write × publish (regular event)
 * - relay:read × subscribe
 * - relay:read × deliver (delivery-time enforcement)
 * - relay:write × inter-pane emit
 *
 * Each cell has: grant-succeeds, revoke-denies, block-denies, unblock-restores.
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

test.describe('ACL Matrix — Relay Capabilities', () => {
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

    await page.evaluate(() => (window as any).__clearMessages__());
  });

  // ─── relay:write × publish (regular event) ─────────────────────────────────

  test('relay:write × publish — grant succeeds', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclGrant__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1, tags: [], content: 'grant test', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  test('relay:write × publish — revoke denies with correct error', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1, tags: [], content: 'revoke test', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('relay:write');
  });

  test('relay:write × publish — block denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1, tags: [], content: 'block test', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
  });

  test('relay:write × publish — unblock restores', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclBlock__(p, d, h);
        (window as any).__aclUnblock__(p, d, h);
      },
      [pubkey, dTag, aggregateHash]
    );

    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1, tags: [], content: 'unblock test', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  // ─── relay:read × subscribe ────────────────────────────────────────────────

  test('relay:read × subscribe — grant succeeds', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclGrant__(p, d, h, 'relay:read'),
      [pubkey, dTag, aggregateHash]
    );

    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-grant-read', [{ kinds: [29003] }]),
      [windowId]
    );

    await page.waitForTimeout(500);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const closed = msgs.find(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    expect(closed).toBeUndefined();
  });

  test('relay:read × subscribe — revoke denies with correct error', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:read'),
      [pubkey, dTag, aggregateHash]
    );

    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-revoke-read', [{ kinds: [29003] }]),
      [windowId]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const closed = msgs.find(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    expect(closed!.raw[2]).toContain('relay:read');
  });

  test('relay:read × subscribe — block denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-block-read', [{ kinds: [29003] }]),
      [windowId]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const closed = msgs.find(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    expect(closed).toBeTruthy();
    expect(closed!.raw[2]).toContain('denied');
  });

  test('relay:read × subscribe — unblock restores', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclBlock__(p, d, h);
        (window as any).__aclUnblock__(p, d, h);
      },
      [pubkey, dTag, aggregateHash]
    );

    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-unblock-read', [{ kinds: [29003] }]),
      [windowId]
    );

    await page.waitForTimeout(500);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const closed = msgs.find(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    expect(closed).toBeUndefined();
  });

  // ─── relay:read × deliver (delivery-time enforcement) ──────────────────────

  test('relay:read × deliver — grant allows delivery', async ({ page }) => {
    // Load sender
    const sender = await loadAndAuth(page);
    // Load receiver
    const receiver = await loadAndAuth(page);

    // Receiver subscribes to a topic
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-deliver-grant', [{ kinds: [29003], '#t': ['test-delivery'] }]),
      [receiver.windowId]
    );

    await page.evaluate(() => (window as any).__clearMessages__());

    // Sender publishes
    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, pk, eid]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003, tags: [['t', 'test-delivery']],
          content: 'delivery grant test', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [sender.windowId, sender.pubkey, eventId]
    );

    // Wait for EVENT delivery to receiver
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m =>
        m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
        m.raw[1] === 'sub-deliver-grant'
      );
    }, { timeout: 5000 }).toBe(true);
  });

  test('relay:read × deliver — revoke blocks delivery silently', async ({ page }) => {
    const sender = await loadAndAuth(page);
    const receiver = await loadAndAuth(page);

    // Receiver subscribes
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-deliver-revoke', [{ kinds: [29003], '#t': ['test-delivery-revoke'] }]),
      [receiver.windowId]
    );

    // Revoke relay:read on receiver
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:read'),
      [receiver.nappEntry.pubkey, receiver.nappEntry.dTag, receiver.nappEntry.aggregateHash]
    );

    await page.evaluate(() => (window as any).__clearMessages__());

    // Sender publishes
    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, pk, eid]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003, tags: [['t', 'test-delivery-revoke']],
          content: 'delivery revoke test', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [sender.windowId, sender.pubkey, eventId]
    );

    // Wait for sender OK
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    // Wait a bit for any potential delivery
    await page.waitForTimeout(1000);

    // Verify NO EVENT delivery to receiver's subscription
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const deliveries = msgs.filter(m =>
      m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
      m.raw[1] === 'sub-deliver-revoke'
    );
    expect(deliveries.length).toBe(0);
  });

  // ─── relay:write × inter-pane emit ────────────────────────────────────────

  test('relay:write × inter-pane emit — grant succeeds', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclGrant__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003, tags: [['t', 'app:test-topic']],
          content: 'inter-pane grant', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  test('relay:write × inter-pane emit — revoke denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003, tags: [['t', 'app:test-topic']],
          content: 'inter-pane revoke', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('relay:write');
  });
});
