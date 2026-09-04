/**
 * @napplet/vite-plugin — private resource-table serialization and loader source.
 *
 * This module emits implementation metadata embedded in a built artifact. It is
 * not a NIP-5A tag, NIP-5D field, or a new NAP operation: resource retrieval
 * remains entirely on the existing `window.napplet.resource.bytes` boundary.
 */

import {
  renderLoaderScreenRuntime,
  type LoaderScreenState,
} from './loader-screen.js';

type FrameCallback = (timestamp: number) => void;

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

interface ResourceBytesRequest {
  url: string;
  servers?: string[];
}

interface ResourceDomain {
  bytes(uri: string, options?: { servers?: string[]; signal?: AbortSignal }): Promise<Blob>;
  bytesMany(requests: ResourceBytesRequest[], options?: { signal?: AbortSignal }): Promise<ResourceBytesItem[]>;
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
  onState?: (state: LoaderScreenState) => void;
  scheduleFrame?: (callback: FrameCallback) => number;
}

interface ObjectUrlHandle {
  url: string;
  references: number;
}

interface PendingResource {
  promise: Promise<Blob>;
  resolve(blob: Blob): void;
  reject(reason: unknown): void;
}

interface RetryOperation {
  kind: 'single' | 'batch';
  sources: string[];
  start(): Promise<void>;
}

interface ResourceFailure {
  cancelled: boolean;
  operation: RetryOperation;
}

interface ActiveAttempt {
  active: boolean;
  controller: AbortController;
  kind: RetryOperation['kind'];
  sources: string[];
}

