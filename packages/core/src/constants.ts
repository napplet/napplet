/**
 * @napplet/core -- Protocol constants for the napplet-shell communication protocol.
 *
 * These constants define event kinds, URIs, and protocol metadata
 * shared across all napplet packages. The wire protocol uses unsigned
 * event templates from napplets; identity is handled by the shell/runtime.
 */

// ─── Protocol Metadata ──────────────────────────────────────────────────────

/**
 * Current protocol version for the napplet-shell communication protocol.
 * @example
 * ```ts
 * console.log(PROTOCOL_VERSION); // '3.0.0'
 * ```
 */
export const PROTOCOL_VERSION = '3.0.0' as const;

/**
 * URI identifying the shell bridge as a pseudo-relay endpoint.
 * Used in relay tags to distinguish shell-routed messages from real relays.
 * @example
 * ```ts
 * const relayTag = ['relay', SHELL_BRIDGE_URI]; // ['relay', 'napplet://shell']
 * ```
 */
export const SHELL_BRIDGE_URI = 'napplet://shell' as const;

/** Maximum age in seconds for an event to be accepted (replay protection window). */
export const REPLAY_WINDOW_SECONDS = 30 as const;

// ─── Bus Event Kinds ────────────────────────────────────────────────────────

/**
 * Bus event kinds for the napplet-shell inter-process protocol.
 * All bus kinds are in the 29000-29999 ephemeral range.
 * Ephemeral events are auto-discarded by real relays per NIP-01 spec —
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
 * @example
 * ```ts
 * if (event.kind === BusKind.IPC_PEER) { // handle IPC-PEER message }
 * ```
 */
export const BusKind = {
  SIGNER_REQUEST: 29001,
  SIGNER_RESPONSE: 29002,
  IPC_PEER: 29003,
  HOTKEY_FORWARD: 29004,
  METADATA: 29005,
  NIPDB_REQUEST: 29006,
  NIPDB_RESPONSE: 29007,
  /** Service discovery responses — napplets query available shell services via kind 29010. */
  SERVICE_DISCOVERY: 29010,
} as const;

/** Union type of all bus event kind values. */
export type BusKindValue = (typeof BusKind)[keyof typeof BusKind];

// ─── Destructive Kinds ──────────────────────────────────────────────────────

/**
 * Event kinds that require explicit user consent before signing.
 * Includes profile (0), contacts (3), deletion (5), and relay list (10002).
 * @example
 * ```ts
 * if (DESTRUCTIVE_KINDS.has(event.kind)) { // prompt user for consent }
 * ```
 */
export const DESTRUCTIVE_KINDS = new Set([0, 3, 5, 10002]);

