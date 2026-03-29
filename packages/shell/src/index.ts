// @napplet/shell — Shell runtime for hosting napplet iframes.
// Framework-agnostic. Host app supplies all dependencies via ShellHooks.

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
  BusKindValue,
} from './types.js';

// Standalone utilities (usable without full shell)
export { originRegistry } from './origin-registry.js';
export { nappKeyRegistry } from './napp-key-registry.js';
export type { PendingUpdate } from './napp-key-registry.js';
export { aclStore, DEFAULT_STORAGE_QUOTA, aclKey } from './acl-store.js';
export { audioManager } from './audio-manager.js';
export type { AudioSource } from './audio-manager.js';
export { handleStorageRequest, cleanupNappStorage } from './storage-proxy.js';

// Protocol constants
export { BusKind, AUTH_KIND, PSEUDO_RELAY_URI, PROTOCOL_VERSION, ALL_CAPABILITIES, DESTRUCTIVE_KINDS } from './types.js';

// Topic constants for shell command routing
export { TOPICS } from './topics.js';
export type { TopicKey, TopicValue } from './topics.js';
