/**
 * trace-animator.ts — Hop-by-hop edge color sweep animation for trace mode.
 *
 * When trace mode is active, each protocol message triggers a sequential
 * sweep animation through its routing path. Edges light up one at a time
 * with color reflecting pass/fail state at each hop. Multiple animations
 * overlap independently — no queue, no drop.
 */

import type { EdgeFlasher } from './topology.js';
import type { ColorClass } from './color-state.js';
import { demoConfig } from './demo-config.js';

// ─── Active Animation Tracking ──────────────────────────────────────────────

/**
 * Per-edge-direction count of active animations.
 * Only revert to resting when count drops to zero.
 */
const _activeAnimations = new Map<string, number>();

/** All pending timeout IDs for cleanup on mode switch. */
const _pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

function _key(edgeId: string, direction: 'out' | 'in'): string {
  return `${edgeId}:${direction}`;
}

function _increment(edgeId: string, direction: 'out' | 'in'): void {
  const k = _key(edgeId, direction);
  _activeAnimations.set(k, (_activeAnimations.get(k) ?? 0) + 1);
}

function _decrement(edgeId: string, direction: 'out' | 'in'): number {
  const k = _key(edgeId, direction);
  const count = (_activeAnimations.get(k) ?? 1) - 1;
  _activeAnimations.set(k, Math.max(0, count));
  return Math.max(0, count);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Animate a single message trace through the topology edges hop-by-hop.
 *
 * Each edge in the path lights up sequentially. Edges before the failure
 * point get 'active' (green), edges at/after get the failure color.
 * After each hop completes, the edge reverts to resting — but only if
 * no other animation is still active on that edge.
 *
 * @param edgeFlasher - The EdgeFlasher from topology.ts
 * @param edges - Ordered edge IDs along the message path
 * @param cls - Classified color for the message ('active', 'amber', 'blocked')
 * @param failureEdgeIndex - Index of the first edge that should show failure color.
 *   For success messages, pass edges.length (all edges are green).
 * @param direction - 'out' or 'in' — which LeaderLine instance to animate
 */
export function animateTrace(
  edgeFlasher: EdgeFlasher,
  edges: string[],
  cls: ColorClass,
  failureEdgeIndex: number,
  direction: 'out' | 'in',
): void {
  const hopDuration = demoConfig.get('demo.TRACE_HOP_DURATION_MS');

  for (let i = 0; i < edges.length; i++) {
    const edgeId = edges[i];
    const edgeColor: ColorClass = i < failureEdgeIndex ? 'active' : cls;

    // Stagger: each hop starts after the previous one
    const startDelay = i * hopDuration;

    const startTimeout = setTimeout(() => {
      _pendingTimeouts.delete(startTimeout);
      _increment(edgeId, direction);
      edgeFlasher.setColor(edgeId, direction, edgeColor);
    }, startDelay);
    _pendingTimeouts.add(startTimeout);

    // Revert after this hop's duration (only if no other animation is active)
    const revertDelay = startDelay + hopDuration;
    const revertTimeout = setTimeout(() => {
      _pendingTimeouts.delete(revertTimeout);
      const remaining = _decrement(edgeId, direction);
      if (remaining === 0) {
        edgeFlasher.setColor(edgeId, direction, null);
      }
    }, revertDelay);
    _pendingTimeouts.add(revertTimeout);
  }
}

/**
 * Cancel all pending trace animations and reset edge states.
 * Call when switching away from trace mode to prevent lingering timeouts.
 *
 * @param edgeFlasher - The EdgeFlasher to reset edge colors
 * @param edgeIds - All topology edge IDs to reset
 */
export function cancelAllTraceAnimations(
  edgeFlasher: EdgeFlasher,
  edgeIds: string[],
): void {
  // Clear all pending timeouts
  for (const timeoutId of _pendingTimeouts) {
    clearTimeout(timeoutId);
  }
  _pendingTimeouts.clear();
  _activeAnimations.clear();

  // Reset all edges to resting color
  for (const edgeId of edgeIds) {
    edgeFlasher.setColor(edgeId, 'out', null);
    edgeFlasher.setColor(edgeId, 'in', null);
  }
}
