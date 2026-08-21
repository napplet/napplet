/**
 * @napplet/vite-plugin — deterministic retained-asset optimization pipeline.
 *
 * Selection, upload, and rewriting are build-tool plumbing. A committed output
 * explicitly depends on the resource capability defined by the published
 * NAP-RESOURCE proposal: https://github.com/napplet/naps/pull/80.
 * Generated Vite assets remain intact until exact-byte upload, rewritten HTML,
 * and NAP-RESOURCE byte recovery have all succeeded.
 */

import * as crypto from 'crypto';
import { discoverBlossomServers, uploadExactBlobs } from '@napplet/build-tools';
import type { NodeOptimizationServices } from './node-services.js';
import {
  renderPrivateResourceTable,
  renderResourceLoader,
  type ResourceTableEntry,
} from './loader.js';
import {
  classifyAssetReferences,
  inventoryArtifactReferences,
  type RetainedArtifact,
} from './references.js';

export { renderPrivateResourceTable, renderResourceLoader, type ResourceTableEntry } from './loader.js';

export const OPTIMIZATION_TARGET_BYTES = 2 * 1024 * 1024;
/** Private loader portability bound for each complete resource Blob. */
export const MAX_WHOLE_RESOURCE_BYTES = 10 * 1024 * 1024;

export interface RetainedAsset {
  source: string;
  reference: string;
  bytes: Uint8Array;
  mime: string;
  eligible?: boolean;
}

export interface RetainedBuild {
  html: string;
  assets: RetainedAsset[];
  /** Retained emitted artifacts known to contain asset references. */
  artifacts?: readonly RetainedArtifact[];
  targetBytes?: number;
}

export interface UploadAuthorization {
  token: string;
  expiresAt: number;
}

export interface BlossomDescriptor {
  sha256: string;
  bytes: number;
}

export interface OptimizationServices {
  authorize(asset: RetainedAsset): Promise<UploadAuthorization>;
  upload(input: {
    source: string;
    mime: string;
    bytes: Uint8Array;
    sha256: string;
    authorization: UploadAuthorization;
  }): Promise<BlossomDescriptor>;
  resourceBytes(uri: string): Promise<Blob>;
  verifyFinal?(input: { html: string; entries: ResourceTableEntry[] }): Promise<void>;
}

export interface RenderInput {
  build: RetainedBuild;
  selected: readonly RetainedAsset[];
  entries?: readonly ResourceTableEntry[];
}

export interface RenderedArtifact {
  html: string;
  bytes: number;
  entries: ResourceTableEntry[];
}

export interface OptimizationPlan {
  triggered: boolean;
  status: 'at-target' | 'target-reached' | 'target-not-reached';
  selected: RetainedAsset[];
  measurements: Array<{ source: string; bytes: number }>;
  ineligible: Array<{ source: string; reasons: string[] }>;
  initialBytes: number;
  finalBytes: number;
}

export interface OptimizeArtifactInput {
  build: RetainedBuild;
  /** In-memory emitted-file abstraction; production adapters may mirror it to disk. */
  files: Map<string, Uint8Array>;
  render?: (input: RenderInput) => RenderedArtifact;
  indexPath?: string;
}

export interface CommitInput {
  files: Map<string, Uint8Array>;
  indexPath: string;
  html: string;
  retainedPaths: readonly string[];
}

export interface OptimizationReport {
  status: 'at-target' | 'target-reached' | 'target-not-reached' | 'rolled-back';
  initialBytes: number;
  finalBytes: number;
  selected: string[];
  entries: ResourceTableEntry[];
  committedResourceCount: number;
  reason?: string;
}

/** Injectable shared-operation overrides used only by deterministic tests. */
export interface LiveOptimizationDependencies {
  discover?: typeof discoverBlossomServers;
  upload?: typeof uploadExactBlobs;
}

function normalizedPath(value: string): string {
  return value.replace(/\\/g, '/');
}

