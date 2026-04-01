/**
 * signer-service.test.ts — Unit tests for the signer service.
 */

declare function setTimeout(cb: () => void, ms?: number): unknown;

import { describe, it, expect } from 'vitest';
import { createSignerService } from './signer-service.js';
import { BusKind } from '@napplet/core';
import type { NostrEvent } from '@napplet/core';
import type { Signer } from '@napplet/runtime';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WINDOW_ID = 'win-test-1';

function makeSignerEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'evt-' + Math.random().toString(36).slice(2).padEnd(58, '0'),
    pubkey: 'a'.repeat(64),
    created_at: Math.floor(Date.now() / 1000),
    kind: BusKind.SIGNER_REQUEST,
    tags: [['id', 'corr-1'], ['method', 'getPublicKey']],
    content: '',
    sig: '0'.repeat(128),
    ...overrides,
  };
}

function createMockSigner(): Signer & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    getPublicKey() {
      calls.push('getPublicKey');
      return 'test-pubkey-' + 'a'.repeat(52);
    },
    async signEvent(event: NostrEvent) {
      calls.push('signEvent');
      return { ...event, sig: 's'.repeat(128) };
    },
    getRelays() {
      calls.push('getRelays');
      return { 'wss://relay.example.com': { read: true, write: true } };
    },
    nip04: {
      async encrypt(_pubkey: string, plaintext: string) {
        calls.push('nip04.encrypt');
        return `encrypted:${plaintext}`;
      },
      async decrypt(_pubkey: string, ciphertext: string) {
        calls.push('nip04.decrypt');
        return `decrypted:${ciphertext}`;
      },
    },
    nip44: {
      async encrypt(_pubkey: string, plaintext: string) {
        calls.push('nip44.encrypt');
        return `encrypted44:${plaintext}`;
      },
      async decrypt(_pubkey: string, ciphertext: string) {
        calls.push('nip44.decrypt');
        return `decrypted44:${ciphertext}`;
      },
    },
  };
}

