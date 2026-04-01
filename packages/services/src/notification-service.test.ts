/**
 * notification-service.test.ts — Unit tests for the notification service.
 */

import { describe, it, expect } from 'vitest';
import { createNotificationService } from './notification-service.js';
import { BusKind } from '@napplet/core';
import type { NostrEvent } from '@napplet/core';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WINDOW_ID = 'win-test-1';
const WINDOW_ID_2 = 'win-test-2';

function makeInterPaneEvent(topic: string, content: Record<string, unknown>, overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'evt-' + Math.random().toString(36).slice(2).padEnd(58, '0'),
    pubkey: 'a'.repeat(64),
    created_at: Math.floor(Date.now() / 1000),
    kind: BusKind.INTER_PANE,
    tags: [['t', topic]],
    content: JSON.stringify(content),
    sig: '0'.repeat(128),
    ...overrides,
  };
}

function createService() {
  return createNotificationService();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createNotificationService', () => {
  it('returns ServiceHandler with correct descriptor', () => {
    const service = createNotificationService();
    expect(service.descriptor).toEqual({
      name: 'notifications',
      version: '1.0.0',
      description: 'Notification state registry — tracks notifications per napplet window',
    });
  });

  it('ignores non-EVENT messages', () => {
    const service = createService();
    const sent: unknown[][] = [];
    service.handleMessage(WINDOW_ID, ['REQ', 'sub-1', {}], (msg) => sent.push(msg));
    expect(sent).toHaveLength(0);
  });

  it('ignores events with wrong kind', () => {
    const service = createService();
    const sent: unknown[][] = [];
    const event = makeInterPaneEvent('notifications:create', { title: 'test', body: 'body' }, { kind: 1 });
    service.handleMessage(WINDOW_ID, ['EVENT', event], (msg) => sent.push(msg));
    expect(sent).toHaveLength(0);
  });

  it('ignores events with non-notifications topic', () => {
    const service = createService();
    const sent: unknown[][] = [];
    const event = makeInterPaneEvent('chat:message', { text: 'hello' });
    service.handleMessage(WINDOW_ID, ['EVENT', event], (msg) => sent.push(msg));
    expect(sent).toHaveLength(0);
  });

  describe('notifications:create', () => {
    it('creates a notification and sends notifications:created with an id', () => {
      const service = createService();
      const sent: unknown[][] = [];

      const event = makeInterPaneEvent('notifications:create', { title: 'New Message', body: 'Hello from chat' });
      service.handleMessage(WINDOW_ID, ['EVENT', event], (msg) => sent.push(msg));

      expect(sent).toHaveLength(1);
      expect(sent[0][0]).toBe('EVENT');
      const responseEvent = sent[0][2] as NostrEvent;
      const topicTag = responseEvent.tags?.find((t: string[]) => t[0] === 't');
      expect(topicTag?.[1]).toBe('notifications:created');
      const content = JSON.parse(responseEvent.content) as Record<string, unknown>;
      expect(typeof content.id).toBe('string');
      expect((content.id as string).length).toBeGreaterThan(0);
    });

    it('calls onChange with the new notification', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({ onChange: (list) => changes.push(list) });

      const event = makeInterPaneEvent('notifications:create', { title: 'Alert', body: 'Something happened' });
      service.handleMessage(WINDOW_ID, ['EVENT', event], () => {});

      expect(changes).toHaveLength(1);
      const list = changes[0] as Array<{ title: string; body: string; read: boolean }>;
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe('Alert');
      expect(list[0].body).toBe('Something happened');
      expect(list[0].read).toBe(false);
    });

    it('creates notification with correct windowId', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({ onChange: (list) => changes.push(list) });

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'T', body: 'B' })], () => {});

      const list = changes[0] as Array<{ windowId: string }>;
      expect(list[0].windowId).toBe(WINDOW_ID);
    });
  });

  describe('notifications:list', () => {
    it('returns notifications:listed with current window notifications', () => {
      const service = createService();
      const sent: unknown[][] = [];

      // Create a notification first
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'T1', body: 'B1' })], () => {});

      // Request list
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:list', {})], (msg) => sent.push(msg));

      expect(sent).toHaveLength(1);
      expect(sent[0][0]).toBe('EVENT');
      const responseEvent = sent[0][2] as NostrEvent;
      const topicTag = responseEvent.tags?.find((t: string[]) => t[0] === 't');
      expect(topicTag?.[1]).toBe('notifications:listed');
      const content = JSON.parse(responseEvent.content) as { notifications: Array<{ title: string }> };
      expect(content.notifications).toHaveLength(1);
      expect(content.notifications[0].title).toBe('T1');
    });

    it('returns empty list for window with no notifications', () => {
      const service = createService();
      const sent: unknown[][] = [];

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:list', {})], (msg) => sent.push(msg));

      const responseEvent = sent[0][2] as NostrEvent;
      const content = JSON.parse(responseEvent.content) as { notifications: unknown[] };
      expect(content.notifications).toHaveLength(0);
    });

    it('returns only notifications for the requesting window', () => {
      const service = createService();
      const sent: unknown[][] = [];

      // Create notifications for two different windows
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'Win1', body: 'B' })], () => {});
      service.handleMessage(WINDOW_ID_2, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'Win2', body: 'B' })], () => {});

      // Request list from WINDOW_ID — should only see its own
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:list', {})], (msg) => sent.push(msg));

      const responseEvent = sent[0][2] as NostrEvent;
      const content = JSON.parse(responseEvent.content) as { notifications: Array<{ title: string }> };
      expect(content.notifications).toHaveLength(1);
      expect(content.notifications[0].title).toBe('Win1');
    });
  });

  describe('notifications:read', () => {
    it('flips read from false to true', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({ onChange: (list) => changes.push(list) });
      const sent: unknown[][] = [];

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'T', body: 'B' })], (msg) => sent.push(msg));
      const created = JSON.parse((sent[0][2] as NostrEvent).content) as { id: string };
      const notifId = created.id;

      // Mark as read
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:read', { id: notifId })], () => {});

      const lastChange = changes[changes.length - 1] as Array<{ id: string; read: boolean }>;
      const notif = lastChange.find((n) => n.id === notifId);
      expect(notif?.read).toBe(true);
    });

    it('does not call onChange if notification is already read', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({ onChange: (list) => changes.push(list) });
      const sent: unknown[][] = [];

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'T', body: 'B' })], (msg) => sent.push(msg));
      const created = JSON.parse((sent[0][2] as NostrEvent).content) as { id: string };
      const notifId = created.id;

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:read', { id: notifId })], () => {});
      const changesAfterRead = changes.length;

      // Reading again should not trigger onChange
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:read', { id: notifId })], () => {});
      expect(changes.length).toBe(changesAfterRead);
    });
  });

  describe('notifications:dismiss', () => {
    it('removes the notification from the list', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({ onChange: (list) => changes.push(list) });
      const sent: unknown[][] = [];

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'T', body: 'B' })], (msg) => sent.push(msg));
      const created = JSON.parse((sent[0][2] as NostrEvent).content) as { id: string };
      const notifId = created.id;

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:dismiss', { id: notifId })], () => {});

      const lastChange = changes[changes.length - 1] as Array<{ id: string }>;
      expect(lastChange.find((n) => n.id === notifId)).toBeUndefined();
    });

    it('calls onChange after dismissal', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({ onChange: (list) => changes.push(list) });
      const sent: unknown[][] = [];

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'T', body: 'B' })], (msg) => sent.push(msg));
      const created = JSON.parse((sent[0][2] as NostrEvent).content) as { id: string };
      const countBefore = changes.length;

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:dismiss', { id: created.id })], () => {});
      expect(changes.length).toBeGreaterThan(countBefore);
    });
  });

  describe('maxPerWindow', () => {
    it('evicts oldest notification (FIFO) when limit is exceeded', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({
        onChange: (list) => changes.push([...list]),
        maxPerWindow: 2,
      });
      const sent: unknown[][] = [];

      // Create 3 notifications — the first should be evicted
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'First', body: '1' })], (msg) => sent.push(msg));
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'Second', body: '2' })], (msg) => sent.push(msg));
      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'Third', body: '3' })], (msg) => sent.push(msg));

      const lastChange = changes[changes.length - 1] as Array<{ title: string }>;
      expect(lastChange).toHaveLength(2);
      expect(lastChange.find((n) => n.title === 'First')).toBeUndefined();
      expect(lastChange.find((n) => n.title === 'Second')).toBeDefined();
      expect(lastChange.find((n) => n.title === 'Third')).toBeDefined();
    });
  });

  describe('onWindowDestroyed', () => {
    it('removes notifications for the destroyed window and calls onChange', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({ onChange: (list) => changes.push(list) });

      service.handleMessage(WINDOW_ID, ['EVENT', makeInterPaneEvent('notifications:create', { title: 'T', body: 'B' })], () => {});
      const countBefore = changes.length;

      service.onWindowDestroyed?.(WINDOW_ID);

      expect(changes.length).toBeGreaterThan(countBefore);
      const lastChange = changes[changes.length - 1] as Array<{ windowId: string }>;
      expect(lastChange.find((n) => n.windowId === WINDOW_ID)).toBeUndefined();
    });

    it('does not call onChange for a window that has no notifications', () => {
      const changes: unknown[] = [];
      const service = createNotificationService({ onChange: (list) => changes.push(list) });

      const countBefore = changes.length;
      service.onWindowDestroyed?.('nonexistent-window');
      expect(changes.length).toBe(countBefore);
    });

    it('does not throw for unknown window', () => {
      const service = createService();
      expect(() => service.onWindowDestroyed?.('nonexistent-window')).not.toThrow();
    });
  });
});
