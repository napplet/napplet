/**
 * Napplet NAP fs types entrypoint.
 *
 * @module
 */

/**
 * @napplet/nap/fs -- Shell-mediated virtual filesystem message types for the JSON envelope wire protocol.
 *
 * NAP-FS gives a napplet access to a runtime-owned virtual filesystem. The
 * napplet sees only virtual paths, directory entries, coarse metadata, and
 * advisory change events. The runtime owns host paths, mounts, backing store,
 * normalization, policy, and authorization of every operation.
 *
 * Defines the message types exchanged between napplet and shell:
 * - Napplet -> Shell: info, pickFile, pickFiles, pickDirectory, pickSaveFile,
 *   stat, list, mkdir, remove, move, watch, unwatch
 * - Shell -> Napplet: the matching results plus runtime-pushed changed
 *
 * Byte transfer (`read` / `write`) is absent: NAP-FS declares those payloads as
 * `bstr` but defines no encoding for them on NIP-5D's JSON envelope, so picking
 * one would invent wire surface. Deferred upstream at
 * <https://github.com/napplet/naps/pull/88#issuecomment-5083402723>
 *
 * All types form a discriminated union on the `type` field.
 */

// Names the message interfaces below reference.
import type {
  NappletMessage,
  FsChange,
  FsDirectoryEntry,
  FsError,
  FsInfo,
  FsMetadata,
  FsMkdirOptions,
  FsPickOptions,
  FsPickResult,
  FsWatchOptions,
} from '@napplet/core';

/** The NAP domain name for fs messages. */
export const DOMAIN = 'fs' as const;

// The NAP-FS schema types, re-exported so consumers can import them from this subpath.
export type {
  FsPermission,
  FsEntryKind,
  FsChangeKind,
  FsError,
  FsRoot,
  FsLimits,
  FsAcceptRule,
  FsPickOptions,
  FsPickedEntry,
  FsPickResult,
  FsInfo,
  FsMetadata,
  FsDirectoryEntry,
  FsMkdirOptions,
  FsWatchOptions,
  FsChange,
} from '@napplet/core';

/**
 * Base interface for all fs NAP messages.
 * Concrete message types narrow the `type` field to specific literals.
 */
export interface FsMessage extends NappletMessage {
  /** Message type in "fs.<action>" format. */
  type: `fs.${string}`;
}

/** Discover visible roots, coarse permissions, and runtime limits. */
export interface FsInfoMessage extends FsMessage {
  type: 'fs.info';
  /** Correlation ID for this request. */
  id: string;
}

/** Result of a `fs.info` request. */
export interface FsInfoResultMessage extends FsMessage {
  type: 'fs.info.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Advisory discovery data. Absent when `error` is present. */
  info?: FsInfo;
  /** Error reason when the runtime could not answer. */
  error?: FsError;
}

/** Ask the runtime to let the user select one file. */
export interface FsPickFileMessage extends FsMessage {
  type: 'fs.pickFile';
  /** Correlation ID for this request. */
  id: string;
  /** Optional picker hints. */
  options?: FsPickOptions;
}

/** Result of a `fs.pickFile` request. */
export interface FsPickFileResultMessage extends FsMessage {
  type: 'fs.pickFile.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Picked virtual path. Absent when `error` is present. */
  result?: FsPickResult;
  /** Error reason, including `cancelled` when the user cancels. */
  error?: FsError;
}

/** Ask the runtime to let the user select one or more files. */
export interface FsPickFilesMessage extends FsMessage {
  type: 'fs.pickFiles';
  /** Correlation ID for this request. */
  id: string;
  /** Optional picker hints. */
  options?: FsPickOptions;
}

/** Result of a `fs.pickFiles` request. */
export interface FsPickFilesResultMessage extends FsMessage {
  type: 'fs.pickFiles.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Picked virtual paths. Absent when `error` is present. */
  result?: FsPickResult;
  /** Error reason, including `cancelled` when the user cancels. */
  error?: FsError;
}

/** Ask the runtime to let the user select one directory. */
export interface FsPickDirectoryMessage extends FsMessage {
  type: 'fs.pickDirectory';
  /** Correlation ID for this request. */
  id: string;
  /** Optional picker hints. */
  options?: FsPickOptions;
}

/** Result of a `fs.pickDirectory` request. */
export interface FsPickDirectoryResultMessage extends FsMessage {
  type: 'fs.pickDirectory.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Picked virtual path. Absent when `error` is present. */
  result?: FsPickResult;
  /** Error reason, including `cancelled` when the user cancels. */
  error?: FsError;
}

/** Ask the runtime to let the user select or name one file destination. */
export interface FsPickSaveFileMessage extends FsMessage {
  type: 'fs.pickSaveFile';
  /** Correlation ID for this request. */
  id: string;
  /** Optional picker hints. */
  options?: FsPickOptions;
}

/** Result of a `fs.pickSaveFile` request. */
export interface FsPickSaveFileResultMessage extends FsMessage {
  type: 'fs.pickSaveFile.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Picked virtual path. Absent when `error` is present. */
  result?: FsPickResult;
  /** Error reason, including `cancelled` when the user cancels. */
  error?: FsError;
}

