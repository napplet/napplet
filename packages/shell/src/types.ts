// @napplet/shell — Shell-specific types and hook interfaces.
// Protocol types (NostrEvent, NostrFilter, Capability, constants) are imported from @napplet/core.

// Protocol types and constants re-exported from @napplet/core
export type { NostrEvent, NostrFilter, Capability } from '@napplet/core';
export { ALL_CAPABILITIES, BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, REPLAY_WINDOW_SECONDS, DESTRUCTIVE_KINDS } from '@napplet/core';
export type { BusKindValue } from '@napplet/core';

// Import Capability type locally for use in this file's shell-specific types
import type { Capability, NostrEvent, NostrFilter } from '@napplet/core';

// ─── Registry Types ─────────────────────────────────────────────────────────

/**
 * Registry entry mapping a napp's pubkey to its runtime metadata.
 * Created after a successful NIP-42 AUTH handshake.
 * @example
 * ```ts
 * const entry: NappKeyEntry = {
 *   pubkey: 'abc123...', windowId: 'win-1', origin: '*',
 *   type: 'chat', dTag: '3chat', aggregateHash: 'deadbeef',
 *   registeredAt: Date.now(),
 * };
 * ```
 */
export interface NappKeyEntry {
  pubkey: string;
  windowId: string;
  origin: string;
  type: string;
  dTag: string;
  aggregateHash: string;
  registeredAt: number;
}

/**
 * ACL entry controlling what a napp pubkey is permitted to do.
 * @example
 * ```ts
 * const entry: AclEntry = {
 *   pubkey: 'abc123...', capabilities: ['relay:read', 'relay:write'],
 *   blocked: false, stateQuota: 524288,
 * };
 * ```
 */
export interface AclEntry {
  pubkey: string;
  capabilities: Capability[];
  blocked: boolean;
  stateQuota?: number;
}

/**
 * A pending consent request for a destructive signing kind.
 * Raised when a signer request arrives for kinds 0, 3, 5, 10002.
 * @example
 * ```ts
 * bridge.registerConsentHandler((request: ConsentRequest) => {
 *   const allowed = confirm(`Allow kind ${request.event.kind}?`);
 *   request.resolve(allowed);
 * });
 * ```
 */
export interface ConsentRequest {
  windowId: string;
  pubkey: string;
  event: NostrEvent;
  resolve: (allowed: boolean) => void;
}

// ─── Hook Interfaces ────────────────────────────────────────────────────────

/**
 * Hook for relay pool operations. Host app provides relay connectivity.
 * @example
 * ```ts
 * const relayPoolHooks: RelayPoolHooks = {
 *   getRelayPool: () => myPool,
 *   trackSubscription: (key, cleanup) => subscriptions.set(key, cleanup),
 *   // ...
 * };
 * ```
 */
export interface RelayPoolHooks {
  /** Get the relay pool instance — returns null if no pool available. */
  getRelayPool(): RelayPoolLike | null;
  /** Track a subscription for lifecycle management. */
  trackSubscription(subKey: string, cleanup: () => void): void;
  /** Untrack and clean up a subscription. */
  untrackSubscription(subKey: string): void;
  /** Open a scoped relay connection (NIP-29 groups). */
  openScopedRelay(windowId: string, relayUrl: string, subId: string, filters: NostrFilter[], sourceWindow: Window): void;
  /** Close a scoped relay connection. */
  closeScopedRelay(windowId: string): void;
  /** Publish to a scoped relay. Returns false if no active scoped relay. */
  publishToScopedRelay(windowId: string, event: NostrEvent): boolean;
  /** Select relay URLs for a given set of filters. */
  selectRelayTier(filters: NostrFilter[]): string[];
}

/** Minimal relay pool interface that the shell requires. */
export interface RelayPoolLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription(relayUrls: string[], filters: any): { subscribe(observer: (item: unknown) => void): { unsubscribe(): void } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publish(relayUrls: string[], event: any): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request(relayUrls: string[], filters: any): { subscribe(observer: { next: (event: unknown) => void; complete: () => void; error: () => void }): { unsubscribe(): void } };
}

