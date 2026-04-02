/**
 * hooks-adapter.ts — Converts ShellAdapter (browser-facing) to RuntimeAdapter (environment-agnostic).
 *
 * The adapter bridges the gap between the shell's browser-oriented ShellAdapter interfaces
 * (Window references, localStorage, postMessage) and the runtime's abstract RuntimeAdapter
 * (windowId strings, persistence interfaces, sendToNapplet callbacks).
 */

import type { NostrEvent, NostrFilter, Capability } from '@napplet/core';
import type {
  RuntimeAdapter,
  RelayPoolAdapter,
  CacheAdapter,
  AuthAdapter,
  Signer,
  ConfigAdapter,
  HotkeyAdapter,
  AclPersistence,
  ManifestPersistence,
  StatePersistence,
  CryptoAdapter,
  WindowManagerAdapter,
  RelayConfigAdapter,
  DmAdapter,
  SendToNapplet,
  RelaySubscriptionHandle,
  ShellSecretPersistence,
  GuidPersistence,
} from '@napplet/runtime';

// ─── Hex utilities (inline to avoid @noble/hashes dependency) ────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
import type { ShellAdapter } from './types.js';
import type { originRegistry as OriginRegistryType } from './origin-registry.js';
import type { manifestCache as ManifestCacheType } from './manifest-cache.js';
import type { aclStore as AclStoreType } from './acl-store.js';
import type { audioManager as AudioManagerType } from './audio-manager.js';
import type { sessionRegistry as SessionRegistryType } from './session-registry.js';

// ─── Browser Dependencies ─────────────────────────────────────────────────

/**
 * Browser-specific singletons that the adapter bridges to the runtime.
 * These use browser APIs (Window, localStorage, postMessage, CustomEvent)
 * that the runtime cannot access directly.
 */
export interface BrowserDeps {
  originRegistry: typeof OriginRegistryType;
  manifestCache: typeof ManifestCacheType;
  aclStore: typeof AclStoreType;
  audioManager: typeof AudioManagerType;
  nappKeyRegistry: typeof SessionRegistryType;
}

// ─── Adapter Factory ──────────────────────────────────────────────────────

/**
 * Convert ShellHooks (browser-facing) into RuntimeHooks (environment-agnostic).
 *
 * The adapter is the single translation layer between browser APIs and the
 * runtime's abstract interfaces. It:
 * - Converts Window references to windowId strings via originRegistry
 * - Wraps localStorage-backed singletons into persistence interfaces
 * - Translates relay pool API shapes (Observable → callback)
 *
 * @param shellHooks - The browser-oriented ShellAdapter provided by the host app
 * @param deps - Browser-specific singletons (originRegistry, aclStore, etc.)
 * @returns RuntimeAdapter suitable for createRuntime()
 *
 * @example
 * ```ts
 * const runtimeHooks = adaptHooks(shellHooks, {
 *   originRegistry, manifestCache, aclStore, audioManager, nappKeyRegistry,
 * });
 * const runtime = createRuntime(runtimeHooks);
 * ```
 */
