/**
 * Manifest cache — persists verified NIP-5A aggregate hashes per napp identity.
 */

/**
 * A cached manifest entry for a verified napp build.
 * @example
 * ```ts
 * const entry: ManifestCacheEntry = {
 *   pubkey: 'abc123...', dTag: '3chat',
 *   aggregateHash: 'deadbeef', verifiedAt: Date.now(),
 * };
 * ```
 */
export interface ManifestCacheEntry {
  pubkey: string;
  dTag: string;
  aggregateHash: string;
  verifiedAt: number;
}

const STORAGE_KEY = 'napplet:manifest-cache';
const cache = new Map<string, ManifestCacheEntry>();

function cacheKey(pubkey: string, dTag: string): string {
  return `${pubkey}:${dTag}`;
}

/**
 * Cache for verified napp manifest entries. Persists to localStorage.
 * Used to detect napp updates (aggregateHash changes) across sessions.
 *
 * @example
 * ```ts
 * import { manifestCache } from '@napplet/shell';
 *
 * manifestCache.set({ pubkey: 'abc...', dTag: 'chat', aggregateHash: 'dead', verifiedAt: Date.now() });
 * const entry = manifestCache.get('abc...', 'chat');
 * ```
 */
export const manifestCache = {
  /**
   * Get a cached manifest entry by pubkey and dTag.
   *
   * @param pubkey - The napp's pubkey
   * @param dTag - The napp's dTag
   * @returns The cached entry, or undefined if not found
   */
  get(pubkey: string, dTag: string): ManifestCacheEntry | undefined {
    return cache.get(cacheKey(pubkey, dTag));
  },

  /**
   * Set (upsert) a manifest cache entry and persist to localStorage.
   *
   * @param entry - The manifest entry to cache
   */
  set(entry: ManifestCacheEntry): void {
    cache.set(cacheKey(entry.pubkey, entry.dTag), entry);
    manifestCache.persist();
  },

  /**
   * Check if a specific hash is cached for a pubkey/dTag combination.
   *
   * @param pubkey - The napp's pubkey
   * @param dTag - The napp's dTag
   * @param hash - The aggregateHash to check
   * @returns True if the exact hash matches the cached entry
   */
  has(pubkey: string, dTag: string, hash: string): boolean {
    const entry = cache.get(cacheKey(pubkey, dTag));
    return !!entry && entry.aggregateHash === hash;
  },

  /**
   * Remove a cached entry for a pubkey/dTag and persist.
   *
   * @param pubkey - The napp's pubkey
   * @param dTag - The napp's dTag
   */
  remove(pubkey: string, dTag: string): void {
    cache.delete(cacheKey(pubkey, dTag));
    manifestCache.persist();
  },

  /** Load the cache from localStorage. */
  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const entries = JSON.parse(raw) as Array<[string, ManifestCacheEntry]>;
      cache.clear();
      for (const [key, val] of entries) cache.set(key, val);
    } catch { /* Corrupted cache data — clear and start fresh */ cache.clear(); }
  },

  /** Persist the cache to localStorage. */
  persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(cache.entries())));
    } catch { /* localStorage unavailable in sandboxed contexts — persist is best-effort */ }
  },

  /** Clear all cached entries and remove from localStorage. */
  clear(): void {
    cache.clear();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* localStorage unavailable — cleanup is best-effort */ }
  },
};
