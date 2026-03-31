/**
 * types.ts — Runtime hook interfaces and supporting types.
 *
 * RuntimeHooks is the abstract contract any environment must implement
 * to host napplets. No DOM types, no browser APIs.
 */

import type { NostrEvent, NostrFilter, Capability, ServiceDescriptor } from '@napplet/core';

// ─── ACL Check Event ──────────────────────────────────────────────────────

/**
 * Event emitted on every ACL enforcement check.
 *
 * @param identity - The napplet identity being checked
 * @param capability - The capability being checked
 * @param decision - Whether the check passed or failed
 *
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

// ─── Message Transport ─────────────────────────────────────────────────────

/**
 * Abstract message sender — the runtime calls this to send NIP-01 messages
 * back to a specific napplet. The transport layer (postMessage, WebSocket,
 * IPC channel, etc.) is the implementor's concern.
 *
 * @param windowId - Target napplet's identifier
 * @param msg - NIP-01 message array (e.g., ['EVENT', subId, event])
 */
export type SendToNapplet = (windowId: string, msg: unknown[]) => void;

// ─── Subscription Handle ───────────────────────────────────────────────────

/** Handle returned by relay pool subscriptions. */
export interface RelaySubscriptionHandle {
  unsubscribe(): void;
}

// ─── Relay Pool Hooks ──────────────────────────────────────────────────────

/**
 * Abstract relay pool — runtime uses this to subscribe to and publish
 * events on real Nostr relays. Implementor wraps their relay library.
 */
export interface RuntimeRelayPoolHooks {
  /**
   * Subscribe to events from relays matching the given filters.
   * The callback receives either 'EOSE' (end of stored events) or a NostrEvent.
   * Returns a handle that can cancel the subscription.
   */
  subscribe(
    filters: NostrFilter[],
    callback: (item: NostrEvent | 'EOSE') => void,
    relayUrls?: string[],
  ): RelaySubscriptionHandle;

  /** Publish an event to relays. */
  publish(event: NostrEvent): void;

  /** Select relay URLs appropriate for the given filters. */
  selectRelayTier(filters: NostrFilter[]): string[];

  /** Track a subscription key for lifecycle management. */
  trackSubscription(subKey: string, cleanup: () => void): void;

  /** Untrack and clean up a subscription. */
  untrackSubscription(subKey: string): void;

  /** Open a scoped relay connection (NIP-29 groups). */
  openScopedRelay(windowId: string, relayUrl: string, subId: string, filters: NostrFilter[], sendToNapplet: SendToNapplet): void;

  /** Close a scoped relay connection. */
  closeScopedRelay(windowId: string): void;

  /** Publish to a scoped relay. Returns false if no active scoped relay. */
  publishToScopedRelay(windowId: string, event: NostrEvent): boolean;

  /** Whether a relay pool is available. */
  isAvailable(): boolean;
}

// ─── Worker Relay / Cache Hooks ────────────────────────────────────────────

/** Abstract local cache — query and store events. */
export interface RuntimeCacheHooks {
  /** Query cached events. Returns matching events. */
  query(filters: NostrFilter[]): Promise<NostrEvent[]>;

  /** Store an event in cache. Best-effort, may silently fail. */
  store(event: NostrEvent): void;

  /** Whether cache is available. */
  isAvailable(): boolean;
}

// ─── Auth / Signer Hooks ───────────────────────────────────────────────────

/** NIP-07 compatible signer interface — minimal methods the runtime needs. */
export interface RuntimeSigner {
  getPublicKey?(): string | Promise<string>;
  signEvent?(event: NostrEvent): Promise<NostrEvent>;
  getRelays?(): Record<string, { read: boolean; write: boolean }> | Promise<Record<string, { read: boolean; write: boolean }>>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

/** Auth hooks — user identity and signing. */
export interface RuntimeAuthHooks {
  /** Get the current user's pubkey, or null if not logged in. */
  getUserPubkey(): string | null;

