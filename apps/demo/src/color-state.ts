/**
 * color-state.ts — Persistent directional color state for topology edges and nodes.
 *
 * Tracks per-edge-direction pass/fail/warn results using one of three
 * persistence modes: rolling window (default), decay, or last-message wins.
 * Derives composite node colors from connected edge states.
 */

import { demoConfig } from './demo-config.js';
import type { DemoTopology } from './topology.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColorClass = 'active' | 'amber' | 'blocked';
export type PersistenceMode = 'rolling' | 'decay' | 'last-message';

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

/**
 * State map keyed by `${edgeId}:${direction}` where direction is 'out' or 'in'.
 */
const _state = new Map<string, EdgeDirectionState>();

const _changeListeners: Array<() => void> = [];

// ─── Initialization ─────────────────────────────────────────────────────────

/**
 * Initialize color state for a topology. Call once after topology is built.
 * Clears any previous state.
 */
export function initColorState(topology: DemoTopology): void {
  _topology = topology;
  _state.clear();
  for (const edge of topology.edges) {
    for (const dir of ['out', 'in'] as const) {
      _state.set(`${edge.id}:${dir}`, { window: [], lastEntry: null });
    }
  }
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
  _notifyChange();
}

// ─── Recording ──────────────────────────────────────────────────────────────

/**
 * Record a color result for a specific edge direction.
 * @param edgeId - Topology edge ID (e.g. 'topology-edge-shell-acl')
 * @param direction - 'out' (source→target) or 'in' (target→source)
 * @param color - The classified color for this message
 */
export function recordEdgeColor(edgeId: string, direction: 'out' | 'in', color: ColorClass): void {
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
  }
}

function _resolveRolling(state: EdgeDirectionState): ColorClass | null {
  if (state.window.length === 0) return null;
  const counts: Record<ColorClass, number> = { active: 0, amber: 0, blocked: 0 };
  for (const entry of state.window) {
    counts[entry.color]++;
  }
  // Majority wins. Ties: blocked > amber > active (worst-case bias for safety).
  const max = Math.max(counts.active, counts.amber, counts.blocked);
  if (max === 0) return null;
  if (counts.blocked === max) return 'blocked';
  if (counts.amber === max) return 'amber';
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
 * green = all active, red = all blocked, amber = mixed or any amber.
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

  const hasBlocked = colors.includes('blocked');
  const hasAmber = colors.includes('amber');
  const hasActive = colors.includes('active');

  // All same → that color. Mixed → amber.
  if (hasBlocked && !hasActive && !hasAmber) return 'blocked';
  if (hasActive && !hasBlocked && !hasAmber) return 'active';
  return 'amber';
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
