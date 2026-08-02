import type { Subscription } from '../nostr.js';
import type { SerialEvent, SerialOpenRequest, SerialOpenResult } from '../serial.js';
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
} from '../fs.js';
import type {
  DmConversationPage,
  DmConversationQuery,
  DmMessage,
  DmMessagePage,
  DmMessageQuery,
  DmOk,
  DmSendRequest,
  DmSendResult,
  DmStatus,
  DmSubscribeRequest,
  DmSubscription,
} from '../dm.js';
import type {
  CommonActionResult,
  CommonFollowsResult,
  CommonNip19DecodeResult,
  CommonNip19EncodeInput,
  CommonNip19EncodeResult,
  CommonProfileResult,
  CommonProfileTarget,
  CommonReaction,
  CommonReportReason,
  CommonReportTarget,
} from '../common.js';

/**
 * Common social actions (NAP-COMMON): shell-mediated NIP-19 helpers, profile
 * lookup, follows, and signed social actions. The shell owns identity, consent,
 * event construction, signing, publishing, relay access, and NIP-19 handling.
 *
 * @example
 * ```ts
 * if (window.napplet.common) {
 *   const { pubkeys } = await window.napplet.common.follows();
 *   await window.napplet.common.react(noteId, '+');
 * }
 * ```
 */
export interface CommonApi {
  /**
   * Encode a supported public NIP-19 value. `nsec` is intentionally unsupported.
   * @param input  Structured NIP-19 encode input
   * @returns Promise resolving to the shell encode result
   */
  encodeNip19(input: CommonNip19EncodeInput): Promise<CommonNip19EncodeResult>;
  /**
   * Decode a supported public NIP-19 value. `nsec` is intentionally unsupported.
   * @param value  NIP-19 value to decode
   * @returns Promise resolving to normalized decoded fields
   */
  decodeNip19(value: string): Promise<CommonNip19DecodeResult>;
  /**
   * Resolve a profile by hex pubkey, npub, or nprofile.
   * @param target  Profile target
   * @returns Promise resolving to latest profile data when available
   */
  getProfile(target: CommonProfileTarget): Promise<CommonProfileResult>;
  /**
   * Return the shell user's followed pubkeys as hex.
   * @returns Promise resolving to followed pubkeys
   */
  follows(): Promise<CommonFollowsResult>;
  /**
   * Ask the shell to follow one or more npub targets.
   * @param pubkeys  Npub targets to follow
   * @returns Promise resolving to the action result
   */
  follow(...pubkeys: string[]): Promise<CommonActionResult>;
  /**
   * Ask the shell to unfollow one or more npub targets.
   * @param pubkeys  Npub targets to unfollow
   * @returns Promise resolving to the action result
   */
  unfollow(...pubkeys: string[]): Promise<CommonActionResult>;
  /**
   * React to a native Nostr event.
   * @param targetEventId     Event id to react to
   * @param reaction          Reaction content
   * @param customEmojiHref   Optional custom emoji URL
   * @returns Promise resolving to the action result
   */
  react(
    targetEventId: string,
    reaction: CommonReaction,
    customEmojiHref?: string,
  ): Promise<CommonActionResult>;
  /**
   * Report an event or pubkey with a NIP-56 reason.
   * @param target  Structured report target
   * @param reason  NIP-56 report reason
   * @param text    Report text
   * @returns Promise resolving to the action result
   */
  report(
    target: CommonReportTarget,
    reason: CommonReportReason,
    text: string,
  ): Promise<CommonActionResult>;
}

/**
 * Runtime-mediated serial device access (NAP-SERIAL): the napplet asks the shell
 * to select and open a user-approved serial session, writes byte arrays to that
 * session, and receives shell-pushed state/data/close events. The shell owns
 * device selection, permissions, raw port handles, streams, OS paths, read loops,
 * and lifecycle policy.
 *
 * @example
 * ```ts
 * if (window.napplet.serial) {
 *   const { session } = await window.napplet.serial.open({ options: { baudRate: 115200 } });
 *   await window.napplet.serial.write(session.id, [112, 105, 110, 103, 10]);
 * }
 * ```
 */