  /** Get the signer, or null if unavailable. */
  getSigner(): RuntimeSigner | null;
}

// ─── Config Hooks ──────────────────────────────────────────────────────────

/** Config hooks — runtime behavior settings. */
export interface RuntimeConfigHooks {
  /** Get the napp update behavior policy. */
  getNappUpdateBehavior(): 'auto-grant' | 'banner' | 'silent-reprompt';
}

// ─── Hotkey Hooks ──────────────────────────────────────────────────────────

/** Hotkey hooks — keyboard shortcut forwarding. */
export interface RuntimeHotkeyHooks {
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

// ─── Persistence Hooks ─────────────────────────────────────────────────────

/**
 * ACL persistence — runtime calls these to save/load ACL state.
 * Implementor decides storage backend (localStorage, file, DB, etc.).
 */
export interface RuntimeAclPersistence {
  persist(data: string): void;
  load(): string | null;
}

/**
 * Manifest persistence — runtime calls these to save/load manifest cache.
 * Implementor decides storage backend.
 */
export interface RuntimeManifestPersistence {
  persist(data: string): void;
  load(): string | null;
}

/**
 * State storage — runtime calls these for napplet-scoped key-value storage.
 * All keys are pre-scoped by the runtime (pubkey:dTag:hash:userKey).
 */
export interface RuntimeStatePersistence {
  get(scopedKey: string): string | null;
  set(scopedKey: string, value: string): boolean;
  remove(scopedKey: string): void;
  clear(prefix: string): void;
  keys(prefix: string): string[];
  calculateBytes(prefix: string, excludeKey?: string): number;
}

// ─── Crypto Hooks ──────────────────────────────────────────────────────────

/** Crypto hooks — event verification. */
export interface RuntimeCryptoHooks {
  /** Verify a nostr event's Schnorr signature. */
  verifyEvent(event: NostrEvent): Promise<boolean>;

