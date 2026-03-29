// @napplet/shell — Inlined types and hook interfaces for the shell runtime.
// Replaces @hyprgate/types dependency and defines framework-agnostic hooks.

// ─── Protocol Constants ────────────────────────────────────────────────────────

export const PROTOCOL_VERSION = '2.0.0' as const;

/** NIP-42 authentication event kind. */
export const AUTH_KIND = 22242 as const;

/** The pseudo-relay URI used in NIP-42 AUTH challenges. */
export const PSEUDO_RELAY_URI = 'hyprgate://shell' as const;

/** Replay protection window in seconds — events older than this are rejected. */
export const REPLAY_WINDOW_SECONDS = 30 as const;

/**
 * Signing kinds that ALWAYS prompt the user regardless of ACL level.
 * These are high-stakes operations: profile (0), contacts (3), deletion (5), relay list (10002).
 */
export const DESTRUCTIVE_KINDS = new Set([0, 3, 5, 10002]);

/**
 * Ephemeral event kinds (29000-29999) used for shell bus messages.
 * Ephemeral events are auto-discarded by real relays per NIP-01 spec.
 */
export const BusKind = {
  REGISTRATION: 29000,
  SIGNER_REQUEST: 29001,
  SIGNER_RESPONSE: 29002,
  INTER_PANE: 29003,
  HOTKEY_FORWARD: 29004,
  METADATA: 29005,
  NIPDB_REQUEST: 29006,
  NIPDB_RESPONSE: 29007,
} as const;

export type BusKindValue = (typeof BusKind)[keyof typeof BusKind];

// ─── Capability Types ──────────────────────────────────────────────────────────

export type Capability =
  | 'relay:read'
  | 'relay:write'
  | 'cache:read'
  | 'cache:write'
  | 'hotkey:forward'
  | 'sign:event'
  | 'sign:nip04'
  | 'sign:nip44'
  | 'storage:read'
  | 'storage:write';

export const ALL_CAPABILITIES: readonly Capability[] = [
  'relay:read',
  'relay:write',
  'cache:read',
  'cache:write',
  'hotkey:forward',
  'sign:event',
  'sign:nip04',
  'sign:nip44',
  'storage:read',
  'storage:write',
] as const;

// ─── NIP-01 Event Shape ────────────────────────────────────────────────────────

/** Standard NIP-01 nostr event. */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

/** NIP-01 subscription filter. */
export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[] | undefined;
}

// ─── Registry Types ────────────────────────────────────────────────────────────

/** Registry entry mapping a napp's pubkey to its runtime metadata. */
export interface NappKeyEntry {
  pubkey: string;
  windowId: string;
  origin: string;
  type: string;
  dTag: string;
  aggregateHash: string;
  registeredAt: number;
}

/** ACL entry controlling what a napp pubkey is permitted to do. */
export interface AclEntry {
  pubkey: string;
  capabilities: Capability[];
  blocked: boolean;
  storageQuota?: number;
}

// ─── Consent Request ───────────────────────────────────────────────────────────

/**
 * A pending consent request for a destructive signing kind.
 * Raised when a signer request arrives for kinds 0, 3, 5, 10002.
 */
export interface ConsentRequest {
  /** Shell-assigned windowId of the requesting iframe */
  windowId: string;
  /** Verified pubkey of the requesting napp */
  pubkey: string;
  /** The nostr event the napp wants to sign */
  event: NostrEvent;
  /** Resolve the consent — true = allow, false = deny */
  resolve: (allowed: boolean) => void;
}

// ─── Signer Interface ──────────────────────────────────────────────────────────

/** NIP-07-compatible signer interface. */
export interface Signer {
  getPublicKey?(): string | Promise<string>;
  signEvent?(event: object): object | Promise<object>;
  getRelays?(): Record<string, object> | Promise<Record<string, object>>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): string | Promise<string>;
    decrypt(pubkey: string, ciphertext: string): string | Promise<string>;
  };
  nip44?: {
    encrypt(pubkey: string, plaintext: string): string | Promise<string>;
    decrypt(pubkey: string, ciphertext: string): string | Promise<string>;
  };
}

// ─── Hook Interfaces ───────────────────────────────────────────────────────────

/** Hook for relay pool operations. Host app provides relay connectivity. */
export interface RelayPoolHooks {
  /** Get the relay pool instance for outbound relay operations */
  getRelayPool(): { subscription(urls: string[], filters: NostrFilter[]): { subscribe(cb: (item: NostrEvent | 'EOSE') => void): { unsubscribe(): void } } } | null;
  /** Track a subscription for lifecycle management */
  trackSubscription(subKey: string, unsubscribe: () => void): void;
  /** Untrack a subscription */
  untrackSubscription(subKey: string): void;
  /** Open a scoped relay connection (NIP-29 groups) */
  openScopedRelay(windowId: string, relayUrl: string, subId: string, filters: NostrFilter[], sourceWindow: Window): void;
  /** Close a scoped relay connection */
  closeScopedRelay(windowId: string): void;
  /** Publish to a scoped relay */
  publishToScopedRelay(windowId: string, event: NostrEvent): boolean;
  /** Select relay tier for a given set of filters */
  selectRelayTier(filters: NostrFilter[]): string[];
}

/** Hook for relay configuration. */
export interface RelayConfigHooks {
  addRelay(tier: string, url: string): void;
  removeRelay(tier: string, url: string): void;
  getRelayConfig(): { discovery: string[]; super: string[]; outbox: string[] };
  getNip66Suggestions(): unknown;
}

/** Hook for window management. Host app provides WM operations. */
export interface WindowManagerHooks {
  /** Create a new window for a napp */
  createWindow(options: { title: string; class: string; iframeSrc?: string }): string | null;
}

/** Hook for auth state. */
export interface AuthHooks {
  /** Get the user's public key (hex) */
  getUserPubkey(): string | null;
  /** Get the active signer (NIP-07 compatible) */
  getSigner(): Signer | null;
}

/** Hook for config. */
export interface ConfigHooks {
  /** Get the napp update behavior setting */
  getNappUpdateBehavior(): 'auto-grant' | 'banner' | 'silent-reprompt';
}

/** Hook for hotkey dispatch. */
export interface HotkeyHooks {
  /** Execute a hotkey forwarded from an iframe */
  executeHotkeyFromForward(event: { key: string; code: string; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; metaKey: boolean }): void;
}

/** Hook for worker relay (local cache). */
export interface WorkerRelayHooks {
  /** Get the worker relay instance for local event caching */
  getWorkerRelay(): { event(event: NostrEvent): Promise<void>; query(tag: unknown[]): Promise<NostrEvent[]> } | null;
}

/** Hook for crypto verification. */
export interface CryptoHooks {
  /** Verify a nostr event signature (can be off-thread for performance) */
  verifyEvent(event: NostrEvent): Promise<boolean>;
}

/** All hooks that the shell requires from the host application. */
export interface ShellHooks {
  relayPool: RelayPoolHooks;
  relayConfig: RelayConfigHooks;
  windowManager: WindowManagerHooks;
  auth: AuthHooks;
  config: ConfigHooks;
  hotkeys: HotkeyHooks;
  workerRelay: WorkerRelayHooks;
  crypto: CryptoHooks;
}
