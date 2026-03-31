/**
 * ACL Enforcement Tests (ACL-01 through ACL-09)
 *
 * Proves that the ACL system correctly implements the permissive-by-default
 * policy, honors grant/revoke/block/unblock operations immediately, and
 * survives persist/load round-trips.
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

test.describe('ACL Enforcement', () => {
  let windowId: string;
  let nappEntry: { pubkey: string; dTag: string; aggregateHash: string };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__ === true, { timeout: 10000 });
    await page.evaluate(() => (window as any).__aclClear__());
    await page.evaluate(() => (window as any).__clearLocalStorage__());

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

    // Clear messages for clean test state
    await page.evaluate(() => (window as any).__clearMessages__());
  });

  test('ACL-01: default permissive -- unknown napp operates successfully', async ({ page }) => {
    // Auth'd napplet with no explicit ACL entry should have all capabilities
    // Use a bus kind subscription (29003) to avoid relay pool EOSE timing issues
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-acl-01', [{ kinds: [29003] }]),
      [windowId]
    );

    // Brief wait for any potential CLOSED denial
    await page.waitForTimeout(500);

    // Verify no CLOSED with denial -- subscription was accepted
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const closed = msgs.find(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    expect(closed).toBeUndefined();

    // Also verify via aclCheck that default returns true
    const { pubkey, dTag, aggregateHash } = nappEntry;
    const check = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:read'),
      [pubkey, dTag, aggregateHash]
    );
    expect(check).toBe(true);
  });

  test('ACL-02: explicit grant relay:write -- publish succeeds', async ({ page }) => {
    const { pubkey, dTag, aggregateHash } = nappEntry;

    // Explicitly grant relay:write
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclGrant__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Publish an event
    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid,
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1,
          tags: [],
          content: 'acl-02 test',
          sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    // Wait for OK response
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.direction === 'shell->napplet' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);
  });

  test('ACL-03: revoke relay:write -- publish denied', async ({ page }) => {
    const { pubkey, dTag, aggregateHash } = nappEntry;

    // Revoke relay:write
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Try to publish
    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid,
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1,
          tags: [],
          content: 'acl-03 test',
          sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    // Wait for OK response
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.direction === 'shell->napplet' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('denied: relay:write');
  });

  test('ACL-04: block entire napp -- all operations denied', async ({ page }) => {
    const { pubkey, dTag, aggregateHash } = nappEntry;

    // Block the napp
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    // Try to create a subscription -- should be denied
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-blocked', [{ kinds: [1] }]),
      [windowId]
    );

    // Wait for CLOSED response (blocked napp gets relay:read denied)
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const closed = msgs.find(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    expect(closed).toBeTruthy();
    // Blocked napp has no capabilities, so relay:read check fails
    expect(closed!.raw[2]).toContain('denied');
  });

  test('ACL-05: unblock previously blocked napp -- operations resume', async ({ page }) => {
    const { pubkey, dTag, aggregateHash } = nappEntry;

    // Block then unblock
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclBlock__(p, d, h);
        (window as any).__aclUnblock__(p, d, h);
      },
      [pubkey, dTag, aggregateHash]
    );

    // Create subscription using bus kind to avoid relay pool EOSE timing
    await page.evaluate(
      ([wid]) => (window as any).__createSubscription__(wid, 'sub-unblocked', [{ kinds: [29003] }]),
      [windowId]
    );

    // Brief wait for any potential CLOSED denial
    await page.waitForTimeout(500);

    // Verify no CLOSED -- subscription accepted after unblock
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const closed = msgs.find(m => m.verb === 'CLOSED' && m.direction === 'shell->napplet');
    expect(closed).toBeUndefined();

    // Also verify aclCheck confirms the napp is not blocked
    const check = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:read'),
      [pubkey, dTag, aggregateHash]
    );
    expect(check).toBe(true);
  });

  test('ACL-06: revoke state:read -- getItem denied', async ({ page }) => {
    const { pubkey, dTag, aggregateHash } = nappEntry;

    // Revoke state:read
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:read'),
      [pubkey, dTag, aggregateHash]
    );

    // Send a state-get request -- enforce gate denies at the EVENT handler level
    // with an OK false response (state-proxy is never reached)
    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid,
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003,
          tags: [['t', 'shell:state-get'], ['key', 'test-key'], ['id', 'corr-acl06']],
          content: '',
          sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    // Wait for OK response with denial
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.direction === 'shell->napplet' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('denied: state:read');
  });

  test('ACL-07: revoke state:write -- setItem denied', async ({ page }) => {
    const { pubkey, dTag, aggregateHash } = nappEntry;

    // Revoke state:write
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Send a state-set request -- enforce gate denies at the EVENT handler level
    // with an OK false response (state-proxy is never reached)
    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, eid, pk]) => {
        const event = {
          id: eid,
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003,
          tags: [['t', 'shell:state-set'], ['key', 'test-key'], ['value', 'test-val'], ['id', 'corr-acl07']],
          content: '',
          sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, eventId, pubkey]
    );

    // Wait for OK response with denial
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.direction === 'shell->napplet' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('denied: state:write');
  });

  test('ACL-08: revoke sign:event -- signer request denied', async ({ page }) => {
    const { pubkey, dTag, aggregateHash } = nappEntry;

    // Configure a mock signer first
    await page.evaluate(() => {
      (window as any).__setSigner__({
        getPublicKey: () => 'a'.repeat(64),
        signEvent: (e: any) => Promise.resolve(e),
        getRelays: () => ({}),
      });
    });

    // Revoke sign:event
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'sign:event'),
      [pubkey, dTag, aggregateHash]
    );

    // Send a signer request
    const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
    await page.evaluate(
      ([wid, pk, eid]) => {
        const event = {
          id: eid,
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29001,
          tags: [['method', 'getPublicKey'], ['id', 'corr-acl08']],
          content: '',
          sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, pubkey, eventId]
    );

    // Wait for OK false -- enforce gate checks sign:event capability in handleEvent
    // before the signer handler is reached. Returns 'denied: sign:event'.
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.direction === 'shell->napplet' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('denied: sign:event');
  });

  test('ACL-09: persist/load round-trip -- ACL state survives', async ({ page }) => {
    const { pubkey, dTag, aggregateHash } = nappEntry;

    // Revoke relay:write to create a non-default ACL state
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    // Verify revoke took effect
    const checkBefore = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(checkBefore).toBe(false);

    // Persist to localStorage
    await page.evaluate(() => (window as any).__aclPersist__());

    // Verify localStorage has the data
    const raw = await page.evaluate(() => (window as any).__getLocalStorageItem__('napplet:acl'));
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    // New ACL format: { defaultPolicy, entries: { compositeKey: { caps, blocked, quota } } }
    expect(typeof parsed).toBe('object');
    expect(parsed.defaultPolicy).toBe('permissive');
    expect(typeof parsed.entries).toBe('object');
    // There should be at least one entry (the one we revoked from)
    const keys = Object.keys(parsed.entries);
    expect(keys.length).toBeGreaterThan(0);

    // Save the persisted value, clear the store (which removes from localStorage too),
    // then restore just the localStorage value to simulate a fresh load
    const savedRaw = raw;
    await page.evaluate(() => (window as any).__aclClear__());

    // Verify default permissive now (store empty, localStorage cleared)
    const checkAfterClear = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(checkAfterClear).toBe(true);

    // Restore the localStorage value (simulates having persisted data still on disk)
    await page.evaluate(
      (val) => (window as any).__setLocalStorageItem__('napplet:acl', val),
      savedRaw
    );

    // Load from localStorage
    await page.evaluate(() => (window as any).__aclLoad__());

    // Verify revoked state is restored
    const checkAfterLoad = await page.evaluate(
      ([p, d, h]) => (window as any).__aclCheck__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );
    expect(checkAfterLoad).toBe(false);
  });
});
