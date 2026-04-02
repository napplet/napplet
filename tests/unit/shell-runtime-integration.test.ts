/**
 * shell-runtime-integration.test.ts — Integration test for the four-package chain.
 *
 * Verifies: @napplet/core -> @napplet/acl -> @napplet/runtime -> @napplet/shell
 *
 * - Core types are the single source of truth
 * - ACL uses core Capability type for access checks
 * - Runtime creates in Node.js without browser globals
 * - Shell re-exports core types for backward compatibility
 * - BusKind values are consistent across all packages
 *
 * Note: createShellBridge() requires browser globals (Window, postMessage).
 * The full shell integration is covered by e2e Playwright tests.
 * This test verifies the package layering and type compatibility.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ─── Core — the foundation ───────────────────────────────────────────────────
import {
  BusKind,
  AUTH_KIND,
  SHELL_BRIDGE_URI,
  PROTOCOL_VERSION,
  ALL_CAPABILITIES,
  DESTRUCTIVE_KINDS,
  REPLAY_WINDOW_SECONDS,
  TOPICS,
} from '@napplet/core';
import type { NostrEvent, NostrFilter, Capability, BusKindValue, TopicKey, TopicValue } from '@napplet/core';

// ─── ACL — pure capability checks ───────────────────────────────────────────
import {
  createState,
  grant,
  revoke,
  block,
  unblock,
  check,
  toKey,
  CAP_RELAY_READ,
  CAP_RELAY_WRITE,
  CAP_SIGN_EVENT,
  CAP_STATE_READ,
  CAP_STATE_WRITE,
} from '@napplet/acl';
import type { AclState, Identity } from '@napplet/acl';

// ─── Runtime — protocol engine (browser-agnostic) ────────────────────────────
import { createRuntime, createEnforceGate, resolveCapabilities, formatDenialReason } from '@napplet/runtime';
import type { Runtime, RuntimeHooks } from '@napplet/runtime';

// ─── Shell — browser adapter (re-exports for backward compat) ────────────────
// We import specific re-exports to verify they match core's exports.
// createShellBridge cannot be called without browser globals.
import {
  BusKind as ShellBusKind,
  AUTH_KIND as ShellAUTH_KIND,
  SHELL_BRIDGE_URI as ShellBRIDGE_URI,
  PROTOCOL_VERSION as ShellVERSION,
  ALL_CAPABILITIES as ShellALL_CAPS,
  DESTRUCTIVE_KINDS as ShellDESTRUCTIVE,
  TOPICS as ShellTOPICS,
} from '@napplet/shell';
import type {
  NostrEvent as ShellNostrEvent,
  NostrFilter as ShellNostrFilter,
  Capability as ShellCapability,
} from '@napplet/shell';

// ─── Runtime mock helpers ────────────────────────────────────────────────────
import { createMockRuntimeHooks } from '../../packages/runtime/src/test-utils.js';

describe('shell -> runtime -> acl -> core integration', () => {

  // ─── Core types and constants ────────────────────────────────────────────

  describe('core exports', () => {
    it('core types are importable and defined', () => {
      expect(BusKind).toBeDefined();
      expect(AUTH_KIND).toBe(22242);
      expect(SHELL_BRIDGE_URI).toBe('napplet://shell');
      expect(PROTOCOL_VERSION).toBeDefined();
      expect(ALL_CAPABILITIES.length).toBeGreaterThan(0);
      expect(DESTRUCTIVE_KINDS).toBeInstanceOf(Set);
      expect(typeof REPLAY_WINDOW_SECONDS).toBe('number');
      expect(TOPICS).toBeDefined();
    });
  });

  // ─── Shell re-exports match core ─────────────────────────────────────────

  describe('shell re-exports match core', () => {
    it('BusKind is the same object from both packages', () => {
      expect(ShellBusKind).toBe(BusKind);
    });

    it('AUTH_KIND matches', () => {
      expect(ShellAUTH_KIND).toBe(AUTH_KIND);
    });

    it('SHELL_BRIDGE_URI matches', () => {
      expect(ShellBRIDGE_URI).toBe(SHELL_BRIDGE_URI);
    });

    it('PROTOCOL_VERSION matches', () => {
      expect(ShellVERSION).toBe(PROTOCOL_VERSION);
    });

    it('ALL_CAPABILITIES matches', () => {
      expect(ShellALL_CAPS).toBe(ALL_CAPABILITIES);
    });

    it('DESTRUCTIVE_KINDS matches', () => {
      expect(ShellDESTRUCTIVE).toBe(DESTRUCTIVE_KINDS);
    });

    it('TOPICS matches', () => {
      expect(ShellTOPICS).toBe(TOPICS);
    });

    it('shell type aliases are assignable to core types', () => {
      // Compile-time check: shell's re-exported types are identical to core's
      const event: ShellNostrEvent = {} as NostrEvent;
      const filter: ShellNostrFilter = {} as NostrFilter;
      const cap: ShellCapability = 'relay:read' as Capability;
      // And vice versa
      const event2: NostrEvent = {} as ShellNostrEvent;
      const filter2: NostrFilter = {} as ShellNostrFilter;
      const cap2: Capability = 'sign:event' as ShellCapability;
      expect(true).toBe(true);
    });
  });

  // ─── ACL uses core Capability type ───────────────────────────────────────

  describe('acl uses core Capability type', () => {
    it('grant and check work with core-compatible identity and bitfield', () => {
      let state: AclState = createState('restrictive');
      const id: Identity = { pubkey: 'a'.repeat(64), dTag: 'test', hash: 'b'.repeat(64) };

      // Grant relay:read via bitfield
      state = grant(state, id, CAP_RELAY_READ);
      expect(check(state, id, CAP_RELAY_READ)).toBe(true);
      expect(check(state, id, CAP_RELAY_WRITE)).toBe(false);
    });

    it('block overrides all capabilities', () => {
      let state = createState('restrictive');
      const id: Identity = { pubkey: 'c'.repeat(64), dTag: 'blocked-test', hash: 'd'.repeat(64) };

      state = grant(state, id, CAP_RELAY_READ | CAP_RELAY_WRITE | CAP_SIGN_EVENT);
      expect(check(state, id, CAP_RELAY_READ)).toBe(true);

      state = block(state, id);
      expect(check(state, id, CAP_RELAY_READ)).toBe(false);
      expect(check(state, id, CAP_SIGN_EVENT)).toBe(false);

      state = unblock(state, id);
      expect(check(state, id, CAP_RELAY_READ)).toBe(true);
    });

    it('toKey produces deterministic composite key', () => {
      const id: Identity = { pubkey: 'a'.repeat(64), dTag: 'chat', hash: 'b'.repeat(64) };
      const key = toKey(id);
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
      // Same identity produces same key
      expect(toKey(id)).toBe(key);
    });
  });

  // ─── Runtime creates in Node.js ──────────────────────────────────────────

  describe('runtime creates successfully in Node.js', () => {
    let mock: ReturnType<typeof createMockRuntimeHooks>;
    let runtime: Runtime;

    beforeEach(() => {
      mock = createMockRuntimeHooks();
      runtime = createRuntime(mock.hooks);
    });

    it('creates runtime with mock hooks — no browser dependencies', () => {
      expect(runtime).toBeDefined();
      expect(typeof runtime.handleMessage).toBe('function');
      expect(typeof runtime.sendChallenge).toBe('function');
      expect(typeof runtime.injectEvent).toBe('function');
      expect(typeof runtime.destroy).toBe('function');
      expect(typeof runtime.registerConsentHandler).toBe('function');
    });

    it('runtime exposes sessionRegistry, aclState, manifestCache', () => {
      expect(runtime.sessionRegistry).toBeDefined();
      expect(runtime.aclState).toBeDefined();
      expect(runtime.manifestCache).toBeDefined();
    });

    it('runtime sends AUTH challenge using core AUTH_KIND', () => {
      runtime.sendChallenge('test-win');
      const msg = mock.sent.find(m => m.message[0] === 'AUTH');
      expect(msg).toBeDefined();
      expect(msg!.windowId).toBe('test-win');
    });
  });

  // ─── Enforcement gate chain: runtime -> enforce -> acl -> core ───────────

  describe('enforcement gate chain', () => {
    it('resolveCapabilities uses core BusKind constants', () => {
      const reqCaps = resolveCapabilities(['REQ', 'sub-1', { kinds: [1] }]);
      expect(reqCaps.senderCap).toBe('relay:read');

      const signerCaps = resolveCapabilities(['EVENT', { kind: BusKind.SIGNER_REQUEST }]);
      expect(signerCaps.senderCap).toBe('sign:event');

      const hotkeyCaps = resolveCapabilities(['EVENT', { kind: BusKind.HOTKEY_FORWARD }]);
      expect(hotkeyCaps.senderCap).toBe('hotkey:forward');

      const stateCaps = resolveCapabilities(['EVENT', {
        kind: BusKind.IPC_PEER,
        tags: [['t', TOPICS.STATE_GET]],
      }]);
      expect(stateCaps.senderCap).toBe('state:read');
    });

    it('createEnforceGate produces allow/deny with core Capability strings', () => {
      const aclChecks: Array<{ capability: string; decision: string }> = [];

      const gate = createEnforceGate({
        checkAcl: (_pk, _dTag, _hash, cap) => cap === 'relay:read',
        resolveIdentity: () => ({ dTag: 'test', aggregateHash: 'hash' }),
        onAclCheck: (event) => aclChecks.push(event),
      });

      const allowed = gate('a'.repeat(64), 'relay:read');
      expect(allowed.allowed).toBe(true);
      expect(allowed.capability).toBe('relay:read');

      const denied = gate('a'.repeat(64), 'relay:write');
      expect(denied.allowed).toBe(false);
      expect(denied.capability).toBe('relay:write');

      expect(aclChecks.length).toBe(2);
      expect(aclChecks[0].decision).toBe('allow');
      expect(aclChecks[1].decision).toBe('deny');
    });

    it('formatDenialReason produces standard format', () => {
      const reason = formatDenialReason('relay:write');
      expect(reason).toBe('denied: relay:write');
    });
  });

  // ─── Full chain: runtime with ACL enforcement ────────────────────────────

  describe('full chain: runtime -> acl enforcement -> core types', () => {
    it('runtime enforces ACL revocation using core capability strings', async () => {
      const mock = createMockRuntimeHooks();
      const runtime = createRuntime(mock.hooks);

      // Authenticate a napplet
      const windowId = 'win-chain-test';
      const pubkey = 'e'.repeat(64);
      const dTag = parseInt(pubkey.slice(0, 8), 16).toString(36) + 'chain-napp';
      const hash = 'f'.repeat(64);

      runtime.sendChallenge(windowId);
      const challengeMsg = mock.sent.find(
        m => m.windowId === windowId && m.message[0] === 'AUTH',
      );
      const challenge = challengeMsg!.message[1] as string;

      const authEvent: NostrEvent = {
        id: 'auth-chain-' + '0'.repeat(53),
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: AUTH_KIND,
        tags: [
          ['challenge', challenge],
          ['relay', SHELL_BRIDGE_URI],
          ['type', 'chain-napp'],
          ['aggregateHash', hash],
        ],
        content: '',
        sig: '0'.repeat(128),
      };
      runtime.handleMessage(windowId, ['AUTH', authEvent]);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify auth succeeded
      expect(runtime.sessionRegistry.getPubkey(windowId)).toBe(pubkey);

      // Revoke relay:write using runtime's aclState
      runtime.aclState.revoke(pubkey, dTag, hash, 'relay:write');

      // Try to publish — should be denied
      mock.sent.length = 0;
      const event: NostrEvent = {
        id: 'chain-evt-' + '0'.repeat(54),
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: [],
        content: 'test',
        sig: '0'.repeat(128),
      };
      runtime.handleMessage(windowId, ['EVENT', event]);

      const ok = mock.sent.find(m => m.message[0] === 'OK' && m.message[2] === false);
      expect(ok).toBeDefined();
      expect(ok!.message[3]).toContain('denied: relay:write');

      runtime.destroy();
    });
  });
});
