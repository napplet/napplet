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
  renderLoaderScreenMarkup,
  renderLoaderScreenStyle,
} from './loader-screen.js';
import {
  classifyAssetReferences,
  inventoryArtifactReferences,
  rewriteArtifactReferences,
  type ReferenceInventory,
  type RetainedArtifact,
} from './references.js';

export { renderPrivateResourceTable, renderResourceLoader, type ResourceTableEntry } from './loader.js';

export const OPTIMIZATION_TARGET_BYTES = 2 * 1024 * 1024;
/** Private loader portability bound for each complete resource Blob. */
export const MAX_WHOLE_RESOURCE_BYTES = 10 * 1024 * 1024;
const RENDERED_HTML_ARTIFACT_PATH = '<rendered-index.html>';

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
  inventory?: ReferenceInventory;
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
  inventory: ReferenceInventory;
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

interface DocumentInjectionPoints {
  headClose: number | undefined;
  bodyContent: number | undefined;
}

const RAW_TEXT_ELEMENTS = new Set(['iframe', 'noembed', 'noframes', 'script', 'style', 'textarea', 'title', 'xmp']);

function htmlTagEnd(html: string, start: number): number | undefined {
  let quote: '"' | "'" | undefined;
  for (let index = start + 1; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = undefined;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }
  return undefined;
}

function documentInjectionPoints(html: string): DocumentInjectionPoints {
  const lower = html.toLowerCase();
  let cursor = 0;
  let rawText: string | undefined;
  let templateDepth = 0;
  let headClose: number | undefined;
  let bodyContent: number | undefined;

  while (cursor < html.length && (headClose === undefined || bodyContent === undefined)) {
    const start = rawText
      ? lower.indexOf(`</${rawText}`, cursor)
      : html.indexOf('<', cursor);
    if (start < 0) break;
    if (!rawText && html.startsWith('<!--', start)) {
      const commentEnd = html.indexOf('-->', start + 4);
      cursor = commentEnd < 0 ? html.length : commentEnd + 3;
      continue;
    }
    const end = htmlTagEnd(html, start);
    if (end === undefined) break;
    const tag = /^<\s*(\/?)\s*([a-z][a-z0-9:-]*)/i.exec(html.slice(start, end + 1));
    if (!tag) {
      cursor = end + 1;
      continue;
    }
    const closing = tag[1] === '/';
    const name = tag[2]!.toLowerCase();
    if (rawText) {
      if (closing && name === rawText) rawText = undefined;
      cursor = end + 1;
      continue;
    }
    if (name === 'template') {
      templateDepth = closing ? Math.max(0, templateDepth - 1) : templateDepth + 1;
      cursor = end + 1;
      continue;
    }
    if (templateDepth === 0) {
      if (closing && name === 'head' && headClose === undefined) headClose = start;
      if (!closing && name === 'body' && bodyContent === undefined) bodyContent = end + 1;
    }
    if (!closing && RAW_TEXT_ELEMENTS.has(name)) rawText = name;
    cursor = end + 1;
  }
  return { headClose, bodyContent };
}

function injectPrivateMetadata(html: string, entries: readonly ResourceTableEntry[]): string {
  if (entries.length === 0) return html;
  const table = renderPrivateResourceTable(entries).replace(/<\/script/gi, '<\\/script');
  const metadata = `<style data-napplet-private-loader>${renderLoaderScreenStyle()}</style><script type="application/json" data-napplet-private-resource-table>${table}</script><script>${renderResourceLoader(entries)}</script>`;
  const markup = renderLoaderScreenMarkup();
  const points = documentInjectionPoints(html);
  const insertions = [
    { index: points.headClose ?? 0, value: metadata },
    { index: points.bodyContent ?? html.length, value: markup },
  ].sort((left, right) => right.index - left.index);
  let result = html;
  for (const insertion of insertions) {
    result = `${result.slice(0, insertion.index)}${insertion.value}${result.slice(insertion.index)}`;
  }
  return result;
}

function buildReferenceInventory(build: RetainedBuild): ReferenceInventory {
  return inventoryArtifactReferences({
    assets: build.assets,
    artifacts: [
      { path: RENDERED_HTML_ARTIFACT_PATH, kind: 'html', content: build.html },
      ...(build.artifacts ?? []),
    ],
  });
}

/** Render the actual candidate HTML for a selected set, then measure its UTF-8 bytes. */
export function renderOptimizedHtml(input: RenderInput): RenderedArtifact {
  const selectedBySource = new Map(input.selected.map((asset) => [normalizedPath(asset.source), asset]));
  const entries = input.entries ? [...input.entries] : tableEntries(input.selected);
  const inventory = input.inventory ?? buildReferenceInventory(input.build);
  const replacements = new Map(input.build.assets
    .filter((asset) => !selectedBySource.has(normalizedPath(asset.source)))
    .map((asset) => [normalizedPath(asset.source), dataUri(asset)]));
  const fetchCallReplacements = new Map([...selectedBySource.keys()].map((source) => [
    source,
    `window.__nappletPrivateResourceLoader.response("${source}")`,
  ]));
  const artifact = inventory.artifacts.find((candidate) => candidate.path === RENDERED_HTML_ARTIFACT_PATH);
  if (!artifact) throw new Error('optimizer reference inventory is missing the rendered HTML artifact');
  let html = rewriteArtifactReferences({
    artifact,
    inventory,
    replacements,
    fetchCallReplacements,
  }).content;

  html = injectPrivateMetadata(html, entries);
  return { html, bytes: Buffer.byteLength(html), entries };
}

/** Plan deterministic externalization without mutating emitted output. */
export function planExternalAssets(input: RetainedBuild): OptimizationPlan {
  const targetBytes = input.targetBytes ?? OPTIMIZATION_TARGET_BYTES;
  const inventory = buildReferenceInventory(input);
  const initial = renderOptimizedHtml({ build: input, selected: [], inventory });
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
      inventory,
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
    rendered = renderOptimizedHtml({ build: input, selected, inventory });
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
    inventory,
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
    const rendered = render({ build: input.build, selected: plan.selected, entries, inventory: plan.inventory });
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
