/**
 * Napplet NAP fs shim entrypoint.
 *
 * @module
 */

// @napplet/nap/fs -- Shell-mediated virtual filesystem shim.
// Correlates fs.* request/result envelopes; routes fs.changed pushes to listeners.
// The runtime owns host paths, mounts, backing store, policy, and authorization.

import { postToShell } from '../boundary.js';
import type { Subscription } from '@napplet/core';
import type {
  FsChange,
  FsDirectoryEntry,
  FsInfo,
  FsMetadata,
  FsMkdirOptions,
  FsOutboundMessage,
  FsPickOptions,
  FsPickResult,
  FsReadOptions,
  FsReadResult,
  FsWatchOptions,
  FsWriteOptions,
  FsWriteResult,
} from './types.js';

/** Default timeout for fs request-response operations. */
const REQUEST_TIMEOUT_MS = 30_000;

/** Every fs.*.result envelope correlates through this single map, keyed by request id. */
const pending = new Map<string, {
  resolve: (msg: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

const changeHandlers = new Set<(change: FsChange) => void>();

let installed = false;

/** The result discriminants routed into the pending map. */
const RESULT_TYPES = new Set([
  'fs.info.result',
  'fs.pickFile.result',
  'fs.pickFiles.result',
  'fs.pickDirectory.result',
  'fs.pickSaveFile.result',
  'fs.stat.result',
  'fs.list.result',
  'fs.read.result',
  'fs.write.result',
  'fs.mkdir.result',
  'fs.remove.result',
  'fs.move.result',
  'fs.watch.result',
  'fs.unwatch.result',
]);

/**
 * Send an fs request and await its correlated result envelope.
 *
 * @param type     The outbound fs discriminant
 * @param payload  Operation fields to merge alongside the generated id
 * @returns Promise resolving to the raw result envelope
 */
function request(
  type: FsOutboundMessage['type'],
  payload: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const id = crypto.randomUUID();
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pending.delete(id)) reject(new Error(`${type} timed out`));
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timeout });

    postToShell({ type, id, ...payload });
  });
}

/**
 * Narrow a result envelope to its declared success field.
 *
 * @param msg        The resolved result envelope
 * @param field      The operation-specific success field name
 * @param operation  The discriminant, used in the failure message
 * @returns The success field value
 */
function expectField<T>(msg: Record<string, unknown>, field: string, operation: string): T {
  const value = msg[field];
  if (value === undefined) {
    throw new Error(`${operation} returned no ${field}`);
  }
  return value as T;
}

function handleResult(msg: { type: string; [key: string]: unknown }): void {
  const id = msg.id;
  if (typeof id !== 'string') return;
  const entry = pending.get(id);
  if (!entry) return;
  pending.delete(id);
  clearTimeout(entry.timeout);
  if (typeof msg.error === 'string') {
    entry.reject(new Error(msg.error));
    return;
  }
  entry.resolve(msg);
}

function handleChanged(msg: { type: string; [key: string]: unknown }): void {
  const change = msg.change as FsChange | undefined;
  if (!change) return;
  for (const handler of changeHandlers) handler(change);
}

/**
 * Handle fs.* messages from the shell via the central message listener.
 * Covers request results and runtime-pushed fs.changed events.
 *
 * @param msg  The shell envelope to route
 */
export function handleFsMessage(msg: { type: string; [key: string]: unknown }): void {
  if (RESULT_TYPES.has(msg.type)) {
    handleResult(msg);
  } else if (msg.type === 'fs.changed') {
    handleChanged(msg);
  }
}

/**
 * Discover visible roots, coarse root permissions, and runtime limits.
 * Advisory discovery only -- never treat it as an authorization token.
 *
 * @returns Promise resolving to the runtime's filesystem discovery data
 *
 * @example
 * ```ts
 * const { roots, limits } = await info();
 * ```
 */
export async function info(): Promise<FsInfo> {
  const msg = await request('fs.info');
  return expectField<FsInfo>(msg, 'info', 'fs.info');
}

/**
 * Ask the runtime to let the user select one file.
 *
 * @param options  Optional picker hints
 * @returns Promise resolving to picked virtual filesystem paths
 */
export async function pickFile(options?: FsPickOptions): Promise<FsPickResult> {
  const msg = await request('fs.pickFile', options === undefined ? {} : { options });
  return expectField<FsPickResult>(msg, 'result', 'fs.pickFile');
}

/**
 * Ask the runtime to let the user select one or more files.
 *
 * @param options  Optional picker hints
 * @returns Promise resolving to picked virtual filesystem paths
 */
export async function pickFiles(options?: FsPickOptions): Promise<FsPickResult> {
  const msg = await request('fs.pickFiles', options === undefined ? {} : { options });
  return expectField<FsPickResult>(msg, 'result', 'fs.pickFiles');
}

/**
 * Ask the runtime to let the user select one directory.
 *
 * @param options  Optional picker hints
 * @returns Promise resolving to picked virtual filesystem paths
 */
