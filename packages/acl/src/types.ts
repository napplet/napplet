/**
 * @napplet/acl — Type definitions and capability bit constants.
 *
 * All types use Readonly<> to enforce immutability at the type level.
 * Capability constants are bitfield values for fast check/grant/revoke.
 */

// ─── Capability Bit Constants ─────────────────────────────────────────────────

/** relay:read — subscribe to relay events */
export const CAP_RELAY_READ    = 1 << 0;   // 1
/** relay:write — publish events to relays */
export const CAP_RELAY_WRITE   = 1 << 1;   // 2
/** cache:read — read from local cache */
export const CAP_CACHE_READ    = 1 << 2;   // 4
/** cache:write — write to local cache */
export const CAP_CACHE_WRITE   = 1 << 3;   // 8
/** hotkey:forward — forward keyboard shortcuts to shell */
export const CAP_HOTKEY_FORWARD = 1 << 4;  // 16
/** sign:event — request event signing */
export const CAP_SIGN_EVENT    = 1 << 5;   // 32
/** sign:nip04 — request NIP-04 encrypt/decrypt */
export const CAP_SIGN_NIP04    = 1 << 6;   // 64
/** sign:nip44 — request NIP-44 encrypt/decrypt */
export const CAP_SIGN_NIP44    = 1 << 7;   // 128
/** state:read — read napplet-scoped state */
export const CAP_STATE_READ    = 1 << 8;   // 256
/** state:write — write napplet-scoped state */
export const CAP_STATE_WRITE   = 1 << 9;   // 512

/** All capabilities granted (bits 0-9 set) */
export const CAP_ALL = (1 << 10) - 1;      // 1023

/** No capabilities granted */
export const CAP_NONE = 0;

// ─── Identity ─────────────────────────────────────────────────────────────────

/**
 * Napplet identity — composite key for ACL lookups.
 *
 * @param pubkey - Ephemeral session public key (hex)
 * @param dTag - Derived tag (deterministic from pubkey + napp type)
 * @param hash - Aggregate hash of napplet build artifacts
 */
export interface Identity {
  readonly pubkey: string;
  readonly dTag: string;
  readonly hash: string;
}

// ─── ACL Entry ────────────────────────────────────────────────────────────────

/**
 * A single ACL entry for one napplet identity.
 *
 * @param caps - Bitfield of granted capabilities (use CAP_* constants)
 * @param blocked - Orthogonal block flag; when true, all checks fail regardless of caps
 * @param quota - State storage quota in bytes
 */
export interface AclEntry {
  readonly caps: number;
  readonly blocked: boolean;
  readonly quota: number;
}

// ─── ACL State ────────────────────────────────────────────────────────────────

/**
 * Complete ACL state — immutable data structure.
 *
 * All mutations return a new AclState; the original is never modified.
 *
 * @param defaultPolicy - 'permissive' grants all caps to unknown identities;
 *                        'restrictive' denies all caps to unknown identities
 * @param entries - Map from composite key ('pubkey:dTag:hash') to AclEntry
 */
export interface AclState {
  readonly defaultPolicy: 'permissive' | 'restrictive';
  readonly entries: Readonly<Record<string, AclEntry>>;
}

/** Default state storage quota in bytes (512 KB) */
export const DEFAULT_QUOTA = 512 * 1024;