/** Hook for relay configuration. */
export interface RelayConfigHooks {
  /** Add a relay URL to a named tier. */
  addRelay(tier: string, url: string): void;
  /** Remove a relay URL from a named tier. */
  removeRelay(tier: string, url: string): void;
  /** Get the current relay configuration by tier. */
  getRelayConfig(): { discovery: string[]; super: string[]; outbox: string[] };
  /** Get NIP-66 relay suggestions. */
  getNip66Suggestions(): unknown;
}

/** Hook for window management. */
export interface WindowManagerHooks {
  /** Create a new window. Returns the window ID or null on failure. */
  createWindow(options: { title: string; class: string; iframeSrc?: string }): string | null;
}

/** Hook for auth state and signing. */
export interface AuthHooks {
  /** Get the current user's pubkey, or null if not logged in. */
  getUserPubkey(): string | null;
  /** Get the NIP-07 compatible signer, or null if unavailable. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSigner(): any | null;
}

/** Hook for config. */
export interface ConfigHooks {
  /** Get the napp update behavior policy. */
  getNappUpdateBehavior(): 'auto-grant' | 'banner' | 'silent-reprompt';
}

/** Hook for hotkey dispatch. */
export interface HotkeyHooks {
  /** Execute a forwarded hotkey from a napp. */
  executeHotkeyFromForward(event: {
    key: string;
    code: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  }): void;
}

/** Hook for worker relay (local cache). */
export interface WorkerRelayHooks {
  /** Get the worker relay instance, or null if unavailable. */
  getWorkerRelay(): WorkerRelayLike | null;
}

/** Minimal worker relay interface. */
export interface WorkerRelayLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event(event: NostrEvent): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query(req: any): Promise<NostrEvent[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  count?(req: any): Promise<number>;
}

/** Hook for crypto verification. */
export interface CryptoHooks {
  /** Verify a nostr event's signature. */
  verifyEvent(event: NostrEvent): Promise<boolean>;
}

/** Hook for DM sending (NIP-17 gift-wrap). */
export interface DmHooks {
  /** Send a direct message to a recipient. */
  sendDm(recipientPubkey: string, message: string): Promise<{ success: boolean; eventId?: string; error?: string }>;
}

/**
 * Event emitted on every ACL enforcement check.
 * @example
 * ```ts
 * hooks.onAclCheck = (event: AclCheckEvent) => {
 *   console.log(`${event.decision}: ${event.capability} for ${event.identity.pubkey}`);
 * };
 * ```
 */
export interface AclCheckEvent {
  /** The identity being checked. */
  identity: { pubkey: string; dTag: string; hash: string };
  /** The capability being checked (e.g., 'relay:write', 'state:read'). */
  capability: string;
  /** The enforcement decision. */
  decision: 'allow' | 'deny';
}

/**
 * All hooks that the shell requires from the host application.
 * @example
 * ```ts
 * const hooks: ShellHooks = {
 *   relayPool: myRelayPoolHooks,
 *   relayConfig: myRelayConfigHooks,
 *   windowManager: myWindowManagerHooks,
 *   auth: myAuthHooks,
 *   config: myConfigHooks,
 *   hotkeys: myHotkeyHooks,
 *   workerRelay: myWorkerRelayHooks,
 *   crypto: myCryptoHooks,
 * };
 * ```
 */
export interface ShellHooks {
  relayPool: RelayPoolHooks;
  relayConfig: RelayConfigHooks;
  windowManager: WindowManagerHooks;
  auth: AuthHooks;
  config: ConfigHooks;
  hotkeys: HotkeyHooks;
  workerRelay: WorkerRelayHooks;
  crypto: CryptoHooks;
  dm?: DmHooks;
  /** Called on every ACL enforcement check. Both allows and denials are reported. */
  onAclCheck?: (event: AclCheckEvent) => void;
}