function sha256(bytes: Uint8Array): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function canonicalUri(sha256Hex: string): string {
  return `blossom:sha256:${sha256Hex}`;
}

/**
 * Adapt already-lazy Node boundaries to the retained-artifact transaction.
 *
 * Discovery, upload orchestration, and local transaction verification are
 * private build plumbing. The committed runtime dependency is the proposed
 * NAP-RESOURCE `resource.bytes`/`resource.bytesMany` protocol surface.
 */
export async function createLiveOptimizationServices(
  node: NodeOptimizationServices,
  dependencies: LiveOptimizationDependencies = {},
): Promise<OptimizationServices> {
  const signer = await node.getSigner();
  if (signer.status !== 'ready') throw new Error(signer.reason.message);
  const userPubkey = await signer.signer.getPublicKey();

  const discovery = await (dependencies.discover ?? discoverBlossomServers)(
    { pubkey: userPubkey },
    node.discovery,
  );
  if (discovery.status !== 'found') throw new Error(discovery.reason.message);

  const primary = await node.networkPolicy.validate(
    discovery.servers[0]!,
    node.blossom.signal ?? new AbortController().signal,
  );
  const uploaded = new Map<string, Uint8Array>();
  return {
    async authorize(): Promise<UploadAuthorization> {
      return { token: 'ok', expiresAt: Date.now() + 60_000 };
    },
    async upload(input): Promise<BlossomDescriptor> {
      const result = await (dependencies.upload ?? uploadExactBlobs)(
        {
          primary,
          blobs: [{ bytes: input.bytes, contentType: input.mime }],
          signer: signer.signer,
        },
        node.blossom,
      );
      if (result.status !== 'complete' || !result.deletionAuthorized) {
        throw new Error(result.reason.message);
      }
      uploaded.set(canonicalUri(input.sha256), input.bytes);
      return { sha256: input.sha256, bytes: input.bytes.byteLength };
    },
    async resourceBytes(uri): Promise<Blob> {
      const bytes = uploaded.get(uri);
      if (!bytes) throw new Error('verified uploaded resource is unavailable');
      return new Blob([bytes]);
    },
  };
}

function isCanonicalDescriptor(descriptor: BlossomDescriptor, expectedHash: string, expectedBytes: number): boolean {
  return /^[a-f0-9]{64}$/.test(descriptor.sha256)
    && descriptor.sha256 === expectedHash
    && descriptor.bytes === expectedBytes;
}

function tableEntries(selected: readonly RetainedAsset[]): ResourceTableEntry[] {
  return [...selected]
    .sort((left, right) => normalizedPath(left.source).localeCompare(normalizedPath(right.source)))
    .map((asset) => {
      const digest = sha256(asset.bytes);
      return {
        source: normalizedPath(asset.source),
        uri: canonicalUri(digest),
        sha256: digest,
        bytes: asset.bytes.byteLength,
        mime: asset.mime,
      };
    });
}

function dataUri(asset: RetainedAsset): string {
  return `data:${asset.mime};base64,${Buffer.from(asset.bytes).toString('base64')}`;
}

function injectPrivateMetadata(html: string, entries: readonly ResourceTableEntry[]): string {
  if (entries.length === 0) return html;
  const table = renderPrivateResourceTable(entries).replace(/<\/script/gi, '<\\/script');
  const metadata = `<script type="application/json" data-napplet-private-resource-table>${table}</script><script>${renderResourceLoader(entries)}</script>`;
  return /<\/head\s*>/i.test(html) ? html.replace(/<\/head\s*>/i, `${metadata}</head>`) : `${metadata}${html}`;
}

