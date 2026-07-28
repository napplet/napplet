/**
 * Napplet NAP intent shim entrypoint.
 *
 * @module
 */

import { postToShell } from '../boundary.js';
import type { Subscription } from '@napplet/core';
import type {
  IntentAvailability,
  IntentAvailableMessage,
  IntentAvailableResultMessage,
  IntentChangedMessage,
  IntentHandlersMessage,
  IntentHandlersResultMessage,
  IntentInvokeMessage,
  IntentInvokeResultMessage,
  IntentOpenOptions,
  IntentRequest,
  IntentResult,
} from './types.js';

const REQUEST_TIMEOUT_MS = 30_000;

const pendingInvoke = new Map<string, {
  resolve: (result: IntentResult) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

const pendingAvailable = new Map<string, {
  resolve: (availability: IntentAvailability) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

const pendingHandlers = new Map<string, {
  resolve: (handlers: IntentAvailability[]) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

const changedHandlers = new Set<(availability: IntentAvailability) => void>();
let installed = false;

function isMessageType<T extends { type: string }>(
  msg: { type: string },
  type: T['type'],
): msg is T {
  return msg.type === type;
}

function handleInvokeResult(msg: IntentInvokeResultMessage): void {
  const pending = pendingInvoke.get(msg.id);
  if (!pending) return;
  pendingInvoke.delete(msg.id);
  clearTimeout(pending.timeout);
  if (msg.result !== undefined) {
    pending.resolve(msg.result);
    return;
  }
  pending.reject(new Error(msg.error ?? 'invoke failed'));
}

function handleAvailableResult(msg: IntentAvailableResultMessage): void {
  const pending = pendingAvailable.get(msg.id);
  if (!pending) return;
  pendingAvailable.delete(msg.id);
  clearTimeout(pending.timeout);
  if (msg.availability !== undefined) {
    pending.resolve(msg.availability);
    return;
  }
  pending.reject(new Error(msg.error ?? 'intent availability unavailable'));
}

function handleHandlersResult(msg: IntentHandlersResultMessage): void {
  const pending = pendingHandlers.get(msg.id);
  if (!pending) return;
  pendingHandlers.delete(msg.id);
  clearTimeout(pending.timeout);
  if (msg.handlers !== undefined) {
    pending.resolve(msg.handlers);
    return;
  }
  pending.reject(new Error(msg.error ?? 'intent handlers unavailable'));
}

function handleChanged(msg: IntentChangedMessage): void {
  if (!msg.availability) return;
  for (const callback of changedHandlers) callback(msg.availability);
}

/**
 * Route an INTENT envelope received from the runtime.
 *
 * @param msg Runtime-delivered INTENT envelope
 * @returns Nothing
 */
export function handleIntentMessage(msg: { type: string; [key: string]: unknown }): void {
  if (isMessageType<IntentInvokeResultMessage>(msg, 'intent.invoke.result')) {
    handleInvokeResult(msg);
  } else if (isMessageType<IntentAvailableResultMessage>(msg, 'intent.available.result')) {
    handleAvailableResult(msg);
  } else if (isMessageType<IntentHandlersResultMessage>(msg, 'intent.handlers.result')) {
    handleHandlersResult(msg);
  } else if (isMessageType<IntentChangedMessage>(msg, 'intent.changed')) {
    handleChanged(msg);
  }
}

/**
 * Dispatch an intent request by archetype.
 *
 * @param request Archetype dispatch request
 * @returns Promise resolving to the structured dispatch result
 *
 * @example
 * ```ts
 * const result = await invoke({
 *   archetype: 'note',
 *   action: 'open',
 *   convention: 'napplet:note/open',
 *   payload: { id: 'abc' },
 * });
 * ```
 */
export function invoke(request: IntentRequest): Promise<IntentResult> {
  const id = crypto.randomUUID();
  return new Promise<IntentResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingInvoke.delete(id)) reject(new Error('intent.invoke timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingInvoke.set(id, { resolve, reject, timeout });
    const msg: IntentInvokeMessage = {
      type: 'intent.invoke',
      id,
      request,
    };
    postToShell(msg);
  });
}

/**
 * Open a napplet by archetype.
 *
 * @param archetype Role slug to open
 * @param payload Optional opaque payload
 * @param opts Optional convention, handler selection, and behavior hints
 * @returns Promise resolving to the structured dispatch result
 *
 * @example
 * ```ts
 * await open('note', { id: 'abc' }, { convention: 'napplet:note/open' });
 * ```
 */
export function open(
  archetype: string,
  payload?: unknown,
  opts?: IntentOpenOptions,
): Promise<IntentResult> {
  return invoke({ archetype, action: 'open', payload, ...opts });
}

/**
 * Check whether the runtime can satisfy an archetype.
 *
 * @param archetype Role slug to inspect
 * @returns Installed-catalog availability
 */
export function available(archetype: string): Promise<IntentAvailability> {
  const id = crypto.randomUUID();
  return new Promise<IntentAvailability>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingAvailable.delete(id)) reject(new Error('intent.available timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingAvailable.set(id, { resolve, reject, timeout });
    const msg: IntentAvailableMessage = {
      type: 'intent.available',
      id,
      archetype,
    };
    postToShell(msg);
  });
}

/**
 * List every archetype the runtime can satisfy.
 *
 * @returns Installed-catalog availability records
 */
export function handlers(): Promise<IntentAvailability[]> {
  const id = crypto.randomUUID();
  return new Promise<IntentAvailability[]>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingHandlers.delete(id)) reject(new Error('intent.handlers timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingHandlers.set(id, { resolve, reject, timeout });
    const msg: IntentHandlersMessage = {
      type: 'intent.handlers',
      id,
    };
    postToShell(msg);
  });
}

/**
 * Subscribe to runtime-pushed availability changes.
 *
 * @param handler Callback for each availability update
 * @returns Subscription handle
 */
export function onChanged(handler: (availability: IntentAvailability) => void): Subscription {
  changedHandlers.add(handler);
  return {
    close(): void {
      changedHandlers.delete(handler);
    },
  };
}

/**
 * Install the INTENT shim state.
 *
 * @returns Cleanup function
 */
export function installIntentShim(): () => void {
  if (installed) return () => undefined;
  installed = true;
  return () => {
    for (const pending of pendingInvoke.values()) clearTimeout(pending.timeout);
    for (const pending of pendingAvailable.values()) clearTimeout(pending.timeout);
    for (const pending of pendingHandlers.values()) clearTimeout(pending.timeout);
    pendingInvoke.clear();
    pendingAvailable.clear();
    pendingHandlers.clear();
    changedHandlers.clear();
    installed = false;
  };
}
