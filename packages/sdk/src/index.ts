/**
 * @napplet/sdk — Typed named exports wrapping window.napplet.
 *
 * Provides `relay`, `ipc`, and `storage` objects that delegate
 * to `window.napplet.*` at call time. Developers using a bundler can import
 * individual namespaces without depending on the shim's side-effect install:
 *
 * ```ts
 * import { relay, ipc } from '@napplet/sdk';
 * ```
 *
 * The shim must still be imported somewhere in the application to install
 * the `window.napplet` global. The SDK only wraps it — it does not install it.
 *
 * @packageDocumentation
 */

import type {
  NappletGlobal,
  NostrEvent,
  NostrFilter,
  Subscription,
  EventTemplate,
} from '@napplet/core';

// ─── Global type augmentation ────────────────────────────────────────────────
// Provides window.napplet autocompletion for TypeScript consumers who import
// only the SDK (not the shim). Both shim and SDK reference NappletGlobal from
// @napplet/core — no duplication.

declare global {
  interface Window {
    napplet: NappletGlobal;
  }
}

// ─── Runtime guard ──────────────────────────────────────────────────────────

/**
 * Retrieve the `window.napplet` global, throwing a clear error if it is absent.
 *
 * Every SDK method calls this at invocation time — not at module load time —
 * so the shim can be imported in any order relative to the SDK.
 */
function requireNapplet(): NappletGlobal {
  const w = window as Window & { napplet?: NappletGlobal };
  if (!w.napplet) {
    throw new Error('window.napplet not installed -- import @napplet/shim first');
  }
  return w.napplet;
}

// ─── Relay namespace ────────────────────────────────────────────────────────

/**
 * NIP-01 relay operations: subscribe to events, publish events, one-shot queries.
 *
 * Each method delegates to `window.napplet.relay.*` at call time, which in turn
 * routes through the shell's relay pool via postMessage.
 *
 * @example
 * ```ts
 * import { relay } from '@napplet/sdk';
 *
 * const sub = relay.subscribe(
 *   { kinds: [1], limit: 10 },
 *   (event) => console.log(event),
 *   () => console.log('EOSE'),
 * );
 * ```
 */
export const relay = {
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
  ): Subscription {
    return requireNapplet().relay.subscribe(filters, onEvent, onEose, options);
  },

  /**
   * Sign and publish a Nostr event through the shell.
   * @param template  Unsigned event template
   * @param options   Optional: `{ relay: true }` to publish via scoped relay
   * @returns The signed NostrEvent after successful publication
   */
  publish(
    template: EventTemplate,
    options?: { relay?: boolean },
  ): Promise<NostrEvent> {
    return requireNapplet().relay.publish(template, options);
  },

  /**
   * One-shot query: subscribe, collect events until EOSE, then resolve.
   * @param filters  NIP-01 subscription filters
   * @returns Promise resolving to array of matching NostrEvent objects
   */
  query(filters: NostrFilter | NostrFilter[]): Promise<NostrEvent[]> {
    return requireNapplet().relay.query(filters);
  },
};

// ─── IPC namespace ──────────────────────────────────────────────────────────

/**
 * Inter-napplet pubsub: broadcast and receive IPC-PEER events through the shell.
 *
 * @example
 * ```ts
 * import { ipc } from '@napplet/sdk';
 *
 * ipc.emit('profile:open', [], JSON.stringify({ pubkey: '...' }));
 *
 * const sub = ipc.on('profile:open', (payload) => {
 *   console.log('Profile requested:', payload);
 * });
 * ```
 */
export const ipc = {
  /**
   * Broadcast an IPC-PEER event to other napplets via the shell.
   * @param topic      The 't' tag value (e.g., 'profile:open')
   * @param extraTags  Additional NIP-01 tags beyond the 't' tag (default: [])
   * @param content    Event content (default: empty string)
   */
  emit(topic: string, extraTags?: string[][], content?: string): void {
    requireNapplet().ipc.emit(topic, extraTags, content);
  },

  /**
   * Subscribe to IPC-PEER events on a specific topic.
   * @param topic     The 't' tag value to listen for
   * @param callback  Called with `(payload, event)` for each matching event
   * @returns A Subscription handle with a `close()` method
   */
  on(
    topic: string,
    callback: (payload: unknown, event: NostrEvent) => void,
  ): Subscription {
    return requireNapplet().ipc.on(topic, callback);
  },
};

