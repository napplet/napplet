/**
 * @napplet/acl — Pure, WASM-ready ACL module for the napplet protocol.
 *
 * Zero dependencies. Zero side effects. All functions are pure:
 * state in, result out. Designed for deterministic access control
 * decisions that could be compiled to WASM without modification.
 *
 * @example
 * ```ts
 * import {
 *   createState, check, grant, revoke, block, unblock,
 *   CAP_RELAY_READ, CAP_SIGN_EVENT,
 * } from '@napplet/acl';
 *
 * // Create state with restrictive default (deny unknown identities)
 * let state = createState('restrictive');
 *
 * const id = { pubkey: 'abc...', dTag: 'chat', hash: 'ff00...' };
 *
 * // Grant relay read access
 * state = grant(state, id, CAP_RELAY_READ);
 * check(state, id, CAP_RELAY_READ);  // true
 * check(state, id, CAP_SIGN_EVENT);  // false (not granted)
 *
 * // Block the identity (overrides all caps)
 * state = block(state, id);
 * check(state, id, CAP_RELAY_READ);  // false (blocked)
 *
 * // Unblock restores previous capabilities
 * state = unblock(state, id);
 * check(state, id, CAP_RELAY_READ);  // true (restored)
 * ```
 *
 * @packageDocumentation
 */

// Types
export type { AclState, AclEntry, Identity } from './types.js';

// Constants
export {
  CAP_RELAY_READ,
  CAP_RELAY_WRITE,
  CAP_CACHE_READ,
  CAP_CACHE_WRITE,
  CAP_HOTKEY_FORWARD,
  CAP_SIGN_EVENT,
  CAP_SIGN_NIP04,
  CAP_SIGN_NIP44,
  CAP_STATE_READ,
  CAP_STATE_WRITE,
  CAP_ALL,
  CAP_NONE,
  DEFAULT_QUOTA,
} from './types.js';

// Core check
export { check, toKey } from './check.js';

// State mutations
export {
  createState,
  grant,
  revoke,
  block,
  unblock,
  setQuota,
  getQuota,
  serialize,
  deserialize,
} from './mutations.js';
