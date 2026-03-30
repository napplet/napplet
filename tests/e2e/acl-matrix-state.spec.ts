/**
 * ACL Matrix — State Capabilities (state:read, state:write)
 *
 * Tests every capability × action cell for state operations:
 * - state:read × state-get, state-keys
 * - state:write × state-set, state-remove, state-clear
 * - block/unblock for both state:read and state:write
 *
 * State operations arrive as EVENT kind 29003 with shell:state-* topics.
 * The enforce gate in resolveCapabilities() maps these to state:read or state:write
 * directly, bypassing the relay:write check that generic events would hit.
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
        kind: 29003,
        tags,
        content: '',
        sig: '0'.repeat(128),
      };
      (window as any).__publishEvent__(wid, event);
    },
    [windowId, pubkey, topic, corrId, JSON.stringify(extraTags)]
  );
}

async function waitForStateResponse(
  page: any, corrId: string
): Promise<{ tags: string[][]; hasError: boolean; errorMsg?: string }> {
  await expect.poll(async () => {
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    return msgs.some(m =>
      m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
      typeof m.raw[2] === 'object' &&
      (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === corrId)
    );
  }, { timeout: 5000 }).toBe(true);

  const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
  const response = msgs.find(m =>
    m.verb === 'EVENT' && m.direction === 'shell->napplet' &&
    typeof m.raw[2] === 'object' &&
    (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === corrId)
  );
  const respEvt = response!.raw[2] as { tags?: string[][] };
  const tags = respEvt.tags ?? [];
  const errorTag = tags.find(t => t[0] === 'error');
  return {
    tags,
    hasError: !!errorTag,
    errorMsg: errorTag?.[1],
  };
}

test.describe('ACL Matrix — State Capabilities', () => {
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

  // ─── state:read × state-get ────────────────────────────────────────────────

  test('state:read × state-get — grant succeeds', async ({ page }) => {
    // state:read is granted by default
    await sendStateRequest(page, windowId, pubkey, 'shell:state-get', 'corr-sr-01', [['key', 'test-key']]);
    const resp = await waitForStateResponse(page, 'corr-sr-01');
    expect(resp.hasError).toBe(false);
  });

  test('state:read × state-get — revoke denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:read'),
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-get', 'corr-sr-02', [['key', 'test-key']]);

    // When state:read is revoked, the enforce gate denies with OK false
    // (state operations go through handleEvent which sends OK false on denial)
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('state:read');
  });

  // ─── state:read × state-keys ──────────────────────────────────────────────

  test('state:read × state-keys — grant succeeds', async ({ page }) => {
    await sendStateRequest(page, windowId, pubkey, 'shell:state-keys', 'corr-sr-03', []);
    const resp = await waitForStateResponse(page, 'corr-sr-03');
    expect(resp.hasError).toBe(false);
  });

  test('state:read × state-keys — revoke denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:read'),
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-keys', 'corr-sr-04', []);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('state:read');
  });

  // ─── state:read × block/unblock ───────────────────────────────────────────

  test('state:read × block denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-get', 'corr-sr-05', [['key', 'test-key']]);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok).toBeTruthy();
  });

  test('state:read × unblock restores', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclBlock__(p, d, h);
        (window as any).__aclUnblock__(p, d, h);
      },
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-get', 'corr-sr-06', [['key', 'test-key']]);
    const resp = await waitForStateResponse(page, 'corr-sr-06');
    expect(resp.hasError).toBe(false);
  });

  // ─── state:write × state-set ──────────────────────────────────────────────

  test('state:write × state-set — grant succeeds', async ({ page }) => {
    await sendStateRequest(page, windowId, pubkey, 'shell:state-set', 'corr-sw-01', [['key', 'test-key'], ['value', 'test-val']]);
    const resp = await waitForStateResponse(page, 'corr-sw-01');
    expect(resp.hasError).toBe(false);
    const okTag = resp.tags.find(t => t[0] === 'ok');
    expect(okTag).toBeTruthy();
    expect(okTag![1]).toBe('true');
  });

  test('state:write × state-set — revoke denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:write'),
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-set', 'corr-sw-02', [['key', 'test-key'], ['value', 'test-val']]);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('state:write');
  });

  // ─── state:write × state-remove ───────────────────────────────────────────

  test('state:write × state-remove — grant succeeds', async ({ page }) => {
    // First set a key so there's something to remove
    await sendStateRequest(page, windowId, pubkey, 'shell:state-set', 'corr-sw-03a', [['key', 'remove-me'], ['value', 'val']]);
    await waitForStateResponse(page, 'corr-sw-03a');
    await page.evaluate(() => (window as any).__clearMessages__());

    await sendStateRequest(page, windowId, pubkey, 'shell:state-remove', 'corr-sw-03', [['key', 'remove-me']]);
    const resp = await waitForStateResponse(page, 'corr-sw-03');
    expect(resp.hasError).toBe(false);
  });

  test('state:write × state-remove — revoke denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:write'),
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-remove', 'corr-sw-04', [['key', 'test-key']]);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('state:write');
  });

  // ─── state:write × state-clear ────────────────────────────────────────────

  test('state:write × state-clear — grant succeeds', async ({ page }) => {
    await sendStateRequest(page, windowId, pubkey, 'shell:state-clear', 'corr-sw-05', []);
    const resp = await waitForStateResponse(page, 'corr-sw-05');
    expect(resp.hasError).toBe(false);
  });

  test('state:write × state-clear — revoke denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'state:write'),
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-clear', 'corr-sw-06', []);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.parsed.success === false);
    expect(ok!.parsed.reason).toContain('state:write');
  });

  // ─── state:write × block/unblock ──────────────────────────────────────────

  test('state:write × block denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-set', 'corr-sw-07', [['key', 'test-key'], ['value', 'test-val']]);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.parsed.success === false);
    }, { timeout: 5000 }).toBe(true);
  });

  test('state:write × unblock restores', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclBlock__(p, d, h);
        (window as any).__aclUnblock__(p, d, h);
      },
      [pubkey, dTag, aggregateHash]
    );

    await sendStateRequest(page, windowId, pubkey, 'shell:state-set', 'corr-sw-08', [['key', 'test-key'], ['value', 'test-val']]);
    const resp = await waitForStateResponse(page, 'corr-sw-08');
    expect(resp.hasError).toBe(false);
  });
});
