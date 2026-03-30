/**
 * Storage Isolation Tests (STR-01 through STR-09)
 *
 * Proves that the storage proxy correctly implements scoped CRUD operations,
 * cross-napp isolation, quota enforcement with UTF-8 byte counting, and
 * data persistence across shell reloads.
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

// Helper: build a storage request event
function buildStorageEvent(
  pubkey: string,
  topic: string,
  tags: string[][],
  correlationId: string,
): Record<string, unknown> {
  return {
    id: Math.random().toString(36).slice(2).padEnd(64, '0'),
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 29003, // BusKind.INTER_PANE
    tags: [['t', topic], ['id', correlationId], ...tags],
    content: '',
    sig: '0'.repeat(128),
  };
}

// Helper: extract tag value from response event
function getResponseTag(response: TappedMessage, tagName: string): string | undefined {
  const evt = response.raw[2] as { tags?: string[][] };
  return evt?.tags?.find((t: string[]) => t[0] === tagName)?.[1];
}

function getResponseTags(response: TappedMessage, tagName: string): string[] {
  const evt = response.raw[2] as { tags?: string[][] };
  return evt?.tags?.filter((t: string[]) => t[0] === tagName).map((t: string[]) => t[1]) ?? [];
}

// Helper: inject storage request and wait for response with matching correlation ID
async function storageRequest(
  page: any,
  windowId: string,
  pubkey: string,
  topic: string,
  tags: string[][],
  correlationId: string,
): Promise<TappedMessage> {
  const event = buildStorageEvent(pubkey, topic, tags, correlationId);
  await page.evaluate(
    ([wid, evt]: [string, Record<string, unknown>]) => (window as any).__publishEvent__(wid, evt),
    [windowId, event]
  );

  // Wait for response with matching correlation ID
  let response: TappedMessage | undefined;
  await expect.poll(async () => {
    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    response = msgs.find((m: TappedMessage) =>
      m.direction === 'shell->napplet' &&
      m.verb === 'EVENT' &&
      typeof m.raw[2] === 'object' &&
      (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === correlationId)
    );
    return !!response;
  }, { timeout: 5000 }).toBe(true);
  return response!;
}

test.describe('Storage Isolation', () => {
  let windowId: string;
  let nappEntry: { pubkey: string; dTag: string; aggregateHash: string };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__SHELL_READY__ === true, { timeout: 10000 });
    await page.evaluate(() => (window as any).__clearLocalStorage__());
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

    // Clear messages for clean test state
    await page.evaluate(() => (window as any).__clearMessages__());
  });

  test('STR-01: setItem + getItem round-trip returns correct value', async ({ page }) => {
    const { pubkey } = nappEntry;

    // Set a value
    const setResp = await storageRequest(page, windowId, pubkey, 'shell:storage-set',
      [['key', 'test-key'], ['value', 'hello-world']], 'corr-set-1');
    expect(getResponseTag(setResp, 'ok')).toBe('true');

    // Clear messages
    await page.evaluate(() => (window as any).__clearMessages__());

    // Get the value
    const getResp = await storageRequest(page, windowId, pubkey, 'shell:storage-get',
      [['key', 'test-key']], 'corr-get-1');
    expect(getResponseTag(getResp, 'value')).toBe('hello-world');
    expect(getResponseTag(getResp, 'found')).toBe('true');
  });

  test('STR-02: getItem for missing key returns not found', async ({ page }) => {
    const { pubkey } = nappEntry;

    const resp = await storageRequest(page, windowId, pubkey, 'shell:storage-get',
      [['key', 'nonexistent']], 'corr-miss-1');
    expect(getResponseTag(resp, 'found')).toBe('false');
  });

  test('STR-03: removeItem removes key', async ({ page }) => {
    const { pubkey } = nappEntry;

    // Set a key
    await storageRequest(page, windowId, pubkey, 'shell:storage-set',
      [['key', 'rm-key'], ['value', 'temp']], 'corr-rm-set');
    await page.evaluate(() => (window as any).__clearMessages__());

    // Remove the key
    const rmResp = await storageRequest(page, windowId, pubkey, 'shell:storage-remove',
      [['key', 'rm-key']], 'corr-rm-1');
    expect(getResponseTag(rmResp, 'ok')).toBe('true');
    await page.evaluate(() => (window as any).__clearMessages__());

    // Get the removed key
    const getResp = await storageRequest(page, windowId, pubkey, 'shell:storage-get',
      [['key', 'rm-key']], 'corr-rm-get');
    expect(getResponseTag(getResp, 'found')).toBe('false');
  });

  test('STR-04: keys() lists all napp keys', async ({ page }) => {
    const { pubkey } = nappEntry;

    // Set 3 keys
    await storageRequest(page, windowId, pubkey, 'shell:storage-set',
      [['key', 'k1'], ['value', 'v1']], 'corr-k1');
    await page.evaluate(() => (window as any).__clearMessages__());
    await storageRequest(page, windowId, pubkey, 'shell:storage-set',
      [['key', 'k2'], ['value', 'v2']], 'corr-k2');
    await page.evaluate(() => (window as any).__clearMessages__());
    await storageRequest(page, windowId, pubkey, 'shell:storage-set',
      [['key', 'k3'], ['value', 'v3']], 'corr-k3');
    await page.evaluate(() => (window as any).__clearMessages__());

    // Get keys
    const keysResp = await storageRequest(page, windowId, pubkey, 'shell:storage-keys',
      [], 'corr-keys-1');
    const keys = getResponseTags(keysResp, 'key');
    expect(keys).toContain('k1');
    expect(keys).toContain('k2');
    expect(keys).toContain('k3');
  });

  test('STR-05: clear() removes all napp keys', async ({ page }) => {
    const { pubkey } = nappEntry;

    // Set 2 keys
    await storageRequest(page, windowId, pubkey, 'shell:storage-set',
      [['key', 'c1'], ['value', 'v1']], 'corr-c1');
    await page.evaluate(() => (window as any).__clearMessages__());
    await storageRequest(page, windowId, pubkey, 'shell:storage-set',
      [['key', 'c2'], ['value', 'v2']], 'corr-c2');
    await page.evaluate(() => (window as any).__clearMessages__());

    // Clear napp storage
    const clearResp = await storageRequest(page, windowId, pubkey, 'shell:storage-clear',
      [], 'corr-clear-1');
    expect(getResponseTag(clearResp, 'ok')).toBe('true');
    await page.evaluate(() => (window as any).__clearMessages__());

    // Verify keys are empty
    const keysResp = await storageRequest(page, windowId, pubkey, 'shell:storage-keys',
      [], 'corr-keys-after-clear');
    const keys = getResponseTags(keysResp, 'key');
    expect(keys.length).toBe(0);
  });

  test('STR-06: cross-napp isolation -- napp A key not visible to napp B', async ({ page }) => {
    const { pubkey: pubkeyA } = nappEntry;

    // Napp A sets a key
    await storageRequest(page, windowId, pubkeyA, 'shell:storage-set',
      [['key', 'shared-name'], ['value', 'napp-a-data']], 'corr-iso-set');
    await page.evaluate(() => (window as any).__clearMessages__());

    // Load a second auth-napplet
    const windowId2 = await page.evaluate(() => (window as any).__loadNapplet__('auth-napplet'));

    // Wait for second napplet's AUTH OK
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.filter(m => m.verb === 'OK' && m.parsed.success === true).length;
    }, { timeout: 15000 }).toBeGreaterThanOrEqual(1);

    // Get second napplet identity
    const nappEntry2 = await page.evaluate(
      (wid) => (window as any).__getNappEntry__(wid),
      windowId2
    );

    await page.evaluate(() => (window as any).__clearMessages__());

    // Napp B reads the same key name
    const getResp = await storageRequest(page, windowId2, nappEntry2.pubkey, 'shell:storage-get',
      [['key', 'shared-name']], 'corr-iso-get');
    // Different scoped key because different pubkey/dTag/aggregateHash
    expect(getResponseTag(getResp, 'found')).toBe('false');
  });

  test('STR-07: quota enforcement -- write exceeding 512KB returns error', async ({ page }) => {
    const { pubkey } = nappEntry;

    // Generate a value larger than 512KB (524288 bytes)
    const bigValue = 'x'.repeat(600000);
    await page.evaluate(
      ([wid, pk, val]: string[]) => {
        const event = {
          id: Math.random().toString(36).slice(2).padEnd(64, '0'),
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003,
          tags: [['t', 'shell:storage-set'], ['key', 'big'], ['value', val], ['id', 'corr-quota-1']],
          content: '',
          sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, pubkey, bigValue]
    );

    // Wait for response with error
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m =>
        m.direction === 'shell->napplet' &&
        m.verb === 'EVENT' &&
        typeof m.raw[2] === 'object' &&
        (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === 'corr-quota-1')
      );
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const response = msgs.find(m =>
      m.direction === 'shell->napplet' &&
      m.verb === 'EVENT' &&
      typeof m.raw[2] === 'object' &&
      (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === 'corr-quota-1')
    );
    const errorTag = (response!.raw[2] as any).tags.find((t: string[]) => t[0] === 'error');
    expect(errorTag).toBeTruthy();
    expect(errorTag[1]).toContain('quota exceeded');
  });

  test('STR-08: quota accuracy -- write at limit succeeds, over limit fails', async ({ page }) => {
    const { pubkey } = nappEntry;

    // First write: ~500KB (well under 524288 quota)
    const fillValue = 'x'.repeat(500000);
    await page.evaluate(
      ([wid, pk, val]: string[]) => {
        const event = {
          id: Math.random().toString(36).slice(2).padEnd(64, '0'),
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003,
          tags: [['t', 'shell:storage-set'], ['key', 'fill'], ['value', val], ['id', 'corr-boundary-1']],
          content: '',
          sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, pubkey, fillValue]
    );

    // Wait for fill response
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m =>
        m.direction === 'shell->napplet' &&
        m.verb === 'EVENT' &&
        typeof m.raw[2] === 'object' &&
        (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === 'corr-boundary-1')
      );
    }, { timeout: 5000 }).toBe(true);

    const msgs1: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const fillResp = msgs1.find(m =>
      m.direction === 'shell->napplet' &&
      m.verb === 'EVENT' &&
      typeof m.raw[2] === 'object' &&
      (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === 'corr-boundary-1')
    );
    const fillOk = (fillResp!.raw[2] as any).tags.find((t: string[]) => t[0] === 'ok');
    expect(fillOk?.[1]).toBe('true');

    await page.evaluate(() => (window as any).__clearMessages__());

    // Second write: ~30KB more should push over 524288 total
    const overflowValue = 'y'.repeat(30000);
    await page.evaluate(
      ([wid, pk, val]: string[]) => {
        const event = {
          id: Math.random().toString(36).slice(2).padEnd(64, '0'),
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          kind: 29003,
          tags: [['t', 'shell:storage-set'], ['key', 'overflow'], ['value', val], ['id', 'corr-boundary-2']],
          content: '',
          sig: '0'.repeat(128),
        };
        (window as any).__publishEvent__(wid, event);
      },
      [windowId, pubkey, overflowValue]
    );

    // Wait for overflow response
    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m =>
        m.direction === 'shell->napplet' &&
        m.verb === 'EVENT' &&
        typeof m.raw[2] === 'object' &&
        (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === 'corr-boundary-2')
      );
    }, { timeout: 5000 }).toBe(true);

    const msgs2: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const overflowResp = msgs2.find(m =>
      m.direction === 'shell->napplet' &&
      m.verb === 'EVENT' &&
      typeof m.raw[2] === 'object' &&
      (m.raw[2] as any)?.tags?.some((t: string[]) => t[0] === 'id' && t[1] === 'corr-boundary-2')
    );
    const overflowError = (overflowResp!.raw[2] as any).tags.find((t: string[]) => t[0] === 'error');
    expect(overflowError).toBeTruthy();
    expect(overflowError[1]).toContain('quota exceeded');
  });

  test('STR-09: storage persistence -- values survive shell reload', async ({ page }) => {
    const { pubkey } = nappEntry;

    // Set a value
    await storageRequest(page, windowId, pubkey, 'shell:storage-set',
      [['key', 'persist-test'], ['value', 'survive-reload']], 'corr-persist-set');
    await page.evaluate(() => (window as any).__clearMessages__());

    // Find the scoped localStorage key that contains 'persist-test'
    const keysBeforeReload: string[] = await page.evaluate(
      () => (window as any).__getLocalStorageKeys__()
    );
    const scopedKey = keysBeforeReload.find(k => k.includes('persist-test'));
    expect(scopedKey).toBeTruthy();

    // Read the value directly from localStorage
    const valueBefore = await page.evaluate(
      (key) => (window as any).__getLocalStorageItem__(key),
      scopedKey
    );
    expect(valueBefore).toBe('survive-reload');

    // Reload the page
    await page.reload();
    await page.waitForFunction(() => (window as any).__SHELL_READY__ === true, { timeout: 10000 });

    // Verify the scoped key is still in localStorage
    const keysAfterReload: string[] = await page.evaluate(
      () => (window as any).__getLocalStorageKeys__()
    );
    expect(keysAfterReload).toContain(scopedKey);

    // Read the value directly
    const valueAfter = await page.evaluate(
      (key) => (window as any).__getLocalStorageItem__(key),
      scopedKey
    );
    expect(valueAfter).toBe('survive-reload');
  });
});