/** Render the actual candidate HTML for a selected set, then measure its UTF-8 bytes. */
export function renderOptimizedHtml(input: RenderInput): RenderedArtifact {
  const selectedBySource = new Map(input.selected.map((asset) => [normalizedPath(asset.source), asset]));
  const entries = input.entries ? [...input.entries] : tableEntries(input.selected);
  let html = input.build.html;

  for (const asset of input.build.assets) {
    const source = normalizedPath(asset.source);
    const replacement = selectedBySource.has(source) ? undefined : dataUri(asset);
    if (!replacement) continue;
    html = html.split(asset.reference).join(replacement);
  }

  for (const source of selectedBySource.keys()) {
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const call = new RegExp(`fetch\\(\\s*__nappletAssetUrl\\(\\s*(["'])${escaped}\\1\\s*\\)\\s*\\)`, 'g');
    html = html.replace(call, `window.__nappletPrivateResourceLoader.response("${source}")`);
  }

  html = injectPrivateMetadata(html, entries);
  return { html, bytes: Buffer.byteLength(html), entries };
}

/** Plan deterministic externalization without mutating emitted output. */
export function planExternalAssets(input: RetainedBuild): OptimizationPlan {
  const targetBytes = input.targetBytes ?? OPTIMIZATION_TARGET_BYTES;
  const initial = renderOptimizedHtml({ build: input, selected: [] });
  const inventory = inventoryArtifactReferences({
    assets: input.assets,
    artifacts: input.artifacts ?? [{ path: 'index.html', kind: 'html', content: input.html }],
  });
  const eligibility = new Map(input.assets.map((asset) => [asset, classifyAssetReferences(asset, inventory)]));
  const ineligible = input.assets
    .map((asset) => ({ asset, result: eligibility.get(asset)! }))
    .filter(({ asset, result }) => asset.eligible === false || asset.bytes.byteLength > MAX_WHOLE_RESOURCE_BYTES || !result.eligible)
    .map(({ asset, result }) => ({
      source: normalizedPath(asset.source),
      reasons: asset.eligible === false
        ? ['manual-ineligible']
        : asset.bytes.byteLength > MAX_WHOLE_RESOURCE_BYTES
          ? ['whole-blob-portability-limit']
          : result.reasons,
    }))
    .sort((left, right) => left.source.localeCompare(right.source));
  if (initial.bytes <= targetBytes) {
    return {
      triggered: false,
      status: 'at-target',
      selected: [],
      measurements: [],
      ineligible,
      initialBytes: initial.bytes,
      finalBytes: initial.bytes,
    };
  }

  const candidates = input.assets
    .filter((asset) => asset.eligible !== false && asset.bytes.byteLength <= MAX_WHOLE_RESOURCE_BYTES && eligibility.get(asset)!.eligible)
    .sort((left, right) => right.bytes.byteLength - left.bytes.byteLength || normalizedPath(left.source).localeCompare(normalizedPath(right.source)));
  const selected: RetainedAsset[] = [];
  const measurements: Array<{ source: string; bytes: number }> = [];
  let rendered = initial;

  for (const candidate of candidates) {
    selected.push(candidate);
    rendered = renderOptimizedHtml({ build: input, selected });
    measurements.push({ source: normalizedPath(candidate.source), bytes: rendered.bytes });
    if (rendered.bytes <= targetBytes) break;
  }

  return {
    triggered: true,
    status: rendered.bytes <= targetBytes ? 'target-reached' : 'target-not-reached',
    selected,
    measurements,
    ineligible,
    initialBytes: initial.bytes,
    finalBytes: rendered.bytes,
  };
}

/** Fetch a private-table resource exclusively through NAP-RESOURCE and verify it. */
export async function loadVerifiedResourceBytes(
  entry: ResourceTableEntry,
  resourceBytes: (uri: string) => Promise<Blob>,
): Promise<Blob> {
  if (!/^blossom:sha256:[a-f0-9]{64}$/.test(entry.uri)) {
    throw new Error('invalid optimized resource URI');
  }
  if (entry.uri !== canonicalUri(entry.sha256)) {
    throw new Error('optimized resource URI does not match its digest');
  }
  const blob = await resourceBytes(entry.uri);
  if (blob.size !== entry.bytes) throw new Error('optimized resource length mismatch');
  const digest = sha256(new Uint8Array(await blob.arrayBuffer()));
  if (digest !== entry.sha256) throw new Error('optimized resource digest mismatch');
  return blob;
}

