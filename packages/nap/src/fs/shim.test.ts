import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface PostedMessage {
  msg: unknown;
  targetOrigin: string;
}

let postedMessages: PostedMessage[];
let uuidCounter: number;
let originalCryptoDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  postedMessages = [];
  uuidCounter = 0;
  originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      randomUUID: () => `fs-test-${++uuidCounter}`,
    },
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      parent: {
        postMessage(msg: unknown, targetOrigin: string) {
          postedMessages.push({ msg, targetOrigin });
        },
      },
    },
  });

  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalCryptoDescriptor) {
    Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'crypto');
  }
  Reflect.deleteProperty(globalThis, 'window');
});

describe('@napplet/nap/fs shim', () => {
  it('discovers roots and limits', async () => {
    const { handleFsMessage, info } = await import('./shim.js');

    const result = info();

    expect(postedMessages).toEqual([
      { msg: { type: 'fs.info', id: 'fs-test-1' }, targetOrigin: '*' },
    ]);

    handleFsMessage({
      type: 'fs.info.result',
      id: 'fs-test-1',
      info: {
        roots: [{ path: '/shared', name: 'Shared files', permissions: ['read', 'list'] }],
        limits: { maxReadBytes: 1048576, maxWriteBytes: 1048576, maxWatchCount: 16 },
      },
    });

    await expect(result).resolves.toEqual({
      roots: [{ path: '/shared', name: 'Shared files', permissions: ['read', 'list'] }],
      limits: { maxReadBytes: 1048576, maxWriteBytes: 1048576, maxWatchCount: 16 },
    });
  });

  it('stats a visible entry', async () => {
    const { handleFsMessage, stat } = await import('./shim.js');

    const result = stat('/shared/note.txt');

    expect(postedMessages).toEqual([
      { msg: { type: 'fs.stat', id: 'fs-test-1', path: '/shared/note.txt' }, targetOrigin: '*' },
    ]);

    handleFsMessage({
      type: 'fs.stat.result',
      id: 'fs-test-1',
      metadata: { path: '/shared/note.txt', kind: 'file', size: 12 },
    });

    await expect(result).resolves.toEqual({ path: '/shared/note.txt', kind: 'file', size: 12 });
  });

  it('lists directory entries', async () => {
    const { handleFsMessage, list } = await import('./shim.js');

    const result = list('/shared');

    expect(postedMessages).toEqual([
      { msg: { type: 'fs.list', id: 'fs-test-1', path: '/shared' }, targetOrigin: '*' },
    ]);

    handleFsMessage({
      type: 'fs.list.result',
      id: 'fs-test-1',
      entries: [{ name: 'note.txt', path: '/shared/note.txt', kind: 'file', size: 12 }],
    });

    await expect(result).resolves.toEqual([
      { name: 'note.txt', path: '/shared/note.txt', kind: 'file', size: 12 },
    ]);
  });

  it('creates directories with recursive options', async () => {
    const { handleFsMessage, mkdir } = await import('./shim.js');

    const result = mkdir('/shared/projects/new', { recursive: true });

    expect(postedMessages).toEqual([
      {
        msg: {
          type: 'fs.mkdir',
          id: 'fs-test-1',
          path: '/shared/projects/new',
          options: { recursive: true },
        },
        targetOrigin: '*',
      },
    ]);

    handleFsMessage({ type: 'fs.mkdir.result', id: 'fs-test-1' });

    await expect(result).resolves.toBeUndefined();
  });

  it('omits the options key when mkdir options are not supplied', async () => {
    const { handleFsMessage, mkdir } = await import('./shim.js');

    const result = mkdir('/shared/projects');

    expect(postedMessages).toEqual([
      { msg: { type: 'fs.mkdir', id: 'fs-test-1', path: '/shared/projects' }, targetOrigin: '*' },
    ]);

    handleFsMessage({ type: 'fs.mkdir.result', id: 'fs-test-1' });

    await expect(result).resolves.toBeUndefined();
  });

  it('sends remove recursive as a top-level field, never nested in options', async () => {
    const { handleFsMessage, remove } = await import('./shim.js');

    const result = remove('/shared/projects', true);

    expect(postedMessages).toEqual([
      {
        msg: {
          type: 'fs.remove',
          id: 'fs-test-1',
          path: '/shared/projects',
          recursive: true,
        },
        targetOrigin: '*',
      },
    ]);

    const posted = postedMessages[0]?.msg as Record<string, unknown>;
    expect(Object.keys(posted)).toContain('recursive');
    expect(Object.keys(posted)).not.toContain('options');

    handleFsMessage({ type: 'fs.remove.result', id: 'fs-test-1' });

    await expect(result).resolves.toBeUndefined();
  });

  it('moves entries with fromPath and toPath', async () => {
    const { handleFsMessage, move } = await import('./shim.js');

    const result = move('/shared/a.txt', '/shared/b.txt');

    expect(postedMessages).toEqual([
      {
        msg: {
          type: 'fs.move',
          id: 'fs-test-1',
          fromPath: '/shared/a.txt',
          toPath: '/shared/b.txt',
        },
        targetOrigin: '*',
      },
    ]);

    handleFsMessage({ type: 'fs.move.result', id: 'fs-test-1' });

    await expect(result).resolves.toBeUndefined();
  });

  it('resolves watch with the runtime-generated watchId', async () => {
    const { handleFsMessage, watch } = await import('./shim.js');

    const result = watch('/shared', { recursive: true });

    expect(postedMessages).toEqual([
      {
        msg: {
          type: 'fs.watch',
          id: 'fs-test-1',
          path: '/shared',
          options: { recursive: true },
        },
        targetOrigin: '*',
      },
    ]);

    handleFsMessage({ type: 'fs.watch.result', id: 'fs-test-1', watchId: 'watch-1' });

    await expect(result).resolves.toBe('watch-1');
  });

  it('stops watches by id', async () => {
    const { handleFsMessage, unwatch } = await import('./shim.js');

    const result = unwatch('watch-1');

    expect(postedMessages).toEqual([
      { msg: { type: 'fs.unwatch', id: 'fs-test-1', watchId: 'watch-1' }, targetOrigin: '*' },
    ]);

    handleFsMessage({ type: 'fs.unwatch.result', id: 'fs-test-1' });

    await expect(result).resolves.toBeUndefined();
  });

  it('rejects results carrying an error reason', async () => {
    const { handleFsMessage, stat } = await import('./shim.js');

    const result = stat('/hidden/private.txt');

    handleFsMessage({ type: 'fs.stat.result', id: 'fs-test-1', error: 'not-found' });

    await expect(result).rejects.toThrow('not-found');
  });

  it('rejects rather than resolving undefined when a success field is missing', async () => {
    const { handleFsMessage, list } = await import('./shim.js');

    const result = list('/shared');

    handleFsMessage({ type: 'fs.list.result', id: 'fs-test-1' });

    await expect(result).rejects.toThrow('fs.list returned no entries');
  });

  it('fans out runtime-pushed changes until subscriptions close', async () => {
    const { handleFsMessage, onChanged } = await import('./shim.js');
    const first = vi.fn();
    const second = vi.fn();

    const firstSub = onChanged(first);
    onChanged(second);

    handleFsMessage({
      type: 'fs.changed',
      change: { watchId: 'watch-1', path: '/shared/note.txt', kind: 'modified' },
    });
    firstSub.close();
    handleFsMessage({
      type: 'fs.changed',
      change: { watchId: 'watch-1', path: '/shared/old.txt', kind: 'moved', fromPath: '/shared/new.txt' },
    });

    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith({
      watchId: 'watch-1',
      path: '/shared/note.txt',
      kind: 'modified',
    });
    expect(second).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenNthCalledWith(2, {
      watchId: 'watch-1',
      path: '/shared/old.txt',
      kind: 'moved',
      fromPath: '/shared/new.txt',
    });
  });

  it('ignores foreign domains, unknown ids, and malformed envelopes without throwing', async () => {
    const { handleFsMessage, onChanged } = await import('./shim.js');
    const handler = vi.fn();
    onChanged(handler);

    expect(() => handleFsMessage({ type: 'unknown.domain' })).not.toThrow();
    expect(() => handleFsMessage({ type: 'fs.stat.result', id: 'never-sent' })).not.toThrow();
    expect(() => handleFsMessage({ type: 'fs.stat.result' })).not.toThrow();
    expect(() => handleFsMessage({ type: 'fs.changed' })).not.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not resolve a pending request from a fs.changed push', async () => {
    const { handleFsMessage, stat } = await import('./shim.js');

    const result = stat('/shared/note.txt');
    let settled = false;
    void result.then(() => { settled = true; }, () => { settled = true; });

    handleFsMessage({
      type: 'fs.changed',
      change: { watchId: 'watch-1', path: '/shared/note.txt', kind: 'modified' },
    });
    await Promise.resolve();

    expect(settled).toBe(false);

    handleFsMessage({
      type: 'fs.stat.result',
      id: 'fs-test-1',
      metadata: { path: '/shared/note.txt', kind: 'file' },
    });

    await expect(result).resolves.toEqual({ path: '/shared/note.txt', kind: 'file' });
  });

  it('clears pending requests and handlers on cleanup', async () => {
    const { installFsShim, handleFsMessage, onChanged } = await import('./shim.js');
    const handler = vi.fn();

    const cleanup = installFsShim();
    onChanged(handler);
    cleanup();

    handleFsMessage({
      type: 'fs.changed',
      change: { watchId: 'watch-1', path: '/shared/note.txt', kind: 'modified' },
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