export function adaptHooks(shellHooks: ShellAdapter, deps: BrowserDeps): RuntimeAdapter {
  const { originRegistry } = deps;

  // ─── sendToNapplet: windowId → Window lookup → postMessage ────────────

  const sendToNapplet: SendToNapplet = (windowId: string, msg: unknown[]): void => {
    const win = originRegistry.getIframeWindow(windowId);
    if (win) win.postMessage(msg, '*');
  };

  // ─── Relay Pool Adapter ─────────────────────────────────────────────────

  const relayPool: RelayPoolAdapter = {
    subscribe(
      filters: NostrFilter[],
      callback: (item: NostrEvent | 'EOSE') => void,
      relayUrls?: string[],
    ): RelaySubscriptionHandle {
      const pool = shellHooks.relayPool.getRelayPool();
      if (!pool) return { unsubscribe() { /* no-op */ } };

      const urls = relayUrls ?? shellHooks.relayPool.selectRelayTier(filters);
      const sub = pool.subscription(urls, filters).subscribe((item) => {
        if (item === 'EOSE') {
          callback('EOSE');
        } else {
          callback(item as NostrEvent);
        }
      });
      return { unsubscribe: () => sub.unsubscribe() };
    },

    publish(event: NostrEvent): void {
      const pool = shellHooks.relayPool.getRelayPool();
      if (!pool) return;
      const relayUrls = shellHooks.relayPool.selectRelayTier([]);
      pool.publish(relayUrls, event);
    },

    selectRelayTier(filters: NostrFilter[]): string[] {
      return shellHooks.relayPool.selectRelayTier(filters);
    },

    trackSubscription(subKey: string, cleanup: () => void): void {
      shellHooks.relayPool.trackSubscription(subKey, cleanup);
    },

    untrackSubscription(subKey: string): void {
      shellHooks.relayPool.untrackSubscription(subKey);
    },

    openScopedRelay(
      windowId: string,
      relayUrl: string,
      subId: string,
      filters: NostrFilter[],
      sendFn: SendToNapplet,
    ): void {
      const win = originRegistry.getIframeWindow(windowId);
      if (win) shellHooks.relayPool.openScopedRelay(windowId, relayUrl, subId, filters, win);
    },

    closeScopedRelay(windowId: string): void {
      shellHooks.relayPool.closeScopedRelay(windowId);
    },

    publishToScopedRelay(windowId: string, event: NostrEvent): boolean {
      return shellHooks.relayPool.publishToScopedRelay(windowId, event);
    },

    isAvailable(): boolean {
      return shellHooks.relayPool.getRelayPool() !== null;
    },
  };

  // ─── Cache Adapter (Worker Relay) ───────────────────────────────────────

  const cache: CacheAdapter = {
    async query(filters: NostrFilter[]): Promise<NostrEvent[]> {
      const workerRelay = shellHooks.workerRelay.getWorkerRelay();
      if (!workerRelay) return [];
      // Worker relay expects REQ-style array: ['REQ', subId, ...filters]
      const subId = crypto.randomUUID();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return workerRelay.query(['REQ', subId, ...(filters as any[])]);
    },

    store(event: NostrEvent): void {
      const workerRelay = shellHooks.workerRelay.getWorkerRelay();
      if (!workerRelay) return;
      try { workerRelay.event(event)?.catch?.(() => { /* best-effort */ }); } catch { /* best-effort */ }
    },

    isAvailable(): boolean {
      return shellHooks.workerRelay.getWorkerRelay() !== null;
    },
  };

  // ─── Auth Adapter ───────────────────────────────────────────────────────

  const auth: AuthAdapter = {
    getUserPubkey(): string | null {
      return shellHooks.auth.getUserPubkey();
    },
    getSigner(): Signer | null {
      return shellHooks.auth.getSigner();
    },
  };

  // ─── Config Adapter ─────────────────────────────────────────────────────

  const config: ConfigAdapter = {
    getNappUpdateBehavior(): 'auto-grant' | 'banner' | 'silent-reprompt' {
      return shellHooks.config.getNappUpdateBehavior();
    },
  };

  // ─── Hotkey Adapter ─────────────────────────────────────────────────────

  const hotkeys: HotkeyAdapter = {
    executeHotkeyFromForward(event): void {
      shellHooks.hotkeys.executeHotkeyFromForward(event);
    },
  };

  // ─── Crypto Adapter ─────────────────────────────────────────────────────

  const cryptoHooks: CryptoAdapter = {
    async verifyEvent(event: NostrEvent): Promise<boolean> {
      return shellHooks.crypto.verifyEvent(event);
    },
    randomUUID(): string {
      return crypto.randomUUID();
    },
    randomBytes(length: number): Uint8Array {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      return bytes;
    },
  };

  // ─── ACL Persistence (localStorage-backed) ──────────────────────────────

  const aclPersistence: AclPersistence = {
    persist(data: string): void {
      try { localStorage.setItem('napplet:acl', data); } catch { /* best-effort */ }
    },
    load(): string | null {
      try { return localStorage.getItem('napplet:acl'); } catch { return null; }
    },
  };

  // ─── Manifest Persistence (localStorage-backed) ─────────────────────────

  const manifestPersistence: ManifestPersistence = {
    persist(data: string): void {
      try { localStorage.setItem('napplet:manifest-cache', data); } catch { /* best-effort */ }
    },
    load(): string | null {
      try { return localStorage.getItem('napplet:manifest-cache'); } catch { return null; }
    },
  };

  // ─── State Persistence (localStorage-backed, scoped) ────────────────────

  const statePersistence: StatePersistence = {
    get(scopedKey: string): string | null {
      try { return localStorage.getItem(scopedKey); } catch { return null; }
    },
    set(scopedKey: string, value: string): boolean {
      try { localStorage.setItem(scopedKey, value); return true; } catch { return false; }
    },
    remove(scopedKey: string): void {
      try { localStorage.removeItem(scopedKey); } catch { /* best-effort */ }
    },
    clear(prefix: string): void {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) keysToRemove.push(key);
        }
        for (const key of keysToRemove) localStorage.removeItem(key);
      } catch { /* best-effort */ }
    },
    keys(prefix: string): string[] {
      try {
        const result: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) result.push(key);
        }
        return result;
      } catch { return []; }
    },
    calculateBytes(prefix: string, excludeKey?: string): number {
      try {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key?.startsWith(prefix)) continue;
          if (excludeKey && key === excludeKey) continue;
          const value = localStorage.getItem(key) ?? '';
          total += new TextEncoder().encode(key + value).length;
        }
        return total;
      } catch { return 0; }
    },
  };

  // ─── Window Manager Adapter ─────────────────────────────────────────────

  const windowManager: WindowManagerAdapter = {
    createWindow(options): string | null {
      return shellHooks.windowManager.createWindow(options);
    },
  };

  // ─── Relay Config Adapter ───────────────────────────────────────────────

  const relayConfig: RelayConfigAdapter = {
    addRelay(tier: string, url: string): void {
      shellHooks.relayConfig.addRelay(tier, url);
    },
    removeRelay(tier: string, url: string): void {
      shellHooks.relayConfig.removeRelay(tier, url);
    },
    getRelayConfig(): { discovery: string[]; super: string[]; outbox: string[] } {
      return shellHooks.relayConfig.getRelayConfig();
    },
    getNip66Suggestions(): unknown {
      return shellHooks.relayConfig.getNip66Suggestions();
    },
  };

  // ─── Shell Secret Persistence (localStorage-backed) ─────────────────────

  const shellSecretPersistence: ShellSecretPersistence = {
    get(): Uint8Array | null {
      try {
        const hex = localStorage.getItem('napplet-shell-secret');
        if (!hex) return null;
        return hexToBytes(hex);
      } catch { return null; }
    },
    set(secret: Uint8Array): void {
      try {
        localStorage.setItem('napplet-shell-secret', bytesToHex(secret));
      } catch { /* localStorage unavailable */ }
    },
  };

  // ─── GUID Persistence (localStorage-backed) ────────────────────────────

  const guidPersistence: GuidPersistence = {
    get(windowId: string): string | null {
      try {
        return localStorage.getItem(`napplet-guid:${windowId}`);
      } catch { return null; }
    },
    set(windowId: string, guid: string): void {
      try {
        localStorage.setItem(`napplet-guid:${windowId}`, guid);
      } catch { /* localStorage unavailable */ }
    },
    remove(windowId: string): void {
      try {
        localStorage.removeItem(`napplet-guid:${windowId}`);
      } catch { /* localStorage unavailable */ }
    },
  };

  // ─── DM Adapter (optional) ──────────────────────────────────────────────

  const dm: DmAdapter | undefined = shellHooks.dm
    ? {
        sendDm(recipientPubkey: string, message: string) {
          return shellHooks.dm!.sendDm(recipientPubkey, message);
        },
      }
    : undefined;

  // ─── Assemble RuntimeAdapter ────────────────────────────────────────────

  return {
    sendToNapplet,
    relayPool,
    cache,
    auth,
    config,
    hotkeys,
    crypto: cryptoHooks,
    aclPersistence,
    manifestPersistence,
    statePersistence,
    windowManager,
    relayConfig,
    dm,
    shellSecretPersistence,
    guidPersistence,
    onAclCheck: shellHooks.onAclCheck,
    onHashMismatch: shellHooks.onHashMismatch,
    services: shellHooks.services,
  };
}
