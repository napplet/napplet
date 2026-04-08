/**
 * @napplet/core — Protocol type definitions shared across all napplet packages.
 *
 * These types define the NIP-01 wire format structures and capability system
 * used by the napplet-shell communication protocol.
 */

import type { NappletGlobalShell } from './envelope.js';

// ─── NIP-01 Types ─────────────────────────────────────────────────────────────

/**
 * Standard NIP-01 nostr event.
 * @example
 * ```ts
 * const event: NostrEvent = {
 *   id: '...', pubkey: '...', created_at: 1234567890,
 *   kind: 1, tags: [['t', 'topic']], content: 'Hello', sig: '...',
 * };
 * ```
 */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

/**
 * NIP-01 subscription filter.
 * @example
 * ```ts
 * const filter: NostrFilter = { kinds: [1], authors: ['abc123...'], limit: 10 };
 * ```
 */
export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[] | undefined;
}

// ─── Capability Types ────────────────────────────────────────────────────────

/**
 * A capability string that can be granted to or revoked from a napplet.
 * Used by the ACL system to control what operations a napplet can perform.
 *
 * Note: The @napplet/acl package uses bitfield constants (CAP_*) for fast
 * checks. This string union is the human-readable protocol-level representation.
 *
 * @example
 * ```ts
 * const cap: Capability = 'relay:write';
 * ```
 */
export type Capability =
  | 'relay:read'
  | 'relay:write'
  | 'cache:read'
  | 'cache:write'
  | 'hotkey:forward'
  | 'sign:event'
  | 'sign:nip04'
  | 'sign:nip44'
  | 'state:read'
  | 'state:write';

/**
 * All available capabilities in the napplet protocol.
 * @example
 * ```ts
 * for (const cap of ALL_CAPABILITIES) { acl.grant(identity, cap); }
 * ```
 */
export const ALL_CAPABILITIES: readonly Capability[] = [
  'relay:read',
  'relay:write',
  'cache:read',
  'cache:write',
  'hotkey:forward',
  'sign:event',
  'sign:nip04',
  'sign:nip44',
  'state:read',
  'state:write',
] as const;

// ─── Handshake Message Payloads ─────────────────────────────────────────────

/**
 * Payload for the REGISTER verb (napplet -> shell).
 * Napplet announces its type and claimed aggregate hash before AUTH.
 *
 * @example
 * ```ts
 * // Napplet sends:
 * window.parent.postMessage(['REGISTER', { dTag: 'chat', claimedHash: 'abc123...' }], '*');
 * ```
 */
export interface RegisterPayload {
  /** Napplet type identifier from <meta name="napplet-type"> */
  readonly dTag: string;
  /** Aggregate hash from <meta name="napplet-aggregate-hash">, empty string in dev mode */
  readonly claimedHash: string;
}

/**
 * Payload for the IDENTITY verb (shell -> napplet).
 * Shell sends a deterministic keypair derived from the napplet's verified identity.
 *
 * @example
 * ```ts
 * // Shell sends to napplet iframe:
 * iframe.contentWindow.postMessage(['IDENTITY', {
 *   pubkey: 'deadbeef...',
 *   privkey: 'cafebabe...',
 *   dTag: 'chat',
 *   aggregateHash: 'abc123...',
 * }], '*');
 * ```
 */
export interface IdentityPayload {
  /** Hex-encoded public key of the delegated keypair */
  readonly pubkey: string;
  /** Hex-encoded private key of the delegated keypair (32 bytes = 64 hex chars) */
  readonly privkey: string;
  /** Napplet type identifier (echoed back from REGISTER) */
  readonly dTag: string;
  /** Verified aggregate hash (may differ from claimed if shell overrides) */
  readonly aggregateHash: string;
}

// ─── Shim API Types ──────────────────────────────────────────────────────────

/**
 * Subscription handle returned by relay.subscribe() and ipc.on().
 * Call close() to unsubscribe and stop receiving events.
 *
 * @example
 * ```ts
 * const sub = window.napplet.relay.subscribe(filter, onEvent, onEose);
 * // Later:
 * sub.close();
 * ```
 */
export interface Subscription {
  /** Close the subscription and stop receiving events. */
  close(): void;
}

