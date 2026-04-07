/**
 * @napplet/core -- Legacy NIP-01 bus constants.
 *
 * @deprecated These constants are from the NIP-01 wire format era. They will be removed
 * when all consumers migrate to JSON envelope messages. Use NUB-specific type strings instead.
 *
 * @example
 * ```ts
 * // Legacy (NIP-01 era):
 * import { BusKind, DESTRUCTIVE_KINDS } from '@napplet/core';
 *
 * // Future (JSON envelope era):
 * // import type { RelaySubscribe } from '@napplet/nubs/relay';
 * ```
 *
 * @packageDocumentation
 */

// ─── Bus Event Kinds ────────────────────────────────────────────────────────

/**
 * Bus event kinds for the napplet-shell inter-process protocol.
 * All bus kinds are in the 29000-29999 ephemeral range.
 * Ephemeral events are auto-discarded by real relays per NIP-01 spec --
 * perfect for bus traffic that should never persist beyond the ShellBridge.
 *
 * ### IPC-* Namespace
 * The `IPC-*` prefix is reserved for the inter-napplet communication bus.
 *
 * | Constant | Kind | Status | Description |
 * |----------|------|--------|-------------|
 * | `IPC_PEER` | 29003 | Current | Directed peer-to-peer IPC between napplets and the shell |
 * | `IPC_BROADCAST` | TBD | Reserved | Future: broadcast to all napplets |
 * | `IPC_CHANNEL` | TBD | Reserved | Future: named channel pubsub |
 *
 * See RUNTIME-SPEC.md for full IPC-* namespace semantics.
 *
 * @deprecated Use NUB-specific JSON envelope message types instead.
 * BusKind constants will be removed when all consumers migrate to JSON envelopes.
 *
 * @example
 * ```ts
 * if (event.kind === BusKind.IPC_PEER) { // handle IPC-PEER message }
 * ```
 */
export const BusKind = {
  REGISTRATION: 29000,
  SIGNER_REQUEST: 29001,
  SIGNER_RESPONSE: 29002,
  IPC_PEER: 29003,
  HOTKEY_FORWARD: 29004,
  METADATA: 29005,
  NIPDB_REQUEST: 29006,
  NIPDB_RESPONSE: 29007,
  /** Service discovery responses -- napplets query available shell services via kind 29010. */
  SERVICE_DISCOVERY: 29010,
} as const;

/**
 * Union type of all bus event kind values.
 *
 * @deprecated Will be removed with BusKind.
 */
export type BusKindValue = (typeof BusKind)[keyof typeof BusKind];

// ─── Destructive Kinds ──────────────────────────────────────────────────────

/**
 * Event kinds that require explicit user consent before signing.
 * Includes profile (0), contacts (3), deletion (5), and relay list (10002).
 *
 * @deprecated Will be moved to signer NUB module.
 *
 * @example
 * ```ts
 * if (DESTRUCTIVE_KINDS.has(event.kind)) { // prompt user for consent }
 * ```
 */
export const DESTRUCTIVE_KINDS = new Set([0, 3, 5, 10002]);

// ─── Handshake Verbs ───────────────────────────────────────────────────────

/**
 * NIP-01 verb for napplet registration (napplet -> shell).
 * Sent before AUTH to announce napplet identity and claim an aggregate hash.
 *
 * @deprecated Will be replaced by JSON envelope handshake messages.
 */
export const VERB_REGISTER = 'REGISTER' as const;

/**
 * NIP-01 verb for identity delegation (shell -> napplet).
 * Shell sends a derived keypair to the napplet after verifying registration.
 *
 * @deprecated Will be replaced by JSON envelope handshake messages.
 */
export const VERB_IDENTITY = 'IDENTITY' as const;

/**
 * NIP-42 AUTH event kind used for napplet authentication handshakes.
 *
 * @deprecated Will be moved to auth/handshake NUB module.
 *
 * @example
 * ```ts
 * if (event.kind === AUTH_KIND) { // handle auth }
 * ```
 */
export const AUTH_KIND = 22242 as const;
