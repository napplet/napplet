/**
 * Napplet NAP fs domain entrypoint.
 *
 * @module
 */

/**
 * @napplet/nap/fs -- Shell-mediated virtual filesystem module (NAP-FS).
 *
 * A napplet discovers visible roots, inspects and lists entries, creates,
 * removes and moves them, and subscribes to advisory change events. The runtime
 * owns host paths, mounts, backing store, normalization, policy, and
 * authorization of every operation -- the napplet sees only virtual paths.
 *
 * Byte transfer (`read` / `write`) is not available. NAP-FS declares those
 * payloads as `bstr` but defines no encoding for them on NIP-5D's JSON
 * envelope, so shipping one would invent wire surface. Tracked upstream at
 * <https://github.com/napplet/naps/pull/88#issuecomment-5083402723>
 *
 * Exports typed message definitions for the fs domain, shim installer, SDK
 * helpers, and registers the `fs` domain with core dispatch on import.
 *
 * @example
 * ```ts
 * import { fsList, fsMkdir, fsWatch, fsOnChanged } from '@napplet/nap/fs';
 *
 * const entries = await fsList('/shared');
 * await fsMkdir('/shared/projects/new', { recursive: true });
 * const watchId = await fsWatch('/shared', { recursive: true });
 * const sub = fsOnChanged((change) => console.log(change.path, change.kind));
 * ```
 *
 * @packageDocumentation
 */

export { DOMAIN } from './types.js';

export type {
  FsPermission,
  FsEntryKind,
  FsChangeKind,
  FsError,
  FsRoot,
  FsLimits,
  FsInfo,
  FsMetadata,
  FsDirectoryEntry,
  FsMkdirOptions,
  FsWatchOptions,
  FsChange,
  FsMessage,
  FsInfoMessage,
  FsInfoResultMessage,
  FsStatMessage,
  FsStatResultMessage,
  FsListMessage,
  FsListResultMessage,
  FsMkdirMessage,
  FsMkdirResultMessage,
  FsRemoveMessage,
  FsRemoveResultMessage,
  FsMoveMessage,
  FsMoveResultMessage,
  FsWatchMessage,
  FsWatchResultMessage,
  FsUnwatchMessage,
  FsUnwatchResultMessage,
  FsChangedMessage,
  FsOutboundMessage,
  FsInboundMessage,
  FsNapMessage,
} from './types.js';

export {
  installFsShim,
  handleFsMessage,
  info,
  stat,
  list,
  mkdir,
  remove,
  move,
  watch,
  unwatch,
  onChanged,
} from './shim.js';

export {
  fsInfo,
  fsStat,
  fsList,
  fsMkdir,
  fsRemove,
  fsMove,
  fsWatch,
  fsUnwatch,
  fsOnChanged,
} from './sdk.js';

import { registerNap } from '@napplet/core';
import { DOMAIN } from './types.js';

/**
 * Register the fs domain with the core dispatch singleton.
 * Handler is a no-op placeholder -- the shell/shim provide real handlers.
 * Registration ensures dispatch.getRegisteredDomains() includes 'fs'.
 */
registerNap(DOMAIN, (_msg) => {
  /* Shell or shim replaces this handler at runtime */
});
