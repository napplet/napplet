/**
 * discovery.test.ts — Unit tests for kind 29010 service discovery protocol.
 *
 * Verifies that the runtime intercepts REQs for kind 29010, generates
 * synthetic discovery events from the service registry, and supports
 * live subscription updates on dynamic service registration.
 */

declare function setTimeout(cb: (...args: unknown[]) => void, ms?: number): unknown;

import { describe, it, expect, beforeEach } from 'vitest';
import { createRuntime } from './runtime.js';
import type { Runtime } from './runtime.js';
import { createMockRuntimeAdapter } from './test-utils.js';
import type { MockRuntimeContext } from './test-utils.js';
import { BusKind, AUTH_KIND, SHELL_BRIDGE_URI } from '@napplet/core';
import type { NostrEvent } from '@napplet/core';
import type { ServiceHandler } from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEST_PUBKEY = 'a'.repeat(64);
const TEST_HASH = 'b'.repeat(64);
const WINDOW_ID = 'win-disc-1';
const SENTINEL_PUBKEY = '0'.repeat(64);
const SENTINEL_SIG = '0'.repeat(128);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Complete AUTH handshake for a window. */
async function authenticateWindow(
  runtime: Runtime,
  ctx: MockRuntimeContext,
  windowId: string,
): Promise<void> {
  runtime.sendChallenge(windowId);
  const challengeMsg = ctx.sent.find(
    (s) => s.windowId === windowId && s.message[0] === 'AUTH',
  );
  expect(challengeMsg).toBeDefined();
  const challenge = challengeMsg!.message[1] as string;
  const authEvent = makeAuthEvent(challenge);
  runtime.handleMessage(windowId, ['AUTH', authEvent]);
  // Wait for async verifyEvent
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 10));
}

function makeDiscoveryReq(subId: string): unknown[] {
  return ['REQ', subId, { kinds: [BusKind.SERVICE_DISCOVERY] }];
}

// ─── Mock Service Handlers ────────────────────────────────────────────────────

