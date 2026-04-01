/**
 * service-dispatch.ts — Generic topic-prefix routing for registered services.
 *
 * Routes IPC-PEER events to the correct ServiceHandler based on the topic
 * prefix (text before ':'). Services receive raw NIP-01 message arrays via
 * handleMessage() and respond via the send callback.
 */

import type { NostrEvent } from '@napplet/core';
import type { ServiceRegistry, SendToNapplet } from './types.js';

/**
 * Route an IPC-PEER event to the matching service handler by topic prefix.
 * Extracts the prefix before ':' from the topic, looks up the handler in the
 * service registry, and calls handleMessage() with an ['EVENT', event] message.
 *
 * Returns true if a service handled the message, false otherwise.
 *
 * @param windowId - The napplet window that sent the event
 * @param event - The IPC-PEER event to route
 * @param topic - The full topic string (e.g., 'audio:register')
 * @param services - The service registry to look up handlers
 * @param sendToNapplet - Callback to send messages back to the napplet
 * @returns true if a service handled the event, false if no matching service
 *
 * @example
 * ```ts
 * const handled = routeServiceMessage(windowId, event, 'audio:play', services, sendToNapplet);
 * if (!handled) eventBuffer.bufferAndDeliver(event, windowId);
 * ```
 */
export function routeServiceMessage(
  windowId: string,
  event: NostrEvent,
  topic: string,
  services: ServiceRegistry,
  sendToNapplet: SendToNapplet,
): boolean {
  const colonIndex = topic.indexOf(':');
  if (colonIndex === -1) return false;

  const prefix = topic.slice(0, colonIndex);
  const handler = services[prefix];
  if (!handler) return false;

  const send = (msg: unknown[]): void => sendToNapplet(windowId, msg);
  handler.handleMessage(windowId, ['EVENT', event], send);
  return true;
}

/**
 * Notify all registered service handlers that a napplet window was destroyed.
 * Calls onWindowDestroyed() on every handler that implements it.
 * Errors in individual handlers are caught and silently ignored to prevent
 * one service's cleanup failure from blocking others.
 *
 * @param windowId - The destroyed napplet's window identifier
 * @param services - The service registry containing all handlers
 *
 * @example
 * ```ts
 * notifyServiceWindowDestroyed('window-1', services);
 * ```
 */
export function notifyServiceWindowDestroyed(
  windowId: string,
  services: ServiceRegistry,
): void {
  for (const handler of Object.values(services)) {
    try {
      handler.onWindowDestroyed?.(windowId);
    } catch {
      /* Service cleanup is best-effort — don't let one service block others */
    }
  }
}
