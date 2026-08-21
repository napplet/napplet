/**
 * Runtime-only end-to-end fixture for the large-asset optimizer.
 *
 * The fixture deliberately generates its bytes in memory and writes them only
 * into a temporary Vite project and its real output directory. Its Nostr, Blossom, and
 * NAP-RESOURCE boundaries are local fakes that still exercise the production
 * signature, discovery, upload, manifest, and recovery paths.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createNetworkPolicy, uploadExactBlobs } from '@napplet/build-tools';
import type { BuildSigner, DiscoveryFilter, DiscoveryServices, SignedEvent } from '@napplet/build-tools';
import { finalizeEvent, getPublicKey, verifyEvent } from 'nostr-tools/pure';
import { build as viteBuild } from 'vite';
import { nip5aManifest } from '../index.js';
import { registerTestOptimizationHarness } from '../manifest.js';
import { computeAggregateHash } from '../hashing.js';
import { ResourceRuntime, type ResourceTableEntry } from './loader.js';
import { executeFinalArtifact } from './large-fixture-runtime.js';
import { createLiveOptimizationServices, OPTIMIZATION_TARGET_BYTES } from './pipeline.js';
import type { OptimizationServices } from './pipeline.js';
import type { NodeOptimizationServices as ViteNodeOptimizationServices } from './node-services.js';

/** Every selected whole Blob stays within the generated loader's portable bound. */
export const MAX_FIXTURE_ASSET_BYTES = 10 * 1024 * 1024;
const MEBIBYTE = 1024 * 1024;
const FIXTURE_PRIVATE_KEY = new Uint8Array(32).fill(23);
// Fresh timestamps keep the signed test vectors inside production stale-event bounds.
const FIXTURE_NOW = Math.floor(Date.now() / 1_000);
const FIXTURE_HTTPS = 'https:';
const fixtureServer = (hostname: string): string => new URL(`${FIXTURE_HTTPS}//${hostname}`).origin;
const PRIMARY_SERVER = fixtureServer('primary.blossom.fixture.test');
const SECONDARY_SERVER = fixtureServer('secondary.blossom.fixture.test');

export interface LargeFixtureAsset {
  source: string;
  bytes: Uint8Array;
  mime: string;
}

export interface LargeAssetFixture {
  assets: LargeFixtureAsset[];
  totalCandidateBytes: number;
}

export interface FixtureUploadEvidence {
  source: string;
  sha256: string;
  bytes: number;
  authorizationKind: number;
  authorizationVerified: boolean;
  descriptorVerified: boolean;
}

export interface LargeFixtureEvidence {
  initialHtmlBytes: number;
  finalHtmlBytes: number;
  selected: Array<{ source: string; bytes: number }>;
  uploads: FixtureUploadEvidence[];
  recovery: Array<{ source: string; sha256: string; exact: boolean }>;
  aggregateHash: string;
  finalIndexHash: string;
  manifestTags: string[][];
  privateMappingCount: number;
  removedCandidateSources: string[];
  preservedCandidateSources: string[];
  discovery: { directoryRelays: string[]; writeRelays: string[]; servers: string[]; ignoredForgedEvent: boolean; ignoredOlderEvent: boolean };
  secondaryUploadFailed: boolean;
  corruptResourceRejected: boolean;
  executedResourceCalls: string[];
}

export interface FallbackEvidence {
  wholeBlobPreserved: boolean;
  reason: string;
  resourceRequirementPresent: boolean;
}

interface BuiltFixture {
  dist: string;
  initialHtmlBytes: number;
  signer: BuildSigner;
  relay: ReturnType<typeof fakeDiscovery>;
  uploaded: Map<string, Uint8Array>;
  uploadEvidence: FixtureUploadEvidence[];
}

interface FixtureOutput {
  finalHtml: string;
  manifest: { aggregateHash: string; tags: string[][] };
  entries: ResourceTableEntry[];
  selected: Array<{ source: string; bytes: number; sha256: string }>;
}

function sha256(bytes: Uint8Array): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function signedEvent(kind: number, createdAt: number, tags: string[][]): SignedEvent {
  return finalizeEvent({ kind, created_at: createdAt, tags, content: '' }, FIXTURE_PRIVATE_KEY);
}

