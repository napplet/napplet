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
   * Keyboard forwarding and action keybindings: register named actions the shell
   * can bind to keys, forward unbound keystrokes to the shell, listen for
   * shell-triggered actions locally.
   *
   * @example
   * ```ts
   * // Register an action the shell can bind to a key:
   * const result = await window.napplet.keys.registerAction({
   *   id: 'editor.save', label: 'Save', defaultKey: 'Ctrl+S',
   * });
   *
   * // Listen for the bound key locally:
   * const sub = window.napplet.keys.onAction('editor.save', () => {
   *   console.log('Save triggered!');
   * });
   *
   * // Unregister when no longer needed:
   * window.napplet.keys.unregisterAction('editor.save');
   * ```
   */
  keys: {
    /**
     * Declare a named action that the shell can bind to a key.
     * The shell decides the actual binding; `defaultKey` is a hint only.
     * @param action  The action to register (id, label, optional defaultKey)
     * @returns The assigned binding, if any
     */
    registerAction(action: {
      id: string;
      label: string;
      defaultKey?: string;
    }): Promise<{ actionId: string; binding?: string }>;
    /**
     * Remove a previously registered action. The shell removes any binding
     * and updates the suppress list.
     * @param actionId  The action to unregister
     */
    unregisterAction(actionId: string): void;
    /**
     * Register a local handler for when a bound key is pressed.
     * This is NOT a wire message — the shim intercepts the key locally
     * and invokes the callback with zero latency.
     * @param actionId  The action to listen for
     * @param callback  Called when the action is triggered
     * @returns A Subscription with `close()` to stop listening
     */
    onAction(actionId: string, callback: () => void): Subscription;
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
