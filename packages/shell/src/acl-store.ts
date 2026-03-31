/**
 * ACL Store — composite-keyed capability registry for napp identity.
 *
 * ACL entries are keyed by pubkey:dTag:aggregateHash — a composite key
 * that ties permissions to a specific napp build.
 *
 * Default policy is PERMISSIVE: unknown identities have all capabilities granted.
 */

import type { Capability, AclEntry } from './types.js';
import { ALL_CAPABILITIES, DESTRUCTIVE_KINDS } from './types.js';

const STORAGE_KEY = 'napplet:acl';

export const DEFAULT_STATE_QUOTA = 512 * 1024;

interface InternalAclEntry {
  key: string;
  pubkey: string;
  dTag: string;
  aggregateHash: string;
  capabilities: Set<Capability>;
  blocked: boolean;
  stateQuota: number;
}

function aclKey(pubkey: string, dTag: string, aggregateHash: string): string {
  return `${pubkey}:${dTag}:${aggregateHash}`;
}

const store = new Map<string, InternalAclEntry>();

function getOrCreate(pubkey: string, dTag: string, aggregateHash: string): InternalAclEntry {
  const key = aclKey(pubkey, dTag, aggregateHash);
  let entry = store.get(key);
  if (!entry) {
    entry = {
      key,
      pubkey,
      dTag,
      aggregateHash,
      capabilities: new Set(ALL_CAPABILITIES),
      blocked: false,
      stateQuota: DEFAULT_STATE_QUOTA,
    };
    store.set(key, entry);
  }
  return entry;
}

export { DESTRUCTIVE_KINDS };

export const aclStore = {
  check(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): boolean {
    const key = aclKey(pubkey, dTag, aggregateHash);
    const entry = store.get(key);
    if (!entry) return true;
    if (entry.blocked) return false;
    return entry.capabilities.has(capability);
  },

  grant(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): void {
    getOrCreate(pubkey, dTag, aggregateHash).capabilities.add(capability);
  },

  revoke(pubkey: string, dTag: string, aggregateHash: string, capability: Capability): void {
    getOrCreate(pubkey, dTag, aggregateHash).capabilities.delete(capability);
  },

  block(pubkey: string, dTag: string, aggregateHash: string): void {
    getOrCreate(pubkey, dTag, aggregateHash).blocked = true;
  },

  unblock(pubkey: string, dTag: string, aggregateHash: string): void {
    getOrCreate(pubkey, dTag, aggregateHash).blocked = false;
  },

  isBlocked(pubkey: string, dTag: string, aggregateHash: string): boolean {
    const key = aclKey(pubkey, dTag, aggregateHash);
    return store.get(key)?.blocked ?? false;
  },

  requiresPrompt(kind: number): boolean {
    return DESTRUCTIVE_KINDS.has(kind);
  },

  getEntry(pubkey: string, dTag: string, aggregateHash: string): AclEntry | undefined {
    const key = aclKey(pubkey, dTag, aggregateHash);
    const internal = store.get(key);
    if (!internal) return undefined;
    return {
      pubkey: internal.pubkey,
      capabilities: Array.from(internal.capabilities),
      blocked: internal.blocked,
      stateQuota: internal.stateQuota,
    };
  },

  getAllEntries(): AclEntry[] {
    return Array.from(store.values()).map(e => ({
      pubkey: e.pubkey,
      capabilities: Array.from(e.capabilities),
      blocked: e.blocked,
      stateQuota: e.stateQuota,
    }));
  },

  persist(): void {
    try {
      const entries = Array.from(store.entries()).map(([key, val]) => [
        key,
        {
          pubkey: val.pubkey,
          dTag: val.dTag,
          aggregateHash: val.aggregateHash,
          capabilities: Array.from(val.capabilities),
          blocked: val.blocked,
          stateQuota: val.stateQuota,
        },
      ]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // localStorage unavailable
    }
  },

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const entries = JSON.parse(raw) as Array<
        [string, {
          pubkey: string;
          dTag?: string;
          aggregateHash?: string;
          capabilities: Capability[];
          blocked: boolean;
          stateQuota?: number;
        }]
      >;
      store.clear();
      for (const [key, val] of entries) {
        if (val.dTag === undefined || val.aggregateHash === undefined) continue;
        store.set(key, {
          key,
          pubkey: val.pubkey,
          dTag: val.dTag,
          aggregateHash: val.aggregateHash,
          capabilities: new Set(val.capabilities),
          blocked: val.blocked,
          stateQuota: val.stateQuota ?? DEFAULT_STATE_QUOTA,
        });
      }
    } catch {
      store.clear();
    }
  },

  getStateQuota(pubkey: string, dTag: string, aggregateHash: string): number {
    const key = aclKey(pubkey, dTag, aggregateHash);
    return store.get(key)?.stateQuota ?? DEFAULT_STATE_QUOTA;
  },

  clear(): void {
    store.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  },
};