/** Read coarse metadata for a visible entry. */
export interface FsStatMessage extends FsMessage {
  type: 'fs.stat';
  /** Correlation ID for this request. */
  id: string;
  /** Virtual absolute path of the entry. */
  path: string;
}

/** Result of a `fs.stat` request. */
export interface FsStatResultMessage extends FsMessage {
  type: 'fs.stat.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Entry metadata. Absent when `error` is present. */
  metadata?: FsMetadata;
  /** Error reason when the runtime could not stat the entry. */
  error?: FsError;
}

/** List the direct children of a visible directory. */
export interface FsListMessage extends FsMessage {
  type: 'fs.list';
  /** Correlation ID for this request. */
  id: string;
  /** Virtual absolute path of the directory. */
  path: string;
}

/** Result of a `fs.list` request. */
export interface FsListResultMessage extends FsMessage {
  type: 'fs.list.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Directory entries in unspecified order. Absent when `error` is present. */
  entries?: FsDirectoryEntry[];
  /** Error reason when the runtime could not list the directory. */
  error?: FsError;
}

/** Create a directory. */
export interface FsMkdirMessage extends FsMessage {
  type: 'fs.mkdir';
  /** Correlation ID for this request. */
  id: string;
  /** Virtual absolute path of the directory to create. */
  path: string;
  /** Optional recursive parent creation. */
  options?: FsMkdirOptions;
}

/** Result of a `fs.mkdir` request. */
export interface FsMkdirResultMessage extends FsMessage {
  type: 'fs.mkdir.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Error reason when the runtime could not create the directory. */
  error?: FsError;
}

/** Remove a file or directory. */
export interface FsRemoveMessage extends FsMessage {
  type: 'fs.remove';
  /** Correlation ID for this request. */
  id: string;
  /** Virtual absolute path of the entry to remove. */
  path: string;
  /** Remove a non-empty directory and its authorized descendants. Top-level, not nested in options. */
  recursive?: boolean;
}

/** Result of a `fs.remove` request. */
export interface FsRemoveResultMessage extends FsMessage {
  type: 'fs.remove.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Error reason when the runtime could not remove the entry. */
  error?: FsError;
}

/** Move or rename a file or directory. */
export interface FsMoveMessage extends FsMessage {
  type: 'fs.move';
  /** Correlation ID for this request. */
  id: string;
  /** Virtual absolute source path. */
  fromPath: string;
  /** Virtual absolute destination path. */
  toPath: string;
}

/** Result of a `fs.move` request. */
export interface FsMoveResultMessage extends FsMessage {
  type: 'fs.move.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Error reason when the runtime could not move the entry. */
  error?: FsError;
}

/** Start an advisory watch on a visible path. */
export interface FsWatchMessage extends FsMessage {
  type: 'fs.watch';
  /** Correlation ID for this request. */
  id: string;
  /** Virtual absolute path to watch. */
  path: string;
  /** Optional recursive descendant coverage. */
  options?: FsWatchOptions;
}

/** Result of a `fs.watch` request. */
export interface FsWatchResultMessage extends FsMessage {
  type: 'fs.watch.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Runtime-generated watch id. Absent when `error` is present. */
  watchId?: string;
  /** Error reason when the runtime could not start the watch. */
  error?: FsError;
}

/** Stop a watch. */
export interface FsUnwatchMessage extends FsMessage {
  type: 'fs.unwatch';
  /** Correlation ID for this request. */
  id: string;
  /** Runtime-generated watch id. */
  watchId: string;
}

/** Result of a `fs.unwatch` request. */
export interface FsUnwatchResultMessage extends FsMessage {
  type: 'fs.unwatch.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Error reason when the runtime could not stop the watch. */
  error?: FsError;
}

/** Runtime-pushed advisory change event. Carries no correlation id. */
export interface FsChangedMessage extends FsMessage {
  type: 'fs.changed';
  /** The change signal. Advisory only -- re-read after receiving it. */
  change: FsChange;
}

/** Napplet -> Shell fs messages. */
export type FsOutboundMessage =
  | FsInfoMessage
  | FsPickFileMessage
  | FsPickFilesMessage
  | FsPickDirectoryMessage
  | FsPickSaveFileMessage
  | FsStatMessage
  | FsListMessage
  | FsMkdirMessage
  | FsRemoveMessage
  | FsMoveMessage
  | FsWatchMessage
  | FsUnwatchMessage;

/** Shell -> Napplet fs messages. */
export type FsInboundMessage =
  | FsInfoResultMessage
  | FsPickFileResultMessage
  | FsPickFilesResultMessage
  | FsPickDirectoryResultMessage
  | FsPickSaveFileResultMessage
  | FsStatResultMessage
  | FsListResultMessage
  | FsMkdirResultMessage
  | FsRemoveResultMessage
  | FsMoveResultMessage
  | FsWatchResultMessage
  | FsUnwatchResultMessage
  | FsChangedMessage;

/** All fs NAP message types (discriminated union on `type` field). */
export type FsNapMessage = FsOutboundMessage | FsInboundMessage;
