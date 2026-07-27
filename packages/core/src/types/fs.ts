/**
 * NAP-FS schema types for shell-mediated virtual filesystem access.
 *
 * Non-normative note -- the canonical definition lives in napplet/naps#88:
 * <https://github.com/napplet/naps/pull/88>
 *
 * Byte transfer (`read` / `write`) is intentionally absent from this module.
 * NAP-FS declares those payloads as CBOR `bstr`, but does not define how a
 * `bstr` is encoded on NIP-5D's JSON envelope -- the spec's own examples use a
 * `<bytes>` placeholder rather than a concrete encoding. Choosing one here
 * (base64, byte array, or otherwise) would invent wire surface that no other
 * implementation could interoperate with, so the question is deferred upstream:
 * <https://github.com/napplet/naps/pull/88#issuecomment-5083402723>
 *
 * `FsLimits.maxReadBytes` and `FsLimits.maxWriteBytes` are retained: the spec
 * makes them required fields of `FsInfo`, and they are advisory discovery data
 * rather than operations.
 */

/** A coarse permission a runtime may advertise for a visible root or entry. */
export type FsPermission = 'read' | 'write' | 'create' | 'delete' | 'list' | 'watch';

/** The kind of a filesystem entry. `unknown` grants no implied operation. */
export type FsEntryKind = 'file' | 'directory' | 'unknown';

/** The kind of change reported by an advisory watch event. */
export type FsChangeKind = 'created' | 'modified' | 'deleted' | 'moved' | 'unknown';

/** Closed set of NAP-FS error reasons. Never widen this to `string`. */
export type FsError =
  | 'not-found'
  | 'already-exists'
  | 'not-a-file'
  | 'not-a-directory'
  | 'invalid-path'
  | 'permission-denied'
  | 'policy-denied'
  | 'quota-exceeded'
  | 'too-large'
  | 'unsupported'
  | 'conflict'
  | 'io-error';

/** A runtime-curated root visible to the napplet. Names and descriptions are safe-to-disclose labels, never host paths. */
export interface FsRoot {
  /** Virtual absolute path of the root. */
  path: string;
  /** Runtime-curated display label. */
  name: string;
  /** Coarse advisory permissions for this root. */
  permissions: FsPermission[];
  /** Optional runtime-curated description. */
  description?: string;
}

/** Runtime-advertised operational limits. Advisory discovery data, not authorization. */
export interface FsLimits {
  /** Maximum bytes a single read may request. */
  maxReadBytes: number;
  /** Maximum bytes a single write may carry. */
  maxWriteBytes: number;
  /** Maximum concurrently active watches, when advertised. */
  maxWatchCount?: number;
  /** Maximum concurrent in-flight requests, when advertised. */
  maxInFlightRequests?: number;
  /** Maximum aggregate in-flight bytes, when advertised. */
  maxInFlightBytes?: number;
}

/** Visible roots and runtime limits. Advisory discovery only -- never an authorization token. */
export interface FsInfo {
  /** Roots visible to this napplet. */
  roots: FsRoot[];
  /** Runtime-advertised operational limits. */
  limits: FsLimits;
}

/** Coarse metadata for a visible file or directory. Omits host-specific identifiers. */
export interface FsMetadata {
  /** Virtual absolute path of the entry. */
  path: string;
  /** The kind of entry. */
  kind: FsEntryKind;
  /** Size in bytes, when the runtime discloses it. */
  size?: number;
  /** Last-modified timestamp, when the runtime discloses it. */
  modifiedAt?: number;
  /** Creation timestamp, when the runtime discloses it. */
  createdAt?: number;
  /** Coarse advisory permissions for this entry. */
  permissions?: FsPermission[];
  /** Opaque write-precondition token. Compare only for equality; infer no ordering or content. */
  revision?: string;
}

/** A direct child of a listed directory. Result ordering is unspecified. */
export interface FsDirectoryEntry {
  /** Entry name within its parent directory. */
  name: string;
  /** Virtual absolute path of the entry. */
  path: string;
  /** The kind of entry. */
  kind: FsEntryKind;
  /** Size in bytes, when the runtime discloses it. */
  size?: number;
  /** Last-modified timestamp, when the runtime discloses it. */
  modifiedAt?: number;
}

/** Options for directory creation. */
export interface FsMkdirOptions {
  /** Create missing parents within the napplet's authorized view. */
  recursive?: boolean;
}

/** Options for starting an advisory watch. */
export interface FsWatchOptions {
  /** Watch visible descendants rather than only direct children. */
  recursive?: boolean;
}

/** An advisory change signal. Events may be coalesced, duplicated, reordered, or dropped -- re-read after receiving one. */
export interface FsChange {
  /** The watch that produced this event. */
  watchId: string;
  /** Virtual absolute path the change applies to. */
  path: string;
  /** The kind of change. */
  kind: FsChangeKind;
  /** Previous path, when the change is a move. */
  fromPath?: string;
}
