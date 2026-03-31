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

// ─── Service Extension Types ────────────────────────────────────────────────

/**
 * Metadata describing a registered shell service.
 * Services are optional capabilities a shell provides beyond the core protocol.
 *
 * @example
 * ```ts
 * const descriptor: ServiceDescriptor = {
 *   name: 'audio',
 *   version: '1.0.0',
 *   description: 'Audio playback management and mute control',
 * };
 * ```
 */
export interface ServiceDescriptor {
  /** Unique service identifier (e.g., 'audio', 'notifications', 'clipboard'). */
  name: string;
  /** Semver version of the service implementation. */
  version: string;
  /** Human-readable description of the service. */
  description?: string;
}

/**
 * Handler for service-specific messages from napplets.
 * The shell dispatches service messages to the appropriate handler based on the
 * service name extracted from the topic prefix.
 *
 * @example
 * ```ts
 * const handler: ServiceHandler = {
 *   descriptor: { name: 'audio', version: '1.0.0' },
 *   handleRequest(windowId, topic, content, event) {
 *     if (topic === 'audio:register') {
 *       audioManager.register(windowId, content.nappClass, content.title);
 *     }
 *   },
 * };
 * ```
 */
export interface ServiceHandler {
  /** Metadata describing this service. */
  descriptor: ServiceDescriptor;
  /**
   * Handle a service request from a napplet.
   *
   * @param windowId - The requesting napplet's window identifier
   * @param topic - The full topic string (e.g., 'audio:register')
   * @param content - Parsed JSON content from the event
   * @param event - The raw NostrEvent for advanced use cases
   */
  handleRequest(windowId: string, topic: string, content: unknown, event: NostrEvent): void;
  /**
   * Called when a napplet window is destroyed. Services should clean up
   * any state associated with the window.
   *
   * @param windowId - The destroyed napplet's window identifier
   */
  onWindowDestroyed?(windowId: string): void;
}

/**
 * Registry of shell services available to napplets.
 * The service registry is the extension point for adding new capabilities
 * to the shell without protocol changes.
 *
 * @example
 * ```ts
 * const services: ServiceRegistry = {
 *   audio: {
 *     descriptor: { name: 'audio', version: '1.0.0' },
 *     handleRequest(windowId, topic, content) { ... },
 *     onWindowDestroyed(windowId) { ... },
 *   },
 *   notifications: {
 *     descriptor: { name: 'notifications', version: '1.0.0' },
 *     handleRequest(windowId, topic, content) { ... },
 *   },
 * };
 * ```
 */
export interface ServiceRegistry {
  [serviceName: string]: ServiceHandler;
}

// ─── Shell Hooks ────────────────────────────────────────────────────────────

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
  /**
   * Optional service extensions. Each key is a service name (e.g., 'audio',
   * 'notifications'). Napplets discover available services via kind 29010
   * service discovery events.
   *
   * @example
   * ```ts
   * const hooks: ShellHooks = {
   *   // ... required hooks ...
   *   services: {
   *     audio: myAudioServiceHandler,
   *     notifications: myNotificationServiceHandler,
   *   },
   * };
   * ```
   */
  services?: ServiceRegistry;
}
