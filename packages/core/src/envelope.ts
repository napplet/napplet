/**
 * @napplet/core -- JSON envelope types for the napplet-shell wire protocol.
 *
 * Defines the base types for the JSON envelope wire format introduced
 * in NIP-5D v4. All messages between napplet and shell use a `type`
 * field as a discriminant in `domain.action` format.
 *
 * @example
 * ```ts
 * import type { NappletMessage, NubDomain, ShellSupports } from '@napplet/core';
 * import { NUB_DOMAINS } from '@napplet/core';
 * ```
 *
 * @packageDocumentation
 */

// ─── Envelope Base Types ───────────────────────────────────────────────────

/**
 * Base interface for all JSON envelope messages exchanged between
 * napplet and shell. The `type` field is a string discriminant
 * in `domain.action` format (e.g., `"relay.subscribe"`, `"signer.sign"`).
 *
 * Concrete message types extend this interface with domain-specific payload fields.
 *
 * @example
 * ```ts
 * const msg: NappletMessage = { type: 'relay.subscribe' };
 *
 * // Concrete message with payload:
 * interface RelaySubscribe extends NappletMessage {
 *   type: 'relay.subscribe';
 *   filters: NostrFilter[];
 * }
 * ```
 */
export interface NappletMessage {
  /** Message type discriminant in "domain.action" format (e.g., "relay.subscribe", "signer.sign") */
  type: string;
}

// ─── NUB Domain Types ──────────────────────────────────────────────────────

/**
 * String literal union of the four NUB (Napplet Unified Blueprint) domains.
 * Each domain corresponds to a capability namespace that a shell may support.
 *
 * | Domain    | Scope                                     |
 * |-----------|-------------------------------------------|
 * | `relay`   | NIP-01 relay proxy (subscribe, publish)   |
 * | `signer`  | NIP-07/NIP-44 signing delegation          |
 * | `storage` | Scoped key-value storage proxy            |
 * | `ifc`     | Inter-frame communication (IPC peer bus)  |
 *
 * @example
 * ```ts
 * const domain: NubDomain = 'relay';
 * const isValid = NUB_DOMAINS.includes(domain); // true
 * ```
 */
export type NubDomain = 'relay' | 'signer' | 'storage' | 'ifc';

/**
 * Runtime-accessible constant array of all NUB domain names.
 * Useful for iteration, validation, and capability enumeration.
 *
 * @example
 * ```ts
 * for (const domain of NUB_DOMAINS) {
 *   console.log(`Checking support for: ${domain}`);
 * }
 * ```
 */
export const NUB_DOMAINS: readonly NubDomain[] = ['relay', 'signer', 'storage', 'ifc'] as const;

// ─── Shell Capability Query ────────────────────────────────────────────────

/**
 * Interface for the shell capability query API.
 * Allows napplets to check whether the shell supports a NUB domain
 * or a sandbox permission at runtime.
 *
 * @example
 * ```ts
 * const shell: ShellSupports = {
 *   supports(capability) {
 *     return NUB_DOMAINS.includes(capability as NubDomain);
 *   },
 * };
 *
 * shell.supports('relay');  // true
 * shell.supports('popups'); // depends on sandbox config
 * ```
 */
export interface ShellSupports {
  /** Check whether the shell supports a NUB capability or sandbox permission. */
  supports(capability: NubDomain | string): boolean;
}

// ─── Shell Global Type ─────────────────────────────────────────────────────

/**
 * Type for the `window.napplet.shell` namespace.
 * Extends {@link ShellSupports} to provide capability queries.
 *
 * @example
 * ```ts
 * // In a napplet iframe:
 * if (window.napplet.shell.supports('signer')) {
 *   const signed = await window.napplet.relay.publish(template);
 * }
 * ```
 */
export interface NappletGlobalShell extends ShellSupports {}