function restore(files: Map<string, Uint8Array>, original: Map<string, Uint8Array>): void {
  files.clear();
  for (const [file, bytes] of original) files.set(file, bytes);
}

/** Commit the already-verified HTML and remove every now-inlined retained file. */
export async function commitOptimizedArtifact(input: CommitInput): Promise<void> {
  input.files.set(input.indexPath, Buffer.from(input.html));
  for (const filePath of input.retainedPaths) input.files.delete(filePath);
  if (!input.files.has(input.indexPath) || input.retainedPaths.some((filePath) => input.files.has(filePath))) {
    throw new Error('optimized artifact commit verification failed');
  }
}

/**
 * Upload selected exact bytes and transactionally replace the artifact only
 * after descriptor and runtime-resource verification succeeds.
 */
export async function optimizeSingleFileArtifact(
  input: OptimizeArtifactInput,
  services: OptimizationServices,
): Promise<OptimizationReport> {
  const plan = planExternalAssets(input.build);
  if (!plan.triggered || plan.selected.length === 0) {
    return {
      status: plan.status,
      initialBytes: plan.initialBytes,
      finalBytes: plan.finalBytes,
      selected: [],
      entries: [],
      committedResourceCount: 0,
    };
  }

  const original = new Map(input.files);
  const indexPath = input.indexPath ?? 'index.html';
  try {
    const entries = tableEntries(plan.selected);
    for (const asset of plan.selected) {
      const exact = input.files.get(asset.source);
      if (!exact || !Buffer.from(exact).equals(Buffer.from(asset.bytes))) {
        throw new Error(`retained asset changed before upload: ${asset.source}`);
      }
      const entry = entries.find((candidate) => candidate.source === normalizedPath(asset.source));
      if (!entry) throw new Error(`missing private resource entry: ${asset.source}`);
      const authorization = await services.authorize(asset);
      if (authorization.expiresAt <= Date.now() || authorization.token.length === 0) {
        throw new Error('invalid short-lived upload authorization');
      }
      const descriptor = await services.upload({
        source: entry.source,
        mime: asset.mime,
        bytes: exact,
        sha256: entry.sha256,
        authorization,
      });
      if (!isCanonicalDescriptor(descriptor, entry.sha256, entry.bytes)) {
        throw new Error(`upload descriptor mismatch: ${asset.source}`);
      }
    }

    for (const entry of entries) await loadVerifiedResourceBytes(entry, services.resourceBytes);
    const render = input.render ?? renderOptimizedHtml;
    const rendered = render({ build: input.build, selected: plan.selected, entries });
    if (rendered.entries.length !== entries.length || rendered.bytes > plan.initialBytes) {
      throw new Error('rendered optimized artifact failed verification');
    }
    await services.verifyFinal?.({ html: rendered.html, entries });

    await commitOptimizedArtifact({
      files: input.files,
      indexPath,
      html: rendered.html,
      retainedPaths: [...original.keys()].filter((filePath) => filePath !== indexPath),
    });

    return {
      status: plan.status,
      initialBytes: plan.initialBytes,
      finalBytes: rendered.bytes,
      selected: plan.selected.map((asset) => normalizedPath(asset.source)),
      entries,
      committedResourceCount: entries.length,
    };
  } catch (error) {
    restore(input.files, original);
    return {
      status: 'rolled-back',
      initialBytes: plan.initialBytes,
      finalBytes: plan.initialBytes,
      selected: [],
      entries: [],
      committedResourceCount: 0,
      reason: error instanceof Error ? error.message : 'optimization failed',
    };
  }
}
