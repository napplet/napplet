// @napplet/shell — Browser adapter over @napplet/runtime.
// Delegates all protocol logic to the runtime engine. Provides browser-specific
// concerns: Window/postMessage bridging, localStorage persistence, audio manager.

// ─── Public API ─────────────────────────────────────────────────────────────

// Factory function — main entry point
export { createShellBridge } from './shell-bridge.js';
export type { ShellBridge } from './shell-bridge.js';

// Hooks adapter — for advanced integrators who need to customize the adapter
export { adaptHooks } from './hooks-adapter.js';
export type { BrowserDeps } from './hooks-adapter.js';

// Protocol types (re-exported from @napplet/core for backwards compatibility)
export type { NostrEvent, NostrFilter, Capability } from '@napplet/core';
export { BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, ALL_CAPABILITIES, DESTRUCTIVE_KINDS, REPLAY_WINDOW_SECONDS } from '@napplet/core';
export type { BusKindValue } from '@napplet/core';

// Types for host app integration (shell-specific)
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
  NappKeyEntry,
  AclEntry,
  AclCheckEvent,
  ServiceDescriptor,
  ServiceHandler,
  ServiceRegistry,
} from './types.js';

// Standalone utilities (usable without full shell)
export { originRegistry } from './origin-registry.js';
export { audioManager } from './audio-manager.js';
export type { AudioSource } from './audio-manager.js';
export { manifestCache } from './manifest-cache.js';
export type { ManifestCacheEntry } from './manifest-cache.js';

// Enforcement gate (re-exported from @napplet/runtime for backwards compatibility)
export { createEnforceGate, resolveCapabilities, formatDenialReason } from '@napplet/runtime';
export type { CapabilityResolution, EnforceResult, EnforceConfig, IdentityResolver, AclChecker } from '@napplet/runtime';

// Topic constants for shell command routing
export { TOPICS } from './topics.js';
export type { TopicKey, TopicValue } from './topics.js';