/**
 * Unsigned event template passed to relay.publish().
 * The shell signs it via the NIP-07 proxy before broadcasting.
 *
 * @example
 * ```ts
 * const signed = await window.napplet.relay.publish({
 *   kind: 1,
 *   content: 'Hello Nostr!',
 *   tags: [],
 *   created_at: Math.floor(Date.now() / 1000),
 * });
 * ```
 */
export interface EventTemplate {
  /** Nostr event kind number */
  kind: number;
  /** Event content (typically plaintext or JSON string) */
  content: string;
  /** Event tags (NIP-01 tag arrays) */
  tags: string[][];
  /** Unix timestamp (seconds since epoch) */
  created_at: number;
}

/**
 * The window.napplet global installed by @napplet/shim.
 *
 * Activated by a side-effect import:
 * ```ts
 * import '@napplet/shim';
 * // Now window.napplet is available with full TypeScript types.
 * ```
 */
export interface NappletGlobal {
  /**
   * NIP-01 relay operations: subscribe to events, publish events, one-shot queries.
   * Routes through the shell's relay pool via postMessage.
   */
  relay: {
    /**
     * Open a live NIP-01 subscription through the shell's relay pool.
     * @param filters  One or more NIP-01 subscription filters
     * @param onEvent  Called for each matching event
     * @param onEose   Called when the shell signals end of stored events (EOSE)
     * @param options  Optional: `{ relay, group }` for NIP-29 scoped relay subscriptions
     * @returns A Subscription handle with a `close()` method
     */
    subscribe(
      filters: NostrFilter | NostrFilter[],
      onEvent: (event: NostrEvent) => void,
      onEose: () => void,
      options?: { relay?: string; group?: string },
    ): Subscription;
    /**
     * Sign and publish a Nostr event through the shell.
     * @param template  Unsigned event template
     * @param options   Optional: `{ relay: true }` to publish via scoped relay
     * @returns The signed NostrEvent after successful publication
     */
    publish(template: EventTemplate, options?: { relay?: boolean }): Promise<NostrEvent>;
    /**
     * One-shot query: subscribe, collect events until EOSE, then resolve.
     * @param filters  NIP-01 subscription filters
     * @returns Promise resolving to array of matching NostrEvent objects
     */
    query(filters: NostrFilter | NostrFilter[]): Promise<NostrEvent[]>;
  };
  /**
   * Inter-napplet pubsub: broadcast and receive IPC-PEER events through the shell.
   */
  ipc: {
    /**
     * Broadcast an IPC-PEER event to other napplets via the shell.
     * @param topic      The 't' tag value (e.g., 'profile:open')
     * @param extraTags  Additional NIP-01 tags beyond the 't' tag (default: [])
     * @param content    Event content (default: empty string)
     */
    emit(topic: string, extraTags?: string[][], content?: string): void;
    /**
     * Subscribe to IPC-PEER events on a specific topic.
     * @param topic     The 't' tag value to listen for
     * @param callback  Called with `(payload, event)` for each matching event
     * @returns A Subscription handle with a `close()` method
     */
    on(topic: string, callback: (payload: unknown, event: NostrEvent) => void): Subscription;
  };
  /**
   * Napplet-scoped storage: async localStorage-like API proxied through the shell.
   * Each napplet's storage is isolated by identity — napplets cannot read each other's data.
   */
  storage: {
    /**
     * Retrieve a stored value by key. Returns null if the key does not exist.
     * @param key  The storage key
     * @returns The stored string value, or null if not found
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Store a key-value pair.
     * @param key    The storage key
     * @param value  The string value to store
     * @throws If the napplet exceeds its storage quota
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Remove a stored key.
     * @param key  The storage key to remove
     */
    removeItem(key: string): Promise<void>;
    /**
     * List all keys stored by this napplet.
     * @returns Array of storage key strings
     */
    keys(): Promise<string[]>;
  };
  /**
   * Shell capability queries. Check whether the shell supports a NUB,
   * permission, or service.
   *
   * @example
   * ```ts
   * // NUB domain (bare shorthand or prefixed):
   * if (window.napplet.shell.supports('signer')) { ... }
   * if (window.napplet.shell.supports('nub:signer')) { ... }
   *
   * // Permission:
   * if (window.napplet.shell.supports('perm:sign')) { ... }
   *
   * // Service:
   * if (window.napplet.shell.supports('svc:audio')) { ... }
   * ```
   */
  shell: NappletGlobalShell;
}
