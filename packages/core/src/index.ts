/**
 * @napplet/core -- Shared protocol types, constants, and topic definitions.
 *
 * This package is the single source of truth for all protocol-level
 * definitions in the napplet ecosystem. All other @napplet/* packages
 * import their protocol types and constants from here.
 *
 * Zero dependencies. No DOM or browser APIs.
 *
 * @example
 * ```ts
 * import {
 *   type NostrEvent, type NostrFilter, type Capability,
 *   type NappletMessage, type NubDomain, type ShellSupports,
 *   type NubHandler, type NubDispatch,
 *   NUB_DOMAINS, SHELL_BRIDGE_URI, PROTOCOL_VERSION,
 *   createDispatch, registerNub, dispatch, getRegisteredDomains,
 *   ALL_CAPABILITIES, TOPICS,
 * } from '@napplet/core';
 * ```
 *
 * @packageDocumentation
 */

// ─── Envelope Types ────────────────────────────────────────────────────────

export type { NappletMessage, NubDomain, NamespacedCapability, ShellSupports, NappletGlobalShell } from './envelope.js';
export { NUB_DOMAINS } from './envelope.js';

// ─── Dispatch Infrastructure ───────────────────────────────────────────────

export type { NubHandler, NubDispatch } from './dispatch.js';
export { createDispatch, registerNub, dispatch, getRegisteredDomains } from './dispatch.js';

// ─── Protocol Types ─────────────────────────────────────────────────────────

export type {
  NostrEvent,
  NostrFilter,
  Capability,
  ServiceDescriptor,
  Subscription,
  EventTemplate,
  ServiceInfo,
  NappletGlobal,
  RegisterPayload,
  IdentityPayload,
} from './types.js';
export { ALL_CAPABILITIES } from './types.js';

// ─── Protocol Constants ─────────────────────────────────────────────────────

export {
  PROTOCOL_VERSION,
  SHELL_BRIDGE_URI,
  REPLAY_WINDOW_SECONDS,
} from './constants.js';

// ─── Legacy Constants (deprecated) ──────────────────────────────────────────

/**
 * @deprecated NIP-01 bus constants -- use JSON envelope message types instead.
 * These re-exports will be removed in a future major version.
 * Import from '@napplet/core/legacy' directly if you still need them.
 */
export { BusKind, DESTRUCTIVE_KINDS, VERB_REGISTER, VERB_IDENTITY, AUTH_KIND } from './legacy.js';
export type { BusKindValue } from './legacy.js';

// ─── Topic Constants ────────────────────────────────────────────────────────

export { TOPICS } from './topics.js';
export type { TopicKey, TopicValue } from './topics.js';