  /** Generate a random UUID string (replaces crypto.randomUUID). */
  randomUUID(): string;
}

// ─── Window Management Hooks ───────────────────────────────────────────────

/** Window management — create new napplet windows. */
export interface RuntimeWindowManagerHooks {
  createWindow(options: { title: string; class: string; iframeSrc?: string }): string | null;
}

// ─── Relay Config Hooks ────────────────────────────────────────────────────

/** Relay configuration — manage relay tiers. */
export interface RuntimeRelayConfigHooks {
  addRelay(tier: string, url: string): void;
  removeRelay(tier: string, url: string): void;
  getRelayConfig(): { discovery: string[]; super: string[]; outbox: string[] };
  getNip66Suggestions(): unknown;
}

// ─── DM Hooks ──────────────────────────────────────────────────────────────

/** DM hooks — send direct messages (NIP-17 gift-wrap). */
export interface RuntimeDmHooks {
  sendDm(recipientPubkey: string, message: string): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
  }>;
}

// ─── Consent Request ───────────────────────────────────────────────────────

/**
 * A pending consent request — either for a destructive signing kind
 * or for undeclared service usage.
 *
 * When type is 'destructive-signing' (or omitted for backwards compat):
 *   Raised when a signer request arrives for kinds 0, 3, 5, 10002.
 *
 * When type is 'undeclared-service':
 *   Raised when a napplet uses a service it did not declare in its manifest.
 *   The serviceName field identifies which service was used without declaration.
 *
 * @example
 * ```ts
 * // Destructive signing consent (existing behavior)
 * const signingConsent: ConsentRequest = {
 *   type: 'destructive-signing',
 *   windowId: 'win-1', pubkey: 'abc...', event: signingEvent,
 *   resolve: (allowed) => { ... },
 * };
 *
 * // Undeclared service consent (new)
 * const serviceConsent: ConsentRequest = {
 *   type: 'undeclared-service',
 *   windowId: 'win-1', pubkey: 'abc...', event: serviceEvent,
 *   serviceName: 'audio',
 *   resolve: (allowed) => { ... },
 * };
 * ```
 */
export interface ConsentRequest {
  /** Consent type discriminator. Defaults to 'destructive-signing' if omitted. */
  type?: 'destructive-signing' | 'undeclared-service';
  windowId: string;
  pubkey: string;
  event: NostrEvent;
  resolve: (allowed: boolean) => void;
  /** Service name for undeclared-service consent. Only present when type is 'undeclared-service'. */
  serviceName?: string;
}

/** Consent handler callback type. */
export type ConsentHandler = (request: ConsentRequest) => void;

// ─── Service Info ─────────────────────────────────────────────────────────

/**
 * Information about an available service, as reported in discovery responses.
 * Mirrors the ServiceDescriptor shape from @napplet/core.
 *
 * @example
 * ```ts
 * const info: ServiceInfo = {
 *   name: 'audio',
 *   version: '1.0.0',
 *   description: 'Audio playback and mute control',
 * };
 * ```
 */
export interface ServiceInfo {
  /** Service identifier (e.g., 'audio', 'notifications'). */
  name: string;
  /** Semver version of the service. */
  version: string;
  /** Optional human-readable description. */
  description?: string;
}

// ─── Compatibility Report ─────────────────────────────────────────────────

/**
 * Result of checking a napplet's declared service requirements against
 * the runtime's registered services.
 *
 * Surfaced via RuntimeHooks.onCompatibilityIssue when compatible is false.
 * In strict mode, the runtime blocks loading. In permissive mode (default),
 * the runtime loads the napplet and the shell host decides UX.
 *
 * @example
 * ```ts
 * const report: CompatibilityReport = {
 *   available: [{ name: 'audio', version: '1.0.0' }],
 *   missing: ['notifications'],
 *   compatible: false,
 * };
 * ```
 */
export interface CompatibilityReport {
  /** Services that the shell provides (full list from service registry). */
  available: ServiceInfo[];
  /** Service names declared in manifest requires but not registered in the runtime. */
  missing: string[];
  /** True if all required services are available (missing.length === 0). */
  compatible: boolean;
}

// ─── NappKeyEntry ──────────────────────────────────────────────────────────

/**
 * Registry entry mapping a napp's pubkey to its runtime metadata.
 * Created after a successful NIP-42 AUTH handshake.
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
 * A pending napp update — raised when a napp reconnects with a different aggregateHash.
 */
export interface PendingUpdate {
  windowId: string;
  pubkey: string;
  dTag: string;
  oldHash: string;
  newHash: string;
  resolve: (action: 'accept' | 'block') => void;
}

/** Callback invoked when a pending update is set or cleared. */
export type PendingUpdateNotifier = (windowId: string) => void;

// ─── Manifest Cache Entry ──────────────────────────────────────────────────

/**
 * A cached manifest entry for a verified napp build.
 * Optionally stores the napplet's declared service requirements from its manifest.
 */
export interface ManifestCacheEntry {
  pubkey: string;
  dTag: string;
  aggregateHash: string;
  verifiedAt: number;
  /** Service names declared in the napplet's manifest requires tags. */
  requires?: string[];
}

// ─── ACL Entry (external representation) ───────────────────────────────────

/** External ACL entry — used in shell commands (shell:acl-get etc.). */
export interface AclEntryExternal {
  pubkey: string;
  capabilities: Capability[];
  blocked: boolean;
  stateQuota?: number;
}

// ─── Service Types ──────────────────────────────────────────────────────────

/**
 * Handler for service-specific messages from napplets.
 * Services receive raw NIP-01 message arrays and respond via the `send` callback.
 * The same interface is used for all services regardless of what NIP-01 verbs they handle.
 *
 * @example
 * ```ts
 * const audioHandler: ServiceHandler = {
 *   descriptor: { name: 'audio', version: '1.0.0' },
 *   handleMessage(windowId, message, send) {
 *     const [verb, ...rest] = message;
 *     if (verb === 'EVENT') {
 *       const event = rest[0] as NostrEvent;
 *       // process audio event...
 *       send(['OK', event.id, true, '']);
 *     }
 *   },
 * };
 * ```
 */
export interface ServiceHandler {
  /** Metadata describing this service. */
  descriptor: ServiceDescriptor;
  /**
   * Handle a raw NIP-01 message from a napplet.
   *
   * @param windowId - The requesting napplet's window identifier
   * @param message - Raw NIP-01 message array (e.g., ['EVENT', event], ['REQ', subId, ...filters])
   * @param send - Callback to send NIP-01 response messages back to the napplet
   */
  handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void;
  /**
   * Called when a napplet window is destroyed. Services should clean up
   * any state associated with the window.
   *
   * @param windowId - The destroyed napplet's window identifier
   */
  onWindowDestroyed?(windowId: string): void;
}

/**
 * Registry of services available to napplets.
 * Each key is a service name (e.g., 'audio', 'notifications').
 * Napplets discover available services via kind 29010 service discovery events.
 *
 * @example
 * ```ts
 * const services: ServiceRegistry = {
 *   audio: audioHandler,
 *   notifications: notificationHandler,
 * };
 * ```
 */
export type ServiceRegistry = Record<string, ServiceHandler>;

// ─── RuntimeHooks ──────────────────────────────────────────────────────────

/**
 * All hooks that the runtime requires from the host environment.
 *
 * This is the primary integration point. A browser shell implements these
 * by wrapping postMessage, localStorage, and relay pool libraries.
 * A CLI or server shell could implement them with IPC channels, file
 * storage, and direct WebSocket connections.
 *
 * @example
 * ```ts
 * import { createRuntime, type RuntimeHooks } from '@napplet/runtime';
 *
 * const hooks: RuntimeHooks = {
 *   sendToNapplet: (wid, msg) => iframeWindows.get(wid)?.postMessage(msg, '*'),
 *   relayPool: myRelayPoolAdapter,
 *   cache: myCacheAdapter,
 *   auth: myAuthAdapter,
 *   config: myConfigAdapter,
 *   hotkeys: myHotkeyAdapter,
 *   crypto: myCryptoAdapter,
 *   aclPersistence: myAclPersistenceAdapter,
 *   manifestPersistence: myManifestPersistenceAdapter,
 *   statePersistence: myStatePersistenceAdapter,
 *   windowManager: myWindowManagerAdapter,
 *   relayConfig: myRelayConfigAdapter,
 * };
 *
 * const runtime = createRuntime(hooks);
 * ```
 */
export interface RuntimeHooks {
  /** Send a NIP-01 message to a napplet by windowId. */
  sendToNapplet: SendToNapplet;