function createMockServiceHandler(
  name: string,
  version: string,
  description?: string,
): ServiceHandler {
  return {
    descriptor: { name, version, ...(description ? { description } : {}) },
    handleMessage() { /* no-op for discovery tests */ },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Service Discovery Protocol (kind 29010)', () => {
  let runtime: Runtime;
  let ctx: MockRuntimeContext;

  describe('with registered services', () => {
    const audioHandler = createMockServiceHandler('audio', '1.0.0', 'Audio playback management');
    const notificationHandler = createMockServiceHandler('notifications', '2.1.0');

    beforeEach(async () => {
      ctx = createMockRuntimeAdapter({
        services: {
          audio: audioHandler,
          notifications: notificationHandler,
        },
      });
      runtime = createRuntime(ctx.hooks);
      await authenticateWindow(runtime, ctx, WINDOW_ID);
      ctx.sent.length = 0; // Clear AUTH messages
    });

    it('DISC-01: responds with one EVENT per service then EOSE', () => {
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('svc-disc'));

      const sentToWindow = ctx.sent.filter((s) => s.windowId === WINDOW_ID);
      const events = sentToWindow.filter((s) => s.message[0] === 'EVENT');
      const eose = sentToWindow.filter((s) => s.message[0] === 'EOSE');

      expect(events).toHaveLength(2);
      expect(eose).toHaveLength(1);
      expect(eose[0].message[1]).toBe('svc-disc');

      // EOSE must come AFTER all EVENTs
      const eoseIndex = sentToWindow.indexOf(eose[0]);
      const lastEventIndex = sentToWindow.lastIndexOf(events[events.length - 1]);
      expect(eoseIndex).toBeGreaterThan(lastEventIndex);
    });

    it('DISC-02: discovery events contain s, v, and optional d tags', () => {
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('svc-disc'));

      const events = ctx.sent
        .filter((s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT')
        .map((s) => s.message[2] as NostrEvent);

      // Find the audio event (has description)
      const audioEvent = events.find((e) =>
        e.tags.some((t) => t[0] === 's' && t[1] === 'audio'),
      );
      expect(audioEvent).toBeDefined();
      expect(audioEvent!.kind).toBe(BusKind.SERVICE_DISCOVERY);
      expect(audioEvent!.tags).toContainEqual(['s', 'audio']);
      expect(audioEvent!.tags).toContainEqual(['v', '1.0.0']);
      expect(audioEvent!.tags).toContainEqual(['d', 'Audio playback management']);
      expect(audioEvent!.content).toBe('{}');

      // Find the notifications event (no description)
      const notifEvent = events.find((e) =>
        e.tags.some((t) => t[0] === 's' && t[1] === 'notifications'),
      );
      expect(notifEvent).toBeDefined();
      expect(notifEvent!.tags).toContainEqual(['s', 'notifications']);
      expect(notifEvent!.tags).toContainEqual(['v', '2.1.0']);
      // Should NOT have a d tag when description is omitted
      expect(notifEvent!.tags.find((t) => t[0] === 'd')).toBeUndefined();
    });

    it('DISC-02: synthetic events use sentinel pubkey and sig', () => {
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('svc-disc'));

      const events = ctx.sent
        .filter((s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT')
        .map((s) => s.message[2] as NostrEvent);

      for (const event of events) {
        expect(event.pubkey).toBe(SENTINEL_PUBKEY);
        expect(event.sig).toBe(SENTINEL_SIG);
        expect(event.id).toBeDefined();
        expect(event.id.length).toBe(64);
      }
    });

    it('DISC-01: subscription ID is echoed in EVENT and EOSE', () => {
      const subId = 'my-custom-sub-id';
      runtime.handleMessage(WINDOW_ID, ['REQ', subId, { kinds: [BusKind.SERVICE_DISCOVERY] }]);

      const sentToWindow = ctx.sent.filter((s) => s.windowId === WINDOW_ID);
      for (const msg of sentToWindow) {
        if (msg.message[0] === 'EVENT') {
          expect(msg.message[1]).toBe(subId);
        }
        if (msg.message[0] === 'EOSE') {
          expect(msg.message[1]).toBe(subId);
        }
      }
    });
  });

  describe('DISC-03: unified discovery (core + optional services)', () => {
    beforeEach(async () => {
      const relayPoolHandler = createMockServiceHandler('relay-pool', '1.0.0', 'Nostr relay pool');
      const cacheHandler = createMockServiceHandler('cache', '1.0.0', 'Local event cache');
      const audioHandler = createMockServiceHandler('audio', '1.0.0', 'Audio playback');

      ctx = createMockRuntimeAdapter({
        services: {
          'relay-pool': relayPoolHandler,
          cache: cacheHandler,
          audio: audioHandler,
        },
      });
      runtime = createRuntime(ctx.hooks);
      await authenticateWindow(runtime, ctx, WINDOW_ID);
      ctx.sent.length = 0;
    });

    it('core infrastructure and optional services appear in same response', () => {
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('svc-disc'));

      const events = ctx.sent
        .filter((s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT')
        .map((s) => s.message[2] as NostrEvent);

      expect(events).toHaveLength(3);

      const names = events.map((e) => e.tags.find((t) => t[0] === 's')![1]);
      expect(names).toContain('relay-pool');
      expect(names).toContain('cache');
      expect(names).toContain('audio');
    });
  });

  describe('DISC-04: empty registry', () => {
    beforeEach(async () => {
      ctx = createMockRuntimeAdapter(); // No services
      runtime = createRuntime(ctx.hooks);
      await authenticateWindow(runtime, ctx, WINDOW_ID);
      ctx.sent.length = 0;
    });

    it('responds with EOSE immediately and zero EVENTs', () => {
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('svc-disc'));

      const sentToWindow = ctx.sent.filter((s) => s.windowId === WINDOW_ID);
      const events = sentToWindow.filter((s) => s.message[0] === 'EVENT');
      const eose = sentToWindow.filter((s) => s.message[0] === 'EOSE');

      expect(events).toHaveLength(0);
      expect(eose).toHaveLength(1);
      expect(eose[0].message[1]).toBe('svc-disc');
    });
  });

  describe('live subscription updates', () => {
    beforeEach(async () => {
      ctx = createMockRuntimeAdapter({
        services: {
          audio: createMockServiceHandler('audio', '1.0.0'),
        },
      });
      runtime = createRuntime(ctx.hooks);
      await authenticateWindow(runtime, ctx, WINDOW_ID);
      ctx.sent.length = 0;
    });

    it('registerService pushes new EVENT to open discovery subscriptions', () => {
      // Open a discovery subscription
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('live-disc'));
      // Clear sent messages after initial response
      ctx.sent.length = 0;

      // Register a new service dynamically
      runtime.registerService('notifications', createMockServiceHandler(
        'notifications', '2.0.0', 'Push notifications',
      ));

      // Should receive a new EVENT for the newly registered service
      const events = ctx.sent.filter(
        (s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT',
      );
      expect(events).toHaveLength(1);
      const event = events[0].message[2] as NostrEvent;
      expect(event.tags).toContainEqual(['s', 'notifications']);
      expect(event.tags).toContainEqual(['v', '2.0.0']);
      expect(event.tags).toContainEqual(['d', 'Push notifications']);
      // Should use the live-disc subscription ID
      expect(events[0].message[1]).toBe('live-disc');
    });

    it('CLOSE stops live discovery updates', () => {
      // Open a discovery subscription
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('live-disc'));
      ctx.sent.length = 0;

      // Close the subscription
      runtime.handleMessage(WINDOW_ID, ['CLOSE', 'live-disc']);
      ctx.sent.length = 0;

      // Register a new service
      runtime.registerService('notifications', createMockServiceHandler(
        'notifications', '2.0.0',
      ));

      // Should NOT receive any events (subscription was closed)
      const events = ctx.sent.filter(
        (s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT',
      );
      expect(events).toHaveLength(0);
    });
  });

  describe('auth and ACL gating', () => {
    it('unauthenticated window receives no discovery events (queued pre-auth)', () => {
      ctx = createMockRuntimeAdapter();
      runtime = createRuntime(ctx.hooks);
      // Do NOT authenticate — just send a discovery REQ
      // The runtime queues pre-auth messages, so nothing is delivered
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('svc-disc'));

      // No discovery EVENTs should be sent to an unauthenticated window
      const events = ctx.sent.filter(
        (s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT',
      );
      expect(events).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      ctx = createMockRuntimeAdapter({
        services: {
          audio: createMockServiceHandler('audio', '1.0.0'),
        },
      });
      runtime = createRuntime(ctx.hooks);
      await authenticateWindow(runtime, ctx, WINDOW_ID);
      ctx.sent.length = 0;
    });

    it('REQ with multiple filters all containing only kind 29010 triggers discovery', () => {
      runtime.handleMessage(WINDOW_ID, [
        'REQ', 'multi-filter',
        { kinds: [BusKind.SERVICE_DISCOVERY] },
        { kinds: [BusKind.SERVICE_DISCOVERY] },
      ]);

      const events = ctx.sent.filter(
        (s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT',
      );
      expect(events.length).toBeGreaterThan(0);
    });

    it('REQ with kind 29010 mixed with other kinds goes to relay pool, not discovery', () => {
      runtime.handleMessage(WINDOW_ID, [
        'REQ', 'mixed-kinds',
        { kinds: [1, BusKind.SERVICE_DISCOVERY] },
      ]);

      // isDiscoveryReq returns false for mixed kinds — not intercepted for discovery.
      // With relay pool unavailable (mock) and non-bus kinds, runtime sends EOSE.
      // Verify no discovery EVENTs (kind 29010 synthetic events with sentinel pubkey)
      const discoveryEvents = ctx.sent.filter(
        (s) => s.windowId === WINDOW_ID &&
          s.message[0] === 'EVENT' &&
          (s.message[2] as NostrEvent)?.pubkey === SENTINEL_PUBKEY,
      );
      expect(discoveryEvents).toHaveLength(0);
    });

    it('discovery events have unique IDs', () => {
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('svc-disc'));

      const eventIds = ctx.sent
        .filter((s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT')
        .map((s) => (s.message[2] as NostrEvent).id);

      expect(eventIds.length).toBeGreaterThan(0);
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(eventIds.length);
    });

    it('multiple discovery REQs from same window are independent', () => {
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('disc-1'));
      runtime.handleMessage(WINDOW_ID, makeDiscoveryReq('disc-2'));

      const disc1Events = ctx.sent.filter(
        (s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT' && s.message[1] === 'disc-1',
      );
      const disc2Events = ctx.sent.filter(
        (s) => s.windowId === WINDOW_ID && s.message[0] === 'EVENT' && s.message[1] === 'disc-2',
      );

      // Both should get the same number of events (1 service registered)
      expect(disc1Events).toHaveLength(1);
      expect(disc2Events).toHaveLength(1);
    });
  });
});
