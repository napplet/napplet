/**
 * @napplet/core — Shared protocol types, constants, and topic definitions.
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
 *   BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION,
 *   DESTRUCTIVE_KINDS, ALL_CAPABILITIES, TOPICS,
 * } from '@napplet/core';
 * ```
 *
 * @packageDocumentation
 */

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
} from './types.js';
export { ALL_CAPABILITIES } from './types.js';

// ─── Protocol Constants ─────────────────────────────────────────────────────

export {
  PROTOCOL_VERSION,
  SHELL_BRIDGE_URI,
  AUTH_KIND,
  REPLAY_WINDOW_SECONDS,
  BusKind,
  DESTRUCTIVE_KINDS,
} from './constants.js';
export type { BusKindValue } from './constants.js';

// ─── Topic Constants ────────────────────────────────────────────────────────

export { TOPICS } from './topics.js';
export type { TopicKey, TopicValue } from './topics.js';
