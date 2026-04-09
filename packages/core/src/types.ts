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
 * The shell signs it before broadcasting.
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
     * Publish an encrypted Nostr event through the shell.
     * The shell encrypts content, signs the event, and broadcasts it.
     * @param template    Unsigned event template
     * @param recipient   Hex-encoded recipient public key
     * @param encryption  Encryption scheme: 'nip44' (default) or 'nip04'
     * @returns The signed encrypted NostrEvent after successful publication
     */
    publishEncrypted(template: EventTemplate, recipient: string, encryption?: 'nip44' | 'nip04'): Promise<NostrEvent>;
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
   * Media session control: create sessions, report state and metadata,
   * declare capabilities, receive commands from the shell.
   *
   * @example
   * ```ts
   * // Create a media session:
   * const { sessionId } = await window.napplet.media.createSession({
   *   title: 'My Song', artist: 'The Artist',
   * });
   *
   * // Report playback state:
   * window.napplet.media.reportState(sessionId, {
   *   status: 'playing', position: 42.5, duration: 240,
   * });
   *
   * // Listen for shell commands:
   * window.napplet.media.onCommand(sessionId, (action, value) => {
   *   if (action === 'pause') player.pause();
   * });
   * ```
   */
  media: {
    /**
     * Create a new media session with the shell.
     * @param metadata  Optional initial metadata (title, artist, album, artwork, duration, mediaType)
     * @returns The confirmed session result with sessionId
     */
    createSession(metadata?: {
      title?: string;
      artist?: string;
      album?: string;
      artwork?: { url?: string; hash?: string };
      duration?: number;
      mediaType?: 'audio' | 'video';
    }): Promise<{ sessionId: string }>;
    /**
     * Update metadata for an existing session. Partial updates supported.
     * @param sessionId  The session to update
     * @param metadata   Partial metadata fields to update
     */
    updateSession(sessionId: string, metadata: {
      title?: string;
      artist?: string;
      album?: string;
      artwork?: { url?: string; hash?: string };
      duration?: number;
      mediaType?: 'audio' | 'video';
    }): void;
    /**
     * Destroy a media session.
     * @param sessionId  The session to destroy
     */
    destroySession(sessionId: string): void;
    /**
     * Report current playback state for a session.
     * @param sessionId  The session to report state for
     * @param state      Current playback state
     */
    reportState(sessionId: string, state: {
      status: 'playing' | 'paused' | 'stopped' | 'buffering';
      position?: number;
      duration?: number;
      volume?: number;
    }): void;
    /**
     * Declare which media actions the session currently supports.
     * @param sessionId  The session to update capabilities for
     * @param actions    Currently supported actions
     */
    reportCapabilities(sessionId: string, actions: ('play' | 'pause' | 'stop' | 'next' | 'prev' | 'seek' | 'volume')[]): void;
    /**
     * Listen for media commands from the shell.
     * @param sessionId  The session to listen for commands on
     * @param callback   Called with (action, value?) when a command is received
     * @returns A Subscription with `close()` to stop listening
     */
    onCommand(sessionId: string, callback: (action: 'play' | 'pause' | 'stop' | 'next' | 'prev' | 'seek' | 'volume', value?: number) => void): Subscription;
    /**
     * Listen for the shell's media control list.
     * @param sessionId  The session to associate controls with
     * @param callback   Called with the shell's supported controls
     * @returns A Subscription with `close()` to stop listening
     */
    onControls(sessionId: string, callback: (controls: ('play' | 'pause' | 'stop' | 'next' | 'prev' | 'seek' | 'volume')[]) => void): Subscription;
  };
  /**
   * Shell-rendered notifications: send notifications, set badge counts,
   * register channels, request permission, listen for user interaction.
   *
   * @example
   * ```ts
   * // Send a notification:
   * const { notificationId } = await window.napplet.notify.send({
   *   title: 'New message', body: 'Alice: hey!', priority: 'normal',
   * });
   *
   * // Set badge count:
   * window.napplet.notify.badge(3);
   *
   * // Listen for action clicks:
   * window.napplet.notify.onAction((notificationId, actionId) => {
   *   if (actionId === 'reply') openReply(notificationId);
   * });
   * ```
   */
  notify: {
    /**
     * Send a notification to the shell.
     * @param notification  Notification payload (title required)
     * @returns The shell-assigned notificationId
     */
    send(notification: {
      title: string;
      body?: string;
      icon?: string;
      actions?: { id: string; label: string }[];
      channel?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }): Promise<{ notificationId: string }>;
    /**
     * Dismiss a notification by ID. Fire-and-forget.
     * @param notificationId  The notification to dismiss
     */
    dismiss(notificationId: string): void;
    /**
     * Set the badge count for this napplet. Pass 0 to clear.
     * @param count  Badge count
     */
    badge(count: number): void;
    /**
     * Register a notification channel for per-category user control.
     * @param channel  Channel definition
     */
    registerChannel(channel: {
      channelId: string;
      label: string;
      description?: string;
      defaultPriority?: 'low' | 'normal' | 'high' | 'urgent';
    }): void;
    /**
     * Request permission to send notifications.
     * @param channel  Optional channel to request permission for
     * @returns Whether permission was granted
     */
    requestPermission(channel?: string): Promise<{ granted: boolean }>;
    /**
     * Listen for action button clicks on notifications.
     * @param callback  Called with (notificationId, actionId)
     * @returns A Subscription with `close()` to stop listening
     */
    onAction(callback: (notificationId: string, actionId: string) => void): Subscription;
    /**
     * Listen for notification body clicks.
     * @param callback  Called with (notificationId)
     * @returns A Subscription with `close()` to stop listening
     */
    onClicked(callback: (notificationId: string) => void): Subscription;
    /**
     * Listen for notification dismissals.
     * @param callback  Called with (notificationId, reason?)
     * @returns A Subscription with `close()` to stop listening
     */
    onDismissed(callback: (notificationId: string, reason?: string) => void): Subscription;
    /**
     * Listen for the shell's notification capability list.
     * @param callback  Called with supported controls
     * @returns A Subscription with `close()` to stop listening
     */
    onControls(callback: (controls: ('toasts' | 'badges' | 'actions' | 'channels' | 'system')[]) => void): Subscription;
  };
  /**
   * Read-only user identity queries: public key, profile, follows, relays,
   * lists, zaps, mutes, blocked, badges. All queries are strictly read-only --
   * no signing, encryption, or decryption.
   *
   * @example
   * ```ts
   * // Get the user's public key:
   * const pubkey = await window.napplet.identity.getPublicKey();
   *
   * // Get profile metadata:
   * const profile = await window.napplet.identity.getProfile();
   * if (profile) console.log(profile.name);
   *
   * // Get follow list:
   * const follows = await window.napplet.identity.getFollows();
   * ```
   */
  identity: {
    /** Get the user's hex-encoded public key. Always succeeds. */
    getPublicKey(): Promise<string>;
    /** Get the user's relay list (NIP-65). */
    getRelays(): Promise<Record<string, { read: boolean; write: boolean }>>;
    /** Get the user's profile metadata (kind 0). Returns null if not found. */
    getProfile(): Promise<{
      name?: string;
      displayName?: string;
      about?: string;
      picture?: string;
      banner?: string;
      nip05?: string;
      lud16?: string;
      website?: string;
    } | null>;
    /** Get the user's follow list (kind 3 contact list). */
    getFollows(): Promise<string[]>;
    /** Get entries from a user's categorized list. */
    getList(listType: string): Promise<string[]>;
    /** Get zap receipts sent to the user. */
    getZaps(): Promise<{
      eventId: string;
      sender: string;
      amount: number;
      content?: string;
    }[]>;
    /** Get the user's mute list (kind 10000). */
    getMutes(): Promise<string[]>;
    /** Get the user's block list. */
    getBlocked(): Promise<string[]>;
    /** Get badges awarded to the user (NIP-58). */
    getBadges(): Promise<{
      id: string;
      name?: string;
      description?: string;
      image?: string;
      thumbs?: string[];
      awardedBy: string;
    }[]>;
  };
  /**
   * Shell capability queries. Check whether the shell supports a NUB
   * or permission.
   *
   * @example
   * ```ts
   * // NUB domain (bare shorthand or prefixed):
   * if (window.napplet.shell.supports('relay')) { ... }
   * if (window.napplet.shell.supports('nub:relay')) { ... }
   *
   * // Permission:
   * if (window.napplet.shell.supports('perm:popups')) { ... }
   * ```
   */
  shell: NappletGlobalShell;
}
