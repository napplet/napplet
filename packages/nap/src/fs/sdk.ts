/**
 * Napplet NAP fs sdk entrypoint.
 *
 * @module
 */

/**
 * @napplet/nap/fs -- SDK helpers wrapping window.napplet.fs.
 *
 * These convenience functions delegate to `window.napplet.fs.*` at call time.
 * The shim must be imported somewhere to install the global.
 */

import type { NappletGlobal, Subscription } from '@napplet/core';
import type {
  FsChange,
  FsDirectoryEntry,
  FsInfo,
  FsMetadata,
  FsMkdirOptions,
  FsPickOptions,
  FsPickResult,
  FsWatchOptions,
} from './types.js';

function requireFs(): NonNullable<NappletGlobal['fs']> {
  const w = window as Window & { napplet?: NappletGlobal };
  if (!w.napplet?.fs) {
    throw new Error('window.napplet.fs is unavailable -- runtime did not inject this domain');
  }
  return w.napplet.fs;
}

/**
 * Discover visible roots, coarse root permissions, and runtime limits.
 *
 * @returns Promise resolving to the runtime's filesystem discovery data
 */
export function fsInfo(): Promise<FsInfo> {
  return requireFs().info();
}

/**
 * Ask the runtime to let the user select one file.
 *
 * @param options  Optional picker hints
 * @returns Promise resolving to picked virtual filesystem paths
 */
export function fsPickFile(options?: FsPickOptions): Promise<FsPickResult> {
  return requireFs().pickFile(options);
}

/**
 * Ask the runtime to let the user select one or more files.
 *
 * @param options  Optional picker hints
 * @returns Promise resolving to picked virtual filesystem paths
 */
export function fsPickFiles(options?: FsPickOptions): Promise<FsPickResult> {
  return requireFs().pickFiles(options);
}

/**
 * Ask the runtime to let the user select one directory.
 *
 * @param options  Optional picker hints
 * @returns Promise resolving to picked virtual filesystem paths
 */
export function fsPickDirectory(options?: FsPickOptions): Promise<FsPickResult> {
  return requireFs().pickDirectory(options);
}

/**
 * Ask the runtime to let the user select or name one file destination.
 *
 * @param options  Optional picker hints
 * @returns Promise resolving to picked virtual filesystem paths
 */
export function fsPickSaveFile(options?: FsPickOptions): Promise<FsPickResult> {
  return requireFs().pickSaveFile(options);
}

/**
 * Read coarse metadata for a visible file or directory.
 *
 * @param path  Virtual absolute path of the entry
 * @returns Promise resolving to the entry metadata
 */
export function fsStat(path: string): Promise<FsMetadata> {
  return requireFs().stat(path);
}

/**
 * List the direct children of a visible directory. Ordering is unspecified.
 *
 * @param path  Virtual absolute path of the directory
 * @returns Promise resolving to the directory entries
 */
export function fsList(path: string): Promise<FsDirectoryEntry[]> {
  return requireFs().list(path);
}

/**
 * Create a directory.
 *
 * @param path     Virtual absolute path of the directory to create
 * @param options  Optional recursive parent creation
 * @returns Promise resolving once the runtime acknowledges the creation
 */
export function fsMkdir(path: string, options?: FsMkdirOptions): Promise<void> {
  return requireFs().mkdir(path, options);
}

/**
 * Remove a file or directory.
 *
 * @param path       Virtual absolute path of the entry to remove
 * @param recursive  Remove a non-empty directory and its authorized descendants
 * @returns Promise resolving once the runtime acknowledges the removal
 */
export function fsRemove(path: string, recursive?: boolean): Promise<void> {
  return requireFs().remove(path, recursive);
}

/**
 * Move or rename a file or directory.
 *
 * @param fromPath  Virtual absolute source path
 * @param toPath    Virtual absolute destination path
 * @returns Promise resolving once the runtime acknowledges the move
 */
export function fsMove(fromPath: string, toPath: string): Promise<void> {
  return requireFs().move(fromPath, toPath);
}

/**
 * Start an advisory watch on a visible path.
 *
 * @param path     Virtual absolute path to watch
 * @param options  Optional recursive descendant coverage
 * @returns Promise resolving to the runtime-generated watch id
 */
export function fsWatch(path: string, options?: FsWatchOptions): Promise<string> {
  return requireFs().watch(path, options);
}

/**
 * Stop a watch. Unknown ids may be treated as successful no-ops by the runtime.
 *
 * @param watchId  Runtime-generated watch id
 * @returns Promise resolving once the runtime acknowledges the request
 */
export function fsUnwatch(watchId: string): Promise<void> {
  return requireFs().unwatch(watchId);
}

/**
 * Register for runtime-pushed filesystem change events.
 *
 * @param handler  Called with each advisory change
 * @returns A Subscription with `close()` to stop listening
 */
export function fsOnChanged(handler: (change: FsChange) => void): Subscription {
  return requireFs().onChanged(handler);
}
