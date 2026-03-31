/**
 * @napplet/core — Protocol type definitions shared across all napplet packages.
 *
 * These types define the NIP-01 wire format structures and capability system
 * used by the napplet-shell communication protocol.
 */

// ─── NIP-01 Types ─────────────────────────────────────────────────────────────

/**
 * Standard NIP-01 nostr event.
 * @example
 * ```ts
 * const event: NostrEvent = {
 *   id: '...', pubkey: '...', created_at: 1234567890,
 *   kind: 1, tags: [['t', 'topic']], content: 'Hello', sig: '...',
 * };
 * ```
 */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

/**
 * NIP-01 subscription filter.
 * @example
 * ```ts
 * const filter: NostrFilter = { kinds: [1], authors: ['abc123...'], limit: 10 };
 * ```
 */
export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[] | undefined;
}

// ─── Capability Types ────────────────────────────────────────────────────────

/**
 * A capability string that can be granted to or revoked from a napplet.
 * Used by the ACL system to control what operations a napplet can perform.
 *
 * Note: The @napplet/acl package uses bitfield constants (CAP_*) for fast
 * checks. This string union is the human-readable protocol-level representation.
 *
 * @example
 * ```ts
 * const cap: Capability = 'relay:write';
 * ```
 */
export type Capability =
  | 'relay:read'
  | 'relay:write'
  | 'cache:read'
  | 'cache:write'
  | 'hotkey:forward'
  | 'sign:event'
  | 'sign:nip04'
  | 'sign:nip44'
  | 'state:read'
  | 'state:write';

/**
 * All available capabilities in the napplet protocol.
 * @example
 * ```ts
 * for (const cap of ALL_CAPABILITIES) { acl.grant(identity, cap); }
 * ```
 */
export const ALL_CAPABILITIES: readonly Capability[] = [
  'relay:read',
  'relay:write',
  'cache:read',
  'cache:write',
  'hotkey:forward',
  'sign:event',
  'sign:nip04',
  'sign:nip44',
  'state:read',
  'state:write',
] as const;