export interface SerialApi {
  /**
   * Ask the runtime to select and open a serial session.
   * @param request  Filters, options, and optional chooser label
   * @returns Promise resolving to the runtime-assigned serial open result
   */
  open(request: SerialOpenRequest): Promise<SerialOpenResult>;
  /**
   * Write bytes to an open serial session.
   * @param sessionId  Runtime-assigned serial session id
   * @param data       Byte values to write
   * @returns Promise resolving after the runtime acknowledges the write
   */
  write(sessionId: string, data: Uint8Array | number[]): Promise<void>;
  /**
   * Close an open serial session.
   * @param sessionId  Runtime-assigned serial session id
   * @param reason     Optional reason for the close request
   * @returns Promise resolving after the runtime acknowledges the close
   */
  close(sessionId: string, reason?: string): Promise<void>;
  /**
   * Register for shell-pushed serial events.
   * @param handler  Called with each serial event
   * @returns A Subscription with `close()` to stop listening
   */
  onEvent(handler: (event: SerialEvent) => void): Subscription;
}

/**
 * Shell-mediated virtual filesystem access (NAP-FS): the napplet sees only
 * virtual paths, directory entries, coarse metadata, user-mediated picker
 * results, and advisory change events. The runtime owns host paths, mounts,
 * backing store, policy, and authorization of every operation.
 *
 * `info()` is advisory discovery, not an authorization token -- permissions can
 * change mid-session and any operation can still fail, so handle rejections
 * even when `info()` advertised a matching permission.
 *
 * @example
 * ```ts
 * if (window.napplet.fs) {
 *   const { roots } = await window.napplet.fs.info();
 *   const picked = await window.napplet.fs.pickFile({ accept: [{ extension: '.md' }] });
 *   const bytes = await window.napplet.fs.read(picked.entries[0].path);
 *   await window.napplet.fs.write('/shared/copy.txt', bytes.data, { mode: 'replace' });
 *   const entries = await window.napplet.fs.list('/shared');
 *   const watchId = await window.napplet.fs.watch('/shared', { recursive: true });
 *   window.napplet.fs.onChanged((change) => refresh(change.path));
 * }
 * ```
 */
export interface FsApi {
  /**
   * Discover visible roots, coarse root permissions, and runtime limits.
   * @returns Promise resolving to advisory filesystem discovery data
   */
  info(): Promise<FsInfo>;
  /**
   * Ask the runtime to let the user select one file.
   * @param options  Optional picker hints
   * @returns Promise resolving to picked virtual filesystem paths
   */
  pickFile(options?: FsPickOptions): Promise<FsPickResult>;
  /**
   * Ask the runtime to let the user select one or more files.
   * @param options  Optional picker hints
   * @returns Promise resolving to picked virtual filesystem paths
   */
  pickFiles(options?: FsPickOptions): Promise<FsPickResult>;
  /**
   * Ask the runtime to let the user select one directory.
   * @param options  Optional picker hints
   * @returns Promise resolving to picked virtual filesystem paths
   */
  pickDirectory(options?: FsPickOptions): Promise<FsPickResult>;
  /**
   * Ask the runtime to let the user select or name one file destination.
   * @param options  Optional picker hints
   * @returns Promise resolving to picked virtual filesystem paths
   */
  pickSaveFile(options?: FsPickOptions): Promise<FsPickResult>;
  /**
   * Read coarse metadata for a visible file or directory.
   * @param path  Virtual absolute path of the entry
   * @returns Promise resolving to the entry metadata
   */
  stat(path: string): Promise<FsMetadata>;
  /**
   * List the direct children of a visible directory. Ordering is unspecified.
   * @param path  Virtual absolute path of the directory
   * @returns Promise resolving to the directory entries
   */
  list(path: string): Promise<FsDirectoryEntry[]>;
  /**
   * Read bytes from a visible file. `data` is RFC 4648 standard padded base64 text.
   * @param path     Virtual absolute path of the file
   * @param options  Optional range read controls
   * @returns Promise resolving to the read result
   */
  read(path: string, options?: FsReadOptions): Promise<FsReadResult>;
  /**
   * Write bytes to a visible file. `data` is RFC 4648 standard padded base64 text.
   * @param path     Virtual absolute path of the file
   * @param data     Decoded bytes encoded as standard padded base64 text
   * @param options  Optional write mode and preconditions
   * @returns Promise resolving to the write result
   */
  write(path: string, data: string, options?: FsWriteOptions): Promise<FsWriteResult>;
  /**
   * Create a directory.
   * @param path     Virtual absolute path of the directory to create
   * @param options  Optional recursive parent creation
   * @returns Promise resolving once the runtime acknowledges the creation
   */
  mkdir(path: string, options?: FsMkdirOptions): Promise<void>;
  /**
   * Remove a file or directory.
   * @param path       Virtual absolute path of the entry to remove
   * @param recursive  Remove a non-empty directory and its authorized descendants
   * @returns Promise resolving once the runtime acknowledges the removal
   */
  remove(path: string, recursive?: boolean): Promise<void>;
  /**
   * Move or rename a file or directory.
   * @param fromPath  Virtual absolute source path
   * @param toPath    Virtual absolute destination path
   * @returns Promise resolving once the runtime acknowledges the move
   */
  move(fromPath: string, toPath: string): Promise<void>;
  /**
   * Start an advisory watch on a visible path.
   * @param path     Virtual absolute path to watch
   * @param options  Optional recursive descendant coverage
   * @returns Promise resolving to the runtime-generated watch id
   */
  watch(path: string, options?: FsWatchOptions): Promise<string>;
  /**
   * Stop a watch. Unknown ids may be treated as successful no-ops.
   * @param watchId  Runtime-generated watch id
   * @returns Promise resolving once the runtime acknowledges the request
   */
  unwatch(watchId: string): Promise<void>;
  /**
   * Register for runtime-pushed filesystem change events.
   * @param handler  Called with each advisory change
   * @returns A Subscription with `close()` to stop listening
   */
  onChanged(handler: (change: FsChange) => void): Subscription;
}

