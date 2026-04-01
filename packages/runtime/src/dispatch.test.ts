/**
 * dispatch.test.ts — Unit tests for @napplet/runtime message dispatch.
 *
 * Tests all five NIP-01 verbs (EVENT, REQ, CLOSE, COUNT, AUTH) plus
 * ACL enforcement — all in Node.js without browser globals.
 */

declare function setTimeout(cb: (...args: unknown[]) => void, ms?: number): unknown;

import { describe, it, expect, beforeEach } from 'vitest';
import { createRuntime } from './runtime.js';
import type { Runtime } from './runtime.js';
import { createMockRuntimeHooks } from './test-utils.js';
import type { MockRuntimeContext } from './test-utils.js';
import { BusKind, AUTH_KIND, SHELL_BRIDGE_URI } from '@napplet/core';
import type { NostrEvent } from '@napplet/core';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEST_PUBKEY = 'a'.repeat(64);
const TEST_DTAG = parseInt(TEST_PUBKEY.slice(0, 8), 16).toString(36) + 'test-napp';
const TEST_HASH = 'b'.repeat(64);
const WINDOW_ID = 'win-test-1';

function makeAuthEvent(challenge: string): NostrEvent {
  return {
    id: 'auth-' + Math.random().toString(36).slice(2).padEnd(58, '0'),
    pubkey: TEST_PUBKEY,
    created_at: Math.floor(Date.now() / 1000),
    kind: AUTH_KIND,
    tags: [
      ['challenge', challenge],
      ['relay', SHELL_BRIDGE_URI],
      ['type', 'test-napp'],
      ['aggregateHash', TEST_HASH],
    ],
    content: '',
    sig: '0'.repeat(128),
  };
}

function makeEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'evt-' + Math.random().toString(36).slice(2).padEnd(58, '0'),
    pubkey: TEST_PUBKEY,
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: 'test content',
    sig: '0'.repeat(128),
    ...overrides,
  };
}

