import type {
  FsChange,
  FsDirectoryEntry,
  FsInfo,
  FsMetadata,
  FsMkdirOptions,
  FsPickOptions,
  FsPickResult,
  FsReadOptions,
  FsReadResult,
  FsWatchOptions,
  FsWriteOptions,
  FsWriteResult,
  Subscription,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Shell-mediated virtual filesystem access (NAP-FS): discover visible roots,
 * ask the runtime to mediate file and directory selection, inspect and list
 * entries, read and write base64-encoded file bytes, create, remove and move
 * them, and subscribe to advisory change events. The runtime owns host paths,
 * mounts, backing store, normalization, policy, and authorization -- the
 * napplet sees only virtual paths.
 *
 * `info()` is advisory discovery, not an authorization token: handle failures
 * even when it advertised a matching permission.
 *
 * @example
 * ```ts
 * import { fs } from '@napplet/sdk';
 *
 * const picked = await fs.pickFile({ accept: [{ extension: '.md' }] });
 * const bytes = await fs.read(picked.entries[0].path);
 * await fs.write('/shared/copy.txt', bytes.data, { mode: 'replace' });
 * const entries = await fs.list('/shared');
 * const watchId = await fs.watch('/shared', { recursive: true });
 * fs.onChanged((change) => refresh(change.path));
 * ```
 */
export const fs: SdkDomain<'fs'> = {
  /**
   * Discover visible roots, coarse root permissions, and runtime limits.
   * @returns Promise resolving to advisory filesystem discovery data
   */
  info(): Promise<FsInfo> {
    return requireDomain('fs').info();
  },

  /**
   * Ask the runtime to let the user select one file.
   * @param options  Optional picker hints
   * @returns Promise resolving to picked virtual filesystem paths
   */
  pickFile(options?: FsPickOptions): Promise<FsPickResult> {
    return requireDomain('fs').pickFile(options);
  },

  /**
   * Ask the runtime to let the user select one or more files.
   * @param options  Optional picker hints
   * @returns Promise resolving to picked virtual filesystem paths
   */
  pickFiles(options?: FsPickOptions): Promise<FsPickResult> {
    return requireDomain('fs').pickFiles(options);
  },

  /**
   * Ask the runtime to let the user select one directory.
   * @param options  Optional picker hints
   * @returns Promise resolving to picked virtual filesystem paths
   */
  pickDirectory(options?: FsPickOptions): Promise<FsPickResult> {
    return requireDomain('fs').pickDirectory(options);
  },

  /**
   * Ask the runtime to let the user select or name one file destination.
   * @param options  Optional picker hints
   * @returns Promise resolving to picked virtual filesystem paths
   */
  pickSaveFile(options?: FsPickOptions): Promise<FsPickResult> {
    return requireDomain('fs').pickSaveFile(options);
  },

  /**
   * Read coarse metadata for a visible file or directory.
   * @param path  Virtual absolute path of the entry
   * @returns Promise resolving to the entry metadata
   */
  stat(path: string): Promise<FsMetadata> {
    return requireDomain('fs').stat(path);
  },

  /**
   * List the direct children of a visible directory. Ordering is unspecified.
   * @param path  Virtual absolute path of the directory
   * @returns Promise resolving to the directory entries
   */
  list(path: string): Promise<FsDirectoryEntry[]> {
    return requireDomain('fs').list(path);
  },

  /**
   * Read bytes from a visible file.
   * @param path     Virtual absolute path of the file
   * @param options  Optional range read controls
   * @returns Promise resolving to the read result
   */
  read(path: string, options?: FsReadOptions): Promise<FsReadResult> {
    return requireDomain('fs').read(path, options);
  },

  /**
   * Write bytes to a visible file. `data` is RFC 4648 standard padded base64 text.
   * @param path     Virtual absolute path of the file
   * @param data     Decoded bytes encoded as standard padded base64 text
   * @param options  Optional write mode and preconditions
   * @returns Promise resolving to the write result
   */
  write(path: string, data: string, options?: FsWriteOptions): Promise<FsWriteResult> {
    return requireDomain('fs').write(path, data, options);
  },

  /**
   * Create a directory.
   * @param path     Virtual absolute path of the directory to create
   * @param options  Optional recursive parent creation
   * @returns Promise resolving once the runtime acknowledges the creation
   */
  mkdir(path: string, options?: FsMkdirOptions): Promise<void> {
    return requireDomain('fs').mkdir(path, options);
  },

  /**
   * Remove a file or directory.
   * @param path       Virtual absolute path of the entry to remove
   * @param recursive  Remove a non-empty directory and its authorized descendants
   * @returns Promise resolving once the runtime acknowledges the removal
   */
  remove(path: string, recursive?: boolean): Promise<void> {
    return requireDomain('fs').remove(path, recursive);
  },

  /**
   * Move or rename a file or directory.
   * @param fromPath  Virtual absolute source path
   * @param toPath    Virtual absolute destination path
   * @returns Promise resolving once the runtime acknowledges the move
   */
  move(fromPath: string, toPath: string): Promise<void> {
    return requireDomain('fs').move(fromPath, toPath);
  },

  /**
   * Start an advisory watch on a visible path.
   * @param path     Virtual absolute path to watch
   * @param options  Optional recursive descendant coverage
   * @returns Promise resolving to the runtime-generated watch id
   */
  watch(path: string, options?: FsWatchOptions): Promise<string> {
    return requireDomain('fs').watch(path, options);
  },

  /**
   * Stop a watch. Unknown ids may be treated as successful no-ops.
   * @param watchId  Runtime-generated watch id
   * @returns Promise resolving once the runtime acknowledges the request
   */
  unwatch(watchId: string): Promise<void> {
    return requireDomain('fs').unwatch(watchId);
  },

  /**
   * Register for runtime-pushed filesystem change events.
   * @param handler  Called with each advisory change
   * @returns A Subscription with `close()` to stop listening
   */
  onChanged(handler: (change: FsChange) => void): Subscription {
    return requireDomain('fs').onChanged(handler);
  },
};
