/**
 * @napplet/vite-plugin — private resource-table serialization and loader source.
 *
 * This module emits implementation metadata embedded in a built artifact. It is
 * not a NIP-5A tag, NIP-5D field, or a new NAP operation: resource retrieval
 * remains entirely on the existing `window.napplet.resource.bytes` boundary.
 */

export interface ResourceTableEntry {
  source: string;
  uri: string;
  sha256: string;
  bytes: number;
  mime: string;
}

interface ResourceBytesItem {
  url: string;
  ok: boolean;
  blob?: Blob;
}

interface ResourceDomain {
  bytes(uri: string, options?: { signal?: AbortSignal }): Promise<Blob>;
  bytesMany(uris: string[], options?: { signal?: AbortSignal }): Promise<ResourceBytesItem[]>;
}

interface ResourceWindow {
  napplet?: { resource?: ResourceDomain };
}

interface ObjectUrlApi {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export interface ResourceRuntimeOptions {
  entries: readonly ResourceTableEntry[];
  window?: ResourceWindow;
  url?: ObjectUrlApi;
  digest?: (blob: Blob) => Promise<string>;
  maxAssetBytes?: number;
  maxLiveBytes?: number;
  maxBatchSize?: number;
  maxConcurrentDigests?: number;
  timeoutMs?: number;
}

interface ObjectUrlHandle {
  url: string;
  references: number;
}

const DEFAULT_MAX_ASSET_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_LIVE_BYTES = 50 * 1024 * 1024;
const DEFAULT_MAX_BATCH_SIZE = 8;
const DEFAULT_MAX_CONCURRENT_DIGESTS = 2;
const DEFAULT_TIMEOUT_MS = 30_000;

function canonicalUri(sha256: string): string {
  return `blossom:sha256:${sha256}`;
}

function requireResource(runtimeWindow: ResourceWindow): ResourceDomain {
  const resource = runtimeWindow.napplet?.resource;
  if (!resource) {
    throw new Error('window.napplet.resource is unavailable; this optimized artifact requires the existing resource capability');
  }
  return resource;
}

function defaultDigest(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then(async (bytes) => {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  });
}

function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('optimized resource recovery timed out')), timeoutMs);
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function chunks<T>(values: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  operation: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = Array.from({ length: values.length }) as R[];
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= values.length) return;
      results[index] = await operation(values[index]!, index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

/**
 * Bounded private runtime for generated artifact references.
 *
 * It deliberately accepts only table-authorized canonical Blossom URIs and
 * calls only the existing `window.napplet.resource` projection. The mapping is
 * build-private metadata, never a NAP message or manifest field.
 */
export class ResourceRuntime {
  private readonly entries: Map<string, ResourceTableEntry>;
  private readonly runtimeWindow: ResourceWindow;
  private readonly objectUrls: ObjectUrlApi;
  private readonly digest: (blob: Blob) => Promise<string>;
  private readonly maxAssetBytes: number;
  private readonly maxLiveBytes: number;
  private readonly maxBatchSize: number;
  private readonly maxConcurrentDigests: number;
  private readonly timeoutMs: number;
  private readonly cache = new Map<string, Blob>();
  private readonly liveUrls = new Map<string, ObjectUrlHandle>();
  private liveBytes = 0;

  constructor(options: ResourceRuntimeOptions) {
    this.entries = new Map(options.entries.map((entry) => [entry.source, { ...entry }]));
    this.runtimeWindow = options.window ?? (globalThis as ResourceWindow);
    this.objectUrls = options.url ?? URL;
    this.digest = options.digest ?? defaultDigest;
    this.maxAssetBytes = options.maxAssetBytes ?? DEFAULT_MAX_ASSET_BYTES;
    this.maxLiveBytes = options.maxLiveBytes ?? DEFAULT_MAX_LIVE_BYTES;
    this.maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
    this.maxConcurrentDigests = options.maxConcurrentDigests ?? DEFAULT_MAX_CONCURRENT_DIGESTS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isInteger(this.maxBatchSize) || this.maxBatchSize < 1) throw new Error('invalid optimized resource batch limit');
    if (!Number.isInteger(this.maxConcurrentDigests) || this.maxConcurrentDigests < 1) throw new Error('invalid optimized resource digest limit');
  }

  private entryFor(source: string): ResourceTableEntry {
    const entry = this.entries.get(source);
    if (!entry) throw new Error(`unknown optimized resource: ${source}`);
    if (!/^blossom:sha256:[a-f0-9]{64}$/.test(entry.uri) || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.uri !== canonicalUri(entry.sha256)) {
      throw new Error(`invalid optimized resource mapping: ${source}`);
    }
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || entry.bytes > this.maxAssetBytes) {
      throw new Error(`optimized resource exceeds bounded asset limit: ${source}`);
    }
    return entry;
  }

  private async verify(entry: ResourceTableEntry, blob: Blob): Promise<Blob> {
    if (blob.size !== entry.bytes) throw new Error(`optimized resource length mismatch: ${entry.source}`);
    const sha256 = await this.digest(blob);
    if (sha256 !== entry.sha256) throw new Error(`optimized resource digest mismatch: ${entry.source}`);
    return blob;
  }

  private cacheVerified(source: string, blob: Blob): void {
    if (this.cache.has(source)) return;
    if (this.liveBytes + blob.size > this.maxLiveBytes) throw new Error('optimized resource live-byte limit exceeded');
    this.cache.set(source, blob);
    this.liveBytes += blob.size;
  }

  /** Resolve one private source through the existing whole-Blob resource API. */
  async resolve(source: string): Promise<Blob> {
    const cached = this.cache.get(source);
    if (cached) return cached;
    const entry = this.entryFor(source);
    const blob = await withTimeout(requireResource(this.runtimeWindow).bytes(entry.uri), this.timeoutMs);
    const verified = await this.verify(entry, blob);
    this.cacheVerified(source, verified);
    return verified;
  }

  /** Resolve an ordered list in bounded `bytesMany` batches; partial batches never enter the cache. */
  async resolveMany(sources: string[]): Promise<Blob[]> {
    const entries = sources.map((source) => ({ source, entry: this.entryFor(source) }));
    const result: Blob[] = [];
    for (const group of chunks(entries, this.maxBatchSize)) {
      const pending = group.filter(({ source }) => !this.cache.has(source));
      const cached = new Map(group.filter(({ source }) => this.cache.has(source)).map(({ source }) => [source, this.cache.get(source)!]));
      if (pending.length > 0) {
        const uris = pending.map(({ entry }) => entry.uri);
        const items = await withTimeout(requireResource(this.runtimeWindow).bytesMany(uris), this.timeoutMs);
        if (items.length !== pending.length || items.some((item, index) => !item.ok || !item.blob || item.url !== uris[index])) {
          throw new Error('optimized resource batch recovery failed');
        }
        const verified = await mapWithConcurrency(pending, this.maxConcurrentDigests, async ({ entry }, index) => this.verify(entry, items[index]!.blob!));
        for (let index = 0; index < pending.length; index += 1) this.cacheVerified(pending[index]!.source, verified[index]!);
      }
      for (const { source } of group) result.push(cached.get(source) ?? this.cache.get(source)!);
    }
    return result;
  }

  /** Return a Response backed only by an already verified complete Blob. */
  async response(source: string): Promise<Response> {
    const entry = this.entryFor(source);
    return new Response(await this.resolve(source), { headers: { 'content-type': entry.mime } });
  }

  /** Allocate a reference-counted object URL for loader-owned image/audio/video/CSS paths. */
  async objectUrl(source: string): Promise<string> {
    const existing = this.liveUrls.get(source);
    if (existing) {
      existing.references += 1;
      return existing.url;
    }
    const url = this.objectUrls.createObjectURL(await this.resolve(source));
    this.liveUrls.set(source, { url, references: 1 });
    return url;
  }

  /** Release one reference or all resources, revoking every owned Blob URL at its final boundary. */
  release(source?: string): void {
    if (source === undefined) {
      for (const value of this.liveUrls.values()) this.objectUrls.revokeObjectURL(value.url);
      this.liveUrls.clear();
      this.cache.clear();
      this.liveBytes = 0;
      return;
    }
    const handle = this.liveUrls.get(source);
    if (handle) {
      handle.references -= 1;
      if (handle.references <= 0) {
        this.objectUrls.revokeObjectURL(handle.url);
        this.liveUrls.delete(source);
      }
    }
    const cached = this.cache.get(source);
    if (cached && !this.liveUrls.has(source)) {
      this.cache.delete(source);
      this.liveBytes -= cached.size;
    }
  }

  /** Deterministic page-teardown cleanup for every loader-owned URL and Blob. */
  teardown(): void {
    this.release();
  }
}