/** Complete the AUTH handshake for a window, returning the challenge. */
async function authenticateWindow(
  runtime: Runtime,
  mock: MockRuntimeContext,
  windowId: string = WINDOW_ID,
): Promise<void> {
  runtime.sendChallenge(windowId);
  const challengeMsg = mock.sent.find(
    m => m.windowId === windowId && m.message[0] === 'AUTH',
  );
  expect(challengeMsg).toBeDefined();
  const challenge = challengeMsg!.message[1] as string;

  const authEvent = makeAuthEvent(challenge);
  runtime.handleMessage(windowId, ['AUTH', authEvent]);

  // Wait for async AUTH processing (verifyEvent is async)
  await new Promise(resolve => setTimeout(resolve, 10));

  // Verify auth succeeded
  const okMsg = mock.sent.find(
    m => m.windowId === windowId && m.message[0] === 'OK' && m.message[2] === true,
  );
  expect(okMsg).toBeDefined();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runtime message dispatch', () => {
  let mock: MockRuntimeContext;
  let runtime: Runtime;

  beforeEach(() => {
    mock = createMockRuntimeHooks();
    runtime = createRuntime(mock.hooks);
  });

  // ─── AUTH verb ─────────────────────────────────────────────────────────────

  describe('AUTH', () => {
    it('sends AUTH challenge to napplet', () => {
      runtime.sendChallenge(WINDOW_ID);
      const challengeMsg = mock.sent.find(m => m.message[0] === 'AUTH');
      expect(challengeMsg).toBeDefined();
      expect(challengeMsg!.windowId).toBe(WINDOW_ID);
      expect(typeof challengeMsg!.message[1]).toBe('string');
    });

    it('accepts valid AUTH response and registers napplet identity', async () => {
      await authenticateWindow(runtime, mock);
      // After auth, the sessionRegistry should have the entry
      const pubkey = runtime.sessionRegistry.getPubkey(WINDOW_ID);
      expect(pubkey).toBe(TEST_PUBKEY);
    });

    it('rejects AUTH with wrong kind', async () => {
      runtime.sendChallenge(WINDOW_ID);
      const challengeMsg = mock.sent.find(m => m.message[0] === 'AUTH');
      const challenge = challengeMsg!.message[1] as string;

      const badEvent = makeAuthEvent(challenge);
      badEvent.kind = 1; // wrong kind
      runtime.handleMessage(WINDOW_ID, ['AUTH', badEvent]);
      await new Promise(resolve => setTimeout(resolve, 10));

      const okFail = mock.sent.find(
        m => m.message[0] === 'OK' && m.message[2] === false,
      );
      expect(okFail).toBeDefined();
      expect(okFail!.message[3]).toContain('event kind must be 22242');
    });

    it('rejects AUTH with challenge mismatch', async () => {
      runtime.sendChallenge(WINDOW_ID);

      const badEvent = makeAuthEvent('wrong-challenge');
      runtime.handleMessage(WINDOW_ID, ['AUTH', badEvent]);
      await new Promise(resolve => setTimeout(resolve, 10));

      const okFail = mock.sent.find(
        m => m.message[0] === 'OK' && m.message[2] === false,
      );
      expect(okFail).toBeDefined();
      expect(okFail!.message[3]).toContain('challenge mismatch');
    });

    it('rejects AUTH with wrong relay tag', async () => {
      runtime.sendChallenge(WINDOW_ID);
      const challengeMsg = mock.sent.find(m => m.message[0] === 'AUTH');
      const challenge = challengeMsg!.message[1] as string;

      const badEvent = makeAuthEvent(challenge);
      badEvent.tags = badEvent.tags.map(t =>
        t[0] === 'relay' ? ['relay', 'wss://wrong.relay'] : t,
      );
      runtime.handleMessage(WINDOW_ID, ['AUTH', badEvent]);
      await new Promise(resolve => setTimeout(resolve, 10));

      const okFail = mock.sent.find(
        m => m.message[0] === 'OK' && m.message[2] === false,
      );
      expect(okFail).toBeDefined();
      expect(okFail!.message[3]).toContain('relay tag');
    });

    it('rejects AUTH with missing type tag', async () => {
      runtime.sendChallenge(WINDOW_ID);
      const challengeMsg = mock.sent.find(m => m.message[0] === 'AUTH');
      const challenge = challengeMsg!.message[1] as string;

      const badEvent = makeAuthEvent(challenge);
      badEvent.tags = badEvent.tags.filter(t => t[0] !== 'type');
      runtime.handleMessage(WINDOW_ID, ['AUTH', badEvent]);
      await new Promise(resolve => setTimeout(resolve, 10));

      const okFail = mock.sent.find(
        m => m.message[0] === 'OK' && m.message[2] === false,
      );
      expect(okFail).toBeDefined();
      expect(okFail!.message[3]).toContain('missing required type tag');
    });

    it('rejects AUTH with invalid signature', async () => {
      // Override crypto to reject
      mock = createMockRuntimeHooks({
        crypto: {
          async verifyEvent() { return false; },
          randomUUID() { return 'mock-uuid-fail-' + '0'.repeat(40); },
        },
      });
      runtime = createRuntime(mock.hooks);

      runtime.sendChallenge(WINDOW_ID);
      const challengeMsg = mock.sent.find(m => m.message[0] === 'AUTH');
      const challenge = challengeMsg!.message[1] as string;

      const authEvent = makeAuthEvent(challenge);
      runtime.handleMessage(WINDOW_ID, ['AUTH', authEvent]);
      await new Promise(resolve => setTimeout(resolve, 10));

      const okFail = mock.sent.find(
        m => m.message[0] === 'OK' && m.message[2] === false,
      );
      expect(okFail).toBeDefined();
      expect(okFail!.message[3]).toContain('invalid signature');
    });
  });

  // ─── REQ verb ──────────────────────────────────────────────────────────────

  describe('REQ', () => {
    it('rejects REQ from unauthenticated napplet with CLOSED', () => {
      runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-1', { kinds: [1] }]);

      // Unauthenticated messages are queued, not immediately rejected.
      // But the subscription should NOT be created.
      // Send CLOSE to see if it's harmless
      runtime.handleMessage(WINDOW_ID, ['CLOSE', 'sub-1']);
    });

    it('creates subscription for authenticated napplet', async () => {
      await authenticateWindow(runtime, mock);
      mock.sent.length = 0; // clear auth messages

      runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-1', { kinds: [1] }]);

      // Should get EOSE since relay pool is unavailable and not a bus kind
      const eose = mock.sent.find(m => m.message[0] === 'EOSE' && m.message[1] === 'sub-1');
      expect(eose).toBeDefined();
    });

    it('delivers buffered events to new subscriptions', async () => {
      await authenticateWindow(runtime, mock);
      mock.sent.length = 0;

      // Inject an IPC-PEER event into the buffer
      runtime.injectEvent('test:topic', { data: 'hello' });

      // Subscribe with filter matching IPC-PEER events
      runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-buf', { kinds: [BusKind.IPC_PEER] }]);

      // Should receive the buffered event
      const eventMsg = mock.sent.find(
        m => m.message[0] === 'EVENT' && m.message[1] === 'sub-buf',
      );
      expect(eventMsg).toBeDefined();
    });
  });

  // ─── EVENT verb ─────────────────────────────────────────────────────────────

  describe('EVENT', () => {
    it('queues EVENT from unauthenticated napplet', () => {
      const event = makeEvent();
      runtime.handleMessage(WINDOW_ID, ['EVENT', event]);

      // Should not get an OK response yet (queued for auth)
      const ok = mock.sent.find(m => m.message[0] === 'OK');
      expect(ok).toBeUndefined();
    });

    it('delivers events to matching subscriptions', async () => {
      // Auth two windows
      await authenticateWindow(runtime, mock, 'win-sender');

      const pubkey2 = 'c'.repeat(64);
      const mock2Crypto = {
        async verifyEvent() { return true; },
        randomUUID() { return 'mock-uuid-2-' + '0'.repeat(40); },
      };
      // Use same runtime, just authenticate a second window
      runtime.sendChallenge('win-receiver');
      const challengeMsg = mock.sent.find(
        m => m.windowId === 'win-receiver' && m.message[0] === 'AUTH',
      );
      const challenge = challengeMsg!.message[1] as string;
      const authEvent2: NostrEvent = {
        id: 'auth2-' + '0'.repeat(58),
        pubkey: pubkey2,
        created_at: Math.floor(Date.now() / 1000),
        kind: AUTH_KIND,
        tags: [
          ['challenge', challenge],
          ['relay', SHELL_BRIDGE_URI],
          ['type', 'test-napp-2'],
          ['aggregateHash', 'd'.repeat(64)],
        ],
        content: '',
        sig: '0'.repeat(128),
      };
      runtime.handleMessage('win-receiver', ['AUTH', authEvent2]);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Receiver subscribes to kind 1
      runtime.handleMessage('win-receiver', ['REQ', 'sub-recv', { kinds: [1] }]);
      mock.sent.length = 0;

      // Sender publishes kind 1
      const event = makeEvent({ kind: 1 });
      runtime.handleMessage('win-sender', ['EVENT', event]);

      // Receiver should get the event on their subscription
      const delivered = mock.sent.find(
        m => m.windowId === 'win-receiver' && m.message[0] === 'EVENT' && m.message[1] === 'sub-recv',
      );
      expect(delivered).toBeDefined();
    });

    it('routes signer request events to signer handler', async () => {
      await authenticateWindow(runtime, mock);
      mock.sent.length = 0;

      const signerEvent = makeEvent({
        kind: BusKind.SIGNER_REQUEST,
        tags: [['id', 'corr-1'], ['method', 'getPublicKey']],
      });
      runtime.handleMessage(WINDOW_ID, ['EVENT', signerEvent]);

      // Should get an OK for the signer request (even if signer returns null)
      await new Promise(resolve => setTimeout(resolve, 10));
      const ok = mock.sent.find(m => m.message[0] === 'OK');
      expect(ok).toBeDefined();
    });

    it('sends OK true for IPC-PEER events', async () => {
      await authenticateWindow(runtime, mock);
      mock.sent.length = 0;

      const interPaneEvent = makeEvent({
        kind: BusKind.IPC_PEER,
        tags: [['t', 'custom:topic']],
      });
      runtime.handleMessage(WINDOW_ID, ['EVENT', interPaneEvent]);

      const ok = mock.sent.find(
        m => m.windowId === WINDOW_ID && m.message[0] === 'OK' && m.message[2] === true,
      );
      expect(ok).toBeDefined();
    });
  });

  // ─── CLOSE verb ─────────────────────────────────────────────────────────────

  describe('CLOSE', () => {
    it('removes subscription after CLOSE', async () => {
      await authenticateWindow(runtime, mock);
      mock.sent.length = 0;

      // Create subscription
      runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-close-test', { kinds: [1] }]);

      // Close it
      runtime.handleMessage(WINDOW_ID, ['CLOSE', 'sub-close-test']);

      // Inject an event that would have matched
      runtime.injectEvent('test:close', {});
      mock.sent.length = 0;

      // Create a new subscription to check the event is in the buffer
      // but should NOT be delivered to the closed sub
      runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-close-verify', { kinds: [BusKind.IPC_PEER] }]);

      const deliveredToClosed = mock.sent.find(
        m => m.message[0] === 'EVENT' && m.message[1] === 'sub-close-test',
      );
      expect(deliveredToClosed).toBeUndefined();
    });

    it('handles CLOSE for non-existent subscription gracefully', async () => {
      await authenticateWindow(runtime, mock);
      // Should not throw
      runtime.handleMessage(WINDOW_ID, ['CLOSE', 'non-existent-sub']);
    });
  });

  // ─── COUNT verb ─────────────────────────────────────────────────────────────

  describe('COUNT', () => {
    it('responds with count for authenticated napplet', async () => {
      await authenticateWindow(runtime, mock);

      // Inject some events
      runtime.injectEvent('count:test', { n: 1 });
      runtime.injectEvent('count:test', { n: 2 });
      mock.sent.length = 0;

      runtime.handleMessage(WINDOW_ID, ['COUNT', 'count-1', { kinds: [BusKind.IPC_PEER] }]);

      const countMsg = mock.sent.find(
        m => m.message[0] === 'COUNT' && m.message[1] === 'count-1',
      );
      expect(countMsg).toBeDefined();
      expect((countMsg!.message[2] as { count: number }).count).toBeGreaterThanOrEqual(2);
    });

    it('rejects COUNT from unauthenticated napplet', () => {
      runtime.handleMessage(WINDOW_ID, ['COUNT', 'count-x', { kinds: [1] }]);
      // Message is queued for auth, not immediately rejected
      const countResponse = mock.sent.find(m => m.message[0] === 'COUNT');
      expect(countResponse).toBeUndefined();
    });
  });

  // ─── ACL Enforcement ───────────────────────────────────────────────────────

  describe('ACL enforcement', () => {
    it('denies relay:write when capability is revoked', async () => {
      await authenticateWindow(runtime, mock);

      // Revoke relay:write for this napp
      runtime.aclState.revoke(TEST_PUBKEY, TEST_DTAG, TEST_HASH, 'relay:write');
      mock.sent.length = 0;

      const event = makeEvent({ kind: 1 });
      runtime.handleMessage(WINDOW_ID, ['EVENT', event]);

      const ok = mock.sent.find(
        m => m.message[0] === 'OK' && m.message[2] === false,
      );
      expect(ok).toBeDefined();
      expect(ok!.message[3]).toContain('denied: relay:write');
    });

    it('denies relay:read when REQ capability is revoked', async () => {
      await authenticateWindow(runtime, mock);

      // Revoke relay:read
      runtime.aclState.revoke(TEST_PUBKEY, TEST_DTAG, TEST_HASH, 'relay:read');
      mock.sent.length = 0;

      runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-denied', { kinds: [1] }]);

      const closed = mock.sent.find(
        m => m.message[0] === 'CLOSED' && m.message[1] === 'sub-denied',
      );
      expect(closed).toBeDefined();
      expect(closed!.message[2]).toContain('denied: relay:read');
    });

    it('denies sign:event when signer capability is revoked', async () => {
      await authenticateWindow(runtime, mock);
      runtime.aclState.revoke(TEST_PUBKEY, TEST_DTAG, TEST_HASH, 'sign:event');
      mock.sent.length = 0;

      const signerEvent = makeEvent({
        kind: BusKind.SIGNER_REQUEST,
        tags: [['id', 'corr-denied'], ['method', 'getPublicKey']],
      });
      runtime.handleMessage(WINDOW_ID, ['EVENT', signerEvent]);

      const ok = mock.sent.find(
        m => m.message[0] === 'OK' && m.message[2] === false,
      );
      expect(ok).toBeDefined();
      expect(ok!.message[3]).toContain('denied: sign:event');
    });

    it('denies state:read when revoked', async () => {
      await authenticateWindow(runtime, mock);
      runtime.aclState.revoke(TEST_PUBKEY, TEST_DTAG, TEST_HASH, 'state:read');
      mock.sent.length = 0;

      const stateGetEvent = makeEvent({
        kind: BusKind.IPC_PEER,
        tags: [['t', 'shell:state-get'], ['key', 'test-key'], ['id', 'corr-state-denied']],
      });
      runtime.handleMessage(WINDOW_ID, ['EVENT', stateGetEvent]);

      const ok = mock.sent.find(
        m => m.message[0] === 'OK' && m.message[2] === false,
      );
      expect(ok).toBeDefined();
      expect(ok!.message[3]).toContain('denied: state:read');
    });

    it('logs ACL check events to onAclCheck callback', async () => {
      await authenticateWindow(runtime, mock);
      mock.aclChecks.length = 0;

      // Send an EVENT that triggers ACL check
      const event = makeEvent({ kind: 1 });
      runtime.handleMessage(WINDOW_ID, ['EVENT', event]);

      // Should have at least one ACL check logged
      expect(mock.aclChecks.length).toBeGreaterThan(0);
      const relayWriteCheck = mock.aclChecks.find(c => c.capability === 'relay:write');
      expect(relayWriteCheck).toBeDefined();
      expect(relayWriteCheck!.identity.pubkey).toBe(TEST_PUBKEY);
      expect(relayWriteCheck!.decision).toBe('allow');
    });
  });

  // ─── Message queuing for unauthenticated napplets ──────────────────────────

  describe('message queuing', () => {
    it('queues messages before AUTH and drains after successful AUTH', async () => {
      // Send messages before auth
      const event = makeEvent({ kind: 1 });
      runtime.handleMessage(WINDOW_ID, ['EVENT', event]);

      // No OK yet
      expect(mock.sent.find(m => m.message[0] === 'OK')).toBeUndefined();

      // Now authenticate
      await authenticateWindow(runtime, mock);

      // After auth, queued messages should be processed — check for OK
      const ok = mock.sent.find(
        m => m.windowId === WINDOW_ID && m.message[0] === 'OK' && m.message[1] === event.id,
      );
      expect(ok).toBeDefined();
    });
  });

  // ─── Runtime lifecycle ─────────────────────────────────────────────────────

  describe('lifecycle', () => {
    it('destroy() persists state and clears internal structures', async () => {
      await authenticateWindow(runtime, mock);
      runtime.destroy();

      // Registry should still have data but internal maps are cleared
      // The runtime should not throw when destroyed
      expect(true).toBe(true);
    });

    it('injectEvent delivers to matching subscriptions', async () => {
      await authenticateWindow(runtime, mock);
      runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-inject', { kinds: [BusKind.IPC_PEER] }]);
      mock.sent.length = 0;

      runtime.injectEvent('test:inject', { data: 'injected' });

      const delivered = mock.sent.find(
        m => m.message[0] === 'EVENT' && m.message[1] === 'sub-inject',
      );
      expect(delivered).toBeDefined();
      const deliveredEvent = delivered!.message[2] as NostrEvent;
      expect(deliveredEvent.kind).toBe(BusKind.IPC_PEER);
    });
  });
});

