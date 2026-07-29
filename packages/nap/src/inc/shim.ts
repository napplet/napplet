/**
 * Napplet NAP INC shim entrypoint.
 *
 * @module
 */

import { postToShell } from '../boundary.js';
import { normalizeConventionUri } from '../convention-uri.js';
import type {
  ChannelClosed,
  ChannelEvent,
  ChannelHandle,
  ChannelInfo,
  IncEvent,
  Subscription,
} from '@napplet/core';
import type {
  IncChannelClosedMessage,
  IncChannelEventMessage,
  IncChannelListMessage,
  IncChannelListResultMessage,
  IncChannelOpenMessage,
  IncChannelOpenedMessage,
  IncChannelOpenResultMessage,
  IncEventMessage,
  IncSubscribeMessage,
  IncUnsubscribeMessage,
} from './types.js';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETAINED_OPENED = 100;
const MAX_RETAINED_EVENTS = 100;

const topicHandlers = new Map<string, Set<(event: IncEvent) => void>>();
const openedHandlers = new Set<(handle: ChannelHandle) => void>();
const retainedOpened: ChannelHandle[] = [];

interface ChannelState {
  info: ChannelInfo;
  events: ChannelEvent[];
  eventHandlers: Set<(event: ChannelEvent) => void>;
  closed?: ChannelClosed;
  closedHandlers: Set<(event: ChannelClosed) => void>;
}