export async function pickDirectory(options?: FsPickOptions): Promise<FsPickResult> {
  const msg = await request('fs.pickDirectory', options === undefined ? {} : { options });
  return expectField<FsPickResult>(msg, 'result', 'fs.pickDirectory');
}

/**
 * Ask the runtime to let the user select or name one file destination.
 *
 * @param options  Optional picker hints
 * @returns Promise resolving to picked virtual filesystem paths
 */
export async function pickSaveFile(options?: FsPickOptions): Promise<FsPickResult> {
  const msg = await request('fs.pickSaveFile', options === undefined ? {} : { options });
  return expectField<FsPickResult>(msg, 'result', 'fs.pickSaveFile');
}

/**
 * Read coarse metadata for a visible file or directory.
 *
 * @param path  Virtual absolute path of the entry
 * @returns Promise resolving to the entry metadata
 */
export async function stat(path: string): Promise<FsMetadata> {
  const msg = await request('fs.stat', { path });
  return expectField<FsMetadata>(msg, 'metadata', 'fs.stat');
}

/**
 * List the direct children of a visible directory. Ordering is unspecified.
 *
 * @param path  Virtual absolute path of the directory
 * @returns Promise resolving to the directory entries
 */
export async function list(path: string): Promise<FsDirectoryEntry[]> {
  const msg = await request('fs.list', { path });
  return expectField<FsDirectoryEntry[]>(msg, 'entries', 'fs.list');
}

/**
 * Read bytes from a visible file.
 *
 * @param path     Virtual absolute path of the file
 * @param options  Optional range read controls
 * @returns Promise resolving to the read result
 */
export async function read(path: string, options?: FsReadOptions): Promise<FsReadResult> {
  const msg = await request('fs.read', { path, ...(options === undefined ? {} : { options }) });
  return expectField<FsReadResult>(msg, 'result', 'fs.read');
}

/**
 * Write bytes to a visible file. `data` is RFC 4648 standard padded base64 text.
 *
 * @param path     Virtual absolute path of the file
 * @param data     Decoded bytes encoded as standard padded base64 text
 * @param options  Optional write mode and preconditions
 * @returns Promise resolving to the write result
 */
export async function write(
  path: string,
  data: string,
  options?: FsWriteOptions,
): Promise<FsWriteResult> {
  const msg = await request('fs.write', {
    path,
    data,
    ...(options === undefined ? {} : { options }),
  });
  return expectField<FsWriteResult>(msg, 'result', 'fs.write');
}

/**
 * Create a directory.
 *
 * @param path     Virtual absolute path of the directory to create
 * @param options  Optional recursive parent creation
 * @returns Promise resolving once the runtime acknowledges the creation
 */
export async function mkdir(path: string, options?: FsMkdirOptions): Promise<void> {
  await request('fs.mkdir', { path, ...(options === undefined ? {} : { options }) });
}

/**
 * Remove a file or directory.
 *
 * @param path       Virtual absolute path of the entry to remove
 * @param recursive  Remove a non-empty directory and its authorized descendants
 * @returns Promise resolving once the runtime acknowledges the removal
 */
export async function remove(path: string, recursive?: boolean): Promise<void> {
  await request('fs.remove', { path, ...(recursive === undefined ? {} : { recursive }) });
}

/**
 * Move or rename a file or directory.
 *
 * @param fromPath  Virtual absolute source path
 * @param toPath    Virtual absolute destination path
 * @returns Promise resolving once the runtime acknowledges the move
 */
export async function move(fromPath: string, toPath: string): Promise<void> {
  await request('fs.move', { fromPath, toPath });
}

/**
 * Start an advisory watch on a visible path.
 *
 * @param path     Virtual absolute path to watch
 * @param options  Optional recursive descendant coverage
 * @returns Promise resolving to the runtime-generated watch id
 */
export async function watch(path: string, options?: FsWatchOptions): Promise<string> {
  const msg = await request('fs.watch', { path, ...(options === undefined ? {} : { options }) });
  return expectField<string>(msg, 'watchId', 'fs.watch');
}

/**
 * Stop a watch. Unknown ids may be treated as successful no-ops by the runtime.
 *
 * @param watchId  Runtime-generated watch id
 * @returns Promise resolving once the runtime acknowledges the request
 */
export async function unwatch(watchId: string): Promise<void> {
  await request('fs.unwatch', { watchId });
}

/**
 * Register for runtime-pushed filesystem change events.
 *
 * @param handler  Called with each advisory change
 * @returns A Subscription with `close()` to stop listening
 */
export function onChanged(handler: (change: FsChange) => void): Subscription {
  changeHandlers.add(handler);
  return {
    close(): void {
      changeHandlers.delete(handler);
    },
  };
}

/**
 * Install the fs shim. Registration-only -- requests are issued on demand.
 *
 * @returns cleanup function that clears pending requests and change handlers
 */
export function installFsShim(): () => void {
  if (installed) {
    return () => undefined; // already installed: no-op cleanup
  }
  installed = true;
  return () => {
    for (const entry of pending.values()) clearTimeout(entry.timeout);
    pending.clear();
    changeHandlers.clear();
    installed = false;
  };
}