// ─── Services namespace ─────────────────────────────────────────────────────

// ─── Storage namespace ──────────────────────────────────────────────────────

/**
 * Napplet-scoped storage: async localStorage-like API proxied through the shell.
 * Each napplet's storage is isolated by identity.
 *
 * @example
 * ```ts
 * import { storage } from '@napplet/sdk';
 *
 * await storage.setItem('theme', 'dark');
 * const theme = await storage.getItem('theme'); // 'dark'
 * ```
 */
export const storage = {
  /**
   * Retrieve a stored value by key. Returns null if the key does not exist.
   * @param key  The storage key
   * @returns The stored string value, or null if not found
   */
  getItem(key: string): Promise<string | null> {
    return requireNapplet().storage.getItem(key);
  },

  /**
   * Store a key-value pair.
   * @param key    The storage key
   * @param value  The string value to store
   */
  setItem(key: string, value: string): Promise<void> {
    return requireNapplet().storage.setItem(key, value);
  },

  /**
   * Remove a stored key.
   * @param key  The storage key to remove
   */
  removeItem(key: string): Promise<void> {
    return requireNapplet().storage.removeItem(key);
  },

  /**
   * List all keys stored by this napplet.
   * @returns Array of storage key strings
   */
  keys(): Promise<string[]> {
    return requireNapplet().storage.keys();
  },
};

// ─── Keys namespace ────────────────────────────────────────────────────────

/**
 * Keyboard forwarding and action keybindings: register named actions the shell
 * can bind to keys, listen for shell-triggered actions locally.
 *
 * @example
 * ```ts
 * import { keys } from '@napplet/sdk';
 *
 * const result = await keys.registerAction({
 *   id: 'editor.save',
 *   label: 'Save',
 *   defaultKey: 'Ctrl+S',
 * });
 *
 * const sub = keys.onAction('editor.save', () => {
 *   console.log('Save triggered!');
 * });
 * ```
 */
export const keys = {
  /**
   * Declare a named action that the shell can bind to a key.
   * @param action  The action to register (id, label, optional defaultKey)
   * @returns The assigned binding, if any
   */
  registerAction(action: {
    id: string;
    label: string;
    defaultKey?: string;
  }): Promise<{ actionId: string; binding?: string }> {
    return requireNapplet().keys.registerAction(action);
  },

  /**
   * Remove a previously registered action.
   * @param actionId  The action to unregister
   */
  unregisterAction(actionId: string): void {
    requireNapplet().keys.unregisterAction(actionId);
  },

  /**
   * Register a local handler for when a bound key is pressed.
   * @param actionId  The action to listen for
   * @param callback  Called when the action is triggered
   * @returns A Subscription with `close()` to stop listening
   */
  onAction(actionId: string, callback: () => void): Subscription {
    return requireNapplet().keys.onAction(actionId, callback);
  },

  /**
   * Convenience: register a named action AND wire a local handler in one call.
   * Returns a handle whose `close()` both unregisters the action and removes
   * the onAction listener.
   *
   * @param action   The action to register (id, label, optional defaultKey)
   * @param handler  Called when the shell triggers this action
   * @returns The assigned binding plus a `close()` teardown function
   *
   * @example
   * ```ts
   * import { keys } from '@napplet/sdk';
   *
   * const handle = await keys.register(
   *   { id: 'editor.save', label: 'Save', defaultKey: 'Ctrl+S' },
   *   () => saveDocument(),
   * );
   *
   * // Later, tear down both registration and listener:
   * handle.close();
   * ```
   */
  async register(
    action: { id: string; label: string; defaultKey?: string },
    handler: () => void,
  ): Promise<{ actionId: string; binding?: string; close: () => void }> {
    const n = requireNapplet();
    const result = await n.keys.registerAction(action);
    const sub = n.keys.onAction(action.id, handler);
    return {
      ...result,
      close() {
        sub.close();
        n.keys.unregisterAction(action.id);
      },
    };
  },
};

// ─── Type re-exports from @napplet/core ─────────────────────────────────────

export type { NostrEvent } from '@napplet/core';
export type { NostrFilter } from '@napplet/core';
export type { Subscription } from '@napplet/core';
export type { EventTemplate } from '@napplet/core';

