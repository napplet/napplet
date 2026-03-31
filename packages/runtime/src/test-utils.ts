/**
 * test-utils.ts — Mock RuntimeHooks for unit testing.
 *
 * Not exported from the package — only used by tests.
 * No browser globals (window, document, localStorage).
 */

import type {
  RuntimeHooks,
  RuntimeRelayPoolHooks,
  RuntimeCacheHooks,
  RuntimeAuthHooks,
  RuntimeConfigHooks,
  RuntimeHotkeyHooks,
  RuntimeCryptoHooks,
  RuntimeAclPersistence,
  RuntimeManifestPersistence,
  RuntimeStatePersistence,
  RuntimeWindowManagerHooks,
  RuntimeRelayConfigHooks,
  AclCheckEvent,
} from './types.js';
import type { NostrEvent, NostrFilter } from '@napplet/core';

// ─── Recorded message types ─────────────────────────────────────────────────

export interface SentMessage {
  windowId: string;
  message: unknown[];
}

export interface MockRuntimeContext {
  hooks: RuntimeHooks;
  /** All messages sent to napplets via sendToNapplet. */
  sent: SentMessage[];
  /** All ACL check events logged. */
  aclChecks: AclCheckEvent[];
  /** In-memory state storage. */
  stateStore: Map<string, string>;
  /** In-memory ACL persistence store. */
  aclStore: { data: string | null };
  /** In-memory manifest persistence store. */
  manifestStore: { data: string | null };
  /** Reset all recorded data. */
  reset(): void;
}

// ─── Mock Relay Pool ──────────────────────────────────────────────────────────

function createMockRelayPool(): RuntimeRelayPoolHooks {
  const tracked = new Map<string, () => void>();

  return {
    subscribe(_filters: NostrFilter[], _cb: (item: NostrEvent | 'EOSE') => void, _relayUrls?: string[]) {
      return { unsubscribe() { /* no-op */ } };
    },
    publish(_event: NostrEvent) { /* no-op */ },
    selectRelayTier(_filters: NostrFilter[]) { return []; },
    trackSubscription(subKey: string, cleanup: () => void) { tracked.set(subKey, cleanup); },
    untrackSubscription(subKey: string) { const fn = tracked.get(subKey); if (fn) { fn(); tracked.delete(subKey); } },
    openScopedRelay() { /* no-op */ },
    closeScopedRelay() { /* no-op */ },
    publishToScopedRelay() { return false; },
    isAvailable() { return false; },
  };
}

// ─── Mock Cache ───────────────────────────────────────────────────────────────

function createMockCache(): RuntimeCacheHooks {
  return {
    query(_filters: NostrFilter[]) { return Promise.resolve([]); },
    store(_event: NostrEvent) { /* no-op */ },
    isAvailable() { return false; },
  };
}

// ─── Mock Auth ────────────────────────────────────────────────────────────────

function createMockAuth(): RuntimeAuthHooks {
  return {
    getUserPubkey() { return 'user_' + '0'.repeat(60); },
    getSigner() { return null; },
  };
}

// ─── Mock Config ──────────────────────────────────────────────────────────────

function createMockConfig(): RuntimeConfigHooks {
  return {
    getNappUpdateBehavior() { return 'auto-grant'; },
  };
}

// ─── Mock Hotkeys ─────────────────────────────────────────────────────────────

function createMockHotkeys(): RuntimeHotkeyHooks {
  return {
    executeHotkeyFromForward() { /* no-op */ },
  };
}

// ─── Mock Crypto ──────────────────────────────────────────────────────────────

let uuidCounter = 0;

function createMockCrypto(): RuntimeCryptoHooks {
  return {
    async verifyEvent(_event: NostrEvent) { return true; },
    randomUUID() { return `mock-uuid-${++uuidCounter}-${'0'.repeat(40)}`; },
  };
}

// ─── Mock Persistence ─────────────────────────────────────────────────────────

function createMockAclPersistence(store: { data: string | null }): RuntimeAclPersistence {
  return {
    persist(data: string) { store.data = data; },
    load() { return store.data; },
  };
}

function createMockManifestPersistence(store: { data: string | null }): RuntimeManifestPersistence {
  return {
    persist(data: string) { store.data = data; },
    load() { return store.data; },
  };
}

function createMockStatePersistence(stateStore: Map<string, string>): RuntimeStatePersistence {
  return {
    get(key: string) { return stateStore.get(key) ?? null; },
    set(key: string, value: string) { stateStore.set(key, value); return true; },
    remove(key: string) { stateStore.delete(key); },
    clear(prefix: string) {
      for (const k of [...stateStore.keys()]) {
        if (k.startsWith(prefix)) stateStore.delete(k);
      }
    },
    keys(prefix: string) {
      return [...stateStore.keys()].filter(k => k.startsWith(prefix));
    },
    calculateBytes(prefix: string) {
      let bytes = 0;
      for (const [k, v] of stateStore.entries()) {
        if (k.startsWith(prefix)) bytes += k.length + v.length;
      }
      return bytes;
    },
  };
}

// ─── Mock Window Manager ──────────────────────────────────────────────────────

function createMockWindowManager(): RuntimeWindowManagerHooks {
  return {
    createWindow(_options: { title: string; class: string; iframeSrc?: string }) { return 'mock-window-1'; },
  };
}

// ─── Mock Relay Config ────────────────────────────────────────────────────────

function createMockRelayConfig(): RuntimeRelayConfigHooks {
  return {
    addRelay() { /* no-op */ },
    removeRelay() { /* no-op */ },
    getRelayConfig() { return { discovery: [], super: [], outbox: [] }; },
    getNip66Suggestions() { return []; },
  };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a complete set of mock RuntimeHooks for testing.
 * All hooks are sensible no-ops that record calls for assertions.
 *
 * @param overrides - Partial overrides for any hook property
 * @returns A MockRuntimeContext with hooks and recorded data
 */
export function createMockRuntimeHooks(overrides?: Partial<RuntimeHooks>): MockRuntimeContext {
  const sent: SentMessage[] = [];
  const aclChecks: AclCheckEvent[] = [];
  const stateStore = new Map<string, string>();
  const aclStore = { data: null as string | null };
  const manifestStore = { data: null as string | null };

  uuidCounter = 0;

  const hooks: RuntimeHooks = {
    sendToNapplet(windowId: string, msg: unknown[]) {
      sent.push({ windowId, message: msg });
    },
    relayPool: createMockRelayPool(),
    cache: createMockCache(),
    auth: createMockAuth(),
    config: createMockConfig(),
    hotkeys: createMockHotkeys(),
    crypto: createMockCrypto(),
    aclPersistence: createMockAclPersistence(aclStore),
    manifestPersistence: createMockManifestPersistence(manifestStore),
    statePersistence: createMockStatePersistence(stateStore),
    windowManager: createMockWindowManager(),
    relayConfig: createMockRelayConfig(),
    onAclCheck(event: AclCheckEvent) { aclChecks.push(event); },
    ...overrides,
  };

  return {
    hooks,
    sent,
    aclChecks,
    stateStore,
    aclStore,
    manifestStore,
    reset() {
      sent.length = 0;
      aclChecks.length = 0;
      stateStore.clear();
      aclStore.data = null;
      manifestStore.data = null;
      uuidCounter = 0;
    },
  };
}
