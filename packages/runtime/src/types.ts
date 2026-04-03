/**
 * types.ts — Runtime adapter interfaces and supporting types.
 *
 * RuntimeAdapter is the abstract contract any environment must implement
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
  /** The triggering NIP-01 message, if available. */
  message?: unknown[];
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

// ─── Runtime Sub-interfaces ────────────────────────────────────────────────
//
// These describe what the protocol engine requires from the host environment
// (environment abstraction contracts). Suffix: *Adapter.
//
// Shell sub-interfaces (in @napplet/shell) describe injection points the
// host app provides. Those keep the *Hooks suffix. The distinction is
// intentional: RelayPoolAdapter (runtime) ≠ RelayPoolHooks (shell).

// ─── Relay Pool Adapter ────────────────────────────────────────────────────

/**
 * Abstract relay pool — runtime uses this to subscribe to and publish
 * events on real Nostr relays. Implementor wraps their relay library.
 */
export interface RelayPoolAdapter {
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

// ─── Cache Adapter ─────────────────────────────────────────────────────────

/** Abstract local cache — query and store events. */
export interface CacheAdapter {
  /** Query cached events. Returns matching events. */
  query(filters: NostrFilter[]): Promise<NostrEvent[]>;

  /** Store an event in cache. Best-effort, may silently fail. */
  store(event: NostrEvent): void;

  /** Whether cache is available. */
  isAvailable(): boolean;
}

// ─── Signer / Auth Adapters ────────────────────────────────────────────────

/** NIP-07 compatible signer interface — minimal methods the runtime needs. */
export interface Signer {
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

/** Auth adapter — user identity and signing. */
export interface AuthAdapter {
  /** Get the current user's pubkey, or null if not logged in. */
  getUserPubkey(): string | null;

  /** Get the signer, or null if unavailable. */
  getSigner(): Signer | null;
}

// ─── Config Adapter ────────────────────────────────────────────────────────

/** Config adapter — runtime behavior settings. */
export interface ConfigAdapter {
  /** Get the napp update behavior policy. */
  getNappUpdateBehavior(): 'auto-grant' | 'banner' | 'silent-reprompt';
}

// ─── Hotkey Adapter ────────────────────────────────────────────────────────

/** Hotkey adapter — keyboard shortcut forwarding. */
export interface HotkeyAdapter {
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

// ─── Persistence Adapters ──────────────────────────────────────────────────

/**
 * ACL persistence — runtime calls these to save/load ACL state.
 * Implementor decides storage backend (localStorage, file, DB, etc.).
 */
export interface AclPersistence {
  persist(data: string): void;
  load(): string | null;
}

/**
 * Manifest persistence — runtime calls these to save/load manifest cache.
 * Implementor decides storage backend.
 */
export interface ManifestPersistence {
  persist(data: string): void;
  load(): string | null;
}

/**
 * Shell secret persistence — runtime calls these to save/load the per-shell secret
 * used for deterministic keypair derivation. The secret is a 32-byte random value
 * generated once on first use.
 */
export interface ShellSecretPersistence {
  /** Get the stored shell secret, or null if not yet generated. */
  get(): Uint8Array | null;
  /** Store the shell secret. */
  set(secret: Uint8Array): void;
}

/**
 * GUID persistence — runtime calls these to save/load per-iframe instance GUIDs.
 * GUIDs survive page reloads: same iframe slot gets the same GUID.
 * Implementor decides storage backend and keying strategy
 * (e.g., localStorage keyed by iframe src or slot index).
 */
export interface GuidPersistence {
  /** Get a stored GUID for a window identifier, or null if none exists. */
  get(windowId: string): string | null;
  /** Store a GUID for a window identifier. */
  set(windowId: string, guid: string): void;
  /** Remove a stored GUID. */
  remove(windowId: string): void;
}

/**
 * State storage — runtime calls these for napplet-scoped key-value storage.
 * All keys are pre-scoped by the runtime (dTag:hash:userKey).
 */
export interface StatePersistence {
  get(scopedKey: string): string | null;
  set(scopedKey: string, value: string): boolean;
  remove(scopedKey: string): void;
  clear(prefix: string): void;
  keys(prefix: string): string[];
  calculateBytes(prefix: string, excludeKey?: string): number;
}

// ─── Crypto Adapter ────────────────────────────────────────────────────────

/** Crypto adapter — event verification. */
export interface CryptoAdapter {
  /** Verify a nostr event's Schnorr signature. */
  verifyEvent(event: NostrEvent): Promise<boolean>;

  /** Generate a random UUID string (replaces crypto.randomUUID). */
  randomUUID(): string;

