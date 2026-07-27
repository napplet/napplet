/**
 * @napplet/sdk -- Link, lists, common, BLE, serial, and fs wrapper objects.
 *
 * @packageDocumentation
 */

import type {
  LinkOpenOptions,
  LinkOpenResult,
  NappletGlobal,
  ListItem,
  ListMutationResult,
  ListOptions,
  ListRef,
  ListSupport,
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
  CountFilter,
  CountOptions,
  CountResult,
  BleAttribute,
  BleEvent,
  BleOpenRequest,
  BleOpenResult,
  BleService,
  BleWriteOptions,
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
  SerialEvent,
  SerialOpenRequest,
  SerialOpenResult,
  FsChange,
  FsDirectoryEntry,
  FsInfo,
  FsMetadata,
  FsMkdirOptions,
  FsWatchOptions,
  Subscription,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';

type SdkDomain<K extends keyof NappletGlobal> = NonNullable<NappletGlobal[K]>;

/**
 * Shell-mediated link opening (NAP-LINK): ask the shell to open an external URL
 * for user-visible navigation. The shell owns prompting, policy, opener
 * isolation, and browser context.
 *
 * @example
 * ```ts
 * import { link } from '@napplet/sdk';
 *
 * const result = await link.open('https://example.com/post/123', { label: 'Read post' });
 * ```
 */
export const link: SdkDomain<'link'> = {
  /**
   * Request that the shell open an external URL for the user.
   * @param url      Absolute URL to open
   * @param options  Optional prompt/display hints
   * @returns Promise resolving to the shell's open/deny status
   */
  open(url: string, options?: LinkOpenOptions): Promise<LinkOpenResult> {
    return requireDomain('link').open(url, options);
  },
};

/**
 * Runtime-mediated event counts (NAP-COUNT): ask the runtime to count NIP-01
 * filter matches without returning matching event payloads. The runtime owns
 * relay selection, NIP-45 COUNT support, indexing, aggregation, approximation,
 * and refusal policy.
 *
 * @example
 * ```ts
 * import { count } from '@napplet/sdk';
 *
 * const result = await count.query({ kinds: [7], '#e': [eventId] });
 * ```
 */
export const count: SdkDomain<'count'> = {
  /**
   * Count events matching one or more NIP-01 filters.
   * @param filters  One NIP-01 filter or a non-empty array of filters
   * @param options  Optional approximation and HyperLogLog hints
   * @returns Promise resolving to the runtime count result
   */
  query(filters: CountFilter | CountFilter[], options?: CountOptions): Promise<CountResult> {
    return requireDomain('count').query(filters, options);
  },
};

/**
 * Runtime-mediated NIP-51 list mutations (NAP-LISTS): add or remove semantic
 * items from supported NIP-51 lists while the runtime owns lookup, merge,
 * encryption, signing, and publishing.
 *
 * @example
 * ```ts
 * import { lists } from '@napplet/sdk';
 *
 * await lists.add({ type: 'mute-list' }, [
 *   { itemType: 'pubkey', value: 'abc123...' },
 * ]);
 * ```
 */
export const lists: SdkDomain<'lists'> = {
  /**
   * Return the NIP-51 list kinds/types this runtime supports.
   * @returns Promise resolving to supported list descriptions
   */
  supported(): Promise<ListSupport[]> {
    return requireDomain('lists').supported();
  },

  /**
   * Add items to a runtime-supported NIP-51 list.
   * @param list     List reference by kind or derived type
   * @param items    Items to add
   * @param options  Optional create/metadata hints
   */
  add(list: ListRef, items: ListItem[], options?: ListOptions): Promise<ListMutationResult> {
    return requireDomain('lists').add(list, items, options);
  },

  /**
   * Remove items from a runtime-supported NIP-51 list.
   * @param list     List reference by kind or derived type
   * @param items    Items to remove
   * @param options  Optional runtime hints
   */
  remove(list: ListRef, items: ListItem[], options?: ListOptions): Promise<ListMutationResult> {
    return requireDomain('lists').remove(list, items, options);
  },
};

/**
 * Common social actions (NAP-COMMON): shell-mediated public NIP-19 helpers,
 * profile lookup, follows, follow/unfollow, reactions, and reports. The shell
 * owns identity, consent, event construction, signing, publishing, relay access,
 * and NIP-19 handling.
 *
 * @example
 * ```ts
 * import { common } from '@napplet/sdk';
 *
 * const { pubkeys } = await common.follows();
 * await common.react(noteId, '+');
 * ```
 */
export const common: SdkDomain<'common'> = {
  /**
   * Encode a supported public NIP-19 value.
   * @param input  Structured NIP-19 encode input
   * @returns Promise resolving to the shell encode result
   */
  encodeNip19(input: CommonNip19EncodeInput): Promise<CommonNip19EncodeResult> {
    return requireDomain('common').encodeNip19(input);
  },

  /**
   * Decode a supported public NIP-19 value.
   * @param value  NIP-19 value to decode
   * @returns Promise resolving to normalized decoded fields
   */
  decodeNip19(value: string): Promise<CommonNip19DecodeResult> {
    return requireDomain('common').decodeNip19(value);
  },

  /**
   * Resolve a profile by hex pubkey, npub, or nprofile.
   * @param target  Profile target
   * @returns Promise resolving to latest profile data when available
   */
  getProfile(target: CommonProfileTarget): Promise<CommonProfileResult> {
    return requireDomain('common').getProfile(target);
  },

  /**
   * Return the shell user's followed pubkeys as hex.
   * @returns Promise resolving to followed pubkeys
   */
  follows(): Promise<CommonFollowsResult> {
    return requireDomain('common').follows();
  },

  /**
   * Ask the shell to follow one or more npub targets.
   * @param pubkeys  Npub targets to follow
   * @returns Promise resolving to the action result
   */
  follow(...pubkeys: string[]): Promise<CommonActionResult> {
    return requireDomain('common').follow(...pubkeys);
  },

  /**
   * Ask the shell to unfollow one or more npub targets.
   * @param pubkeys  Npub targets to unfollow
   * @returns Promise resolving to the action result
   */
  unfollow(...pubkeys: string[]): Promise<CommonActionResult> {
    return requireDomain('common').unfollow(...pubkeys);
  },

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
  ): Promise<CommonActionResult> {
    return requireDomain('common').react(targetEventId, reaction, customEmojiHref);
  },

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
  ): Promise<CommonActionResult> {
    return requireDomain('common').report(target, reason, text);
  },
};

