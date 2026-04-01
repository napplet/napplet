/**
 * acl-state.ts — ACL state container with persistence hooks.
 *
 * Wraps @napplet/acl's pure functions with persistence via
 * AclPersistence. No localStorage or DOM references.
 */

import type { Capability } from '@napplet/core';
import { DESTRUCTIVE_KINDS } from '@napplet/core';
import type { AclState, Identity } from '@napplet/acl';
import {
  createState, check, grant, revoke, block, unblock,
  serialize, deserialize, setQuota, getQuota,
  CAP_RELAY_READ, CAP_RELAY_WRITE, CAP_CACHE_READ, CAP_CACHE_WRITE,
  CAP_HOTKEY_FORWARD, CAP_SIGN_EVENT, CAP_SIGN_NIP04, CAP_SIGN_NIP44,
  CAP_STATE_READ, CAP_STATE_WRITE, CAP_ALL,
} from '@napplet/acl';
import type { AclPersistence, AclEntryExternal } from './types.js';

// ─── Capability String-to-Bit Mapping ──────────────────────────────────────

const CAP_MAP: Record<Capability, number> = {
  'relay:read': CAP_RELAY_READ,
  'relay:write': CAP_RELAY_WRITE,
  'cache:read': CAP_CACHE_READ,
  'cache:write': CAP_CACHE_WRITE,
  'hotkey:forward': CAP_HOTKEY_FORWARD,
  'sign:event': CAP_SIGN_EVENT,
  'sign:nip04': CAP_SIGN_NIP04,
  'sign:nip44': CAP_SIGN_NIP44,
  'state:read': CAP_STATE_READ,
  'state:write': CAP_STATE_WRITE,
};

function capToBit(cap: Capability): number {
  return CAP_MAP[cap] ?? 0;
}

/** Convert a bitfield to an array of capability strings. */
function bitsToCapabilities(bits: number): Capability[] {
  const result: Capability[] = [];
  for (const [cap, bit] of Object.entries(CAP_MAP)) {
    if (bits & bit) result.push(cap as Capability);
  }
  return result;
}

// ─── Identity Helper ───────────────────────────────────────────────────────

function toIdentity(pubkey: string, dTag: string, hash: string): Identity {
  return { pubkey, dTag, hash };
}

// ─── AclStateContainer Interface ───────────────────────────────────────────

/**
 * ACL state container — wraps @napplet/acl's pure functions with
 * persistence and a convenient imperative API.
 *
 * @example
 * ```ts
 * const aclState = createAclState(persistence);
 * aclState.load();
 * const allowed = aclState.check(pubkey, dTag, hash, 'relay:read');
 * ```
 */
export interface AclStateContainer {
  check(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): boolean;
  grant(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): void;
  revoke(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): void;
  block(pubkey: string, dTag: string, aggregateHash: string): void;
  unblock(pubkey: string, dTag: string, aggregateHash: string): void;
  isBlocked(pubkey: string, dTag: string, aggregateHash: string): boolean;
  requiresPrompt(kind: number): boolean;
  getEntry(pubkey: string, dTag: string, aggregateHash: string): AclEntryExternal | undefined;
  getAllEntries(): AclEntryExternal[];
  getStateQuota(pubkey: string, dTag: string, aggregateHash: string): number;
  persist(): void;
  load(): void;
  clear(): void;
}

/**
 * Create an ACL state container backed by @napplet/acl and persisted
 * via the given persistence hooks.
 *
 * @param persistence - Storage backend for ACL state
 * @param defaultPolicy - Default ACL policy for unknown identities
 * @returns An AclStateContainer instance
 *
 * @example
 * ```ts
 * const aclState = createAclState(persistence, 'permissive');
 * aclState.load();
 * ```
 */
export function createAclState(
  persistence: AclPersistence,
  defaultPolicy: 'permissive' | 'restrictive' = 'permissive',
): AclStateContainer {
  let state: AclState = createState(defaultPolicy);

  return {
    check(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): boolean {
      const id = toIdentity(pubkey, dTag, aggregateHash);
      return check(state, id, capToBit(capability));
    },

    grant(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): void {
      const id = toIdentity(pubkey, dTag, aggregateHash);
      state = grant(state, id, capToBit(capability));
    },

    revoke(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): void {
      const id = toIdentity(pubkey, dTag, aggregateHash);
      state = revoke(state, id, capToBit(capability));
    },

    block(pubkey: string, dTag: string, aggregateHash: string): void {
      const id = toIdentity(pubkey, dTag, aggregateHash);
      state = block(state, id);
    },

    unblock(pubkey: string, dTag: string, aggregateHash: string): void {
      const id = toIdentity(pubkey, dTag, aggregateHash);
      state = unblock(state, id);
    },

    isBlocked(pubkey: string, dTag: string, aggregateHash: string): boolean {
      const id = toIdentity(pubkey, dTag, aggregateHash);
      // A blocked identity fails all checks — check with CAP_ALL
      // If blocked, check returns false even for all caps
      return !check(state, id, CAP_ALL) && this.getEntry(pubkey, dTag, aggregateHash)?.blocked === true;
    },

    requiresPrompt(kind: number): boolean {
      return DESTRUCTIVE_KINDS.has(kind);
    },

    getEntry(pubkey: string, dTag: string, aggregateHash: string): AclEntryExternal | undefined {
      const id = toIdentity(pubkey, dTag, aggregateHash);
      const key = `${id.pubkey}:${id.dTag}:${id.hash}`;
      const entry = state.entries[key];
      if (!entry) return undefined;
      return {
        pubkey,
        capabilities: bitsToCapabilities(entry.caps),
        blocked: entry.blocked,
        stateQuota: entry.quota,
      };
    },

    getAllEntries(): AclEntryExternal[] {
      return Object.entries(state.entries).map(([key, entry]) => {
        const parts = key.split(':');
        return {
          pubkey: parts[0],
          capabilities: bitsToCapabilities(entry.caps),
          blocked: entry.blocked,
          stateQuota: entry.quota,
        };
      });
    },

    getStateQuota(pubkey: string, dTag: string, aggregateHash: string): number {
      const id = toIdentity(pubkey, dTag, aggregateHash);
      return getQuota(state, id);
    },

    persist(): void {
      try {
        persistence.persist(serialize(state));
      } catch { /* persistence is best-effort */ }
    },

    load(): void {
      try {
        const raw = persistence.load();
        if (!raw) return;
        state = deserialize(raw);
      } catch {
        state = createState(defaultPolicy);
      }
    },

    clear(): void {
      state = createState(defaultPolicy);
      try { persistence.persist(''); } catch { /* best-effort */ }
    },
  };
}