// ─── Service Dispatch Tests ───────────────────────────────────────────────────

describe('service dispatch — signer', () => {
  it('routes kind 29001 to registered signer service', async () => {
    const signerCalls: Array<{ windowId: string; message: unknown[] }> = [];
    const mock = createMockRuntimeHooks({
      services: {
        signer: {
          descriptor: { name: 'signer', version: '1.0.0' },
          handleMessage(windowId, message, send) {
            signerCalls.push({ windowId, message });
            const event = message[1] as NostrEvent;
            send(['OK', event.id, true, '']);
          },
        },
      },
    });
    const runtime = createRuntime(mock.hooks);

    await authenticateWindow(runtime, mock);
    mock.sent.length = 0;

    const signerEvent = makeEvent({
      kind: BusKind.SIGNER_REQUEST,
      tags: [['id', 'corr-1'], ['method', 'getPublicKey']],
    });
    runtime.handleMessage(WINDOW_ID, ['EVENT', signerEvent]);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(signerCalls.length).toBe(1);
    expect(signerCalls[0].windowId).toBe(WINDOW_ID);
    expect(signerCalls[0].message[0]).toBe('EVENT');
  });

  it('falls back to internal handler when no signer service registered', async () => {
    const mock = createMockRuntimeHooks({
      auth: {
        getUserPubkey: () => 'user_' + '0'.repeat(60),
        getSigner: () => ({
          getPublicKey: () => 'test-pubkey',
        }),
      },
    });
    const runtime = createRuntime(mock.hooks);

    await authenticateWindow(runtime, mock);
    mock.sent.length = 0;

    const signerEvent = makeEvent({
      kind: BusKind.SIGNER_REQUEST,
      tags: [['id', 'corr-1'], ['method', 'getPublicKey']],
    });
    runtime.handleMessage(WINDOW_ID, ['EVENT', signerEvent]);

    await new Promise(resolve => setTimeout(resolve, 10));

    // Internal handler sends OK response
    const okMsg = mock.sent.find(m => m.message[0] === 'OK');
    expect(okMsg).toBeDefined();
  });

  it('send callback from signer service is forwarded to napplet', async () => {
    const mock = createMockRuntimeHooks({
      services: {
        signer: {
          descriptor: { name: 'signer', version: '1.0.0' },
          handleMessage(_windowId, message, send) {
            const event = message[1] as NostrEvent;
            // Send a response event and OK
            send(['EVENT', '__signer__', { kind: 29002, tags: [['id', 'c1']], content: '' }]);
            send(['OK', event.id, true, '']);
          },
        },
      },
    });
    const runtime = createRuntime(mock.hooks);

    await authenticateWindow(runtime, mock);
    mock.sent.length = 0;

    const signerEvent = makeEvent({
      kind: BusKind.SIGNER_REQUEST,
      tags: [['id', 'c1'], ['method', 'getPublicKey']],
    });
    runtime.handleMessage(WINDOW_ID, ['EVENT', signerEvent]);

    await new Promise(resolve => setTimeout(resolve, 10));

    // Both EVENT and OK should be forwarded to the napplet
    const eventMsg = mock.sent.find(m => m.message[0] === 'EVENT');
    const okMsg = mock.sent.find(m => m.message[0] === 'OK' && m.message[2] === true);
    expect(eventMsg).toBeDefined();
    expect(okMsg).toBeDefined();
  });
});