/**
 * Runtime-mediated Bluetooth LE/GATT sessions (NAP-BLE): ask the shell to
 * select a user-approved BLE device, expose opaque sessions and GATT
 * attributes, and receive shell-pushed state/notification/close events. The
 * shell owns chooser UI, permissions, device handles, lifecycle, and policy.
 *
 * @example
 * ```ts
 * import { ble } from '@napplet/sdk';
 *
 * const { session } = await ble.open({ acceptAllDevices: true });
 * const services = await ble.services(session.id);
 * ```
 */
export const ble: SdkDomain<'ble'> = {
  /**
   * Ask the runtime to select and open a BLE session.
   * @param request  Device selection and optional service request
   * @returns Promise resolving to the runtime-assigned BLE open result
   */
  open(request: BleOpenRequest): Promise<BleOpenResult> {
    return requireDomain('ble').open(request);
  },

  /**
   * List exposed GATT services for a session.
   * @param sessionId  Runtime-assigned BLE session id
   * @returns Promise resolving to exposed services
   */
  services(sessionId: string): Promise<BleService[]> {
    return requireDomain('ble').services(sessionId);
  },

  /**
   * Read a characteristic or descriptor value.
   * @param sessionId  Runtime-assigned BLE session id
   * @param target     GATT attribute target
   * @returns Promise resolving to bytes
   */
  read(sessionId: string, target: BleAttribute): Promise<number[]> {
    return requireDomain('ble').read(sessionId, target);
  },

  /**
   * Write bytes to a characteristic or descriptor.
   * @param sessionId  Runtime-assigned BLE session id
   * @param target     GATT attribute target
   * @param data       Byte values to write
   * @param options    Optional write mode preference
   * @returns Promise resolving after the runtime acknowledges the write
   */
  write(
    sessionId: string,
    target: BleAttribute,
    data: number[],
    options?: BleWriteOptions,
  ): Promise<void> {
    return requireDomain('ble').write(sessionId, target, data, options);
  },

  /**
   * Start notifications or indications for a characteristic.
   * @param sessionId  Runtime-assigned BLE session id
   * @param target     GATT characteristic target
   */
  subscribe(sessionId: string, target: BleAttribute): Promise<void> {
    return requireDomain('ble').subscribe(sessionId, target);
  },

  /**
   * Stop notifications or indications for a characteristic.
   * @param sessionId  Runtime-assigned BLE session id
   * @param target     GATT characteristic target
   */
  unsubscribe(sessionId: string, target: BleAttribute): Promise<void> {
    return requireDomain('ble').unsubscribe(sessionId, target);
  },

  /**
   * Close an open BLE session.
   * @param sessionId  Runtime-assigned BLE session id
   * @param reason     Optional reason for the close request
   */
  close(sessionId: string, reason?: string): Promise<void> {
    return requireDomain('ble').close(sessionId, reason);
  },

  /**
   * Register for shell-pushed BLE events.
   * @param handler  Called with each BLE event
   * @returns A Subscription with `close()` to stop listening
   */
  onEvent(handler: (event: BleEvent) => void): Subscription {
    return requireDomain('ble').onEvent(handler);
  },
};

