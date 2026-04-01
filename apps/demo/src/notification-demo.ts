/**
 * notification-demo.ts — Host-owned notification controller for the demo.
 *
 * Owns all host-side notification UX state. The notification service calls
 * handleServiceChange() when its state changes; the controller derives
 * snapshot fields and notifies subscribers. All lifecycle actions send real
 * notifications:* topic events through the service handler path rather than
 * mutating UI-only local state.
 *
 * Architecture principle: service is browser-agnostic and host-owned;
 * this controller is the bridge between the service callback and the DOM
 * rendering code in main.ts.
 */

import type { Notification } from '@napplet/services';
import { BusKind } from '@napplet/shell';
import type { ServiceHandler } from '@napplet/shell';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DemoNotificationSnapshot {
  notifications: readonly Notification[];
  unreadCount: number;
  lastUpdatedAt: number | null;
  /** Host-visible label identifying the most recent notification source. */
  sourceLabel: string | null;
}

export interface DemoNotificationController {
  getSnapshot(): DemoNotificationSnapshot;
  subscribe(listener: (snapshot: DemoNotificationSnapshot) => void): () => void;
  /** Called by the notification service onChange callback. */
  handleServiceChange(notifications: readonly Notification[]): void;
  /** Connect the service handler so actions flow through the real service path. */
  connectService(handler: ServiceHandler): void;
  /** Send a notifications:create event through the real service path. */
  createDemoNotification(input: { title: string; body: string; sourceLabel: string }): void;
  /** Send a notifications:list request through the real service path. */
  requestList(windowId?: string): void;
  /** Send a notifications:read event for the given notification id. */
  markRead(id: string): void;
  /** Send a notifications:dismiss event for the given notification id. */
  dismiss(id: string): void;
}

// ─── Host-side window ID used for direct host-originated notifications ────────

export const DEMO_HOST_WINDOW_ID = '__demo-host__';

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create the host-owned notification controller.
 *
 * @returns A DemoNotificationController instance
 *
 * @example
 * ```ts
 * const controller = createDemoNotificationController();
 * controller.subscribe((snapshot) => renderNotifications(snapshot));
 * ```
 */
export function createDemoNotificationController(): DemoNotificationController {
  let _notifications: readonly Notification[] = [];
  let _lastUpdatedAt: number | null = null;
  let _sourceLabel: string | null = null;
  let _serviceHandler: ServiceHandler | null = null;
  const _listeners: Array<(snapshot: DemoNotificationSnapshot) => void> = [];

  function buildSnapshot(): DemoNotificationSnapshot {
    return {
      notifications: _notifications,
      unreadCount: _notifications.filter((n) => !n.read).length,
      lastUpdatedAt: _lastUpdatedAt,
      sourceLabel: _sourceLabel,
    };
  }

  function notifyListeners(): void {
    const snap = buildSnapshot();
    for (const listener of _listeners) {
      try { listener(snap); } catch { /* ignore listener errors */ }
    }
  }

  /**
   * Build an INTER_PANE event for a notifications:* topic and dispatch it
   * directly to the service handler, bypassing the auth check that the
   * runtime applies to napplet-originated messages. The host shell is
   * trusted and doesn't go through AUTH.
   */
  function dispatchNotificationAction(topic: string, content: Record<string, unknown>): void {
    if (!_serviceHandler) {
      console.warn('[notification-demo] service not connected — cannot dispatch', topic);
      return;
    }
    const event = {
      id: `notif-host-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pubkey: '__demo-host__',
      created_at: Math.floor(Date.now() / 1000),
      kind: BusKind.INTER_PANE,
      tags: [['t', topic]],
      content: JSON.stringify(content),
      sig: '',
    };
    // Send directly to the service handler — the onChange callback will
    // propagate state changes back to handleServiceChange.
    _serviceHandler.handleMessage(DEMO_HOST_WINDOW_ID, ['EVENT', event], (_msg) => {
      // Responses from the service (e.g., notifications:created) are
      // informational in the host context — no napplet to route them to.
    });
  }

  return {
    getSnapshot() {
      return buildSnapshot();
    },

    subscribe(listener) {
      _listeners.push(listener);
      return () => {
        const i = _listeners.indexOf(listener);
        if (i !== -1) _listeners.splice(i, 1);
      };
    },

    handleServiceChange(notifications: readonly Notification[]) {
      _notifications = notifications;
      _lastUpdatedAt = Date.now();
      // sourceLabel reflects the real service path for educational cues
      _sourceLabel = notifications.length > 0 ? 'notifications:create via service' : null;
      notifyListeners();
    },

    connectService(handler: ServiceHandler) {
      _serviceHandler = handler;
    },

    createDemoNotification(input: { title: string; body: string; sourceLabel: string }) {
      _sourceLabel = input.sourceLabel;
      // Send notifications:create through the real service path
      dispatchNotificationAction('notifications:create', {
        title: input.title,
        body: input.body,
      });
    },

    requestList(windowId?: string) {
      if (!_serviceHandler) {
        console.warn('[notification-demo] service not connected — cannot dispatch notifications:list');
        return;
      }
      const wid = windowId ?? DEMO_HOST_WINDOW_ID;
      const event = {
        id: `notif-host-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        pubkey: '__demo-host__',
        created_at: Math.floor(Date.now() / 1000),
        kind: BusKind.INTER_PANE,
        tags: [['t', 'notifications:list']],
        content: '{}',
        sig: '',
      };
      _serviceHandler.handleMessage(wid, ['EVENT', event], (_msg) => {
        // notifications:listed response — host doesn't need to forward it
      });
    },

    markRead(id: string) {
      dispatchNotificationAction('notifications:read', { id });
    },

    dismiss(id: string) {
      dispatchNotificationAction('notifications:dismiss', { id });
    },
  };
}
