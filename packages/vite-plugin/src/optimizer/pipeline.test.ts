import { afterEach, describe, expect, it } from 'vitest';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { writeBundleManifest } from '../manifest.js';
import type { ManifestPluginState } from '../types.js';
import {
  OPTIMIZATION_TARGET_BYTES,
  loadVerifiedResourceBytes,
  optimizeSingleFileArtifact,
  planExternalAssets,
  renderOptimizedHtml,
  renderPrivateResourceTable,
  renderResourceLoader,
  type OptimizationServices,
  type RetainedAsset,
  type RetainedBuild,
} from './pipeline.js';

const tempArtifacts: Array<Map<string, Uint8Array>> = [];
const tempRoots: string[] = [];

function bytes(length: number, value = 65): Uint8Array {
  return Buffer.alloc(length, value);
}

function digest(value: Uint8Array): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function asset(source: string, length: number, mime = 'application/octet-stream'): RetainedAsset {
  return { source, reference: source, bytes: bytes(length, source.charCodeAt(1) || 65), mime };
}

function build(assets: RetainedAsset[], targetBytes = OPTIMIZATION_TARGET_BYTES): RetainedBuild {
  return {
    html: `<html><head></head><body>${assets.map((entry) => `<img src="${entry.reference}">`).join('')}</body></html>`,
    assets,
    targetBytes,
  };
}

function artifactStore(html: string, assets: RetainedAsset[]): Map<string, Uint8Array> {
  const store = new Map<string, Uint8Array>([['index.html', Buffer.from(html)]]);
  for (const entry of assets) store.set(entry.source, entry.bytes);
  tempArtifacts.push(store);
  return store;
}

function fakeServices(overrides: Partial<OptimizationServices> = {}): OptimizationServices {
  const uploaded = new Map<string, Uint8Array>();
  return {
    authorize: async () => ({ token: 'short-lived-test-authorization', expiresAt: Date.now() + 60_000 }),
    upload: async ({ bytes: value, sha256 }) => {
      uploaded.set(`blossom:sha256:${sha256}`, value);
      return { sha256, bytes: value.byteLength };
    },
    resourceBytes: async (uri) => new Blob([uploaded.get(uri) ?? new Uint8Array()]),
    ...overrides,
  };
}

afterEach(() => {
  tempArtifacts.length = 0;
  while (tempRoots.length > 0) fs.rmSync(tempRoots.pop()!, { recursive: true, force: true });
});

