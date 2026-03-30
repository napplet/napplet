/**
 * ACL Matrix — Hotkey Capability (hotkey:forward)
 *
 * Tests the hotkey:forward capability enforcement:
 * - hotkey:forward × hotkey — grant succeeds (executeHotkeyFromForward called)
 * - hotkey:forward × hotkey — revoke denies (silently skipped, OK still sent)
 * - hotkey:forward × block/unblock
 * - relay:write → hotkey dependency
 *
 * The hotkey forwarding path in shell-bridge.ts:
 * 1. handleEvent() receives kind 29004 (BusKind.HOTKEY_FORWARD)
 * 2. resolveCapabilities() maps to hotkey:forward
 * 3. enforce gate checks hotkey:forward
 * 4. If passes, handleHotkeyForward() calls hooks.hotkeys.executeHotkeyFromForward()
 * 5. sendOk(true, '') after the switch statement
 *
 * When hotkey:forward is denied, the enforce gate returns deny and handleEvent
 * sends OK false with 'denied: hotkey:forward'. The handler is never reached.
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

async function sendHotkeyEvent(page: any, windowId: string, pubkey: string): Promise<string> {
  const eventId = Math.random().toString(36).slice(2).padEnd(64, '0');
  await page.evaluate(
    ([wid, pk, eid]: string[]) => {
      const event = {
        id: eid,
        pubkey: pk,
        created_at: Math.floor(Date.now() / 1000),
        kind: 29004,
        tags: [['key', 'k'], ['code', 'KeyK'], ['ctrl', '1'], ['alt', '0'], ['shift', '0'], ['meta', '0']],
        content: '',
        sig: '0'.repeat(128),
      };
      (window as any).__publishEvent__(wid, event);
    },
    [windowId, pubkey, eventId]
  );
  return eventId;
}

test.describe('ACL Matrix — Hotkey Capability', () => {
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

  test('hotkey:forward × hotkey — grant succeeds', async ({ page }) => {
    // hotkey:forward is granted by default (permissive policy)
    const executionsBefore: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );

    const eventId = await sendHotkeyEvent(page, windowId, pubkey);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);

    // Verify the hotkey handler was called
    const callLog = await page.evaluate(() => (window as any).__getMockHooks__().callLog);
    expect(callLog.hotkeyExecutions.length).toBeGreaterThan(executionsBefore);
    expect(callLog.hotkeyExecutions[callLog.hotkeyExecutions.length - 1].key).toBe('k');
    expect(callLog.hotkeyExecutions[callLog.hotkeyExecutions.length - 1].code).toBe('KeyK');
  });

  test('hotkey:forward × hotkey — revoke denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'hotkey:forward'),
      [pubkey, dTag, aggregateHash]
    );

    const executionsBefore: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );

    const eventId = await sendHotkeyEvent(page, windowId, pubkey);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    // Enforce gate catches the denial before the handler is reached
    expect(ok!.parsed.success).toBe(false);
    expect(ok!.parsed.reason).toContain('hotkey:forward');

    // Verify no hotkey execution occurred
    const executionsAfter: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );
    expect(executionsAfter).toBe(executionsBefore);
  });

  test('hotkey:forward × hotkey — block denies', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclBlock__(p, d, h),
      [pubkey, dTag, aggregateHash]
    );

    const executionsBefore: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );

    const eventId = await sendHotkeyEvent(page, windowId, pubkey);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(false);

    // No hotkey execution for blocked napp
    const executionsAfter: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );
    expect(executionsAfter).toBe(executionsBefore);
  });

  test('hotkey:forward × hotkey — unblock restores', async ({ page }) => {
    const { dTag, aggregateHash } = nappEntry;
    await page.evaluate(
      ([p, d, h]) => {
        (window as any).__aclBlock__(p, d, h);
        (window as any).__aclUnblock__(p, d, h);
      },
      [pubkey, dTag, aggregateHash]
    );

    const executionsBefore: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );

    const eventId = await sendHotkeyEvent(page, windowId, pubkey);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    expect(ok!.parsed.success).toBe(true);

    // Hotkey execution restored after unblock
    const executionsAfter: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );
    expect(executionsAfter).toBeGreaterThan(executionsBefore);
  });

  test('hotkey:forward — relay:write is not required (hotkey:forward is sufficient)', async ({ page }) => {
    // Verify that hotkey forwarding uses hotkey:forward capability directly,
    // not relay:write. The enforce gate maps kind 29004 to hotkey:forward.
    const { dTag, aggregateHash } = nappEntry;

    // Revoke relay:write but keep hotkey:forward
    await page.evaluate(
      ([p, d, h]) => (window as any).__aclRevoke__(p, d, h, 'relay:write'),
      [pubkey, dTag, aggregateHash]
    );

    const executionsBefore: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );

    const eventId = await sendHotkeyEvent(page, windowId, pubkey);

    await expect.poll(async () => {
      const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
      return msgs.some(m => m.verb === 'OK' && m.raw[1] === eventId);
    }, { timeout: 5000 }).toBe(true);

    const msgs: TappedMessage[] = await page.evaluate(() => (window as any).__TEST_MESSAGES__);
    const ok = msgs.find(m => m.verb === 'OK' && m.raw[1] === eventId);
    // hotkey:forward is still granted, so the hotkey should execute
    // regardless of relay:write status
    expect(ok!.parsed.success).toBe(true);

    const executionsAfter: number = await page.evaluate(
      () => (window as any).__getMockHooks__().callLog.hotkeyExecutions.length
    );
    expect(executionsAfter).toBeGreaterThan(executionsBefore);
  });
});