  /**
   * Relay pool operations.
   * Optional when a 'relay' or 'relay-pool' service is registered via
   * RuntimeHooks.services or runtime.registerService(). If neither hooks
   * nor service are provided, relay functionality is unavailable.
   */
  relayPool?: RuntimeRelayPoolHooks;

  /**
   * Local event cache (worker relay).
   * Optional when a 'cache' or 'relay' (coordinated) service is registered.
   * If neither hooks nor service are provided, cache functionality is unavailable.
   */
  cache?: RuntimeCacheHooks;

  /** Auth state and signing. */
  auth: RuntimeAuthHooks;

  /** Runtime configuration. */
  config: RuntimeConfigHooks;

  /** Hotkey dispatch. */
  hotkeys: RuntimeHotkeyHooks;

  /** Crypto operations (signature verification, random UUID). */
  crypto: RuntimeCryptoHooks;

  /** ACL persistence (save/load ACL state). */
  aclPersistence: RuntimeAclPersistence;

  /** Manifest cache persistence. */
  manifestPersistence: RuntimeManifestPersistence;

  /** Napplet state storage. */
  statePersistence: RuntimeStatePersistence;

  /** Window management. */
  windowManager: RuntimeWindowManagerHooks;

  /** Relay configuration. */
  relayConfig: RuntimeRelayConfigHooks;

  /** DM sending (optional). */
  dm?: RuntimeDmHooks;

  /** Called on every ACL enforcement check (audit). */
  onAclCheck?: (event: AclCheckEvent) => void;

  /** Called when a pending napp update is set or cleared. */
  onPendingUpdate?: PendingUpdateNotifier;

  /**
   * Called when a napplet's required services are not fully available.
   * Receives a CompatibilityReport with available/missing services.
   * In strict mode, the runtime blocks the napplet from loading.
   * In permissive mode (default), the napplet loads and the host decides UX.
   */
  onCompatibilityIssue?: (report: CompatibilityReport) => void;

  /**
   * When true, missing required services block napplet loading.
   * When false or omitted (default), napplets load with a warning.
   */
  strictMode?: boolean;

  /**
   * Optional service extensions. Shell/host registers service handlers here
   * for static initialization. Services can also be added dynamically via
   * runtime.registerService(). Each key is a service name (e.g., 'audio').
   *
   * @example
   * ```ts
   * const hooks: RuntimeHooks = {
   *   // ... required hooks ...
   *   services: {
   *     audio: myAudioServiceHandler,
   *   },
   * };
   * ```
   */
  services?: ServiceRegistry;
}
