/**
 * Manifest cache — persists verified NIP-5A aggregate hashes per napp identity.
 */

export interface ManifestCacheEntry {
  pubkey: string;
  dTag: string;
  aggregateHash: string;
  verifiedAt: number;
}

const STORAGE_KEY = 'hyprgate:manifest-cache';
const cache = new Map<string, ManifestCacheEntry>();

function cacheKey(pubkey: string, dTag: string): string {
  return `${pubkey}:${dTag}`;
}

export const manifestCache = {
  get(pubkey: string, dTag: string): ManifestCacheEntry | undefined {
    return cache.get(cacheKey(pubkey, dTag));
  },

  set(entry: ManifestCacheEntry): void {
    cache.set(cacheKey(entry.pubkey, entry.dTag), entry);
    manifestCache.persist();
  },

  has(pubkey: string, dTag: string, hash: string): boolean {
    const entry = cache.get(cacheKey(pubkey, dTag));
    return !!entry && entry.aggregateHash === hash;
  },

  remove(pubkey: string, dTag: string): void {
    cache.delete(cacheKey(pubkey, dTag));
    manifestCache.persist();
  },

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const entries = JSON.parse(raw) as Array<[string, ManifestCacheEntry]>;
      cache.clear();
      for (const [key, val] of entries) cache.set(key, val);
    } catch { cache.clear(); }
  },

  persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(cache.entries())));
    } catch { /* silent */ }
  },

  clear(): void {
    cache.clear();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  },
};
