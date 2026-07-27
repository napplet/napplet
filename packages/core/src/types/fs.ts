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
 * Picker operations (`pickFile` / `pickFiles` / `pickDirectory` /
 * `pickSaveFile`) use pure JSON payloads and return runtime-exposed virtual
 * paths, so they are implemented here.
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
  | 'cancelled'
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

/** Advisory picker filter. Runtimes and napplets must not treat it as content validation. */
export interface FsAcceptRule {
  /** MIME type hint such as `text/plain`. */
  mime?: string;
  /** Extension hint such as `.md`. */
  extension?: string;
}

/** User-mediated picker options. Hints only -- never authority. */
export interface FsPickOptions {
  /** Requested permission intent. The runtime decides the actual returned permissions. */
  permissions?: FsPermission[];
  /** Advisory UI filters only. */
  accept?: FsAcceptRule[];
  /** Suggested destination file name for save pickers. */
  suggestedName?: string;
  /** Runtime-displayable description of the picker intent. */
  description?: string;
}

/** A file or directory selected by runtime-mediated user choice. */
export interface FsPickedEntry {
  /** Virtual absolute path exposed to this napplet. */
  path: string;
  /** Selected entry kind. */
  kind: 'file' | 'directory';
  /** Entry name within its virtual parent. */
  name: string;
  /** Permissions actually granted for the returned virtual path. */
  permissions: FsPermission[];
  /** Size in bytes, when the runtime discloses it. */
  size?: number;
  /** Last-modified timestamp, when the runtime discloses it. */
  modifiedAt?: number;
}

/** Result of a user-mediated picker request. Cancellation is an error, not an empty success. */
export interface FsPickResult {
  /** Selected entries exposed as virtual filesystem paths. */
  entries: FsPickedEntry[];
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
