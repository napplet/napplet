/**
 * color-state.ts — Persistent directional color state for topology edges and nodes.
 *
 * Tracks per-edge-direction pass/fail/warn results using one of four
 * persistence modes: rolling window (default), decay, last-message wins, or trace.
 * Derives composite node colors from connected edge states.
 */

import { demoConfig } from './demo-config.js';
import type { DemoTopology } from './topology.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColorClass = 'active' | 'blocked';
export type PersistenceMode = 'rolling' | 'decay' | 'last-message' | 'trace';

interface EdgeDirectionEntry {
  color: ColorClass;
  timestamp: number;
}

interface EdgeDirectionState {
  /** Rolling window of recent results. */
  window: EdgeDirectionEntry[];
  /** Last result (used by decay and last-message modes). */
  lastEntry: EdgeDirectionEntry | null;
}

// ─── Module State ────────────────────────────────────────────────────────────

let _mode: PersistenceMode = 'rolling';
let _topology: DemoTopology | null = null;
let _recording = false;
let _decayTimer: ReturnType<typeof setInterval> | null = null;

/**
 * State map keyed by `${edgeId}:${direction}` where direction is 'out' or 'in'.
 */
const _state = new Map<string, EdgeDirectionState>();

const _changeListeners: Array<() => void> = [];

// ─── Initialization ─────────────────────────────────────────────────────────

/**
 * Initialize color state for a topology. Call once after topology is built.
 * Clears any previous state. Recording starts after a short delay so initial
 * AUTH handshake messages don't populate the state.
 */
export function initColorState(topology: DemoTopology): void {
  _topology = topology;
  _recording = false;
  _state.clear();
  for (const edge of topology.edges) {
    for (const dir of ['out', 'in'] as const) {
      _state.set(`${edge.id}:${dir}`, { window: [], lastEntry: null });
    }
  }
  // Start recording after initial AUTH handshake settles
  setTimeout(() => {
    _recording = true;
  }, 3000);
  _startDecayTimerIfNeeded();
}

/**
 * Enable recording immediately. Call if you need to bypass the startup delay.
 */
export function enableRecording(): void {
  _recording = true;
}

// ─── Persistence Mode ───────────────────────────────────────────────────────

export function getPersistenceMode(): PersistenceMode {
  return _mode;
}

export function setPersistenceMode(mode: PersistenceMode): void {
  if (mode === _mode) return;
  _mode = mode;
  // Clear accumulated state when switching modes so old data doesn't bleed
  for (const state of _state.values()) {
    state.window = [];
    state.lastEntry = null;
  }
  _startDecayTimerIfNeeded();
  _notifyChange();
}

// ─── Decay Timer ──────────────────────────────────────────────────────────

function _startDecayTimerIfNeeded(): void {
  // Clear existing timer
  if (_decayTimer !== null) {
    clearInterval(_decayTimer);
    _decayTimer = null;
  }
  // Only run periodic checks in decay mode
  if (_mode === 'decay') {
    _decayTimer = setInterval(() => {
      _notifyChange();
    }, 200);
  }
}

// ─── Recording ──────────────────────────────────────────────────────────────

/**
 * Record a color result for a specific edge direction.
 * @param edgeId - Topology edge ID (e.g. 'topology-edge-shell-acl')
 * @param direction - 'out' (source→target) or 'in' (target→source)
 * @param color - The classified color for this message
 */
export function recordEdgeColor(edgeId: string, direction: 'out' | 'in', color: ColorClass): void {
  // Don't record until startup delay passes
  if (!_recording) return;
  // Trace mode: persistent state is not accumulated — animations are ephemeral
  if (_mode === 'trace') return;
  const key = `${edgeId}:${direction}`;
  const state = _state.get(key);
  if (!state) return;

  const entry: EdgeDirectionEntry = { color, timestamp: Date.now() };
  state.lastEntry = entry;

  // Maintain rolling window with configurable max size
  const maxWindow = demoConfig.get('demo.ROLLING_WINDOW_SIZE');
  state.window.push(entry);
  if (state.window.length > maxWindow) {
    state.window.splice(0, state.window.length - maxWindow);
  }

  _notifyChange();
}

// ─── Edge Color Queries ─────────────────────────────────────────────────────

