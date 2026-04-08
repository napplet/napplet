import { describe, it, expect } from 'vitest';
import {
  BusKind,
  SHELL_BRIDGE_URI,
  PROTOCOL_VERSION,
  ALL_CAPABILITIES,
  DESTRUCTIVE_KINDS,
  REPLAY_WINDOW_SECONDS,
  TOPICS,
} from './index.js';

// Type-level imports (compile check — if this file compiles, types are exported)
import type { NostrEvent, NostrFilter, Capability, BusKindValue, TopicKey, TopicValue, NamespacedCapability, ShellSupports } from './index.js';

describe('@napplet/core exports', () => {
  describe('BusKind constants', () => {
    it('exports BusKind with all protocol kinds', () => {
      expect(BusKind).toBeDefined();
      expect(typeof BusKind.SIGNER_REQUEST).toBe('number');
      expect(typeof BusKind.SIGNER_RESPONSE).toBe('number');
      expect(typeof BusKind.IPC_PEER).toBe('number');
      expect(typeof BusKind.HOTKEY_FORWARD).toBe('number');
      expect(typeof BusKind.METADATA).toBe('number');
      expect(typeof BusKind.SERVICE_DISCOVERY).toBe('number');
    });

    it('all bus kinds are in the 29000-29999 ephemeral range', () => {
      for (const [, value] of Object.entries(BusKind)) {
        expect(value).toBeGreaterThanOrEqual(29000);
        expect(value).toBeLessThan(30000);
      }
    });
  });

  describe('protocol constants', () => {
    it('exports SHELL_BRIDGE_URI as napplet:// URI', () => {
      expect(typeof SHELL_BRIDGE_URI).toBe('string');
      expect(SHELL_BRIDGE_URI).toMatch(/^napplet:\/\//);
    });

    it('exports PROTOCOL_VERSION as non-empty string', () => {
      expect(typeof PROTOCOL_VERSION).toBe('string');
      expect(PROTOCOL_VERSION.length).toBeGreaterThan(0);
    });

    it('exports REPLAY_WINDOW_SECONDS as positive number', () => {
      expect(typeof REPLAY_WINDOW_SECONDS).toBe('number');
      expect(REPLAY_WINDOW_SECONDS).toBeGreaterThan(0);
    });
  });

  describe('removed handshake exports', () => {
    it('BusKind does not have REGISTRATION', () => {
      expect('REGISTRATION' in BusKind).toBe(false);
    });

    it('does not export handshake constants', () => {
      // Verify via the BusKind object shape -- AUTH_KIND, VERB_REGISTER,
      // VERB_IDENTITY are standalone exports that TypeScript will catch
      // at compile time. BusKind.REGISTRATION is the runtime-checkable one.
      const busKindKeys = Object.keys(BusKind);
      expect(busKindKeys).not.toContain('REGISTRATION');
    });
  });

  describe('capability constants', () => {
    it('exports ALL_CAPABILITIES with known capabilities', () => {
      expect(Array.isArray(ALL_CAPABILITIES)).toBe(true);
      expect(ALL_CAPABILITIES.length).toBeGreaterThan(0);
      expect(ALL_CAPABILITIES).toContain('relay:read');
      expect(ALL_CAPABILITIES).toContain('relay:write');
      expect(ALL_CAPABILITIES).toContain('sign:event');
      expect(ALL_CAPABILITIES).toContain('sign:nip04');
      expect(ALL_CAPABILITIES).toContain('sign:nip44');
      expect(ALL_CAPABILITIES).toContain('state:read');
      expect(ALL_CAPABILITIES).toContain('state:write');
      expect(ALL_CAPABILITIES).toContain('cache:read');
      expect(ALL_CAPABILITIES).toContain('cache:write');
      expect(ALL_CAPABILITIES).toContain('hotkey:forward');
    });
  });

  describe('DESTRUCTIVE_KINDS', () => {
    it('exports DESTRUCTIVE_KINDS as a Set containing metadata, contacts, deletion, relay list', () => {
      expect(DESTRUCTIVE_KINDS).toBeInstanceOf(Set);
      expect(DESTRUCTIVE_KINDS.has(0)).toBe(true);     // metadata
      expect(DESTRUCTIVE_KINDS.has(3)).toBe(true);     // contacts
      expect(DESTRUCTIVE_KINDS.has(5)).toBe(true);     // deletion
      expect(DESTRUCTIVE_KINDS.has(10002)).toBe(true); // relay list
    });
  });

  describe('TOPICS', () => {
    it('exports TOPICS object with shell command keys', () => {
      expect(typeof TOPICS).toBe('object');
      expect(TOPICS).not.toBeNull();
      const topicValues = Object.values(TOPICS);
      expect(topicValues.length).toBeGreaterThan(0);
    });

    it('includes state operation topics', () => {
      expect(TOPICS.STATE_GET).toBe('shell:state-get');
      expect(TOPICS.STATE_SET).toBe('shell:state-set');
      expect(TOPICS.STATE_REMOVE).toBe('shell:state-remove');
      expect(TOPICS.STATE_CLEAR).toBe('shell:state-clear');
      expect(TOPICS.STATE_KEYS).toBe('shell:state-keys');
      expect(TOPICS.STATE_RESPONSE).toBe('napplet:state-response');
    });

    it('includes auth and relay topics', () => {
      expect(TOPICS.AUTH_IDENTITY_CHANGED).toBe('auth:identity-changed');
      expect(TOPICS.RELAY_SCOPED_CONNECT).toBe('shell:relay-scoped-connect');
      expect(TOPICS.RELAY_SCOPED_CLOSE).toBe('shell:relay-scoped-close');
    });

    it('includes audio topics', () => {
      expect(TOPICS.AUDIO_REGISTER).toBe('shell:audio-register');
      expect(TOPICS.AUDIO_UNREGISTER).toBe('shell:audio-unregister');
    });
  });

  describe('type-level exports (compile check)', () => {
    it('types are usable in type annotations', () => {
      // If this compiles, the types are exported correctly
      const _event: NostrEvent = {} as NostrEvent;
      const _filter: NostrFilter = {} as NostrFilter;
      const _cap: Capability = 'relay:read';
      const _busKindVal: BusKindValue = BusKind.IPC_PEER;
      const _topicKey: TopicKey = 'STATE_GET';
      const _topicVal: TopicValue = TOPICS.STATE_GET;
      expect(true).toBe(true);
    });
  });

  describe('namespaced capability types', () => {
    it('NamespacedCapability accepts bare NUB domain shorthand', () => {
      // Compile check: bare NUB domain strings are valid (per D-02)
      const _relay: NamespacedCapability = 'relay';
      const _signer: NamespacedCapability = 'signer';
      const _storage: NamespacedCapability = 'storage';
      const _ifc: NamespacedCapability = 'ifc';
      const _theme: NamespacedCapability = 'theme';
      expect(true).toBe(true);
    });

    it('NamespacedCapability accepts nub: prefixed domains', () => {
      // Compile check: explicit NUB prefix
      const _nubRelay: NamespacedCapability = 'nub:relay';
      const _nubSigner: NamespacedCapability = 'nub:signer';
      const _nubStorage: NamespacedCapability = 'nub:storage';
      const _nubIfc: NamespacedCapability = 'nub:ifc';
      const _nubTheme: NamespacedCapability = 'nub:theme';
      expect(true).toBe(true);
    });

    it('NamespacedCapability accepts perm: prefixed strings', () => {
      // Compile check: permission prefix (per D-03)
      const _permSign: NamespacedCapability = 'perm:sign';
      const _permPopups: NamespacedCapability = 'perm:popups';
      expect(true).toBe(true);
    });

    it('NamespacedCapability accepts svc: prefixed strings', () => {
      // Compile check: service prefix (per D-03)
      const _svcAudio: NamespacedCapability = 'svc:audio';
      const _svcNotifications: NamespacedCapability = 'svc:notifications';
      expect(true).toBe(true);
    });

    it('ShellSupports.supports() accepts NamespacedCapability', () => {
      // Compile check: the interface method accepts all forms
      const shell: ShellSupports = { supports: () => false };
      expect(shell.supports('relay')).toBe(false);
      expect(shell.supports('nub:relay')).toBe(false);
      expect(shell.supports('perm:sign')).toBe(false);
      expect(shell.supports('svc:audio')).toBe(false);
    });
  });
});
