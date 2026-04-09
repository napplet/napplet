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
 * String literal union of the seven NUB (Napplet Unified Blueprint) domains.
 * Each domain corresponds to a capability namespace that a shell may support.
 *
 * | Domain    | Scope                                     |
 * |-----------|-------------------------------------------|
 * | `relay`   | NIP-01 relay proxy (subscribe, publish)   |
 * | `signer`  | NIP-07/NIP-44 signing delegation          |
 * | `storage` | Scoped key-value storage proxy            |
 * | `ifc`     | Inter-frame communication (IPC peer bus)  |
 * | `theme`   | Theme tokens and appearance settings      |
 * | `keys`    | Keyboard forwarding and action keybindings|
 * | `media`   | Media session control and playback        |
 *
 * @example
 * ```ts
 * const domain: NubDomain = 'relay';
 * const isValid = NUB_DOMAINS.includes(domain); // true
 * ```
 */
export type NubDomain = 'relay' | 'signer' | 'storage' | 'ifc' | 'theme' | 'keys' | 'media';

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
export const NUB_DOMAINS: readonly NubDomain[] = ['relay', 'signer', 'storage', 'ifc', 'theme', 'keys', 'media'] as const;

// ─── Namespaced Capability Type ───────────────────────────────────────────

/**
 * Namespaced capability string for {@link ShellSupports.supports}.
 *
 * Accepts two prefix namespaces plus bare NUB domain shorthand:
 *
 * | Prefix  | Example             | Meaning                        |
 * |---------|---------------------|--------------------------------|
 * | `nub:`  | `'nub:relay'`       | Shell implements the relay NUB |
 * | `perm:` | `'perm:sign'`       | Shell grants signing permission|
 * | *(bare)*| `'relay'`           | Shorthand for `'nub:relay'`    |
 *
 * Bare strings are valid only for NUB domains.
 * Permissions MUST use the `perm:` prefix.
 *
 * @example
 * ```ts
 * const cap: NamespacedCapability = 'nub:signer';
 * const bare: NamespacedCapability = 'relay'; // shorthand OK
 * const perm: NamespacedCapability = 'perm:popups';
 * ```
 */
export type NamespacedCapability =
  | NubDomain
  | `nub:${NubDomain}`
  | `perm:${string}`;

// ─── Shell Capability Query ────────────────────────────────────────────────

/**
 * Interface for the shell capability query API.
 * Allows napplets to check whether the shell supports a NUB domain
 * or a permission at runtime.
 *
 * @example
 * ```ts
 * // NUB domain queries (bare shorthand or prefixed):
 * shell.supports('relay');       // shorthand for 'nub:relay'
 * shell.supports('nub:signer'); // explicit NUB prefix
 *
 * // Permission queries:
 * shell.supports('perm:sign');   // signing permission
 * shell.supports('perm:popups'); // popup permission
 * ```
 */
export interface ShellSupports {
  /** Check whether the shell supports a NUB capability or permission. */
  supports(capability: NamespacedCapability): boolean;
}

// ─── Shell Global Type ─────────────────────────────────────────────────────

/**
 * Type for the `window.napplet.shell` namespace.
 * Extends {@link ShellSupports} to provide capability queries.
 *
 * @example
 * ```ts
 * // In a napplet iframe:
 * if (window.napplet.shell.supports('nub:signer')) {
 *   const signed = await window.napplet.relay.publish(template);
 * }
 *
 * // Bare NUB domain shorthand also works:
 * if (window.napplet.shell.supports('signer')) { ... }
 *
 * // Permission queries:
 * window.napplet.shell.supports('perm:sign');
 * ```
 */
export interface NappletGlobalShell extends ShellSupports {}