/**
 * Runtime-mediated serial device access (NAP-SERIAL): ask the shell to select
 * and open a user-approved serial session, write byte arrays to that session,
 * and receive shell-pushed state/data/close events. The shell owns raw port
 * handles, streams, OS paths, permissions, read loops, and lifecycle policy.
 *
 * @example
 * ```ts
 * import { serial } from '@napplet/sdk';
 *
 * const { session } = await serial.open({ options: { baudRate: 115200 } });
 * await serial.write(session.id, [112, 105, 110, 103, 10]);
 * ```
 */
export const serial: SdkDomain<'serial'> = {
  /**
   * Ask the runtime to select and open a serial session.
   * @param request  Filters, options, and optional chooser label
   * @returns Promise resolving to the runtime-assigned serial open result
   */
  open(request: SerialOpenRequest): Promise<SerialOpenResult> {
    return requireDomain('serial').open(request);
  },

  /**
   * Write bytes to an open serial session.
   * @param sessionId  Runtime-assigned serial session id
   * @param data       Byte values to write
   * @returns Promise resolving after the runtime acknowledges the write
   */
  write(sessionId: string, data: Uint8Array | number[]): Promise<void> {
    return requireDomain('serial').write(sessionId, data);
  },

  /**
   * Close an open serial session.
   * @param sessionId  Runtime-assigned serial session id
   * @param reason     Optional reason for the close request
   * @returns Promise resolving after the runtime acknowledges the close
   */
  close(sessionId: string, reason?: string): Promise<void> {
    return requireDomain('serial').close(sessionId, reason);
  },

  /**
   * Register for shell-pushed serial events.
   * @param handler  Called with each serial event
   * @returns A Subscription with `close()` to stop listening
   */
  onEvent(handler: (event: SerialEvent) => void): Subscription {
    return requireDomain('serial').onEvent(handler);
  },
};

/**
 * Shell-mediated virtual filesystem access (NAP-FS): discover visible roots,
 * inspect and list entries, create, remove and move them, and subscribe to
 * advisory change events. The runtime owns host paths, mounts, backing store,
 * normalization, policy, and authorization -- the napplet sees only virtual
 * paths.
 *
 * `info()` is advisory discovery, not an authorization token: handle failures
 * even when it advertised a matching permission.
 *
 * Byte transfer (`read` / `write`) is not available -- NAP-FS declares those
 * payloads as `bstr` without defining a JSON-envelope encoding. Deferred at
 * <https://github.com/napplet/naps/pull/88#issuecomment-5083402723>
 *
 * @example
 * ```ts
 * import { fs } from '@napplet/sdk';
 *
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

/**
 * Runtime-mediated direct messages (NAP-DM): present DM UI while the runtime
 * owns signing, encryption, relay routing, storage, key/session state, and
 * policy.
 *
 * @example
 * ```ts
 * import { dm } from '@napplet/sdk';
 *
 * const { conversations } = await dm.conversations({ limit: 20 });
 * dm.onMessage((message) => render(message));
 * ```
 */
export const dm: SdkDomain<'dm'> = {
  /**
   * Get current DM availability and advisory runtime labels.
   * @returns Promise resolving to the runtime DM status
   */
  status(): Promise<DmStatus> {
    return requireDomain('dm').status();
  },

  /**
   * Fetch normalized conversations visible to this napplet.
   * @param query  Optional cursor and limit
   * @returns Promise resolving to a page of conversations
   */
  conversations(query?: DmConversationQuery): Promise<DmConversationPage> {
    return requireDomain('dm').conversations(query);
  },

  /**
   * Fetch normalized message history for one conversation.
   * @param query  Conversation id plus optional cursor and limit
   * @returns Promise resolving to a page of messages
   */
  messages(query: DmMessageQuery): Promise<DmMessagePage> {
    return requireDomain('dm').messages(query);
  },

  /**
   * Ask the runtime to send a direct message.
   * @param request  Recipients, content, and optional conversation/client ids
   * @returns Promise resolving to the normalized send result
   */
  send(request: DmSendRequest): Promise<DmSendResult> {
    return requireDomain('dm').send(request);
  },

  /**
   * Start live delivery for one conversation or all visible conversations.
   * @param request  Optional conversation scope
   * @returns Promise resolving to the runtime subscription id
   */
  subscribe(request?: DmSubscribeRequest): Promise<DmSubscription> {
    return requireDomain('dm').subscribe(request);
  },

  /**
   * Stop a live DM subscription.
   * @param subscriptionId  Runtime subscription id from subscribe()
   * @returns Promise resolving to the runtime acknowledgement
   */
  unsubscribe(subscriptionId: string): Promise<DmOk> {
    return requireDomain('dm').unsubscribe(subscriptionId);
  },

  /**
   * Register for shell-pushed `dm.message` deliveries.
   * @param handler  Called with each message and its runtime subscription id
   * @returns A Subscription with `close()` to stop listening
   */
  onMessage(
    handler: (message: DmMessage, subscriptionId: string) => void,
  ): Subscription {
    return requireDomain('dm').onMessage(handler);
  },
};