  /** Generate cryptographically secure random bytes. */
  randomBytes(length: number): Uint8Array;
}

/**
 * Hash verification adapter — runtime calls this to verify a napplet's
 * declared aggregate hash against its actual file contents.
 * Optional: if not provided, hash verification is skipped (dev mode).
 */
export interface HashVerifierAdapter {
  /**
   * Compute aggregate hash from the napplet's served files.
   * Returns the computed hash, or null if files cannot be fetched.
   *
   * @param nappletUrl - Base URL of the napplet (iframe src)
   * @param manifestFiles - File paths and hashes from the manifest
   * @returns Computed aggregate hash, or null on failure
   */
  computeHash(
    nappletUrl: string,
    manifestFiles: Array<{ path: string; hash: string }>,
  ): Promise<string | null>;
}

// ─── Window Manager Adapter ────────────────────────────────────────────────

/** Window management — create new napplet windows. */
export interface WindowManagerAdapter {
  createWindow(options: { title: string; class: string; iframeSrc?: string }): string | null;
}

// ─── Relay Config Adapter ──────────────────────────────────────────────────

/** Relay configuration — manage relay tiers. */
export interface RelayConfigAdapter {
  addRelay(tier: string, url: string): void;
  removeRelay(tier: string, url: string): void;
  getRelayConfig(): { discovery: string[]; super: string[]; outbox: string[] };
  getNip66Suggestions(): unknown;
}

// ─── DM Adapter ────────────────────────────────────────────────────────────

/** DM adapter — send direct messages (NIP-17 gift-wrap). */
export interface DmAdapter {
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
 * Surfaced via RuntimeAdapter.onCompatibilityIssue when compatible is false.
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

// ─── SessionEntry ─────────────────────────────────────────────────────────

/**
 * Registry entry mapping a napplet's pubkey to its runtime metadata.
 * Created after a successful NIP-42 AUTH handshake.
 */
export interface SessionEntry {
  pubkey: string;
  windowId: string;
  origin: string;
  type: string;
  dTag: string;
  aggregateHash: string;
  registeredAt: number;
  /** Persistent GUID for this iframe instance, assigned by the runtime. Survives page reloads. */
  instanceId: string;
}

/** @deprecated Use SessionEntry. Will be removed in v0.9.0. */
export type NappKeyEntry = SessionEntry;

/**
 * A pending napplet update — raised when a napplet reconnects with a different aggregateHash.
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
 * A cached manifest entry for a verified napplet build.
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

/**
 * Cached verification result for an aggregate hash.
 * Keyed by manifest event ID — immutable Nostr events mean same ID = same content.
 */
export interface VerificationCacheEntry {
  /** The computed aggregate hash. */
  aggregateHash: string;
  /** Whether the computed hash matched the declared hash. */
  valid: boolean;
  /** Timestamp when verification was performed. */
  verifiedAt: number;
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

// ─── Runtime Config Overrides ──────────────────────────────────────────────

/**
 * Optional runtime configuration overrides. When provided via
 * RuntimeAdapter.getConfigOverrides(), the runtime reads these
 * instead of the module-level defaults. All fields are optional —
 * unset fields use the built-in defaults.
 *
 * Intended for demo/debug use only.
 *
 * @example
 * ```ts
 * const overrides: RuntimeConfigOverrides = {
 *   replayWindowSeconds: 60,
 *   ringBufferSize: 500,
 * };
 * ```
 */
export interface RuntimeConfigOverrides {
  /** Override REPLAY_WINDOW_SECONDS (default: 30). */
  replayWindowSeconds?: number;
  /** Override RING_BUFFER_SIZE (default: 100). */
  ringBufferSize?: number;
}

// ─── RuntimeAdapter ────────────────────────────────────────────────────────

/**
 * All adapters that the runtime requires from the host environment.
 *
 * This is the primary integration point. A browser shell implements these
 * by wrapping postMessage, localStorage, and relay pool libraries.
 * A CLI or server shell could implement them with IPC channels, file
 * storage, and direct WebSocket connections.
 *
 * @example
 * ```ts
 * import { createRuntime, type RuntimeAdapter } from '@napplet/runtime';
 *
 * const hooks: RuntimeAdapter = {
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
export interface RuntimeAdapter {
  /** Send a NIP-01 message to a napplet by windowId. */
  sendToNapplet: SendToNapplet;

  /**
   * Relay pool operations.
   * Optional when a 'relay' or 'relay-pool' service is registered via
   * RuntimeAdapter.services or runtime.registerService(). If neither adapter
   * nor service are provided, relay functionality is unavailable.
   */
  relayPool?: RelayPoolAdapter;

  /**
   * Local event cache (worker relay).
   * Optional when a 'cache' or 'relay' (coordinated) service is registered.
   * If neither adapter nor service are provided, cache functionality is unavailable.
   */
  cache?: CacheAdapter;

  /** Auth state and signing. */
  auth: AuthAdapter;

  /** Runtime configuration. */
  config: ConfigAdapter;

  /** Hotkey dispatch. */
  hotkeys: HotkeyAdapter;

  /** Crypto operations (signature verification, random UUID). */
  crypto: CryptoAdapter;

  /** ACL persistence (save/load ACL state). */
  aclPersistence: AclPersistence;

  /** Manifest cache persistence. */
  manifestPersistence: ManifestPersistence;

  /** Napplet state storage. */
  statePersistence: StatePersistence;

  /** Window management. */
  windowManager: WindowManagerAdapter;

  /** Relay configuration. */
  relayConfig: RelayConfigAdapter;

  /** DM sending (optional). */
  dm?: DmAdapter;

  /** Shell secret persistence (for deterministic keypair derivation). */
  shellSecretPersistence?: ShellSecretPersistence;

  /** Hash verification (optional — if absent, hash verification is skipped). */
  hashVerifier?: HashVerifierAdapter;

  /** GUID persistence for iframe instance tracking (optional — if absent, GUIDs are in-memory only). */
  guidPersistence?: GuidPersistence;

  /**
   * Called when aggregate hash verification fails (computed != declared).
   * Host app should display a user-visible warning.
   */
  onHashMismatch?: (dTag: string, claimed: string, computed: string) => void;

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
   * const hooks: RuntimeAdapter = {
   *   // ... required adapters ...
   *   services: {
   *     audio: myAudioServiceHandler,
   *   },
   * };
   * ```
   */
  services?: ServiceRegistry;

  /**
   * Optional runtime behavior overrides — demo/debug use only.
   * Called lazily on each relevant operation (replay check, buffer push),
   * so changes take effect immediately without runtime recreation.
   */
  getConfigOverrides?(): RuntimeConfigOverrides;
}
