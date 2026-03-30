// @napplet/shell — Shell runtime for hosting napplet iframes.
// Framework-agnostic. Host app provides hooks for relay pool, auth, WM, etc.

// Factory function — main entry point
export { createPseudoRelay } from './pseudo-relay.js';
export type { PseudoRelay } from './pseudo-relay.js';

// Types for host app integration
export type {
  ShellHooks,
  RelayPoolHooks,
  RelayPoolLike,
  RelayConfigHooks,
  WindowManagerHooks,
  AuthHooks,
  ConfigHooks,
  HotkeyHooks,
  WorkerRelayHooks,
  WorkerRelayLike,
  CryptoHooks,
  DmHooks,
  ConsentRequest,
  NostrEvent,
  NostrFilter,
  NappKeyEntry,
  AclEntry,
  Capability,
} from './types.js';

// Standalone utilities (usable without full shell)
export { originRegistry } from './origin-registry.js';
export { nappKeyRegistry } from './napp-key-registry.js';
export type { PendingUpdate } from './napp-key-registry.js';
export { aclStore, DEFAULT_STATE_QUOTA } from './acl-store.js';
export { audioManager } from './audio-manager.js';
export type { AudioSource } from './audio-manager.js';
export { manifestCache } from './manifest-cache.js';
export type { ManifestCacheEntry } from './manifest-cache.js';
export { handleStateRequest, cleanupNappState } from './state-proxy.js';

// Protocol constants
export { BusKind, AUTH_KIND, PSEUDO_RELAY_URI, PROTOCOL_VERSION, ALL_CAPABILITIES, DESTRUCTIVE_KINDS } from './types.js';

// Topic constants for shell command routing
export { TOPICS } from './topics.js';
export type { TopicKey, TopicValue } from './topics.js';
