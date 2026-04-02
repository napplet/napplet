/**
 * manifest-cache.ts — Manifest cache with persistence hooks.
 *
 * Caches NIP-5A manifest data (aggregate hashes) per napplet identity.
 * Delegates storage to ManifestPersistence — no localStorage.
 */

import type { ManifestPersistence, ManifestCacheEntry, VerificationCacheEntry } from './types.js';

/**
 * Cache for verified napplet manifest entries.
 * Used to detect napplet updates (aggregateHash changes) across sessions.
 *
 * @example
 * ```ts
 * const cache = createManifestCache(persistence);
 * cache.load();
 * cache.set({ pubkey: 'abc...', dTag: 'chat', aggregateHash: 'dead', verifiedAt: Date.now() });
 * ```
 */
export interface ManifestCache {
  /** Get a cached manifest entry by pubkey and dTag. */
  get(pubkey: string, dTag: string): ManifestCacheEntry | undefined;
  /** Set (upsert) a manifest cache entry and persist. */
  set(entry: ManifestCacheEntry): void;
  /** Check if a specific hash is cached for a pubkey/dTag combination. */
  has(pubkey: string, dTag: string, hash: string): boolean;
  /** Get the requires list for a cached manifest, or empty array if not found. */
  getRequires(pubkey: string, dTag: string): string[];
  /** Remove a cached entry for a pubkey/dTag and persist. */
  remove(pubkey: string, dTag: string): void;
  /** Load the cache from persistence. */
  load(): void;
  /** Persist the cache to storage. */
  persist(): void;
  /** Clear all cached entries. */
  clear(): void;

  /** Get a cached verification result by manifest event ID. */
  getVerification(eventId: string): VerificationCacheEntry | undefined;

  /** Cache a verification result keyed by manifest event ID. */
  setVerification(eventId: string, result: VerificationCacheEntry): void;

  /** Check if a manifest event ID has been verified. */
  hasVerification(eventId: string): boolean;

  /** Clear all verification cache entries. */
  clearVerifications(): void;
}

/**
 * Create a manifest cache backed by the given persistence hooks.
 *
 * @param persistence - Storage backend for manifest data
 * @returns A ManifestCache instance
 */
export function createManifestCache(persistence: ManifestPersistence): ManifestCache {
  const cache = new Map<string, ManifestCacheEntry>();
  const verificationCache = new Map<string, VerificationCacheEntry>();

  function cacheKey(pubkey: string, dTag: string): string {
    return `${pubkey}:${dTag}`;
  }

  const self: ManifestCache = {
    get(pubkey: string, dTag: string): ManifestCacheEntry | undefined {
      return cache.get(cacheKey(pubkey, dTag));
    },

    set(entry: ManifestCacheEntry): void {
      cache.set(cacheKey(entry.pubkey, entry.dTag), entry);
      self.persist();
    },

    has(pubkey: string, dTag: string, hash: string): boolean {
      const entry = cache.get(cacheKey(pubkey, dTag));
      return !!entry && entry.aggregateHash === hash;
    },

    getRequires(pubkey: string, dTag: string): string[] {
      const entry = cache.get(cacheKey(pubkey, dTag));
      return entry?.requires ?? [];
    },

    remove(pubkey: string, dTag: string): void {
      cache.delete(cacheKey(pubkey, dTag));
      self.persist();
    },

    load(): void {
      try {
        const raw = persistence.load();
        if (!raw) return;
        const entries = JSON.parse(raw) as Array<[string, ManifestCacheEntry]>;
        cache.clear();
        for (const [key, val] of entries) cache.set(key, val);
      } catch { cache.clear(); }
    },

    persist(): void {
      try {
        persistence.persist(JSON.stringify(Array.from(cache.entries())));
      } catch { /* persistence is best-effort */ }
    },

    clear(): void {
      cache.clear();
      verificationCache.clear();
      try { persistence.persist(''); } catch { /* best-effort */ }
    },

    getVerification(eventId: string): VerificationCacheEntry | undefined {
      return verificationCache.get(eventId);
    },

    setVerification(eventId: string, result: VerificationCacheEntry): void {
      verificationCache.set(eventId, result);
      // Verification cache is in-memory only — no persistence needed
      // since manifest event IDs are immutable and re-fetching is cheap
    },

    hasVerification(eventId: string): boolean {
      return verificationCache.has(eventId);
    },

    clearVerifications(): void {
      verificationCache.clear();
    },
  };

  return self;
}