const DEFAULT_MAX_ASSET_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_LIVE_BYTES = 50 * 1024 * 1024;
const DEFAULT_MAX_BATCH_SIZE = 8;
const DEFAULT_MAX_CONCURRENT_DIGESTS = 2;

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
  return blob.arrayBuffer().then(async (value) => {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', value);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  });
}

function defaultScheduleFrame(callback: FrameCallback): number {
  const runtimeGlobal = globalThis as typeof globalThis & { requestAnimationFrame?: (callback: FrameCallback) => number };
  if (typeof runtimeGlobal.requestAnimationFrame === 'function') return runtimeGlobal.requestAnimationFrame(callback);
  queueMicrotask(() => callback(globalThis.performance.now()));
  return 0;
}

function chunks<T>(values: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function deferredResource(): PendingResource {
  let resolve!: (blob: Blob) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Blob>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

/**
 * Bounded private runtime for generated artifact references.
 *
 * It deliberately accepts only table-authorized canonical Blossom URIs and
 * calls only the existing `window.napplet.resource` projection. Retrieval has
 * no napplet-owned deadline; failed and cancelled attempts stay recoverable.
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
  private readonly onState?: (state: LoaderScreenState) => void;
  private readonly scheduleFrame: (callback: FrameCallback) => number;
  private readonly cache = new Map<string, Blob>();
  private readonly liveUrls = new Map<string, ObjectUrlHandle>();
  private readonly pending = new Map<string, PendingResource>();
  private readonly failures = new Map<string, ResourceFailure>();
  private readonly attempts = new Set<ActiveAttempt>();
  private readonly requested = new Set<string>();
  private readonly verified = new Set<string>();
  private readonly digestWaiters: Array<() => void> = [];
  private liveBytes = 0;
  private digestActive = 0;
  private cohortClosed = false;
  private cohortFrameScheduled = false;
  private lastFailureSource: string | undefined;

  constructor(options: ResourceRuntimeOptions) {
    this.entries = new Map(options.entries.map((entry) => [entry.source, { ...entry }]));
    this.runtimeWindow = options.window ?? (globalThis as ResourceWindow);
    this.objectUrls = options.url ?? URL;
    this.digest = options.digest ?? defaultDigest;
    this.maxAssetBytes = options.maxAssetBytes ?? DEFAULT_MAX_ASSET_BYTES;
    this.maxLiveBytes = options.maxLiveBytes ?? DEFAULT_MAX_LIVE_BYTES;
    this.maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
    this.maxConcurrentDigests = options.maxConcurrentDigests ?? DEFAULT_MAX_CONCURRENT_DIGESTS;
    this.onState = options.onState;
    this.scheduleFrame = options.scheduleFrame ?? defaultScheduleFrame;
    if (!Number.isInteger(this.maxBatchSize) || this.maxBatchSize < 1) throw new Error('invalid optimized resource batch limit');
    if (!Number.isInteger(this.maxConcurrentDigests) || this.maxConcurrentDigests < 1) throw new Error('invalid optimized resource digest limit');
    this.emitState();
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

  private snapshot(): LoaderScreenState {
    const active = this.attempts.size > 0;
    const failed = this.lastFailureSource ? this.failures.get(this.lastFailureSource) : undefined;
    const completed = Array.from(this.requested).filter((source) => this.verified.has(source)).length;
    let phase: LoaderScreenState['phase'] = 'initial';
    if (failed) phase = failed.cancelled ? 'cancelled' : 'error';
    else if (active || this.requested.size > 0) phase = 'active';
    if (!failed && !active && this.cohortClosed && this.requested.size > 0 && completed === this.requested.size) phase = 'success';
    return {
      phase,
      active,
      cohortClosed: this.cohortClosed,
      completed,
      total: this.requested.size,
      ...(failed && this.lastFailureSource ? { source: this.lastFailureSource } : {}),
    };
  }

  private emitState(): void {
    this.onState?.(this.snapshot());
  }

  private observe(source: string): void {
    this.requested.add(source);
    if (!this.cohortFrameScheduled) {
      this.cohortFrameScheduled = true;
      this.scheduleFrame(() => {
        this.cohortClosed = true;
        this.emitState();
      });
    }
    this.emitState();
  }

  private async withDigestSlot<T>(operation: () => Promise<T>): Promise<T> {
    if (this.digestActive >= this.maxConcurrentDigests) {
      await new Promise<void>((resolve) => this.digestWaiters.push(resolve));
    }
    this.digestActive += 1;
    try {
      return await operation();
    } finally {
      this.digestActive -= 1;
      this.digestWaiters.shift()?.();
    }
  }

  private async verify(entry: ResourceTableEntry, blob: Blob): Promise<Blob> {
    if (blob.size !== entry.bytes) throw new Error(`optimized resource length mismatch: ${entry.source}`);
    const sha256 = await this.withDigestSlot(() => this.digest(blob));
    if (sha256 !== entry.sha256) throw new Error(`optimized resource digest mismatch: ${entry.source}`);
    return blob;
  }

  private cacheVerified(source: string, blob: Blob): void {
    if (!this.cache.has(source)) {
      if (this.liveBytes + blob.size > this.maxLiveBytes) throw new Error('optimized resource live-byte limit exceeded');
      this.cache.set(source, blob);
      this.liveBytes += blob.size;
    }
    this.verified.add(source);
  }

  private complete(source: string, blob: Blob): void {
    this.cacheVerified(source, blob);
    this.failures.delete(source);
    const pending = this.pending.get(source);
    if (pending) {
      this.pending.delete(source);
      pending.resolve(blob);
    }
    this.emitState();
  }

  private createOperation(kind: RetryOperation['kind'], sources: string[]): RetryOperation {
    const operation = {
      kind,
      sources: [...sources],
      start: async (): Promise<void> => {
        if (kind === 'single') await this.startSingle(operation);
        else await this.startBatch(operation);
      },
    } satisfies RetryOperation;
    return operation;
  }

  private prepareAttempt(operation: RetryOperation): ActiveAttempt | undefined {
    const sources = operation.sources.filter((source) => this.pending.has(source) && !this.cache.has(source));
    if (sources.length === 0) return undefined;
    for (const source of sources) this.failures.delete(source);
    const attempt: ActiveAttempt = {
      active: true,
      controller: new AbortController(),
      kind: operation.kind,
      sources,
    };
    this.attempts.add(attempt);
    this.emitState();
    return attempt;
  }

  private finishAttempt(attempt: ActiveAttempt): void {
    if (!attempt.active) return;
    attempt.active = false;
    this.attempts.delete(attempt);
    this.emitState();
  }

  private recordFailures(sources: string[], cancelled: boolean, kind: RetryOperation['kind']): void {
    const unresolved = sources.filter((source) => this.pending.has(source) && !this.cache.has(source));
    if (unresolved.length === 0) return;
    const retry = this.createOperation(kind, unresolved);
    for (const source of unresolved) this.failures.set(source, { cancelled, operation: retry });
    this.lastFailureSource = unresolved[0];
  }

  private async startSingle(operation: RetryOperation): Promise<void> {
    const attempt = this.prepareAttempt(operation);
    if (!attempt) return;
    const source = attempt.sources[0]!;
    try {
      const entry = this.entryFor(source);
      const blob = await requireResource(this.runtimeWindow).bytes(entry.uri, { signal: attempt.controller.signal });
      const verified = await this.verify(entry, blob);
      if (attempt.active) this.complete(source, verified);
    } catch {
      if (attempt.active) this.recordFailures([source], attempt.controller.signal.aborted, 'single');
    } finally {
      this.finishAttempt(attempt);
    }
  }

  private async startBatch(operation: RetryOperation): Promise<void> {
    const attempt = this.prepareAttempt(operation);
    if (!attempt) return;
    const entries = attempt.sources.map((source) => this.entryFor(source));
    const requests = entries.map((entry) => ({ url: entry.uri }));
    try {
      const items = await requireResource(this.runtimeWindow).bytesMany(requests, { signal: attempt.controller.signal });
      if (!attempt.active) return;
      if (items.length !== requests.length || items.some((item, index) => item.url !== requests[index]!.url)) {
        this.recordFailures(attempt.sources, false, 'batch');
        return;
      }
      const failed: string[] = [];
      await Promise.all(entries.map(async (entry, index) => {
        const item = items[index]!;
        if (!item.ok || !item.blob) {
          failed.push(entry.source);
          return;
        }
        try {
          const verified = await this.verify(entry, item.blob);
          if (attempt.active) this.complete(entry.source, verified);
        } catch {
          failed.push(entry.source);
        }
      }));
      if (attempt.active && failed.length > 0) this.recordFailures(failed, attempt.controller.signal.aborted, 'batch');
    } catch {
      if (attempt.active) this.recordFailures(attempt.sources, attempt.controller.signal.aborted, 'batch');
    } finally {
      this.finishAttempt(attempt);
    }
  }

  /** Resolve one private source through the existing whole-Blob resource API. */
  resolve(source: string): Promise<Blob> {
    let entry: ResourceTableEntry;
    try {
      entry = this.entryFor(source);
    } catch (error) {
      return Promise.reject(error);
    }
    const cached = this.cache.get(source);
    if (cached) return Promise.resolve(cached);
    const existing = this.pending.get(source);
    if (existing) return existing.promise;
    const pending = deferredResource();
    this.pending.set(source, pending);
    this.observe(source);
    void this.createOperation('single', [entry.source]).start();
    return pending.promise;
  }

  /** Resolve an ordered list in bounded `bytesMany` groups without serializing sibling groups. */
  resolveMany(sources: string[]): Promise<Blob[]> {
    try {
      for (const source of sources) this.entryFor(source);
    } catch (error) {
      return Promise.reject(error);
    }
    const created: string[] = [];
    const results = sources.map((source) => {
      const cached = this.cache.get(source);
      if (cached) return Promise.resolve(cached);
      const existing = this.pending.get(source);
      if (existing) return existing.promise;
      const pending = deferredResource();
      this.pending.set(source, pending);
      this.observe(source);
      created.push(source);
      return pending.promise;
    });
    for (const group of chunks(created, this.maxBatchSize)) void this.createOperation('batch', group).start();
    return Promise.all(results);
  }

  /** Retry only unresolved failed or cancelled work under fresh controllers. */
  async retry(): Promise<void> {
    const operations = new Set(Array.from(this.failures.values(), ({ operation }) => operation));
    for (const operation of operations) {
      for (const source of operation.sources) this.failures.delete(source);
    }
    this.emitState();
    await Promise.all(Array.from(operations, (operation) => operation.start()));
  }

  /** Abort active attempts while retaining their original application-facing promises. */
  cancel(): void {
    for (const attempt of [...this.attempts]) {
      attempt.active = false;
      this.attempts.delete(attempt);
      attempt.controller.abort();
      this.recordFailures(attempt.sources, true, attempt.kind);
    }
    this.emitState();
  }

  /** Return a Response backed only by an already verified complete Blob. */
  async response(source: string): Promise<Response> {
    const entry = this.entryFor(source);
    const response = new Response(await this.resolve(source), { headers: { 'content-type': entry.mime } });
    this.release(source);
    return response;
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

  /** Deterministic page-teardown cleanup for controllers, promises, owned URLs, and Blobs. */
  teardown(): void {
    for (const attempt of this.attempts) {
      attempt.active = false;
      attempt.controller.abort();
    }
    this.attempts.clear();
    for (const pending of this.pending.values()) pending.reject(new Error('optimized resource loader was torn down'));
    this.pending.clear();
    this.failures.clear();
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
 * Render the private loader used by automatic resource substitutions.
 *
 * The generated code calls only the existing NAP-RESOURCE web projection. It
 * validates complete terminal Blobs, coalesces duplicate work, and keeps failed
 * or cancelled callers pending until the loader's native Retry control starts a
 * fresh attempt.
 */
export function renderResourceLoader(entries: readonly ResourceTableEntry[]): string {
  const table = renderPrivateResourceTable(entries).replace(/<\/script/gi, '<\\/script');
  return `(() => {
const table = new Map(${table}.map((entry) => [entry.source, entry]));
const cache = new Map();
const urls = new Map();
const pending = new Map();
const failures = new Map();
const attempts = new Set();
const requested = new Set();
const verifiedSources = new Set();
const digestWaiters = [];
let liveBytes = 0;
let digestActive = 0;
let cohortClosed = false;
let cohortFrameScheduled = false;
let lastFailureSource;
let controlsInstalled = false;
const MAX_ASSET_BYTES = ${DEFAULT_MAX_ASSET_BYTES};
const MAX_LIVE_BYTES = ${DEFAULT_MAX_LIVE_BYTES};
const MAX_BATCH_SIZE = ${DEFAULT_MAX_BATCH_SIZE};
const MAX_CONCURRENT_DIGESTS = ${DEFAULT_MAX_CONCURRENT_DIGESTS};
${renderLoaderScreenRuntime()}
function resource() {
  if (!window.napplet || !window.napplet.resource) throw new Error('window.napplet.resource is unavailable; this optimized artifact requires the existing resource capability');
  return window.napplet.resource;
}
function resourceBytes(uri, signal) { resource(); return window.napplet.resource.bytes(uri, { signal: signal }); }
function resourceBytesMany(requests, signal) { resource(); return window.napplet.resource.bytesMany(requests, { signal: signal }); }
function entryFor(source) {
  const entry = table.get(source);
  if (!entry || !/^blossom:sha256:[a-f0-9]{64}$/.test(entry.uri) || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.uri !== 'blossom:sha256:' + entry.sha256 || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || entry.bytes > MAX_ASSET_BYTES) throw new Error('invalid optimized resource mapping: ' + source);
  return entry;
}
function loaderState() {
  const active = attempts.size > 0;
  const failed = lastFailureSource ? failures.get(lastFailureSource) : undefined;
  let completed = 0;
  for (const source of requested) if (verifiedSources.has(source)) completed += 1;
  let phase = failed ? failed.cancelled ? 'cancelled' : 'error' : active || requested.size > 0 ? 'active' : 'initial';
  if (!failed && !active && cohortClosed && requested.size > 0 && completed === requested.size) phase = 'success';
  return { phase: phase, active: active, cohortClosed: cohortClosed, completed: completed, total: requested.size, source: failed ? lastFailureSource : undefined };
}
function installControls() {
  if (controlsInstalled) return;
  const retryButton = document.getElementById('napplet-loader-retry');
  const cancelButton = document.getElementById('napplet-loader-cancel');
  if (!retryButton || !cancelButton) return;
  retryButton.addEventListener('click', retry);
  cancelButton.addEventListener('click', cancel);
  controlsInstalled = true;
}
function syncScreen() { applyLoaderScreenState(loaderState()); installControls(); }
function observe(source) {
  requested.add(source);
  if (!cohortFrameScheduled) {
    cohortFrameScheduled = true;
    requestAnimationFrame(() => { cohortClosed = true; syncScreen(); });
  }
  syncScreen();
}
function createPending() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise: promise, resolve: resolve, reject: reject };
}
async function digestBlob(blob) {
  if (digestActive >= MAX_CONCURRENT_DIGESTS) await new Promise((resolve) => digestWaiters.push(resolve));
  digestActive += 1;
  try {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  } finally {
    digestActive -= 1;
    const next = digestWaiters.shift();
    if (next) next();
  }
}
async function verify(entry, blob) {
  if (blob.size !== entry.bytes) throw new Error('optimized resource length mismatch');
  if (await digestBlob(blob) !== entry.sha256) throw new Error('optimized resource digest mismatch');
  return blob;
}
function cacheVerified(source, blob) {
  if (!cache.has(source)) {
    if (liveBytes + blob.size > MAX_LIVE_BYTES) throw new Error('optimized resource live-byte limit exceeded');
    cache.set(source, blob);
    liveBytes += blob.size;
  }
  verifiedSources.add(source);
}
function complete(source, blob) {
  cacheVerified(source, blob);
  failures.delete(source);
  const waiter = pending.get(source);
  if (waiter) { pending.delete(source); waiter.resolve(blob); }
  syncScreen();
}
function createOperation(kind, sources) {
  const operation = { kind: kind, sources: sources.slice(), start: undefined };
  operation.start = () => kind === 'single' ? startSingle(operation) : startBatch(operation);
  return operation;
}
function prepareAttempt(operation) {
  const sources = operation.sources.filter((source) => pending.has(source) && !cache.has(source));
  if (!sources.length) return undefined;
  for (const source of sources) failures.delete(source);
  const attempt = { active: true, controller: new AbortController(), kind: operation.kind, sources: sources };
  attempts.add(attempt);
  syncScreen();
  return attempt;
}
function finishAttempt(attempt) {
  if (!attempt.active) return;
  attempt.active = false;
  attempts.delete(attempt);
  syncScreen();
}
function recordFailures(sources, cancelled, kind) {
  const unresolved = sources.filter((source) => pending.has(source) && !cache.has(source));
  if (!unresolved.length) return;
  const operation = createOperation(kind, unresolved);
  for (const source of unresolved) failures.set(source, { cancelled: cancelled, operation: operation });
  lastFailureSource = unresolved[0];
}
async function startSingle(operation) {
  const attempt = prepareAttempt(operation);
  if (!attempt) return;
  const source = attempt.sources[0];
  try {
    const entry = entryFor(source);
    const blob = await resourceBytes(entry.uri, attempt.controller.signal);
    const checked = await verify(entry, blob);
    if (attempt.active) complete(source, checked);
  } catch (_) {
    if (attempt.active) recordFailures([source], attempt.controller.signal.aborted, 'single');
  } finally { finishAttempt(attempt); }
}
async function startBatch(operation) {
  const attempt = prepareAttempt(operation);
  if (!attempt) return;
  const entries = attempt.sources.map(entryFor);
  const requests = entries.map((entry) => ({ url: entry.uri }));
  try {
    const items = await resourceBytesMany(requests, attempt.controller.signal);
    if (!attempt.active) return;
    if (items.length !== requests.length || items.some((item, index) => item.url !== requests[index].url)) {
      recordFailures(attempt.sources, false, 'batch');
      return;
    }
    const failed = [];
    await Promise.all(entries.map(async (entry, index) => {
      const item = items[index];
      if (!item.ok || !item.blob) { failed.push(entry.source); return; }
      try {
        const checked = await verify(entry, item.blob);
        if (attempt.active) complete(entry.source, checked);
      } catch (_) { failed.push(entry.source); }
    }));
    if (attempt.active && failed.length) recordFailures(failed, attempt.controller.signal.aborted, 'batch');
  } catch (_) {
    if (attempt.active) recordFailures(attempt.sources, attempt.controller.signal.aborted, 'batch');
  } finally { finishAttempt(attempt); }
}
function resolve(source) {
  let entry;
  try { entry = entryFor(source); } catch (error) { return Promise.reject(error); }
  if (cache.has(source)) return Promise.resolve(cache.get(source));
  if (pending.has(source)) return pending.get(source).promise;
  const waiter = createPending();
  pending.set(source, waiter);
  observe(source);
  createOperation('single', [entry.source]).start();
  return waiter.promise;
}
function resolveMany(sources) {
  try { for (const source of sources) entryFor(source); } catch (error) { return Promise.reject(error); }
  const created = [];
  const results = sources.map((source) => {
    if (cache.has(source)) return Promise.resolve(cache.get(source));
    if (pending.has(source)) return pending.get(source).promise;
    const waiter = createPending();
    pending.set(source, waiter);
    observe(source);
    created.push(source);
    return waiter.promise;
  });
  for (let index = 0; index < created.length; index += MAX_BATCH_SIZE) createOperation('batch', created.slice(index, index + MAX_BATCH_SIZE)).start();
  return Promise.all(results);
}
async function retry() {
  const operations = new Set(Array.from(failures.values(), (failure) => failure.operation));
  for (const operation of operations) for (const source of operation.sources) failures.delete(source);
  syncScreen();
  await Promise.all(Array.from(operations, (operation) => operation.start()));
}
function cancel() {
  for (const attempt of Array.from(attempts)) {
    attempt.active = false;
    attempts.delete(attempt);
    attempt.controller.abort();
    recordFailures(attempt.sources, true, attempt.kind);
  }
  syncScreen();
}
async function response(source) { const entry = entryFor(source); const value = new Response(await resolve(source), { headers: { 'content-type': entry.mime } }); release(source); return value; }
async function objectUrl(source) { const current = urls.get(source); if (current) { current.references += 1; return current.url; } const url = URL.createObjectURL(await resolve(source)); urls.set(source, { url: url, references: 1 }); return url; }
function release(source) { if (source === undefined) { for (const handle of urls.values()) URL.revokeObjectURL(handle.url); urls.clear(); cache.clear(); liveBytes = 0; return; } const handle = urls.get(source); if (handle && --handle.references <= 0) { URL.revokeObjectURL(handle.url); urls.delete(source); } if (!urls.has(source) && cache.has(source)) { liveBytes -= cache.get(source).size; cache.delete(source); } }
function teardown() { for (const attempt of attempts) { attempt.active = false; attempt.controller.abort(); } attempts.clear(); for (const waiter of pending.values()) waiter.reject(new Error('optimized resource loader was torn down')); pending.clear(); failures.clear(); release(); }
window.__nappletPrivateResourceLoader = { resolve: resolve, resolveMany: resolveMany, response: response, objectUrl: objectUrl, release: release, cancel: cancel, retry: retry, teardown: teardown };
requestAnimationFrame(syncScreen);
})();`;
}
