/**
 * notification-service.ts — Notification state registry as a ServiceHandler.
 *
 * Tracks notifications created by napplet windows. Shell hosts wire this
 * into the runtime via registerService('notifications', createNotificationService(opts)).
 * The shell host decides presentation (toast, badge, OS notification, etc.)
 * through the onChange callback. Browser-agnostic — no DOM, no window.
 */

import type { NostrEvent, ServiceDescriptor } from '@napplet/core';
import { BusKind } from '@napplet/core';
import type { ServiceHandler } from '@napplet/runtime';
import type { Notification, NotificationServiceOptions } from './types.js';

/** Notification service version — follows semver. */
const NOTIFICATION_SERVICE_VERSION = '1.0.0';

/** Default maximum notifications per window. */
const DEFAULT_MAX_PER_WINDOW = 100;

/** Counter for generating unique notification IDs. */
let idCounter = 0;

/**
 * Generate a unique notification ID.
 */
function generateId(): string {
  idCounter++;
  return `notif-${Date.now()}-${idCounter}`;
}

/**
 * Create a notification service handler.
 *
 * The notification service is a state registry that tracks notifications
 * per napplet window. Napplets create and manage notifications via
 * `notifications:*` topic events; the shell host controls presentation
 * via the onChange callback.
 *
 * @param options - Optional configuration (onChange callback, maxPerWindow limit)
 * @returns A ServiceHandler to register with the runtime
 *
 * @example
 * ```ts
 * import { createNotificationService } from '@napplet/services';
 *
 * const notifications = createNotificationService({
 *   onChange: (list) => {
 *     const unread = list.filter(n => !n.read);
 *     updateBadge(unread.length);
 *   },
 *   maxPerWindow: 50,
 * });
 *
 * runtime.registerService('notifications', notifications);
 * ```
 */
export function createNotificationService(options?: NotificationServiceOptions): ServiceHandler {
  const notifications = new Map<string, Notification[]>();
  const onChange = options?.onChange;
  const maxPerWindow = options?.maxPerWindow ?? DEFAULT_MAX_PER_WINDOW;

  /**
   * Get a flat list of all notifications across all windows.
   */
  function getAllNotifications(): Notification[] {
    const all: Notification[] = [];
    for (const windowNotifs of notifications.values()) {
      all.push(...windowNotifs);
    }
    return all;
  }

  function notify(): void {
    onChange?.(getAllNotifications());
  }

  /**
   * Parse JSON content from an event, returning undefined on failure.
   */
  function parseContent(event: NostrEvent): Record<string, unknown> | undefined {
    try {
      const parsed: unknown = JSON.parse(event.content);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* Invalid JSON — ignore event */
    }
    return undefined;
  }

  /**
   * Extract the topic string from an event's tags.
   */
  function extractTopic(event: NostrEvent): string | undefined {
    return event.tags?.find((t) => t[0] === 't')?.[1];
  }

  /**
   * Create a synthetic IPC-PEER event to send back to a napplet.
   */
  function createResponseEvent(topic: string, content: Record<string, unknown>): NostrEvent {
    return {
      id: `notif-resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pubkey: '__shell__',
      created_at: Math.floor(Date.now() / 1000),
      kind: BusKind.IPC_PEER,
      tags: [['t', topic]],
      content: JSON.stringify(content),
      sig: '',
    };
  }

  /**
   * Ensure a window's notification list exists.
   */
  function getWindowNotifications(windowId: string): Notification[] {
    let list = notifications.get(windowId);
    if (!list) {
      list = [];
      notifications.set(windowId, list);
    }
    return list;
  }

  /**
   * Enforce maxPerWindow limit by evicting oldest notifications.
   */
  function enforceLimit(list: Notification[]): void {
    while (list.length > maxPerWindow) {
      list.shift(); // Remove oldest (FIFO eviction)
    }
  }

  /**
   * Find a notification by ID across all windows.
   * Returns [windowId, notification, index] or undefined.
   */
  function findById(id: string): [string, Notification, number] | undefined {
    for (const [windowId, list] of notifications) {
      const index = list.findIndex((n) => n.id === id);
      if (index !== -1) {
        return [windowId, list[index], index];
      }
    }
    return undefined;
  }

  function handleNotificationEvent(
    windowId: string,
    event: NostrEvent,
    send: (msg: unknown[]) => void,
  ): void {
    const topic = extractTopic(event);
    if (!topic) return;

    // Strip the 'notifications:' prefix to get the action
    const action = topic.slice(14); // 'notifications:'.length === 14

    switch (action) {
      case 'create': {
        const content = parseContent(event);
        if (!content) return;
        const title = typeof content.title === 'string' ? content.title : '';
        const body = typeof content.body === 'string' ? content.body : '';

        const id = generateId();
        const notification: Notification = {
          id,
          windowId,
          title,
          body,
          read: false,
          createdAt: Math.floor(Date.now() / 1000),
        };

        const list = getWindowNotifications(windowId);
        list.push(notification);
        enforceLimit(list);
        notify();

        // Acknowledge creation with assigned ID
        const ack = createResponseEvent('notifications:created', { id });
        send(['EVENT', '__shell__', ack]);
        break;
      }

      case 'dismiss': {
        const content = parseContent(event);
        if (!content) return;
        const id = typeof content.id === 'string' ? content.id : '';
        if (!id) return;

        const found = findById(id);
        if (found) {
          const [foundWindowId, , index] = found;
          const list = notifications.get(foundWindowId);
          if (list) {
            list.splice(index, 1);
            // Clean up empty lists
            if (list.length === 0) {
              notifications.delete(foundWindowId);
            }
            notify();
          }
        }
        break;
      }

      case 'read': {
        const content = parseContent(event);
        if (!content) return;
        const id = typeof content.id === 'string' ? content.id : '';
        if (!id) return;

        const found = findById(id);
        if (found) {
          const [, notification] = found;
          if (!notification.read) {
            notification.read = true;
            notify();
          }
        }
        break;
      }

      case 'list': {
        const windowNotifs = notifications.get(windowId) ?? [];
        const response = createResponseEvent('notifications:listed', {
          notifications: windowNotifs,
        });
        send(['EVENT', '__shell__', response]);
        break;
      }

      default:
        // Unknown notification action — ignore
        break;
    }
  }

  const descriptor: ServiceDescriptor = {
    name: 'notifications',
    version: NOTIFICATION_SERVICE_VERSION,
    description: 'Notification state registry — tracks notifications per napplet window',
  };

  return {
    descriptor,

    handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void {
      // Services receive ['EVENT', event] messages from the runtime's service dispatch
      if (message[0] !== 'EVENT' || !message[1]) return;
      const event = message[1] as NostrEvent;

      // Only handle IPC-PEER events with notifications:* topics
      if (event.kind !== BusKind.IPC_PEER) return;
      const topic = extractTopic(event);
      if (!topic?.startsWith('notifications:')) return;

      handleNotificationEvent(windowId, event, send);
    },

    onWindowDestroyed(windowId: string): void {
      if (notifications.delete(windowId)) {
        notify();
      }
    },
  };
}
