import * as crypto from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  ResourceRuntime,
  renderResourceLoader,
  type ResourceTableEntry,
} from './loader.js';

function bytes(length: number, value = 65): Uint8Array {
  return new Uint8Array(Buffer.alloc(length, value));
}

function entry(source: string, value: Uint8Array): ResourceTableEntry {
  const sha256 = crypto.createHash('sha256').update(value).digest('hex');
  return { source, uri: `blossom:sha256:${sha256}`, sha256, bytes: value.byteLength, mime: 'application/octet-stream' };
}

function fakeWindow(overrides: Partial<{ bytes: (uri: string) => Promise<Blob>; bytesMany: (uris: string[]) => Promise<Array<{ url: string; ok: boolean; blob?: Blob }>> }> = {}) {
  return {
    napplet: {
      resource: {
        bytes: overrides.bytes ?? (async () => new Blob([])),
        bytesMany: overrides.bytesMany ?? (async () => []),
      },
    },
  };
}

describe('private NAP-RESOURCE runtime', () => {
  it('uses only existing resource.bytes and bytesMany with canonical Blossom URIs', async () => {
    const one = entry('assets/one.bin', bytes(4, 49));
    const two = entry('assets/two.bin', bytes(4, 50));
    const bytesCall = vi.fn(async (uri: string) => new Blob([uri === one.uri ? bytes(4, 49) : bytes(4, 50)]));
    const manyCall = vi.fn(async (uris: string[]) => uris.map((uri) => ({ url: uri, ok: true, blob: new Blob([uri === one.uri ? bytes(4, 49) : bytes(4, 50)]) })));
    const runtime = new ResourceRuntime({ entries: [one, two], window: fakeWindow({ bytes: bytesCall, bytesMany: manyCall }) });

    await expect(runtime.resolve(one.source)).resolves.toBeInstanceOf(Blob);
    await expect(runtime.resolveMany([one.source, two.source])).resolves.toHaveLength(2);
    expect(bytesCall).toHaveBeenCalledWith(one.uri);
    expect(manyCall).toHaveBeenCalledWith([two.uri]);
    expect(renderResourceLoader([one, two])).toContain('window.napplet.resource.bytesMany');
    expect(renderResourceLoader([one, two])).not.toContain('fetch(');
  });

  it('verifies exact length and lowercase SHA-256 before exposing a Response or object URL', async () => {
    const value = bytes(4, 49);
    const resource = entry('assets/value.bin', value);
    const urls = { createObjectURL: vi.fn(() => 'blob:verified'), revokeObjectURL: vi.fn() };
    const runtime = new ResourceRuntime({
      entries: [resource],
      window: fakeWindow({ bytes: async () => new Blob([bytes(3, 49)]) }),
      url: urls,
    });

    await expect(runtime.response(resource.source)).rejects.toThrow(/length/i);
    await expect(runtime.objectUrl(resource.source)).rejects.toThrow(/length/i);
    expect(urls.createObjectURL).not.toHaveBeenCalled();

    const verified = new ResourceRuntime({
      entries: [resource],
      window: fakeWindow({ bytes: async () => new Blob([value]) }),
      url: urls,
    });
    await expect((await verified.response(resource.source)).arrayBuffer()).resolves.toEqual(value.buffer);
    await expect(verified.objectUrl(resource.source)).resolves.toBe('blob:verified');
  });

  it('provides owned response and media paths while reference-counting and revoking Blob URLs', async () => {
    const resource = entry('assets/media.bin', bytes(4, 49));
    const urls = { createObjectURL: vi.fn(() => 'blob:media'), revokeObjectURL: vi.fn() };
    const runtime = new ResourceRuntime({ entries: [resource], window: fakeWindow({ bytes: async () => new Blob([bytes(4, 49)]) }), url: urls });

    expect(await runtime.objectUrl(resource.source)).toBe('blob:media');
    expect(await runtime.objectUrl(resource.source)).toBe('blob:media');
    runtime.release(resource.source);
    expect(urls.revokeObjectURL).not.toHaveBeenCalled();
    runtime.release(resource.source);
    expect(urls.revokeObjectURL).toHaveBeenCalledWith('blob:media');
    await runtime.objectUrl(resource.source);
    runtime.teardown();
    expect(urls.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('bounds batches, digest work, cached bytes, and timeouts without exposing partial batches', async () => {
    const entries = [entry('assets/one.bin', bytes(4, 49)), entry('assets/two.bin', bytes(4, 50)), entry('assets/three.bin', bytes(4, 51))];
    const manyCall = vi.fn(async (uris: string[]) => uris.map((uri) => ({ url: uri, ok: true, blob: new Blob([entries.find((candidate) => candidate.uri === uri)!.sha256 === entries[0]!.sha256 ? bytes(4, 49) : entries.find((candidate) => candidate.uri === uri)!.sha256 === entries[1]!.sha256 ? bytes(4, 50) : bytes(4, 51)]) })));
    let concurrent = 0;
    let peak = 0;
    const runtime = new ResourceRuntime({
      entries,
      window: fakeWindow({ bytesMany: manyCall }),
      maxBatchSize: 2,
      maxConcurrentDigests: 1,
      maxLiveBytes: 12,
      digest: async (blob) => {
        concurrent += 1;
        peak = Math.max(peak, concurrent);
        await Promise.resolve();
        concurrent -= 1;
        return crypto.createHash('sha256').update(new Uint8Array(await blob.arrayBuffer())).digest('hex');
      },
    });

    await expect(runtime.resolveMany(entries.map((candidate) => candidate.source))).resolves.toHaveLength(3);
    expect(manyCall.mock.calls.map(([uris]) => uris)).toEqual([[entries[0]!.uri, entries[1]!.uri], [entries[2]!.uri]]);
    expect(peak).toBe(1);

    const timeout = new ResourceRuntime({ entries: [entries[0]!], window: fakeWindow({ bytes: () => new Promise(() => {}) }), timeoutMs: 1 });
    await expect(timeout.resolve(entries[0]!.source)).rejects.toThrow(/timed out/i);
  });

  it.each([
    ['missing resource domain', undefined],
    ['reordered bytesMany row', [{ url: 'blossom:sha256:0'.padEnd(79, '0'), ok: true, blob: new Blob([bytes(4, 49)]) }]],
    ['failed bytesMany row', [{ url: '', ok: false }]],
  ] as const)('fails closed for %s', async (_name, rows) => {
    const resource = entry('assets/fail.bin', bytes(4, 49));
    const urls = { createObjectURL: vi.fn(() => 'blob:unsafe'), revokeObjectURL: vi.fn() };
    const window = rows === undefined
      ? {}
      : fakeWindow({ bytesMany: async (uris) => rows.map((row, index) => ({ ...row, url: row.url || uris[index]! })) });
    const runtime = new ResourceRuntime({ entries: [resource], window, url: urls });

    await expect(runtime.resolveMany([resource.source])).rejects.toThrow();
    expect(urls.createObjectURL).not.toHaveBeenCalled();
  });
});