const channels = new Map<string, ChannelState>();
const pendingOpen = new Map<string, {
  target: string;
  resolve: (handle: ChannelHandle) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();
const pendingList = new Map<string, {
  resolve: (channels: ChannelInfo[]) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

function transposeConventionUri(topic: string, payload: unknown) {
  const queryIndex = topic.indexOf('?');
  const fragmentIndex = topic.indexOf('#');
  const pathEnd = [queryIndex, fragmentIndex]
    .filter((index) => index >= 0)
    .reduce((end, index) => Math.min(end, index), topic.length);
  const convention = topic.slice(0, pathEnd);
  if (!/^napplet:[^/?#]+\/[^/?#]+$/.test(convention)) {
    return {
      type: 'inc.emit',
      topic,
      ...(payload !== undefined ? { payload } : {}),
    };
  }
  const normalized = normalizeConventionUri(topic, payload);
  return {
    type: 'inc.emit',
    topic: normalized.convention,
    ...(normalized.payload !== undefined ? { payload: normalized.payload } : {}),
  };
}

function assertStableSubscriptionTopic(topic: string): void {
  const queryIndex = topic.indexOf('?');
  const fragmentIndex = topic.indexOf('#');
  if (queryIndex < 0 && fragmentIndex < 0) return;
  const pathEnd = [queryIndex, fragmentIndex]
    .filter((index) => index >= 0)
    .reduce((end, index) => Math.min(end, index), topic.length);
  if (/^napplet:[^/?#]+\/[^/?#]+$/.test(topic.slice(0, pathEnd))) {
    throw new Error('Convention subscriptions must use the stable queryless topic');
  }
}

function closeState(state: ChannelState, reason?: string, notifyRuntime = false): void {
  if (state.closed) return;
  if (notifyRuntime) {
    postToShell({ type: 'inc.channel.close', channelId: state.info.id });
  }
  state.closed = {
    channelId: state.info.id,
    ...(reason !== undefined ? { reason } : {}),
  };
  for (const callback of state.closedHandlers) callback(state.closed);
}

function createHandle(channelId: string, peer: string): ChannelHandle {
  let state = channels.get(channelId);
  if (!state) {
    state = {
      info: { id: channelId, peer },
      events: [],
      eventHandlers: new Set(),
      closedHandlers: new Set(),
    };
    channels.set(channelId, state);
  }

  return {
    id: channelId,
    peer: state.info.peer,
    emit(payload?: unknown): void {
      if (state!.closed) return;
      postToShell({
        type: 'inc.channel.emit',
        channelId,
        ...(payload !== undefined ? { payload } : {}),
      });
    },
    on(callback: (event: ChannelEvent) => void): Subscription {
      state!.eventHandlers.add(callback);
      if (state!.events.length > 0) {
        const retained = state!.events.splice(0);
        for (const event of retained) callback(event);
      }
      return {
        close(): void {
          state!.eventHandlers.delete(callback);
        },
      };
    },
    onClosed(callback: (event: ChannelClosed) => void): Subscription {
      state!.closedHandlers.add(callback);
      if (state!.closed) callback(state!.closed);
      return {
        close(): void {
          state!.closedHandlers.delete(callback);
        },
      };
    },
    close(): void {
      closeState(state!, undefined, true);
    },
  };
}

function retainOpened(handle: ChannelHandle): void {
  if (openedHandlers.size > 0) {
    for (const callback of openedHandlers) callback(handle);
    return;
  }
  if (retainedOpened.length >= MAX_RETAINED_OPENED) {
    const overflowed = retainedOpened.shift();
    if (overflowed) {
      const state = channels.get(overflowed.id);
      if (state) closeState(state, 'buffer overflow', true);
    }
  }
  retainedOpened.push(handle);
}

/** Broadcast an INC topic event. */
export function emit(topic: string, payload?: unknown): void {
  postToShell(transposeConventionUri(topic, payload));
}

/** Subscribe to exact INC topic events. */
export function on(
  topic: string,
  callback: (event: IncEvent) => void,
): Subscription {
  assertStableSubscriptionTopic(topic);
  let handlers = topicHandlers.get(topic);
  if (!handlers) {
    handlers = new Set();
    topicHandlers.set(topic, handlers);
  }
  handlers.add(callback);
  const msg: IncSubscribeMessage = {
    type: 'inc.subscribe',
    id: crypto.randomUUID(),
    topic,
  };
  postToShell(msg);
  return {
    close(): void {
      if (!handlers!.delete(callback)) return;
      if (handlers!.size > 0) return;
      topicHandlers.delete(topic);
      const message: IncUnsubscribeMessage = {
        type: 'inc.unsubscribe',
        topic,
      };
      postToShell(message);
    },
  };
}

/** Open a symmetric point-to-point channel. */
export function open(target: string): Promise<ChannelHandle> {
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingOpen.delete(id)) reject(new Error('inc.channel.open timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingOpen.set(id, { target, resolve, reject, timeout });
    const message: IncChannelOpenMessage = {
      type: 'inc.channel.open',
      id,
      target,
    };
    postToShell(message);
  });
}

/** Subscribe to inbound channel handles, replaying retained opens in order. */
export function onOpened(callback: (handle: ChannelHandle) => void): Subscription {
  openedHandlers.add(callback);
  if (retainedOpened.length > 0) {
    const retained = retainedOpened.splice(0);
    for (const handle of retained) callback(handle);
  }
  return {
    close(): void {
      openedHandlers.delete(callback);
    },
  };
}

/** List active channel snapshots. */
export function list(): Promise<ChannelInfo[]> {
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingList.delete(id)) reject(new Error('inc.channel.list timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingList.set(id, { resolve, reject, timeout });
    const message: IncChannelListMessage = {
      type: 'inc.channel.list',
      id,
    };
    postToShell(message);
  });
}

/** Broadcast to every open channel peer. */
export function broadcast(payload?: unknown): void {
  postToShell({
    type: 'inc.channel.broadcast',
    ...(payload !== undefined ? { payload } : {}),
  });
}

/** Canonical channel namespace exposed as `window.napplet.inc.channel`. */
export const channel = {
  open,
  onOpened,
  list,
  broadcast,
};

/** Dispatch one topic event from the runtime. */
export function handleIncEvent(msg: IncEventMessage): void {
  const handlers = topicHandlers.get(msg.topic);
  if (!handlers) return;
  const event: IncEvent = {
    topic: msg.topic,
    sender: msg.sender,
    ...('payload' in msg ? { payload: msg.payload } : {}),
  };
  for (const callback of handlers) callback(event);
}

function handleOpenResult(msg: IncChannelOpenResultMessage): void {
  const pending = pendingOpen.get(msg.id);
  if (!pending) return;
  pendingOpen.delete(msg.id);
  clearTimeout(pending.timeout);
  if (!msg.channelId) {
    pending.reject(new Error(msg.error ?? 'inc.channel.open failed'));
    return;
  }
  pending.resolve(createHandle(msg.channelId, msg.peer ?? pending.target));
}

function handleOpened(msg: IncChannelOpenedMessage): void {
  retainOpened(createHandle(msg.channelId, msg.peer));
}

function handleChannelEvent(msg: IncChannelEventMessage): void {
  const state = channels.get(msg.channelId);
  if (!state || state.closed) return;
  const event: ChannelEvent = {
    channelId: msg.channelId,
    sender: msg.sender,
    ...('payload' in msg ? { payload: msg.payload } : {}),
  };
  if (state.eventHandlers.size > 0) {
    for (const callback of state.eventHandlers) callback(event);
    return;
  }
  if (state.events.length >= MAX_RETAINED_EVENTS) {
    closeState(state, 'buffer overflow', true);
    return;
  }
  state.events.push(event);
}

function handleListResult(msg: IncChannelListResultMessage): void {
  const pending = pendingList.get(msg.id);
  if (!pending) return;
  pendingList.delete(msg.id);
  clearTimeout(pending.timeout);
  pending.resolve(msg.channels);
}

function handleClosed(msg: IncChannelClosedMessage): void {
  const state = channels.get(msg.channelId);
  if (!state) return;
  closeState(state, msg.reason);
}

/** Route any runtime-delivered INC envelope. */
export function handleIncMessage(msg: { type: string; [key: string]: unknown }): void {
  switch (msg.type) {
    case 'inc.event': {
      if (typeof msg.topic !== 'string' || typeof msg.sender !== 'string') return;
      handleIncEvent({
        type: 'inc.event',
        topic: msg.topic,
        sender: msg.sender,
        ...('payload' in msg ? { payload: msg.payload } : {}),
      });
      return;
    }
    case 'inc.channel.open.result': {
      if (typeof msg.id !== 'string') return;
      if (msg.channelId !== undefined && typeof msg.channelId !== 'string') return;
      if (msg.peer !== undefined && typeof msg.peer !== 'string') return;
      if (msg.error !== undefined && typeof msg.error !== 'string') return;
      handleOpenResult({
        type: 'inc.channel.open.result',
        id: msg.id,
        ...(msg.channelId === undefined ? {} : { channelId: msg.channelId }),
        ...(msg.peer === undefined ? {} : { peer: msg.peer }),
        ...(msg.error === undefined ? {} : { error: msg.error }),
      });
      return;
    }
    case 'inc.channel.opened': {
      if (typeof msg.channelId !== 'string' || typeof msg.peer !== 'string') return;
      handleOpened({ type: 'inc.channel.opened', channelId: msg.channelId, peer: msg.peer });
      return;
    }
    case 'inc.channel.event': {
      if (typeof msg.channelId !== 'string' || typeof msg.sender !== 'string') return;
      handleChannelEvent({
        type: 'inc.channel.event',
        channelId: msg.channelId,
        sender: msg.sender,
        ...('payload' in msg ? { payload: msg.payload } : {}),
      });
      return;
    }
    case 'inc.channel.list.result': {
      if (typeof msg.id !== 'string' || !isChannelInfoList(msg.channels)) return;
      handleListResult({ type: 'inc.channel.list.result', id: msg.id, channels: msg.channels });
      return;
    }
    case 'inc.channel.closed': {
      if (typeof msg.channelId !== 'string') return;
      if (msg.reason !== undefined && typeof msg.reason !== 'string') return;
      handleClosed({
        type: 'inc.channel.closed',
        channelId: msg.channelId,
        ...(msg.reason === undefined ? {} : { reason: msg.reason }),
      });
    }
  }
}

function isChannelInfoList(value: unknown): value is ChannelInfo[] {
  return Array.isArray(value) && value.every((entry) =>
    typeof entry === 'object' &&
    entry !== null &&
    'id' in entry &&
    typeof entry.id === 'string' &&
    'peer' in entry &&
    typeof entry.peer === 'string'
  );
}

/** Install INC state and return endpoint-teardown cleanup. */
export function installIncShim(): () => void {
  return () => {
    for (const pending of pendingOpen.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('INC shim disposed'));
    }
    for (const pending of pendingList.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('INC shim disposed'));
    }
    for (const state of channels.values()) closeState(state, 'endpoint destroyed', true);
    pendingOpen.clear();
    pendingList.clear();
    topicHandlers.clear();
    openedHandlers.clear();
    retainedOpened.length = 0;
    channels.clear();
  };
}
