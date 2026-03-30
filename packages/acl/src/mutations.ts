/**
 * @napplet/acl — Pure state mutation functions.
 *
 * Every function takes an AclState and returns a NEW AclState.
 * The original state is never modified. No side effects, no I/O.
 */

import type { AclState, AclEntry, Identity } from './types.js';
import { CAP_ALL, DEFAULT_QUOTA } from './types.js';
import { toKey } from './check.js';

/**
 * Create a new ACL state with the given default policy.
 *
 * @param policy - 'permissive' grants all caps to unknown identities;
 *                 'restrictive' denies all caps to unknown identities.
 *                 Defaults to 'permissive'.
 * @returns A new empty AclState
 *
 * @example
 * ```ts
 * const state = createState('restrictive');
 * // { defaultPolicy: 'restrictive', entries: {} }
 * ```
 */
export function createState(policy: 'permissive' | 'restrictive' = 'permissive'): AclState {
  return { defaultPolicy: policy, entries: {} };
}

/**
 * Get the entry for an identity, or a default entry based on policy.
 * Internal helper — not exported.
 */
function getEntry(state: AclState, key: string): AclEntry {
  const existing = state.entries[key];
  if (existing) return existing;
  // Default entry: all caps if permissive, no caps if restrictive
  return {
    caps: state.defaultPolicy === 'permissive' ? CAP_ALL : 0,
    blocked: false,
    quota: DEFAULT_QUOTA,
  };
}

/**
 * Grant a capability to an identity.
 *
 * If the identity has no entry, one is created with default caps plus the granted cap.
 * Returns a new AclState — the original is not modified.
 *
 * @param state - Current ACL state
 * @param identity - Napplet identity
 * @param cap - Capability bit constant to grant (e.g., CAP_RELAY_READ)
 * @returns New AclState with the capability granted
 *
 * @example
 * ```ts
 * const state2 = grant(state, id, CAP_RELAY_READ);
 * check(state2, id, CAP_RELAY_READ); // true
 * ```
 */
export function grant(state: AclState, identity: Identity, cap: number): AclState {
  const key = toKey(identity);
  const entry = getEntry(state, key);
  return {
    ...state,
    entries: {
      ...state.entries,
      [key]: { ...entry, caps: entry.caps | cap },
    },
  };
}

/**
 * Revoke a capability from an identity.
 *
 * If the identity has no entry, one is created with default caps minus the revoked cap.
 * Returns a new AclState — the original is not modified.
 *
 * @param state - Current ACL state
 * @param identity - Napplet identity
 * @param cap - Capability bit constant to revoke (e.g., CAP_RELAY_WRITE)
 * @returns New AclState with the capability revoked
 *
 * @example
 * ```ts
 * const state2 = revoke(state, id, CAP_RELAY_WRITE);
 * check(state2, id, CAP_RELAY_WRITE); // false
 * ```
 */
export function revoke(state: AclState, identity: Identity, cap: number): AclState {
  const key = toKey(identity);
  const entry = getEntry(state, key);
  return {
    ...state,
    entries: {
      ...state.entries,
      [key]: { ...entry, caps: entry.caps & ~cap },
    },
  };
}

/**
 * Block an identity.
 *
 * A blocked identity fails all capability checks regardless of granted caps.
 * The caps bitfield is preserved — unblocking restores previous capabilities.
 * Returns a new AclState — the original is not modified.
 *
 * @param state - Current ACL state
 * @param identity - Napplet identity to block
 * @returns New AclState with the identity blocked
 *
 * @example
 * ```ts
 * const state2 = block(state, id);
 * check(state2, id, CAP_RELAY_READ); // false (blocked)
 * ```
 */
export function block(state: AclState, identity: Identity): AclState {
  const key = toKey(identity);
  const entry = getEntry(state, key);
  return {
    ...state,
    entries: {
      ...state.entries,
      [key]: { ...entry, blocked: true },
    },
  };
}

/**
 * Unblock an identity.
 *
 * Restores capability checks to use the caps bitfield.
 * Returns a new AclState — the original is not modified.
 *
 * @param state - Current ACL state
 * @param identity - Napplet identity to unblock
 * @returns New AclState with the identity unblocked
 *
 * @example
 * ```ts
 * const state2 = unblock(state, id);
 * check(state2, id, CAP_RELAY_READ); // true (if cap was granted)
 * ```
 */
export function unblock(state: AclState, identity: Identity): AclState {
  const key = toKey(identity);
  const entry = getEntry(state, key);
  return {
    ...state,
    entries: {
      ...state.entries,
      [key]: { ...entry, blocked: false },
    },
  };
}

/**
 * Set the state storage quota for an identity.
 *
 * @param state - Current ACL state
 * @param identity - Napplet identity
 * @param bytes - Quota in bytes
 * @returns New AclState with the quota set
 *
 * @example
 * ```ts
 * const state2 = setQuota(state, id, 1024 * 1024); // 1 MB
 * getQuota(state2, id); // 1048576
 * ```
 */
export function setQuota(state: AclState, identity: Identity, bytes: number): AclState {
  const key = toKey(identity);
  const entry = getEntry(state, key);
  return {
    ...state,
    entries: {
      ...state.entries,
      [key]: { ...entry, quota: bytes },
    },
  };
}

/**
 * Get the state storage quota for an identity.
 *
 * Returns DEFAULT_QUOTA (512 KB) if no entry exists.
 *
 * @param state - Current ACL state
 * @param identity - Napplet identity
 * @returns Quota in bytes
 *
 * @example
 * ```ts
 * getQuota(state, id); // 524288 (default 512 KB)
 * ```
 */
export function getQuota(state: AclState, identity: Identity): number {
  const key = toKey(identity);
  const entry = state.entries[key];
  return entry?.quota ?? DEFAULT_QUOTA;
}

/**
 * Serialize ACL state to a JSON string.
 *
 * Pure function — no I/O. The persistence adapter in @napplet/shell
 * uses this to write state to localStorage or other backends.
 *
 * @param state - ACL state to serialize
 * @returns JSON string representation
 *
 * @example
 * ```ts
 * const json = serialize(state);
 * localStorage.setItem('napplet:acl', json);
 * ```
 */
export function serialize(state: AclState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize ACL state from a JSON string.
 *
 * Pure function — no I/O. Returns a valid AclState or a fresh
 * permissive state if the input is invalid.
 *
 * @param json - JSON string to parse
 * @returns Parsed AclState, or fresh permissive state on parse failure
 *
 * @example
 * ```ts
 * const json = localStorage.getItem('napplet:acl') ?? '';
 * const state = deserialize(json);
 * ```
 */
export function deserialize(json: string): AclState {
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed.defaultPolicy === 'permissive' || parsed.defaultPolicy === 'restrictive') &&
      typeof parsed.entries === 'object' &&
      parsed.entries !== null
    ) {
      // Validate each entry
      const entries: Record<string, AclEntry> = {};
      for (const [key, value] of Object.entries(parsed.entries)) {
        const entry = value as Record<string, unknown>;
        if (
          typeof entry.caps === 'number' &&
          typeof entry.blocked === 'boolean' &&
          typeof entry.quota === 'number'
        ) {
          entries[key] = {
            caps: entry.caps,
            blocked: entry.blocked,
            quota: entry.quota,
          };
        }
      }
      return { defaultPolicy: parsed.defaultPolicy, entries };
    }
  } catch {
    // Invalid JSON — fall through to default
  }
  return createState('permissive');
}