function stableEntries(entries: readonly ResourceTableEntry[]): ResourceTableEntry[] {
  return [...entries].sort((left, right) => left.source.localeCompare(right.source));
}

/** Render the deterministic private mapping stored inside the optimized HTML. */
export function renderPrivateResourceTable(entries: readonly ResourceTableEntry[]): string {
  return JSON.stringify(stableEntries(entries));
}

/**
 * Render a private one-path loader for automatic resource substitutions.
 *
 * The generated code deliberately uses only the existing NAP-RESOURCE web
 * projection. It verifies the signed table's length and SHA-256 before exposing
 * an object URL to the napplet; it never opens a raw network path.
 */
export function renderResourceLoader(entries: readonly ResourceTableEntry[]): string {
  const table = renderPrivateResourceTable(entries).replace(/<\/script/gi, '<\\/script');
  return `(() => {\nconst table = new Map(${table}.map((entry) => [entry.source, entry]));\nconst cache = new Map();\nconst urls = new Map();\nlet liveBytes = 0;\nconst MAX_ASSET_BYTES = ${DEFAULT_MAX_ASSET_BYTES};\nconst MAX_LIVE_BYTES = ${DEFAULT_MAX_LIVE_BYTES};\nfunction resource() {\n  if (!window.napplet || !window.napplet.resource) throw new Error('window.napplet.resource is unavailable; this optimized artifact requires the existing resource capability');\n  return window.napplet.resource;\n}\nfunction resourceBytes(uri) { resource(); return window.napplet.resource.bytes(uri); }\nfunction resourceBytesMany(uris) { resource(); return window.napplet.resource.bytesMany(uris); }\nfunction entryFor(source) {\n  const entry = table.get(source);\n  if (!entry || !/^blossom:sha256:[a-f0-9]{64}$/.test(entry.uri) || entry.uri !== 'blossom:sha256:' + entry.sha256 || entry.bytes > MAX_ASSET_BYTES) throw new Error('invalid optimized resource mapping: ' + source);\n  return entry;\n}\nasync function verify(entry, blob) {\n  if (blob.size !== entry.bytes) throw new Error('optimized resource length mismatch');\n  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))).map((byte) => byte.toString(16).padStart(2, '0')).join('');\n  if (digest !== entry.sha256) throw new Error('optimized resource digest mismatch');\n  if (!cache.has(entry.source)) { if (liveBytes + blob.size > MAX_LIVE_BYTES) throw new Error('optimized resource live-byte limit exceeded'); cache.set(entry.source, blob); liveBytes += blob.size; }\n  return blob;\n}\nasync function resolve(source) {\n  if (cache.has(source)) return cache.get(source);\n  const entry = entryFor(source);\n  return verify(entry, await resourceBytes(entry.uri));\n}\nasync function resolveMany(sources) {\n  const entries = sources.map(entryFor);\n  const missing = entries.filter((entry) => !cache.has(entry.source));\n  if (missing.length) { const items = await resourceBytesMany(missing.map((entry) => entry.uri)); if (items.length !== missing.length || items.some((item, index) => !item.ok || !item.blob || item.url !== missing[index].uri)) throw new Error('optimized resource batch recovery failed'); await Promise.all(missing.map((entry, index) => verify(entry, items[index].blob))); }\n  return sources.map((source) => cache.get(source));\n}\nasync function response(source) { const entry = entryFor(source); return new Response(await resolve(source), { headers: { 'content-type': entry.mime } }); }\nasync function objectUrl(source) { const current = urls.get(source); if (current) { current.references += 1; return current.url; } const url = URL.createObjectURL(await resolve(source)); urls.set(source, { url, references: 1 }); return url; }\nfunction release(source) { if (source === undefined) { for (const handle of urls.values()) URL.revokeObjectURL(handle.url); urls.clear(); cache.clear(); liveBytes = 0; return; } const handle = urls.get(source); if (handle && --handle.references <= 0) { URL.revokeObjectURL(handle.url); urls.delete(source); } if (!urls.has(source) && cache.has(source)) { liveBytes -= cache.get(source).size; cache.delete(source); } }\nwindow.__nappletPrivateResourceLoader = { resolve, resolveMany, response, objectUrl, release, teardown: () => release() };\n})();`;
}