/**
 * Get the current resolved color for an edge direction based on active persistence mode.
 * Returns null if no data or expired (resting state).
 */
export function getEdgeColor(edgeId: string, direction: 'out' | 'in'): ColorClass | null {
  const key = `${edgeId}:${direction}`;
  const state = _state.get(key);
  if (!state) return null;

  switch (_mode) {
    case 'rolling':
      return _resolveRolling(state);
    case 'decay':
      return _resolveDecay(state);
    case 'last-message':
      return _resolveLastMessage(state);
    case 'trace':
      return null; // Trace mode has no persistent state — edges driven by animations
  }
}

function _resolveRolling(state: EdgeDirectionState): ColorClass | null {
  if (state.window.length === 0) return null;
  let blocked = 0;
  let active = 0;
  for (const entry of state.window) {
    if (entry.color === 'blocked') blocked++;
    else active++;
  }
  // Majority wins — but with small window (default 5), recent state dominates quickly.
  if (blocked >= active) return 'blocked';
  return 'active';
}

function _resolveDecay(state: EdgeDirectionState): ColorClass | null {
  if (!state.lastEntry) return null;
  const elapsed = Date.now() - state.lastEntry.timestamp;
  const decayMs = demoConfig.get('demo.DECAY_DURATION_MS');
  if (elapsed > decayMs) return null;
  return state.lastEntry.color;
}

function _resolveLastMessage(state: EdgeDirectionState): ColorClass | null {
  return state.lastEntry?.color ?? null;
}

// ─── Node Color Queries ─────────────────────────────────────────────────────

/**
 * Derive composite color for a node's inbound direction.
 * Aggregates all connected edge 'in' states.
 * green = all active, red = any blocked.
 */
export function getNodeInboundColor(nodeId: string): ColorClass | null {
  return _deriveNodeColor(nodeId, 'in');
}

/**
 * Derive composite color for a node's outbound direction.
 * Aggregates all connected edge 'out' states.
 */
export function getNodeOutboundColor(nodeId: string): ColorClass | null {
  return _deriveNodeColor(nodeId, 'out');
}

function _deriveNodeColor(nodeId: string, direction: 'out' | 'in'): ColorClass | null {
  if (!_topology) return null;

  // Find all edges connected to this node
  const connectedEdges = _topology.edges.filter(
    (e) => e.from === nodeId || e.to === nodeId,
  );

  if (connectedEdges.length === 0) return null;

  const colors: ColorClass[] = [];
  for (const edge of connectedEdges) {
    const color = getEdgeColor(edge.id, direction);
    if (color) colors.push(color);
  }

  if (colors.length === 0) return null;

  // Any blocked edge = blocked node. Otherwise active.
  if (colors.includes('blocked')) return 'blocked';
  return 'active';
}

// ─── Trace Mode: Direct Node Overlay Updates ────────────────────────────────

/**
 * Directly set a node overlay color during trace mode.
 * Bypasses the persistent state system — used by trace-animator
 * to update node borders in sync with edge sweeps.
 */
export function setNodeOverlayColor(
  nodeId: string,
  direction: 'inbound' | 'outbound',
  color: ColorClass | null,
): void {
  const el = document.querySelector<HTMLElement>(
    `[data-color-overlay="${nodeId}"][data-color-direction="${direction}"]`,
  );
  if (!el) return;
  el.classList.remove('node-color-active', 'node-color-blocked');
  if (color) el.classList.add(`node-color-${color}`);
}

/**
 * Clear all node overlay colors. Used when entering trace mode
 * or when trace animations complete.
 */
export function clearAllNodeOverlays(): void {
  const overlays = document.querySelectorAll<HTMLElement>('.node-color-overlay');
  for (const el of overlays) {
    el.classList.remove('node-color-active', 'node-color-blocked');
  }
}

// ─── Change Notification ────────────────────────────────────────────────────

export function onColorStateChange(callback: () => void): () => void {
  _changeListeners.push(callback);
  return () => {
    const idx = _changeListeners.indexOf(callback);
    if (idx !== -1) _changeListeners.splice(idx, 1);
  };
}

function _notifyChange(): void {
  for (const cb of _changeListeners) {
    try { cb(); } catch { /* ignore listener errors */ }
  }
}
