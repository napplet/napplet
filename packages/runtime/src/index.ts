// @napplet/runtime — Browser-agnostic protocol engine for the napplet protocol.

// ─── Types ─────────────────────────────────────────────────────────────────
export type {
  RuntimeHooks,
  SendToNapplet,
  RuntimeRelayPoolHooks,
  RelaySubscriptionHandle,
  RuntimeCacheHooks,
  RuntimeAuthHooks,
  RuntimeSigner,
  RuntimeConfigHooks,
  RuntimeHotkeyHooks,
  RuntimeAclPersistence,
  RuntimeManifestPersistence,
  RuntimeStatePersistence,
  RuntimeCryptoHooks,
  RuntimeWindowManagerHooks,
  RuntimeRelayConfigHooks,
  RuntimeDmHooks,
  ConsentRequest,
  ConsentHandler,
  NappKeyEntry,
  PendingUpdate,
  PendingUpdateNotifier,
  ManifestCacheEntry,
  AclEntryExternal,
  AclCheckEvent,
} from './types.js';

// ─── Enforcement Gate ──────────────────────────────────────────────────────
export { createEnforceGate, resolveCapabilities, formatDenialReason } from './enforce.js';
export type { CapabilityResolution, EnforceResult, EnforceConfig, IdentityResolver, AclChecker } from './enforce.js';

// ─── NappKeyRegistry ──────────────────────────────────────────────────────
export { createNappKeyRegistry } from './napp-key-registry.js';
export type { NappKeyRegistry } from './napp-key-registry.js';

// ─── ACL State Container ──────────────────────────────────────────────────
export { createAclState } from './acl-state.js';
export type { AclStateContainer } from './acl-state.js';

// ─── Manifest Cache ────────────────────────────────────────────────────────
export { createManifestCache } from './manifest-cache.js';
export type { ManifestCache } from './manifest-cache.js';

// ─── Replay Detection ──────────────────────────────────────────────────────
export { createReplayDetector } from './replay.js';
export type { ReplayDetector } from './replay.js';

// ─── Event Buffer ──────────────────────────────────────────────────────────
export { createEventBuffer, matchesFilter, matchesAnyFilter, RING_BUFFER_SIZE } from './event-buffer.js';
export type { EventBuffer, SubscriptionEntry } from './event-buffer.js';