// ─── Core envelope types ───────────────────────────────────────────────────

export type { NappletMessage, NubDomain, NamespacedCapability, ShellSupports } from '@napplet/core';
export { NUB_DOMAINS } from '@napplet/core';

// ─── NUB Message Type Re-exports ───────────────────────────────────────────
// These types let SDK consumers work with typed envelope messages directly.
// Import from '@napplet/sdk' instead of individual NUB packages.

// Relay NUB
export type {
  RelayMessage,
  RelaySubscribeMessage,
  RelayCloseMessage,
  RelayPublishMessage,
  RelayQueryMessage,
  RelayEventMessage,
  RelayEoseMessage,
  RelayClosedMessage,
  RelayPublishResultMessage,
  RelayQueryResultMessage,
  RelayOutboundMessage,
  RelayInboundMessage,
  RelayNubMessage,
} from '@napplet/nub-relay';

// Signer NUB
export type {
  SignerMessage,
  SignerGetPublicKeyMessage,
  SignerSignEventMessage,
  SignerGetRelaysMessage,
  SignerNip04EncryptMessage,
  SignerNip04DecryptMessage,
  SignerNip44EncryptMessage,
  SignerNip44DecryptMessage,
  SignerGetPublicKeyResultMessage,
  SignerSignEventResultMessage,
  SignerGetRelaysResultMessage,
  SignerNip04EncryptResultMessage,
  SignerNip04DecryptResultMessage,
  SignerNip44EncryptResultMessage,
  SignerNip44DecryptResultMessage,
  SignerRequestMessage,
  SignerResultMessage,
  SignerNubMessage,
} from '@napplet/nub-signer';

// Storage NUB
export type {
  StorageMessage,
  StorageGetMessage,
  StorageSetMessage,
  StorageRemoveMessage,
  StorageKeysMessage,
  StorageGetResultMessage,
  StorageSetResultMessage,
  StorageRemoveResultMessage,
  StorageKeysResultMessage,
  StorageRequestMessage,
  StorageResultMessage,
  StorageNubMessage,
} from '@napplet/nub-storage';

// IFC NUB
export type {
  IfcMessage,
  IfcEmitMessage,
  IfcSubscribeMessage,
  IfcSubscribeResultMessage,
  IfcUnsubscribeMessage,
  IfcEventMessage,
  IfcChannelOpenMessage,
  IfcChannelOpenResultMessage,
  IfcChannelEmitMessage,
  IfcChannelEventMessage,
  IfcChannelBroadcastMessage,
  IfcChannelListMessage,
  IfcChannelListResultMessage,
  IfcChannelCloseMessage,
  IfcChannelClosedMessage,
  IfcTopicMessage,
  IfcChannelMessage,
  IfcOutboundMessage,
  IfcInboundMessage,
  IfcNubMessage,
} from '@napplet/nub-ifc';

// Theme NUB
export type {
  ThemeColors,
  ThemeFont,
  ThemeBackground,
  Theme,
  ThemeMessage,
  ThemeGetMessage,
  ThemeGetResultMessage,
  ThemeChangedMessage,
  ThemeRequestMessage,
  ThemeResultMessage,
  ThemeNubMessage,
} from '@napplet/nub-theme';

// Keys NUB
export type {
  Action,
  RegisterResult,
  KeyBinding,
  KeysMessage,
  KeysForwardMessage,
  KeysRegisterActionMessage,
  KeysRegisterActionResultMessage,
  KeysUnregisterActionMessage,
  KeysBindingsMessage,
  KeysActionMessage,
  KeysRequestMessage,
  KeysResultMessage,
  KeysNubMessage,
} from '@napplet/nub-keys';

// ─── NUB Domain Constants ──────────────────────────────────────────────────

export { DOMAIN as RELAY_DOMAIN } from '@napplet/nub-relay';
export { DOMAIN as SIGNER_DOMAIN, DESTRUCTIVE_KINDS } from '@napplet/nub-signer';
export { DOMAIN as STORAGE_DOMAIN } from '@napplet/nub-storage';
export { DOMAIN as IFC_DOMAIN } from '@napplet/nub-ifc';
export { DOMAIN as THEME_DOMAIN } from '@napplet/nub-theme';
export { DOMAIN as KEYS_DOMAIN } from '@napplet/nub-keys';