/** Wait for async operations to settle. */
function nextTick(ms = 10): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createSignerService', () => {
  it('returns ServiceHandler with correct descriptor', () => {
    const service = createSignerService({ getSigner: () => null });
    expect(service.descriptor).toEqual({
      name: 'signer',
      version: '1.0.0',
      description: 'NIP-07 compatible signer proxy',
    });
  });

  it('ignores non-EVENT messages', () => {
    const signer = createMockSigner();
    const service = createSignerService({ getSigner: () => signer });
    const sent: unknown[][] = [];
    const send = (msg: unknown[]): void => { sent.push(msg); };

    service.handleMessage(WINDOW_ID, ['REQ', 'sub-1', { kinds: [29001] }], send);
    expect(sent).toHaveLength(0);
  });

  it('ignores events with wrong kind', () => {
    const signer = createMockSigner();
    const service = createSignerService({ getSigner: () => signer });
    const sent: unknown[][] = [];
    const send = (msg: unknown[]): void => { sent.push(msg); };

    const event = makeSignerEvent({ kind: 1 });
    service.handleMessage(WINDOW_ID, ['EVENT', event], send);
    expect(sent).toHaveLength(0);
  });

  it('returns error when no signer configured', async () => {
    const service = createSignerService({ getSigner: () => null });
    const sent: unknown[][] = [];
    const send = (msg: unknown[]): void => { sent.push(msg); };

    const event = makeSignerEvent();
    service.handleMessage(WINDOW_ID, ['EVENT', event], send);
    await nextTick();

    expect(sent).toHaveLength(1);
    expect(sent[0][0]).toBe('OK');
    expect(sent[0][2]).toBe(false);
    expect(sent[0][3]).toContain('no signer configured');
  });

  describe('getPublicKey', () => {
    it('returns pubkey via kind 29002 response', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const event = makeSignerEvent({ tags: [['id', 'corr-1'], ['method', 'getPublicKey']] });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      // Should have EVENT (kind 29002) and OK
      const eventMsg = sent.find((m) => m[0] === 'EVENT');
      expect(eventMsg).toBeDefined();
      const responseEvent = eventMsg![2] as Partial<NostrEvent>;
      expect(responseEvent.kind).toBe(BusKind.SIGNER_RESPONSE);
      const resultTag = responseEvent.tags?.find((t) => t[0] === 'result');
      expect(resultTag).toBeDefined();
      expect(JSON.parse(resultTag![1])).toMatch(/test-pubkey/);

      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg).toBeDefined();
      expect(okMsg![2]).toBe(true);
    });
  });

  describe('signEvent', () => {
    it('signs and returns event via kind 29002 response', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const eventToSign: NostrEvent = {
        id: '', pubkey: 'a'.repeat(64), created_at: 1000, kind: 1, tags: [], content: 'hello', sig: '',
      };
      const event = makeSignerEvent({
        tags: [['id', 'corr-2'], ['method', 'signEvent'], ['event', JSON.stringify(eventToSign)]],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      expect(signer.calls).toContain('signEvent');
      const eventMsg = sent.find((m) => m[0] === 'EVENT');
      expect(eventMsg).toBeDefined();
      const responseEvent = eventMsg![2] as Partial<NostrEvent>;
      expect(responseEvent.kind).toBe(BusKind.SIGNER_RESPONSE);
    });

    it('returns error OK for invalid event JSON', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const event = makeSignerEvent({
        tags: [['id', 'corr-3'], ['method', 'signEvent'], ['event', 'not-json']],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg).toBeDefined();
      expect(okMsg![2]).toBe(false);
      expect(okMsg![3]).toContain('invalid event JSON');
    });
  });

  describe('getRelays', () => {
    it('returns relay config via kind 29002 response', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const event = makeSignerEvent({ tags: [['id', 'corr-4'], ['method', 'getRelays']] });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      expect(signer.calls).toContain('getRelays');
      const eventMsg = sent.find((m) => m[0] === 'EVENT');
      expect(eventMsg).toBeDefined();
    });
  });

  describe('nip04', () => {
    it('nip04.encrypt works correctly', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const event = makeSignerEvent({
        tags: [['id', 'corr-5'], ['method', 'nip04.encrypt'], ['params', 'peer-pubkey', 'hello']],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      expect(signer.calls).toContain('nip04.encrypt');
      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg![2]).toBe(true);
    });

    it('nip04.decrypt works correctly', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const event = makeSignerEvent({
        tags: [['id', 'corr-6'], ['method', 'nip04.decrypt'], ['params', 'peer-pubkey', 'ciphertext']],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      expect(signer.calls).toContain('nip04.decrypt');
      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg![2]).toBe(true);
    });
  });

  describe('nip44', () => {
    it('nip44.encrypt works correctly', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const event = makeSignerEvent({
        tags: [['id', 'corr-7'], ['method', 'nip44.encrypt'], ['params', 'peer-pubkey', 'hello44']],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      expect(signer.calls).toContain('nip44.encrypt');
      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg![2]).toBe(true);
    });

    it('nip44.decrypt works correctly', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const event = makeSignerEvent({
        tags: [['id', 'corr-8'], ['method', 'nip44.decrypt'], ['params', 'peer-pubkey', 'ciphertext44']],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      expect(signer.calls).toContain('nip44.decrypt');
      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg![2]).toBe(true);
    });
  });

  describe('unknown method', () => {
    it('returns error OK for unknown method', async () => {
      const signer = createMockSigner();
      const service = createSignerService({ getSigner: () => signer });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const event = makeSignerEvent({ tags: [['id', 'corr-9'], ['method', 'unknownMethod']] });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick();

      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg).toBeDefined();
      expect(okMsg![2]).toBe(false);
      expect((okMsg![3] as string)).toContain('Unknown signer method');
    });
  });

  describe('consent gating', () => {
    it('triggers onConsentNeeded for destructive kinds (default list)', async () => {
      const signer = createMockSigner();
      const consentCalls: Array<{ kind: number }> = [];

      const service = createSignerService({
        getSigner: () => signer,
        onConsentNeeded: ({ event, resolve }) => {
          consentCalls.push({ kind: event.kind });
          resolve(true);
        },
      });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      // Kind 0 is a destructive kind
      const eventToSign: NostrEvent = {
        id: '', pubkey: 'a'.repeat(64), created_at: 1000, kind: 0, tags: [], content: '{}', sig: '',
      };
      const event = makeSignerEvent({
        tags: [['id', 'corr-10'], ['method', 'signEvent'], ['event', JSON.stringify(eventToSign)]],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick(20);

      expect(consentCalls).toHaveLength(1);
      expect(consentCalls[0].kind).toBe(0);
      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg![2]).toBe(true);
    });

    it('returns error OK when user rejects consent', async () => {
      const signer = createMockSigner();
      const service = createSignerService({
        getSigner: () => signer,
        onConsentNeeded: ({ resolve }) => { resolve(false); },
      });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      const eventToSign: NostrEvent = {
        id: '', pubkey: 'a'.repeat(64), created_at: 1000, kind: 3, tags: [], content: '[]', sig: '',
      };
      const event = makeSignerEvent({
        tags: [['id', 'corr-11'], ['method', 'signEvent'], ['event', JSON.stringify(eventToSign)]],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick(20);

      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg![2]).toBe(false);
      expect((okMsg![3] as string)).toContain('user rejected');
    });

    it('skips consent for non-destructive kinds', async () => {
      const signer = createMockSigner();
      const consentCalls: number[] = [];
      const service = createSignerService({
        getSigner: () => signer,
        onConsentNeeded: ({ event, resolve }) => {
          consentCalls.push(event.kind);
          resolve(true);
        },
      });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      // Kind 1 is NOT a destructive kind
      const eventToSign: NostrEvent = {
        id: '', pubkey: 'a'.repeat(64), created_at: 1000, kind: 1, tags: [], content: 'hello', sig: '',
      };
      const event = makeSignerEvent({
        tags: [['id', 'corr-12'], ['method', 'signEvent'], ['event', JSON.stringify(eventToSign)]],
      });
      service.handleMessage(WINDOW_ID, ['EVENT', event], send);
      await nextTick(20);

      expect(consentCalls).toHaveLength(0);
      const okMsg = sent.find((m) => m[0] === 'OK');
      expect(okMsg![2]).toBe(true);
    });

    it('uses custom consentKinds when provided', async () => {
      const signer = createMockSigner();
      const consentCalls: number[] = [];
      const service = createSignerService({
        getSigner: () => signer,
        consentKinds: [9999],
        onConsentNeeded: ({ event, resolve }) => {
          consentCalls.push(event.kind);
          resolve(true);
        },
      });
      const sent: unknown[][] = [];
      const send = (msg: unknown[]): void => { sent.push(msg); };

      // Kind 0 should NOT trigger consent (not in custom list)
      const eventToSign0: NostrEvent = {
        id: '', pubkey: 'a'.repeat(64), created_at: 1000, kind: 0, tags: [], content: '{}', sig: '',
      };
      service.handleMessage(WINDOW_ID, ['EVENT', makeSignerEvent({
        tags: [['id', 'corr-13a'], ['method', 'signEvent'], ['event', JSON.stringify(eventToSign0)]],
      })], send);
      await nextTick(20);

      expect(consentCalls).toHaveLength(0);

      // Kind 9999 SHOULD trigger consent
      const eventToSign9999: NostrEvent = {
        id: '', pubkey: 'a'.repeat(64), created_at: 1001, kind: 9999, tags: [], content: '', sig: '',
      };
      service.handleMessage(WINDOW_ID, ['EVENT', makeSignerEvent({
        tags: [['id', 'corr-13b'], ['method', 'signEvent'], ['event', JSON.stringify(eventToSign9999)]],
      })], send);
      await nextTick(20);

      expect(consentCalls).toHaveLength(1);
      expect(consentCalls[0]).toBe(9999);
    });
  });

  describe('onWindowDestroyed', () => {
    it('does not throw', () => {
      const service = createSignerService({ getSigner: () => null });
      expect(() => service.onWindowDestroyed?.(WINDOW_ID)).not.toThrow();
    });
  });
});