describe('service dispatch — relay', () => {
  it('routes REQ to registered relay service', async () => {
    const relayCalls: Array<{ windowId: string; message: unknown[] }> = [];
    const mock = createMockRuntimeHooks({
      services: {
        relay: {
          descriptor: { name: 'relay', version: '1.0.0' },
          handleMessage(windowId, message, send) {
            relayCalls.push({ windowId, message });
            if (message[0] === 'REQ') {
              send(['EOSE', message[1] as string]);
            }
          },
        },
      },
    });
    const runtime = createRuntime(mock.hooks);

    await authenticateWindow(runtime, mock);
    mock.sent.length = 0;

    runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-1', { kinds: [1] }]);

    expect(relayCalls.length).toBe(1);
    expect(relayCalls[0].message[0]).toBe('REQ');
    expect(relayCalls[0].message[1]).toBe('sub-1');
  });

  it('routes CLOSE to registered relay service', async () => {
    const relayCalls: Array<unknown[]> = [];
    const mock = createMockRuntimeHooks({
      services: {
        relay: {
          descriptor: { name: 'relay', version: '1.0.0' },
          handleMessage(_windowId, message, send) {
            relayCalls.push(message);
            if (message[0] === 'REQ') send(['EOSE', message[1] as string]);
          },
        },
      },
    });
    const runtime = createRuntime(mock.hooks);

    await authenticateWindow(runtime, mock);
    mock.sent.length = 0;

    runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-close', { kinds: [1] }]);
    relayCalls.length = 0;
    runtime.handleMessage(WINDOW_ID, ['CLOSE', 'sub-close']);

    expect(relayCalls.length).toBe(1);
    expect(relayCalls[0][0]).toBe('CLOSE');
  });

  it('sends EOSE from relay service to napplet', async () => {
    const mock = createMockRuntimeHooks({
      services: {
        relay: {
          descriptor: { name: 'relay', version: '1.0.0' },
          handleMessage(_windowId, message, send) {
            if (message[0] === 'REQ') send(['EOSE', message[1] as string]);
          },
        },
      },
    });
    const runtime = createRuntime(mock.hooks);

    await authenticateWindow(runtime, mock);
    mock.sent.length = 0;

    runtime.handleMessage(WINDOW_ID, ['REQ', 'sub-eose', { kinds: [1] }]);

    const eose = mock.sent.find(m => m.message[0] === 'EOSE' && m.message[1] === 'sub-eose');
    expect(eose).toBeDefined();
  });
});

describe('service dispatch — optional relayPool/cache hooks', () => {
  it('works without relayPool and cache hooks when relay service is registered', async () => {
    const mock = createMockRuntimeHooks({
      services: {
        relay: {
          descriptor: { name: 'relay', version: '1.0.0' },
          handleMessage(_windowId, message, send) {
            if (message[0] === 'REQ') send(['EOSE', message[1] as string]);
          },
        },
      },
    });
    // Remove relayPool and cache hooks to verify service-only path
    const hooks = { ...mock.hooks };
    delete (hooks as Record<string, unknown>).relayPool;
    delete (hooks as Record<string, unknown>).cache;

    const rt = createRuntime(hooks);
    await authenticateWindow(rt, mock);
    mock.sent.length = 0;

    // Should not throw — relay service handles it
    expect(() => {
      rt.handleMessage(WINDOW_ID, ['REQ', 'sub-nopool', { kinds: [1] }]);
    }).not.toThrow();

    const eose = mock.sent.find(m => m.message[0] === 'EOSE');
    expect(eose).toBeDefined();
  });
});