describe('large single-file artifact optimizer', () => {
  it('does not trigger at 2 MiB and does trigger at one byte above it', () => {
    expect(planExternalAssets({ html: 'x'.repeat(OPTIMIZATION_TARGET_BYTES), assets: [] }).triggered).toBe(false);
    expect(planExternalAssets({ html: 'x'.repeat(OPTIMIZATION_TARGET_BYTES + 1), assets: [] }).triggered).toBe(true);
  });

  it('orders equal-size retained assets by normalized path and measures every rendered candidate', () => {
    const assets = [asset('/z.bin', 20_000), asset('/a.bin', 20_000), asset('/small.bin', 100)];
    const plan = planExternalAssets(build(assets, 25_000));

    expect(plan.selected.map((entry) => entry.source)).toEqual(['/a.bin', '/z.bin']);
    expect(plan.measurements).toHaveLength(2);
    expect(plan.measurements[0]!.bytes).toBe(renderOptimizedHtml({ build: build(assets, 25_000), selected: plan.selected.slice(0, 1) }).bytes);
  });

  it('reports eligible-asset exhaustion above the target without failing', () => {
    const plan = planExternalAssets({ html: 'x'.repeat(900), assets: [asset('/tiny.bin', 1)], targetBytes: 800 });

    expect(plan.status).toBe('target-not-reached');
    expect(plan.finalBytes).toBeGreaterThan(800);
  });

  it('commits verified selected resources even when exhaustion remains above the target', async () => {
    const selected = asset('/large.bin', 10_000);
    const retained = build([selected], 200);
    const store = artifactStore(retained.html, retained.assets);
    const report = await optimizeSingleFileArtifact({ build: retained, files: store }, fakeServices());

    expect(report.status).toBe('target-not-reached');
    expect(report.committedResourceCount).toBe(1);
    expect(store).toEqual(new Map([['index.html', expect.any(Uint8Array)]]));
  });

  it('uploads the exact selected bytes with short-lived authorization and emits only a canonical lowercase Blossom URI', async () => {
    const selected = asset('/asset.bin', 10_000);
    const retained = build([selected], 5_000);
    const store = artifactStore(retained.html, retained.assets);
    let uploaded: Uint8Array | undefined;
    let authorization: string | undefined;
    const report = await optimizeSingleFileArtifact(
      { build: retained, files: store },
      fakeServices({
        upload: async (request) => {
          uploaded = request.bytes;
          authorization = request.authorization.token;
          return { sha256: request.sha256, bytes: request.bytes.byteLength };
        },
        resourceBytes: async () => new Blob([selected.bytes]),
      }),
    );

    expect(uploaded).toEqual(selected.bytes);
    expect(authorization).toBe('short-lived-test-authorization');
    expect(report.entries).toEqual([expect.objectContaining({ uri: `blossom:sha256:${digest(selected.bytes)}` })]);
    expect(report.entries[0]!.uri).toMatch(/^blossom:sha256:[a-f0-9]{64}$/);
  });

  it('serializes a stable private table and only deletes selected files after verified commit', async () => {
    const first = asset('/b.bin', 10_000, 'image/png');
    const second = asset('/a.bin', 10_000, 'image/jpeg');
    const retained = build([first, second], 5_000);
    const store = artifactStore(retained.html, retained.assets);
    const report = await optimizeSingleFileArtifact({ build: retained, files: store }, fakeServices());
    const table = renderPrivateResourceTable(report.entries);

    expect(JSON.parse(table).map((entry: { source: string }) => entry.source)).toEqual(['/a.bin', '/b.bin']);
    expect(table).toContain('"mime":"image/jpeg"');
    expect(store.has('/a.bin')).toBe(false);
    expect(store.has('/b.bin')).toBe(false);
  });

  it.each([
    ['upload failure', fakeServices({ upload: async () => { throw new Error('upload failed'); } })],
    ['descriptor mismatch', fakeServices({ upload: async ({ bytes: value }) => ({ sha256: '0'.repeat(64), bytes: value.byteLength }) })],
    ['resource recovery failure', fakeServices({ resourceBytes: async () => new Blob([bytes(1)]) })],
  ])('restores every emitted byte and omits committed state on %s', async (_name, services) => {
    const selected = asset('/asset.bin', 10_000);
    const retained = build([selected], 5_000);
    const store = artifactStore(retained.html, retained.assets);
    const original = new Map(store);
    const report = await optimizeSingleFileArtifact({ build: retained, files: store }, services);

    expect(report.status).toBe('rolled-back');
    expect(report.committedResourceCount).toBe(0);
    expect([...store.entries()]).toEqual([...original.entries()]);
  });

  it('uses only the resource.bytes seam to recover a matching Blob and rejects mismatched bytes', async () => {
    const value = bytes(12, 73);
    const entry = { source: '/asset.bin', uri: `blossom:sha256:${digest(value)}`, sha256: digest(value), bytes: value.byteLength, mime: 'application/octet-stream' };
    const recovered = await loadVerifiedResourceBytes(entry, async () => new Blob([value]));

    await expect(loadVerifiedResourceBytes(entry, async () => new Blob([bytes(11, 73)]))).rejects.toThrow(/length/i);
    expect(Buffer.from(await recovered.arrayBuffer())).toEqual(Buffer.from(value));
    expect(renderResourceLoader([entry])).toContain('window.napplet.resource.bytes');
    expect(renderResourceLoader([entry])).not.toContain('fetch(');
  });

  it('emits one resource requirement only after the committed tracer transaction and keeps the private mapping out of tags', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'napplet-optimizer-'));
    tempRoots.push(root);
    const dist = path.join(root, 'dist');
    fs.mkdirSync(dist);
    const emitted = bytes(OPTIMIZATION_TARGET_BYTES + 32, 82);
    fs.writeFileSync(path.join(dist, 'index.html'), '<html><head></head><body><img src="asset.bin"></body></html>');
    fs.writeFileSync(path.join(dist, 'asset.bin'), emitted);
    const uploaded = new Map<string, Uint8Array>();
    const state: ManifestPluginState = {
      outDir: dist,
      projectRoot: root,
      base: '/',
      artifactMode: 'single-file',
      resolvedSchema: null,
      resolvedSchemaSource: null,
      inferredRequires: new Set(),
      reportedMissingRequires: new Set(),
    };

    await writeBundleManifest(
      { nappletType: 'optimizer-tracer', artifactMode: 'single-file' },
      state,
      {
        authorize: async () => ({ token: 'short-lived-test-authorization', expiresAt: Date.now() + 60_000 }),
        upload: async ({ bytes: value, sha256 }) => {
          uploaded.set(`blossom:sha256:${sha256}`, value);
          return { sha256, bytes: value.byteLength };
        },
        resourceBytes: async (uri) => new Blob([uploaded.get(uri) ?? new Uint8Array()]),
      },
    );

    const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.nip5a-manifest.json'), 'utf-8')) as { tags: string[][] };
    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8');
    expect(manifest.tags.filter((tag) => tag[0] === 'requires')).toEqual([['requires', 'resource']]);
    expect(manifest.tags.flat().join(' ')).not.toContain('data-napplet-private-resource-table');
    expect(html).toMatch(/blossom:sha256:[a-f0-9]{64}/);
    expect(fs.existsSync(path.join(dist, 'asset.bin'))).toBe(false);
  });

  it('preserves the ordinary inline artifact when optimization is not triggered', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'napplet-optimizer-'));
    tempRoots.push(root);
    const dist = path.join(root, 'dist');
    fs.mkdirSync(dist);
    fs.writeFileSync(path.join(dist, 'index.html'), '<html><head></head><body><img src="asset.bin"></body></html>');
    fs.writeFileSync(path.join(dist, 'asset.bin'), bytes(12, 82));
    const state: ManifestPluginState = {
      outDir: dist,
      projectRoot: root,
      base: '/',
      artifactMode: 'single-file',
      resolvedSchema: null,
      resolvedSchemaSource: null,
      inferredRequires: new Set(),
      reportedMissingRequires: new Set(),
    };

    await writeBundleManifest({ nappletType: 'optimizer-baseline', artifactMode: 'single-file' }, state);

    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8');
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.nip5a-manifest.json'), 'utf-8')) as { tags: string[][] };
    expect(html).toContain('data:application/octet-stream;base64,UlJSUlJSUlJSUlJS');
    expect(fs.existsSync(path.join(dist, 'asset.bin'))).toBe(false);
    expect(manifest.tags.filter((tag) => tag[0] === 'requires')).toEqual([]);
  });
});