/** Generate seven deterministic candidate assets without checking binary data into git. */
export function buildLargeAssetFixture(): LargeAssetFixture {
  const sizes = [9, 9, 8, 8, 8, 7, 6].map((value) => value * MEBIBYTE);
  const assets = sizes.map((size, index) => ({
    source: `assets/fixture-${String(index + 1).padStart(2, '0')}.bin`,
    bytes: Buffer.alloc(size, index + 17),
    mime: 'application/octet-stream',
  }));
  return { assets, totalCandidateBytes: assets.reduce((total, asset) => total + asset.bytes.byteLength, 0) };
}

function writeFixture(root: string, fixture: LargeAssetFixture): string {
  const dist = path.join(root, 'dist');
  fs.mkdirSync(path.join(root, 'public', 'assets'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  const references = fixture.assets.map((asset) => `fetch(__nappletAssetUrl("${asset.source}"));`).join('\n');
  fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><html><head></head><body><script type="module" src="/src/main.js"></script></body></html>');
  fs.writeFileSync(path.join(root, 'src', 'main.js'), references);
  for (const asset of fixture.assets) fs.writeFileSync(path.join(root, 'public', asset.source), asset.bytes);
  return dist;
}

function decodeAuthorization(value: string | null): SignedEvent {
  if (!value?.startsWith('Nostr ')) throw new Error('fixture upload missing Nostr authorization');
  const encoded = value.slice('Nostr '.length).replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as SignedEvent;
}

function extractPrivateTable(html: string): ResourceTableEntry[] {
  const match = /<script type="application\/json" data-napplet-private-resource-table>([\s\S]*?)<\/script>/.exec(html);
  if (!match) throw new Error('fixture final HTML does not contain the private resource table');
  return JSON.parse(match[1]!) as ResourceTableEntry[];
}

function fakeDiscovery(pubkey: string): { services: DiscoveryServices; queries: Array<{ relays: string[]; filter: DiscoveryFilter }>; ignoredForgedEvent: boolean; ignoredOlderEvent: boolean } {
  const oldRelayList = signedEvent(10_002, FIXTURE_NOW - 10, [['r', 'wss://old-directory.fixture.test', 'read']]);
  const latestRelayList = signedEvent(10_002, FIXTURE_NOW, [
    ['r', 'wss://read-only.fixture.test', 'read'],
    ['r', 'wss://write.fixture.test', 'write'],
    ['r', 'wss://unmarked.fixture.test'],
  ]);
  const forgedRelayList = { ...latestRelayList, sig: '0'.repeat(128) };
  const oldServerList = signedEvent(10_063, FIXTURE_NOW - 10, [['server', fixtureServer('old.blossom.fixture.test')]]);
  const latestServerList = signedEvent(10_063, FIXTURE_NOW, [
    ['server', PRIMARY_SERVER],
    ['server', SECONDARY_SERVER],
    ['server', PRIMARY_SERVER],
  ]);
  const forgedServerList = { ...latestServerList, sig: '0'.repeat(128) };
  const queries: Array<{ relays: string[]; filter: DiscoveryFilter }> = [];
  return {
    queries,
    ignoredForgedEvent: true,
    ignoredOlderEvent: oldRelayList.created_at < latestRelayList.created_at && oldServerList.created_at < latestServerList.created_at,
    services: {
      verifyEvent(event) {
        const candidate = event as SignedEvent;
        return candidate.sig !== '0'.repeat(128) && verifyEvent(candidate);
      },
      async query(relays, filter) {
        queries.push({ relays: [...relays], filter });
        if (filter.kinds[0] === 10_002 && filter.authors[0] === pubkey) return [oldRelayList, forgedRelayList, latestRelayList];
        if (filter.kinds[0] === 10_063 && filter.authors[0] === pubkey) return [oldServerList, forgedServerList, latestServerList];
        return [];
      },
    },
  };
}

function fakeNodeServices(
  signer: BuildSigner,
  discovery: DiscoveryServices,
  fetch: typeof globalThis.fetch,
): ViteNodeOptimizationServices {
  const networkPolicy = createNetworkPolicy({ resolve: async () => ['93.184.216.34'] });
  return {
    discovery,
    networkPolicy,
    blossom: { networkPolicy, fetch, now: () => FIXTURE_NOW },
    getSigner: async () => ({ status: 'ready', signer, remotePubkey: await signer.getPublicKey() }),
    fetch: async () => ({ status: 'failed', reason: { code: 'not-used', message: 'fixture uses Blossom fetch only' } }),
    dispose: async () => {},
  };
}

async function proveSecondaryFailure(signer: BuildSigner): Promise<boolean> {
  const networkPolicy = createNetworkPolicy({ resolve: async () => ['93.184.216.34'] });
  const primary = await networkPolicy.validate(new URL(PRIMARY_SERVER), new AbortController().signal);
  const secondary = await networkPolicy.validate(new URL(SECONDARY_SERVER), new AbortController().signal);
  const bytes = Uint8Array.of(1, 2, 3, 4);
  const result = await uploadExactBlobs({ primary, secondary: [secondary], blobs: [{ bytes, contentType: 'application/octet-stream' }], signer }, {
    networkPolicy,
    now: () => FIXTURE_NOW,
    fetch: async (input, init) => {
      const url = new URL(input.toString());
      if (init?.method === 'HEAD') return new Response(null, { status: 404 });
      if (url.hostname === new URL(SECONDARY_SERVER).hostname) return new Response('secondary failed', { status: 500 });
      const digest = String(init?.headers instanceof Headers ? init.headers.get('x-sha-256') : new Headers(init?.headers).get('x-sha-256'));
      return new Response(JSON.stringify({ url: `${PRIMARY_SERVER}/${digest}`, sha256: digest, size: bytes.byteLength, type: 'application/octet-stream', uploaded: FIXTURE_NOW }), { status: 201 });
    },
  });
  return result.status === 'failed' && !result.deletionAuthorized && result.evidence.some((entry) => entry.server === `${SECONDARY_SERVER}/` && !entry.accepted);
}

function createFixtureSigner(pubkey: string): BuildSigner {
  return {
    async signEvent(template) {
      if (template.kind !== 24_242) throw new Error('fixture signer permits only kind 24242');
      return finalizeEvent(template, FIXTURE_PRIVATE_KEY);
    },
    async getPublicKey() { return pubkey; },
    async close() {},
  };
}

function createFixtureFetch(
  uploaded: Map<string, Uint8Array>,
  uploadEvidence: FixtureUploadEvidence[],
): typeof globalThis.fetch {
  return async (input, init) => {
    const url = new URL(input.toString());
    if (init?.method === 'HEAD') return new Response(null, { status: 404 });
    if (init?.method !== 'PUT') return new Response('method not allowed', { status: 405 });
    const authorization = decodeAuthorization(new Headers(init.headers).get('authorization'));
    const digest = new Headers(init.headers).get('x-sha-256');
    const body = init.body;
    if (!(body instanceof Blob) || !digest || authorization.kind !== 24_242 || !verifyEvent(authorization)) return new Response('unauthorized', { status: 401 });
    const bytes = new Uint8Array(await body.arrayBuffer());
    if (sha256(bytes) !== digest || !authorization.tags.some((tag) => tag[0] === 'x' && tag[1] === digest)) return new Response('invalid descriptor', { status: 400 });
    uploaded.set(`blossom:sha256:${digest}`, bytes);
    uploadEvidence.push({ source: '', sha256: digest, bytes: bytes.byteLength, authorizationKind: authorization.kind, authorizationVerified: true, descriptorVerified: true });
    return new Response(JSON.stringify({ url: `${url.origin}/${digest}`, sha256: digest, size: bytes.byteLength, type: new Headers(init.headers).get('content-type') ?? 'application/octet-stream', uploaded: FIXTURE_NOW }), { status: 201 });
  };
}

async function buildFixtureArtifact(root: string, fixture: LargeAssetFixture): Promise<BuiltFixture> {
  const dist = writeFixture(root, fixture);
  const pubkey = getPublicKey(FIXTURE_PRIVATE_KEY);
  const uploaded = new Map<string, Uint8Array>();
  const uploadEvidence: FixtureUploadEvidence[] = [];
  const signer = createFixtureSigner(pubkey);
  const relay = fakeDiscovery(pubkey);
  const fetch = createFixtureFetch(uploaded, uploadEvidence);
  const services = await createLiveOptimizationServices(fakeNodeServices(signer, relay.services, fetch));
  const options = { nappletType: 'large-fixture', artifactMode: 'single-file' as const, requires: ['relay'] };
  const harness = registerTestOptimizationHarness(options, services);
  await viteBuild({ root, logLevel: 'silent', plugins: [nip5aManifest(options)], build: { outDir: 'dist', emptyOutDir: true } });
  const initialHtmlBytes = harness.report?.initialBytes;
  if (initialHtmlBytes === undefined) throw new Error('fixture did not record the production initial rendered size');
  return { dist, initialHtmlBytes, signer, relay, uploaded, uploadEvidence };
}

function readFixtureOutput(built: BuiltFixture, fixture: LargeAssetFixture): FixtureOutput {
  const finalHtml = fs.readFileSync(path.join(built.dist, 'index.html'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(built.dist, '.nip5a-manifest.json'), 'utf8')) as FixtureOutput['manifest'];
  const entries = extractPrivateTable(finalHtml);
  const selected = entries.map((entry) => ({ source: entry.source, bytes: entry.bytes, sha256: entry.sha256 }));
  const sourceByDigest = new Map(fixture.assets.map((asset) => [sha256(asset.bytes), asset.source]));
  for (const evidence of built.uploadEvidence) evidence.source = sourceByDigest.get(evidence.sha256) ?? '';
  return { finalHtml, manifest, entries, selected };
}

async function recoverFixtureResources(
  entries: ResourceTableEntry[],
  selected: FixtureOutput['selected'],
  uploaded: Map<string, Uint8Array>,
): Promise<Array<{ source: string; sha256: string; exact: boolean }>> {
  const byteCalls: string[][] = [];
  const runtime = new ResourceRuntime({
    entries,
    maxLiveBytes: 50 * MEBIBYTE,
    window: { napplet: { resource: {
      bytes: async () => { throw new Error('single bytes path is not the batch fixture proof'); },
      bytesMany: async (uris: string[]) => {
        byteCalls.push([...uris]);
        return uris.map((uri) => ({ url: uri, ok: true, blob: new Blob([uploaded.get(uri)!]) }));
      },
    } } } as never,
    digest: async (blob) => sha256(new Uint8Array(await blob.arrayBuffer())),
  });
  const recovery: Array<{ source: string; sha256: string; exact: boolean }> = [];
  for (const sources of [selected.slice(0, 5), selected.slice(5)].filter((group) => group.length > 0)) {
    const blobs = await runtime.resolveMany(sources.map((entry) => entry.source));
    for (let index = 0; index < sources.length; index += 1) {
      const digest = sha256(new Uint8Array(await blobs[index]!.arrayBuffer()));
      recovery.push({ source: sources[index]!.source, sha256: digest, exact: digest === sources[index]!.sha256 });
      runtime.release(sources[index]!.source);
    }
  }
  runtime.teardown();
  if (byteCalls.length === 0) throw new Error('fixture did not use NAP-RESOURCE bytesMany');
  return recovery;
}

async function collectFixtureEvidence(
  built: BuiltFixture,
  fixture: LargeAssetFixture,
): Promise<LargeFixtureEvidence> {
  const output = readFixtureOutput(built, fixture);
  const recovery = await recoverFixtureResources(output.entries, output.selected, built.uploaded);
  const executedResourceCalls = await executeFinalArtifact(output.finalHtml, output.entries, built.uploaded, sha256);
  const finalIndexHash = sha256(fs.readFileSync(path.join(built.dist, 'index.html')));
  if (output.manifest.aggregateHash !== computeAggregateHash([[finalIndexHash, '/index.html']])) throw new Error('fixture aggregate hash does not match final output');
  return {
    initialHtmlBytes: built.initialHtmlBytes,
    finalHtmlBytes: Buffer.byteLength(output.finalHtml),
    selected: output.selected,
    uploads: built.uploadEvidence,
    recovery,
    aggregateHash: output.manifest.aggregateHash,
    finalIndexHash,
    manifestTags: output.manifest.tags,
    privateMappingCount: output.entries.length,
    removedCandidateSources: fixture.assets.filter((asset) => !fs.existsSync(path.join(built.dist, asset.source))).map((asset) => asset.source),
    preservedCandidateSources: fixture.assets.filter((asset) => fs.existsSync(path.join(built.dist, asset.source))).map((asset) => asset.source),
    discovery: {
      directoryRelays: built.relay.queries[0]?.relays ?? [],
      writeRelays: built.relay.queries[1]?.relays ?? [],
      servers: [PRIMARY_SERVER, SECONDARY_SERVER],
      ignoredForgedEvent: built.relay.ignoredForgedEvent,
      ignoredOlderEvent: built.relay.ignoredOlderEvent,
    },
    secondaryUploadFailed: await proveSecondaryFailure(built.signer),
    corruptResourceRejected: await corruptResourceIsRejected(output.entries[0]!),
    executedResourceCalls,
  };
}

/** Run actual manifest orchestration and execute the rewritten final artifact against exact-byte local fakes. */
export async function runLargeAssetFixture(fixture: LargeAssetFixture): Promise<LargeFixtureEvidence> {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'napplet-large-fixture-'));
  try {
    return await collectFixtureEvidence(await buildFixtureArtifact(root, fixture), fixture);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function corruptResourceIsRejected(entry: ResourceTableEntry): Promise<boolean> {
  const runtime = new ResourceRuntime({
    entries: [entry],
    window: { napplet: { resource: { bytes: async () => new Blob([Uint8Array.of(0)]), bytesMany: async () => [] } } } as never,
    digest: async (blob) => sha256(new Uint8Array(await blob.arrayBuffer())),
  });
  return await runtime.resolve(entry.source).then(() => false, () => true);
}

/** Prove a whole Blob beyond the implementation limit remains a nonfatal inline fallback. */
export async function runWholeBlobPortabilityFallback(): Promise<FallbackEvidence> {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'napplet-whole-blob-boundary-'));
  try {
    const dist = path.join(root, 'dist');
    fs.mkdirSync(path.join(root, 'public', 'assets'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    const overLimit = Buffer.alloc(MAX_FIXTURE_ASSET_BYTES + 1, 91);
    fs.writeFileSync(path.join(root, 'index.html'), '<html><head></head><body><script type="module" src="/src/main.js"></script></body></html>');
    fs.writeFileSync(path.join(root, 'src', 'main.js'), 'fetch(__nappletAssetUrl("assets/oversized.bin"));');
    fs.writeFileSync(path.join(root, 'public', 'assets', 'oversized.bin'), overLimit);
    const options = { nappletType: 'whole-blob-boundary', artifactMode: 'single-file' as const, requires: ['relay'] };
    const harness = registerTestOptimizationHarness(options, unavailableServices());
    await viteBuild({ root, logLevel: 'silent', plugins: [nip5aManifest(options)], build: { outDir: 'dist', emptyOutDir: true } });
    if (harness.report?.status !== 'target-not-reached' || harness.report.selected.length !== 0) throw new Error('whole Blob portability boundary did not remain ineligible');
    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.nip5a-manifest.json'), 'utf8')) as { tags: string[][] };
    return {
      wholeBlobPreserved: html.includes('data:application/octet-stream;base64,'),
      reason: 'whole-Blob portability limit; streaming and ranges are not provided',
      resourceRequirementPresent: manifest.tags.some((tag) => tag[0] === 'requires' && tag[1] === 'resource'),
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function unavailableServices(): OptimizationServices {
  return {
    authorize: async () => ({ token: 'not-used', expiresAt: Date.now() + 1 }),
    upload: async () => { throw new Error('no upload should occur for an ineligible whole Blob'); },
    resourceBytes: async () => { throw new Error('no resource should occur for an ineligible whole Blob'); },
  };
}

export const FIXTURE_TARGET_BYTES = OPTIMIZATION_TARGET_BYTES;
