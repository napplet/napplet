/**
 * @napplet/acl — Pure check function.
 *
 * Determines whether an identity has a specific capability.
 * No side effects, no I/O, no mutations.
 */

import type { AclState, Identity } from './types.js';

/**
 * Compute composite key from identity fields.
 *
 * @param identity - Napplet identity
 * @returns Composite key string 'pubkey:dTag:hash'
 *
 * @example
 * ```ts
 * toKey({ pubkey: 'abc', dTag: 'chat', hash: 'ff00' })
 * // => 'abc:chat:ff00'
 * ```
 */
export function toKey(identity: Identity): string {
  return `${identity.pubkey}:${identity.dTag}:${identity.hash}`;
}

/**
 * Check whether an identity has a specific capability.
 *
 * Decision logic:
 * 1. If identity has no entry: return based on defaultPolicy
 *    - 'permissive' → true (all caps granted to unknown identities)
 *    - 'restrictive' → false (all caps denied to unknown identities)
 * 2. If identity is blocked: return false (blocked overrides all caps)
 * 3. Otherwise: return (entry.caps & cap) !== 0
 *
 * @param state - Current ACL state (immutable)
 * @param identity - Napplet identity to check
 * @param cap - Capability bit constant (e.g., CAP_RELAY_READ)
 * @returns true if the identity has the capability, false otherwise
 *
 * @example
 * ```ts
 * import { check, createState, grant } from '@napplet/acl';
 * import { CAP_RELAY_READ } from '@napplet/acl';
 *
 * const state = createState('restrictive');
 * const id = { pubkey: 'abc', dTag: 'chat', hash: 'ff00' };
 *
 * check(state, id, CAP_RELAY_READ); // false (restrictive, no entry)
 *
 * const state2 = grant(state, id, CAP_RELAY_READ);
 * check(state2, id, CAP_RELAY_READ); // true
 * ```
 */
export function check(state: AclState, identity: Identity, cap: number): boolean {
  const key = toKey(identity);
  const entry = state.entries[key];
  if (!entry) {
    return state.defaultPolicy === 'permissive';
  }
  if (entry.blocked) {
    return false;
  }
  return (entry.caps & cap) !== 0;
}
