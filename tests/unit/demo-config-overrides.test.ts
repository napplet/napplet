/**
 * demo-config-overrides.test.ts
 *
 * Behavioral tests for TRANS-02:
 * - DemoConfig mutation: set/reset/resetAll/subscribe, clamping to min/max,
 *   modification tracking (isModified, getModifiedKeys)
 * - Runtime config overrides: RuntimeConfigOverrides interface,
 *   lazy getters in createEventBuffer and createReplayDetector
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DemoConfig } from '../../apps/demo/src/demo-config.ts';
import type { ConstantDef } from '../../apps/demo/src/demo-config.ts';
import { createEventBuffer, RING_BUFFER_SIZE } from '../../packages/runtime/src/event-buffer.ts';
import { createReplayDetector } from '../../packages/runtime/src/replay.ts';
import type { RuntimeConfigOverrides } from '../../packages/runtime/src/types.ts';
import type { NostrEvent } from '@napplet/core';

// ─── Test fixture: minimal constant inventory ─────────────────────────────────

function makeFixtureDefs(): ConstantDef[] {
  return [
    {
      key: 'core.REPLAY_WINDOW_SECONDS',
      label: 'Replay Window',
      defaultValue: 30,
      currentValue: 30,
      unit: 's',
      min: 1,
      max: 300,
      step: 1,
      pkg: 'core',
      domain: 'timeouts',
      editable: true,
      description: 'test',
    },
    {
      key: 'runtime.RING_BUFFER_SIZE',
      label: 'Ring Buffer Size',
      defaultValue: 100,
      currentValue: 100,
      unit: 'count',
      min: 1,
      max: 1000,
      step: 1,
      pkg: 'runtime',
      domain: 'sizes',
      editable: true,
      description: 'test',
    },
    {
      key: 'demo.FLASH_DURATION',
      label: 'Flash Duration',
      defaultValue: 500,
      currentValue: 500,
      unit: 'ms',
      min: 50,
      max: 5000,
      step: 50,
      pkg: 'demo',
      domain: 'ui-timing',
      editable: true,
      description: 'test',
    },
    {
      key: 'core.AUTH_KIND',
      label: 'AUTH Kind',
      defaultValue: 22242,
      currentValue: 22242,
      unit: '',
      min: 0,
      max: 65535,
      step: 1,
      pkg: 'core',
      domain: 'protocol',
      editable: false,
      description: 'read-only protocol constant',
    },
  ];
}

// ─── DemoConfig mutation ──────────────────────────────────────────────────────

describe('DemoConfig mutation', () => {
  let config: DemoConfig;

  beforeEach(() => {
    config = new DemoConfig(makeFixtureDefs());
  });

  describe('set()', () => {
    it('updates the current value of an editable constant', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      expect(config.get('core.REPLAY_WINDOW_SECONDS')).toBe(60);
    });

    it('clamps value to the maximum when above max', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 999);
      expect(config.get('core.REPLAY_WINDOW_SECONDS')).toBe(300);
    });

    it('clamps value to the minimum when below min', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 0);
      expect(config.get('core.REPLAY_WINDOW_SECONDS')).toBe(1);
    });

    it('clamps value exactly to max when equal to max', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 300);
      expect(config.get('core.REPLAY_WINDOW_SECONDS')).toBe(300);
    });

    it('does not update a read-only (non-editable) constant', () => {
      config.set('core.AUTH_KIND', 99999);
      expect(config.get('core.AUTH_KIND')).toBe(22242);
    });

    it('throws for an unknown key', () => {
      expect(() => config.set('unknown.KEY', 1)).toThrow('Unknown constant: unknown.KEY');
    });
  });

  describe('reset()', () => {
    it('restores a modified constant to its default value', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      config.reset('core.REPLAY_WINDOW_SECONDS');
      expect(config.get('core.REPLAY_WINDOW_SECONDS')).toBe(30);
    });

    it('is a no-op when the constant is already at its default', () => {
      // Should not throw, value stays at default
      config.reset('core.REPLAY_WINDOW_SECONDS');
      expect(config.get('core.REPLAY_WINDOW_SECONDS')).toBe(30);
    });

    it('silently ignores unknown keys', () => {
      expect(() => config.reset('nonexistent.KEY')).not.toThrow();
    });
  });

  describe('resetAll()', () => {
    it('clears all modifications and restores defaults', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      config.set('runtime.RING_BUFFER_SIZE', 500);
      config.set('demo.FLASH_DURATION', 1000);
      config.resetAll();
      expect(config.get('core.REPLAY_WINDOW_SECONDS')).toBe(30);
      expect(config.get('runtime.RING_BUFFER_SIZE')).toBe(100);
      expect(config.get('demo.FLASH_DURATION')).toBe(500);
    });

    it('results in an empty getModifiedKeys() after reset', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      config.resetAll();
      expect(config.getModifiedKeys()).toHaveLength(0);
    });
  });

  describe('isModified()', () => {
    it('returns false for an unmodified constant', () => {
      expect(config.isModified('core.REPLAY_WINDOW_SECONDS')).toBe(false);
    });

    it('returns true after setting a new value', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      expect(config.isModified('core.REPLAY_WINDOW_SECONDS')).toBe(true);
    });

    it('returns false after resetting to default', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      config.reset('core.REPLAY_WINDOW_SECONDS');
      expect(config.isModified('core.REPLAY_WINDOW_SECONDS')).toBe(false);
    });

    it('returns false for an unknown key', () => {
      expect(config.isModified('nonexistent.KEY')).toBe(false);
    });
  });

  describe('getModifiedKeys()', () => {
    it('returns empty array when no constants are modified', () => {
      expect(config.getModifiedKeys()).toEqual([]);
    });

    it('returns all keys that differ from their defaults', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      config.set('demo.FLASH_DURATION', 1000);
      const modified = config.getModifiedKeys();
      expect(modified).toContain('core.REPLAY_WINDOW_SECONDS');
      expect(modified).toContain('demo.FLASH_DURATION');
      expect(modified).toHaveLength(2);
    });

    it('does not include unmodified constants', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      const modified = config.getModifiedKeys();
      expect(modified).not.toContain('runtime.RING_BUFFER_SIZE');
      expect(modified).not.toContain('demo.FLASH_DURATION');
    });
  });

  describe('subscribe()', () => {
    it('returns an unsubscribe function', () => {
      const unsub = config.subscribe(() => {});
      expect(typeof unsub).toBe('function');
    });

    it('calls the subscriber when a value changes', () => {
      const calls: Array<{ key: string; value: number }> = [];
      config.subscribe((key, value) => calls.push({ key, value }));
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual({ key: 'core.REPLAY_WINDOW_SECONDS', value: 60 });
    });

    it('stops calling subscriber after unsubscribe', () => {
      const calls: Array<{ key: string; value: number }> = [];
      const unsub = config.subscribe((key, value) => calls.push({ key, value }));
      unsub();
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      expect(calls).toHaveLength(0);
    });

    it('calls subscriber for each key during resetAll', () => {
      config.set('core.REPLAY_WINDOW_SECONDS', 60);
      config.set('demo.FLASH_DURATION', 1000);
      const calls: string[] = [];
      config.subscribe((key) => calls.push(key));
      config.resetAll();
      expect(calls).toContain('core.REPLAY_WINDOW_SECONDS');
      expect(calls).toContain('demo.FLASH_DURATION');
    });

    it('does not call subscriber when set value equals current value', () => {
      const calls: string[] = [];
      config.subscribe((key) => calls.push(key));
      // Value is already 30 — no change expected
      config.set('core.REPLAY_WINDOW_SECONDS', 30);
      expect(calls).toHaveLength(0);
    });
  });
});

// ─── RuntimeConfigOverrides interface ────────────────────────────────────────

describe('RuntimeConfigOverrides interface', () => {
  it('accepts an object with optional replayWindowSeconds and ringBufferSize fields', () => {
    // Type-level test: TypeScript would reject this at compile time if the interface changed.
    // This proves the interface exists and accepts both optional fields.
    const overrides: RuntimeConfigOverrides = {
      replayWindowSeconds: 60,
      ringBufferSize: 200,
    };
    expect(overrides.replayWindowSeconds).toBe(60);
    expect(overrides.ringBufferSize).toBe(200);
  });

  it('accepts an empty object (all fields optional)', () => {
    const overrides: RuntimeConfigOverrides = {};
    expect(overrides.replayWindowSeconds).toBeUndefined();
    expect(overrides.ringBufferSize).toBeUndefined();
  });

  it('accepts only replayWindowSeconds without ringBufferSize', () => {
    const overrides: RuntimeConfigOverrides = { replayWindowSeconds: 10 };
    expect(overrides.replayWindowSeconds).toBe(10);
  });
});

// ─── createEventBuffer lazy getBufferSize getter ──────────────────────────────

describe('createEventBuffer with lazy getBufferSize getter', () => {
  function makeMinimalDeps() {
    const sent: Array<{ windowId: string; msg: unknown[] }> = [];
    const sendToNapplet = (windowId: string, msg: unknown[]) => sent.push({ windowId, msg });
    const sessionRegistry = {
      getPubkey: (_wid: string) => null as string | null,
      getWindowId: (_pk: string) => null as string | null,
      register: () => {},
      unregister: () => {},
      getAll: () => [] as Array<{ windowId: string; pubkey: string }>,
      has: () => false,
    };
    const enforce = (_pk: string, _cap: string) => ({ allowed: true as const, reason: '' });
    const subscriptions = new Map<string, { windowId: string; filters: [] }>();
    return { sent, sendToNapplet, sessionRegistry, enforce, subscriptions };
  }

  function makeEvent(id: string): NostrEvent {
    return {
      id,
      pubkey: 'aabb',
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [],
      content: 'test',
      sig: 'ff'.repeat(32),
    };
  }

  it('uses RING_BUFFER_SIZE as default when no getter is provided', () => {
    const { sendToNapplet, sessionRegistry, enforce, subscriptions } = makeMinimalDeps();
    const buf = createEventBuffer(sendToNapplet, sessionRegistry as any, enforce as any, subscriptions as any);
    // Fill beyond default size — should not throw
    for (let i = 0; i < RING_BUFFER_SIZE + 5; i++) {
      buf.bufferAndDeliver(makeEvent(`id-${i}`), null);
    }
    expect(buf.getBufferedEvents().length).toBe(RING_BUFFER_SIZE);
  });

  it('respects a custom buffer size from the getter', () => {
    const { sendToNapplet, sessionRegistry, enforce, subscriptions } = makeMinimalDeps();
    const customSize = 5;
    const buf = createEventBuffer(
      sendToNapplet,
      sessionRegistry as any,
      enforce as any,
      subscriptions as any,
      () => customSize,
    );
    for (let i = 0; i < 10; i++) {
      buf.bufferAndDeliver(makeEvent(`id-${i}`), null);
    }
    expect(buf.getBufferedEvents().length).toBe(customSize);
  });

  it('picks up getter value changes on subsequent calls (lazy evaluation)', () => {
    const { sendToNapplet, sessionRegistry, enforce, subscriptions } = makeMinimalDeps();
    let dynamicSize = 3;
    const buf = createEventBuffer(
      sendToNapplet,
      sessionRegistry as any,
      enforce as any,
      subscriptions as any,
      () => dynamicSize,
    );

    // Fill with size=3
    for (let i = 0; i < 3; i++) {
      buf.bufferAndDeliver(makeEvent(`first-${i}`), null);
    }
    expect(buf.getBufferedEvents().length).toBe(3);

    // Change the dynamic size to 10 — next events should grow the buffer
    dynamicSize = 10;
    for (let i = 0; i < 5; i++) {
      buf.bufferAndDeliver(makeEvent(`second-${i}`), null);
    }
    expect(buf.getBufferedEvents().length).toBe(8);
  });

  it('evicts the oldest event when buffer is at capacity', () => {
    const { sendToNapplet, sessionRegistry, enforce, subscriptions } = makeMinimalDeps();
    const buf = createEventBuffer(
      sendToNapplet,
      sessionRegistry as any,
      enforce as any,
      subscriptions as any,
      () => 2,
    );
    buf.bufferAndDeliver(makeEvent('first'), null);
    buf.bufferAndDeliver(makeEvent('second'), null);
    buf.bufferAndDeliver(makeEvent('third'), null);

    const buffered = buf.getBufferedEvents();
    expect(buffered).toHaveLength(2);
    expect(buffered[0].id).toBe('second');
    expect(buffered[1].id).toBe('third');
  });
});

// ─── createReplayDetector lazy getReplayWindow getter ─────────────────────────

describe('createReplayDetector with lazy getReplayWindow getter', () => {
  function makeEvent(id: string, createdAt: number): NostrEvent {
    return {
      id,
      pubkey: 'aabb',
      created_at: createdAt,
      kind: 1,
      tags: [],
      content: 'test',
      sig: 'ff'.repeat(32),
    };
  }

  it('accepts a valid recent event without a custom getter', () => {
    const detector = createReplayDetector();
    const now = Math.floor(Date.now() / 1000);
    const result = detector.check(makeEvent('fresh-event', now));
    expect(result).toBeNull();
  });

  it('rejects an event older than the default replay window', () => {
    const detector = createReplayDetector();
    const veryOld = Math.floor(Date.now() / 1000) - 9999;
    const result = detector.check(makeEvent('old-event', veryOld));
    expect(result).toContain('too old');
  });

  it('uses the override value from the getter instead of the default', () => {
    // A 5-second window: events 10 seconds old should be rejected
    const detector = createReplayDetector(() => 5);
    const tenSecondsAgo = Math.floor(Date.now() / 1000) - 10;
    const result = detector.check(makeEvent('stale-event', tenSecondsAgo));
    expect(result).toContain('too old');
  });

  it('accepts an event within the custom replay window', () => {
    // A 300-second window: events 10 seconds old should be accepted
    const detector = createReplayDetector(() => 300);
    const tenSecondsAgo = Math.floor(Date.now() / 1000) - 10;
    const result = detector.check(makeEvent('ok-event', tenSecondsAgo));
    expect(result).toBeNull();
  });

  it('picks up getter value changes on subsequent calls (lazy evaluation)', () => {
    let windowSecs = 5;
    const detector = createReplayDetector(() => windowSecs);
    const now = Math.floor(Date.now() / 1000);

    // 10 seconds ago — rejected with 5s window
    const result1 = detector.check(makeEvent('old-event', now - 10));
    expect(result1).toContain('too old');

    // Expand window to 60 seconds — same age now accepted
    windowSecs = 60;
    const result2 = detector.check(makeEvent('ok-event', now - 10));
    expect(result2).toBeNull();
  });

  it('rejects a duplicate event ID', () => {
    const detector = createReplayDetector();
    const now = Math.floor(Date.now() / 1000);
    detector.check(makeEvent('dup-id', now));
    const result = detector.check(makeEvent('dup-id', now));
    expect(result).toContain('duplicate');
  });

  it('rejects events with timestamps too far in the future', () => {
    const detector = createReplayDetector();
    const future = Math.floor(Date.now() / 1000) + 999;
    const result = detector.check(makeEvent('future-event', future));
    expect(result).toContain('future');
  });
});