/**
 * Runtime-mediated direct messages (NAP-DM): the napplet presents DM UI while
 * the shell owns signing, encryption, relay routing, storage, key/session
 * state, and policy.
 *
 * @example
 * ```ts
 * if (window.napplet.dm) {
 *   const status = await window.napplet.dm.status();
 *   if (status.available) {
 *     const { conversations } = await window.napplet.dm.conversations({ limit: 20 });
 *     const sub = await window.napplet.dm.subscribe({ conversationId: conversations[0]?.id });
 *     window.napplet.dm.onMessage((message) => render(message));
 *     await window.napplet.dm.unsubscribe(sub.subscriptionId);
 *   }
 * }
 * ```
 */
export interface DmApi {
  /**
   * Get current DM availability and advisory runtime implementation labels.
   * @returns Promise resolving to the runtime DM status
   */
  status(): Promise<DmStatus>;
  /**
   * Fetch normalized conversation summaries visible to this napplet.
   * @param query  Optional cursor and limit
   * @returns Promise resolving to a page of conversations
   */
  conversations(query?: DmConversationQuery): Promise<DmConversationPage>;
  /**
   * Fetch normalized message history for one conversation.
   * @param query  Conversation id plus optional cursor and limit
   * @returns Promise resolving to a page of messages
   */
  messages(query: DmMessageQuery): Promise<DmMessagePage>;
  /**
   * Ask the runtime to send a direct message.
   * @param request  Recipients, content, and optional conversation/client ids
   * @returns Promise resolving to the normalized sent message result
   */
  send(request: DmSendRequest): Promise<DmSendResult>;
  /**
   * Start live delivery for one conversation or all visible conversations.
   * @param request  Optional conversation scope
   * @returns Promise resolving to the runtime subscription id
   */
  subscribe(request?: DmSubscribeRequest): Promise<DmSubscription>;
  /**
   * Stop a live delivery subscription.
   * @param subscriptionId  Runtime subscription id from subscribe()
   * @returns Promise resolving to the runtime acknowledgement
   */
  unsubscribe(subscriptionId: string): Promise<DmOk>;
  /**
   * Register for shell-pushed `dm.message` deliveries.
   * @param handler  Called with each message and its runtime subscription id
   * @returns A Subscription with `close()` to stop listening
   */
  onMessage(handler: (message: DmMessage, subscriptionId: string) => void): Subscription;
}
