/**
 * ACL Lifecycle — Dynamic State Transitions
 *
 * Tests proving that ACL changes take effect immediately, total revocation
 * produces zero message flow, and ACL state survives persistence round-trips.
 *
 * Requirements covered:
 * - TST-04: Mid-session revoke stops delivery on the very next message
 * - TST-05: Revoke ALL capabilities = zero non-denial messages
 * - TST-06: Persist/reload/verify round-trip
 * - TST-03: Additional block/unblock lifecycle coverage
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

async function publishEvent(
  page: any, windowId: string, pubkey: string, kind: number = 1, extraTags: string[][] = []
): Promise<string> {
  const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
  await page.evaluate(
    ([wid, pk, eid, k, tagsJson]: string[]) => {
      const event = {
        id: eid, pubkey: pk,
        created_at: Math.floor(Date.now() / 1000),
        kind: parseInt(k), tags: JSON.parse(tagsJson),
        content: 'lifecycle test', sig: '0'.repeat(128),
      };
      (window as any).__publishEvent__(wid, event);
    },
    [windowId, pubkey, eventId, String(kind), JSON.stringify(extraTags)]
  );
  return eventId;
}

async function waitForOk(page: any, eventId: string): Promise<TappedMessage> {
  await expect.poll(async () => {
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
  }, { timeout: 5000 }).toBe(true);
  const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
  return msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId)!;
}

async function sendStateRequest(
  page: any, windowId: string, pubkey: string,
  topic: string, corrId: string, extraTags: string[][] = []
): Promise<void> {
  await page.evaluate(
    ([wid, pk, t, cid, tagsJson]: string[]) => {
      const tags = [['t', t], ['id', cid], ...JSON.parse(tagsJson)];
      const event = {
        id: Math.random().toString(36).slice(2).padEnd(64, '0'),
        pubkey: pk,
        created_at: Math.floor(Date.now() / 1000),
        kind: 29003, tags, content: '', sig: '0'.repeat(128),
      };
      (window as any).__publishEvent__(wid, event);
    },
    [windowId, pubkey, topic, corrId, JSON.stringify(extraTags)]
  );
}

test.describe('ACL Lifecycle — Dynamic State Transitions', () => {
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

  // ─── TST-04: Mid-Session Revoke Tests ──────────────────────────────────────

  test('TST-04: mid-session relay:write revoke — publish blocked after revoke', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Publish succeeds initially
    const eventId1 = await publishEvent(page, windowId, pubkey);
    const ok1 = await waitForOk(page, eventId1);
    expect(ok1.parsed.success).toBe(true);

    await page.evaluate(() => (window as any).__clearMessages__());

    // Revoke relay:write mid-session
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Next publish is denied immediately
    const eventId2 = await publishEvent(page, windowId, pubkey);
    const ok2 = await waitForOk(page, eventId2);
    expect(ok2.parsed.success).toBe(false);
    expect(ok2.parsed.reason).toContain('relay:write');
  });

  test('TST-04: mid-session relay:read revoke — subscription delivery blocked after revoke', async ({ page }) => {
    const sender = await loadAndAuth(page);
    const receiver = await loadAndAuth(page);

    // Receiver subscribes to topic
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-lifecycle-read', [{ kinds: [29003], '#t': ['lifecycle-test'] }]),
      [receiver.windowId]
    );

    await page.evaluate(() => (window as any).__clearMessages__());

    // Sender publishes — receiver should get delivery
    const eventId1 = await publishEvent(page, sender.windowId, sender.pubkey, 29003, [['t', 'lifecycle-test']]);

    // Wait for delivery to receiver
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m =>
        m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
        m.raw[1] === 'sub-lifecycle-read'
      );
    }, { timeout: 5000 }).toBe(true);

    await page.evaluate(() => (window as any).__clearMessages__());

    // Revoke relay:read on receiver mid-session
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:read'),
      [receiver.nappEntry.pubkey, receiver.nappEntry.dTag, receiver.nappEntry.aggregateHash]
    );

    // Sender publishes again
    const eventId2 = await publishEvent(page, sender.windowId, sender.pubkey, 29003, [['t', 'lifecycle-test']]);

    // Wait for sender's OK
    await waitForOk(page, eventId2);

    // Wait to be sure no delivery happens
    await page.waitForTimeout(1500);

    // Verify NO delivery to receiver
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const deliveries = msgs.filter(m =>
      m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
      m.raw[1] === 'sub-lifecycle-read'
    );
    expect(deliveries.length).toBe(0);
  });

  test('TST-04: mid-session state:write revoke — state-set blocked after revoke', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // State-set succeeds initially
    await sendStateRequest(page, windowId, pubkey, 'shell:state-set', 'corr-mid-01', [['key', 'test-key'], ['value', 'first']]);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m =>
        m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
        typeof m.raw[2] === 'object' &&
        (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === 'corr-mid-01')
      );
    }, { timeout: 5000 }).toBe(true);

    await page.evaluate(() => (window as any).__clearMessages__());

    // Revoke state:write mid-session
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Next state-set is denied
    await sendStateRequest(page, windowId, pubkey, 'shell:state-set', 'corr-mid-02', [['key', 'test-key'], ['value', 'second']]);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('state:write');
  });

  test('TST-04: mid-session sign:event revoke — signer request blocked after revoke', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Configure mock signer
    await page.evaluate(() => {
      (window as any).__setSigner__({
        getPublicKey: () => 'a'.repeat(64),
        signEvent: (e: any) => Promise.resolve(e),
        getRelays: () => ({}),
      });
    });

    // Signer request succeeds initially
    const eventId1 = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, pk, eid]: string[]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29001, tags: [['method', 'getPublicKey'], ['id', 'corr-mid-sign-01']],
          content: '', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, pubkey, eventId1]
    );
    const ok1 = await waitForOk(page, eventId1);
    expect(ok1.parsed.success).toBe(true);

    await page.evaluate(() => (window as any).__clearMessages__());

    // Revoke sign:event mid-session
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'sign:event'),
      [pubkey, dTag, aggregateHash]
    );

    // Next signer request is denied
    const eventId2 = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, pk, eid]: string[]) => {
        const event = {
          id: eid, pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29001, tags: [['method', 'getPublicKey'], ['id', 'corr-mid-sign-02']],
          content: '', sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, pubkey, eventId2]
    );
    const ok2 = await waitForOk(page, eventId2);
    expect(ok2.parsed.success).toBe(false);
    expect(ok2.parsed.reason).toContain('sign:event');
  });

  test('TST-04: mid-session block — all operations blocked immediately', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Publish succeeds initially
    const eventId1 = await publishEvent(page, windowId, pubkey);
    const ok1 = await waitForOk(page, eventId1);
    expect(ok1.parsed.success).toBe(true);

    await page.evaluate(() => (window as any).__clearMessages__());

    // Block the napp mid-session
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    // Publish is denied
    const eventId2 = await publishEvent(page, windowId, pubkey);
    const ok2 = await waitForOk(page, eventId2);
    expect(ok2.parsed.success).toBe(false);

    // Subscription is denied
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-block-mid', [{ kinds: [29003] }]),
      [windowId]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const closed = msgs.find(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    expect(closed!.raw[2]).toContain('denied');
  });

  // ─── TST-05: Revoke ALL Capabilities ───────────────────────────────────────

  test('TST-05: revoke ALL capabilities — zero messages delivered to napplet', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Revoke every capability
    const allCaps = [
      'relay:read', 'relay:write', 'cache:read', 'cache:write',
      'hotkey:forward', 'sign:event', 'sign:nip04', 'sign:nip44',
      'state:read', 'state:write',
    ];
    for (const cap of allCaps) {
      await page.evaluate(
        ([p, d, h, c]) => (window as any).__aclRevoke__(p, d, h, c),
        [pubkey, dTag, aggregateHash, cap]
      );
    }

    await page.evaluate(() => (window as any).__clearMessages__());

    // Attempt publish — denied (relay:write revoked)
    const eventId = await publishEvent(page, windowId, pubkey);
    await waitForOk(page, eventId);

    // Attempt subscribe — denied (relay:read revoked)
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-revoke-all', [{ kinds: [29003] }]),
      [windowId]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    }, { timeout: 5000 }).toBe(true);

    // Wait to be sure
    await page.waitForTimeout(1000);

    // Count all shell->napplet messages that are NOT denial responses
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const nonDenialMessages = msgs.filter(m =>
      m.direction === 'shell->napplet' &&
      !(m.verb === 'OK' && m.parsed.success === false) &&
      !(m.verb === 'CLOSED')
    );
    expect(nonDenialMessages.length).toBe(0);

    // Verify every capability returns false
    for (const cap of allCaps) {
      const check = await page.evaluate(
        ([p, d, h, c]) => (window as any).__aclCheck__(p, d, h, c),
        [pubkey, dTag, aggregateHash, cap]
      );
      expect(check).toBe(false);
    }
  });

  test('TST-05: revoke ALL then re-grant relay:write — only publish works', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Revoke all capabilities
    const allCaps = [
      'relay:read', 'relay:write', 'cache:read', 'cache:write',
      'hotkey:forward', 'sign:event', 'sign:nip04', 'sign:nip44',
      'state:read', 'state:write',
    ];
    for (const cap of allCaps) {
      await page.evaluate(
        ([p, d, h, c]) => (window as any).__aclRevoke__(p, d, h, c),
        [pubkey, dTag, aggregateHash, cap]
      );
    }

    // Re-grant only relay:write
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclGrant__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    await page.evaluate(() => (window as any).__clearMessages__());

    // Publish succeeds (relay:write re-granted)
    const eventId = await publishEvent(page, windowId, pubkey);
    const ok = await waitForOk(page, eventId);
    expect(ok.parsed.success).toBe(true);

    // Subscribe fails (relay:read still revoked)
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-partial-regrant', [{ kinds: [29003] }]),
      [windowId]
    );

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    }, { timeout: 5000 }).toBe(true);
  });

  // ─── TST-06: ACL State Persistence ─────────────────────────────────────────

  test('TST-06: revoke persists across simulated reload', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Revoke relay:write
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Verify revoked
    const checkBefore = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(checkBefore).toBe(false);

    // Persist to localStorage
    await page.evaluate(() => (window as any).__aclPersist__());

    // Save the raw persisted value
    const savedRaw = await page.evaluate(() => (window as any).__getLocalStorageItem__('napplet:acl'));
    expect(savedRaw).not.toBeNull();

    // Clear ACL store (simulates reload)
    await page.evaluate(() => (window as any).__aclClear__());

    // Verify permissive default after clear
    const checkAfterClear = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(checkAfterClear).toBe(true);

    // Restore localStorage value
    await page.evaluate(
      (val) => (window as any).__setLocalStorageItem__('napplet:acl', val),
      savedRaw
    );

    // Load from localStorage
    await page.evaluate(() => (window as any).__aclLoad__());

    // Verify revoke restored
    const checkAfterLoad = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(checkAfterLoad).toBe(false);
  });

  test('TST-06: block persists across simulated reload', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Block the napp
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    // Verify blocked
    const blocked = await page.evaluate(
      ([p, d, h]) => {
        const entry = (window as any).__aclGetEntry__(p, d, h);
        return entry?.blocked;
      },
      [pubkey, dTag, aggregateHash]
    );
    expect(blocked).toBe(true);

    // Persist
    await page.evaluate(() => (window as any).__aclPersist__());
    const savedRaw = await page.evaluate(() => (window as any).__getLocalStorageItem__('napplet:acl'));

    // Clear store
    await page.evaluate(() => (window as any).__aclClear__());

    // Restore and load
    await page.evaluate(
      (val) => (window as any).__setLocalStorageItem__('napplet:acl', val),
      savedRaw
    );
    await page.evaluate(() => (window as any).__aclLoad__());

    // Verify still blocked
    const blockedAfterLoad = await page.evaluate(
      ([p, d, h]) => {
        const entry = (window as any).__aclGetEntry__(p, d, h);
        return entry?.blocked;
      },
      [pubkey, dTag, aggregateHash]
    );
    expect(blockedAfterLoad).toBe(true);
  });

  test('TST-06: multiple capability revokes persist correctly', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Revoke relay:write and state:write
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclRevoke__(p, d, h, 'relay:write');
        (window as any).__aclRevoke__(p, d, h, 'state:write');
      },
      [pubkey, dTag, aggregateHash]
    );

    // Explicitly grant sign:event (already granted by default, but make it explicit)
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclGrant__(p, d, h, 'sign:event'),
      [pubkey, dTag, aggregateHash]
    );

    // Persist
    await page.evaluate(() => (window as any).__aclPersist__());
    const savedRaw = await page.evaluate(() => (window as any).__getLocalStorageItem__('napplet:acl'));

    // Clear and reload
    await page.evaluate(() => (window as any).__aclClear__());
    await page.evaluate(
      (val) => (window as any).__setLocalStorageItem__('napplet:acl', val),
      savedRaw
    );
    await page.evaluate(() => (window as any).__aclLoad__());

    // Verify correct state restored
    const relayWrite = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(relayWrite).toBe(false);

    const stateWrite = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'state:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(stateWrite).toBe(false);

    const signEvent = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'sign:event'),
      [pubkey, dTag, aggregateHash]
    );
    expect(signEvent).toBe(true);

    const relayRead = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:read'),
      [pubkey, dTag, aggregateHash]
    );
    expect(relayRead).toBe(true);
  });

  test('TST-06: persistence round-trip with behavioral verification', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Revoke relay:write
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Persist, clear, restore, load
    await page.evaluate(() => (window as any).__aclPersist__());
    const savedRaw = await page.evaluate(() => (window as any).__getLocalStorageItem__('napplet:acl'));
    await page.evaluate(() => (window as any).__aclClear__());
    await page.evaluate(
      (val) => (window as any).__setLocalStorageItem__('napplet:acl', val),
      savedRaw
    );
    await page.evaluate(() => (window as any).__aclLoad__());

    await page.evaluate(() => (window as any).__clearMessages__());

    // Actually attempt publish — should be denied (behavioral verification)
    const eventId = await publishEvent(page, windowId, pubkey);
    const ok = await waitForOk(page, eventId);
    expect(ok.parsed.success).toBe(false);
    expect(ok.parsed.reason).toContain('relay:write');
  });

  // ─── TST-03: Block/Unblock Lifecycle ───────────────────────────────────────

  test('TST-03: block during active subscription — delivery stops', async ({ page }) => {
    const sender = await loadAndAuth(page);
    const receiver = await loadAndAuth(page);

    // Receiver subscribes to topic
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-block-active', [{ kinds: [29003], '#t': ['block-lifecycle'] }]),
      [receiver.windowId]
    );

    await page.evaluate(() => (window as any).__clearMessages__());

    // Sender publishes — receiver gets delivery
    const eventId1 = await publishEvent(page, sender.windowId, sender.pubkey, 29003, [['t', 'block-lifecycle']]);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m =>
        m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
        m.raw[1] === 'sub-block-active'
      );
    }, { timeout: 5000 }).toBe(true);

    await page.evaluate(() => (window as any).__clearMessages__());

    // Block receiver
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [receiver.nappEntry.pubkey, receiver.nappEntry.dTag, receiver.nappEntry.aggregateHash]
    );

    // Sender publishes again
    const eventId2 = await publishEvent(page, sender.windowId, sender.pubkey, 29003, [['t', 'block-lifecycle']]);
    await waitForOk(page, eventId2);

    await page.waitForTimeout(1500);

    // Verify NO delivery to receiver after block
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const deliveries = msgs.filter(m =>
      m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
      m.raw[1] === 'sub-block-active'
    );
    expect(deliveries.length).toBe(0);
  });

  test('TST-03: unblock after block — delivery resumes', async ({ page }) => {
    const sender = await loadAndAuth(page);
    const receiver = await loadAndAuth(page);

    // Receiver subscribes
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-unblock-resume', [{ kinds: [29003], '#t': ['unblock-lifecycle'] }]),
      [receiver.windowId]
    );

    // Block receiver
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [receiver.nappEntry.pubkey, receiver.nappEntry.dTag, receiver.nappEntry.aggregateHash]
    );

    // Sender publishes while blocked (should not deliver)
    const eventId1 = await publishEvent(page, sender.windowId, sender.pubkey, 29003, [['t', 'unblock-lifecycle']]);
    await waitForOk(page, eventId1);

    await page.evaluate(() => (window as any).__clearMessages__());

    // Unblock receiver
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclUnblock__(p, d, h),
      [receiver.nappEntry.pubkey, receiver.nappEntry.dTag, receiver.nappEntry.aggregateHash]
    );

    // Sender publishes again — delivery should resume
    const eventId2 = await publishEvent(page, sender.windowId, sender.pubkey, 29003, [['t', 'unblock-lifecycle']]);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m =>
        m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
        m.raw[1] === 'sub-unblock-resume'
      );
    }, { timeout: 5000 }).toBe(true);
  });

  test('TST-03: block preserves capabilities — unblock restores original grants', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;

    // Revoke state:write first (so capabilities are not all-default)
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Block the napp
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    // Unblock the napp
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclUnblock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    // Verify state:write is still revoked (block/unblock did not reset capabilities)
    const stateWrite = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'state:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(stateWrite).toBe(false);

    // Verify relay:read is still granted
    const relayRead = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:read'),
      [pubkey, dTag, aggregateHash]
    );
    expect(relayRead).toBe(true);
  });
});
