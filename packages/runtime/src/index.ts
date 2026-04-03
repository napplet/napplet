// @napplet/runtime — Browser-agnostic protocol engine for the napplet protocol.

// ─── Types ─────────────────────────────────────────────────────────────────
export type {
  RuntimeAdapter,
  SendToNapplet,
  RelayPoolAdapter,
  RelaySubscriptionHandle,
  CacheAdapter,
  AuthAdapter,
  Signer,
  ConfigAdapter,
  HotkeyAdapter,
  AclPersistence,
  ManifestPersistence,
  StatePersistence,
  CryptoAdapter,
  WindowManagerAdapter,
  RelayConfigAdapter,
  DmAdapter,
  ConsentRequest,
  ConsentHandler,
  SessionEntry,
  NappKeyEntry,  // @deprecated — use SessionEntry
  PendingUpdate,
  PendingUpdateNotifier,
  ManifestCacheEntry,
  AclEntryExternal,
  AclCheckEvent,
  ServiceHandler,
  ServiceRegistry,
  CompatibilityReport,
  ServiceInfo,
  ShellSecretPersistence,
  GuidPersistence,
  HashVerifierAdapter,
  VerificationCacheEntry,
  RuntimeConfigOverrides,
} from './types.js';

// ─── Enforcement Gate ──────────────────────────────────────────────────────
export { createEnforceGate, resolveCapabilities, formatDenialReason } from './enforce.js';
export type { CapabilityResolution, EnforceResult, EnforceConfig, IdentityResolver, AclChecker } from './enforce.js';

// ─── SessionRegistry ──────────────────────────────────────────────────────
export { createSessionRegistry, createNappKeyRegistry } from './session-registry.js';
export type { SessionRegistry, NappKeyRegistry } from './session-registry.js';

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

// ─── Runtime Factory (primary entry point) ─────────────────────────────────
export { createRuntime } from './runtime.js';
export type { Runtime } from './runtime.js';

// ─── State Handler ─────────────────────────────────────────────────────────
export { handleStateRequest, cleanupNappState } from './state-handler.js';

// ─── Service Dispatch ─────────────────────────────────────────────────────
export { routeServiceMessage, notifyServiceWindowDestroyed } from './service-dispatch.js';

// ─── Service Discovery ────────────────────────────────────────────────────────
export { createServiceDiscoveryEvent, handleDiscoveryReq, isDiscoveryReq } from './service-discovery.js';
export type { DiscoverySubscription } from './service-discovery.js';
