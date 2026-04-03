/**
 * trace-animator.ts — Hop-by-hop edge color sweep animation for trace mode.
 *
 * When trace mode is active, each protocol message triggers a sequential
 * sweep animation through its routing path. Edges light up one at a time
 * with color reflecting pass/fail state at each hop. Node overlays update
 * in sync with the sweep. Multiple animations overlap independently.
 */

import type { EdgeFlasher } from './topology.js';
import type { ColorClass } from './color-state.js';
import { setNodeOverlayColor } from './color-state.js';
import { demoConfig } from './demo-config.js';
import type { DemoTopology } from './topology.js';

// ─── Active Animation Tracking ──────────────────────────────────────────────

/**
 * Per-edge-direction count of active animations.
 * Only revert to resting when count drops to zero.
 */
const _activeAnimations = new Map<string, number>();

/**
 * Per-node-direction count of active animations.
 * Only revert to resting when count drops to zero.
 */
const _activeNodeAnimations = new Map<string, number>();

/** All pending timeout IDs for cleanup on mode switch. */
const _pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

function _key(id: string, direction: string): string {
  return `${id}:${direction}`;
}

function _increment(map: Map<string, number>, id: string, direction: string): void {
  const k = _key(id, direction);
  map.set(k, (map.get(k) ?? 0) + 1);
}

function _decrement(map: Map<string, number>, id: string, direction: string): number {
  const k = _key(id, direction);
  const count = (map.get(k) ?? 1) - 1;
  map.set(k, Math.max(0, count));
  return Math.max(0, count);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Animate a single message trace through the topology edges hop-by-hop.
 * Also updates node overlays in sync with the edge sweep.
 *
 * @param edgeFlasher - The EdgeFlasher from topology.ts
 * @param edges - Ordered edge IDs along the message path
 * @param nodes - Ordered node IDs along the message path
 * @param topology - The DemoTopology for resolving edge→node connections
 * @param cls - Classified color for the message ('active', 'amber', 'blocked')
 * @param failureEdgeIndex - Index of the first edge that should show failure color.
 * @param direction - 'out' or 'in' — which LeaderLine instance to animate
 */
export function animateTrace(
  edgeFlasher: EdgeFlasher,
  edges: string[],
  nodes: string[],
  topology: DemoTopology,
  cls: ColorClass,
  failureEdgeIndex: number,
  direction: 'out' | 'in',
): void {
  const hopDuration = demoConfig.get('demo.TRACE_HOP_DURATION_MS');
  const nodeDirection = direction === 'out' ? 'outbound' : 'inbound';

  for (let i = 0; i < edges.length; i++) {
    const edgeId = edges[i];
    const edgeColor: ColorClass = i < failureEdgeIndex ? 'active' : cls;

    // Find the node at this hop position
    const nodeId = i < nodes.length ? nodes[i] : null;
    // The receiving node at the end of this edge
    const nextNodeId = (i + 1) < nodes.length ? nodes[i + 1] : null;

    // Stagger: each hop starts after the previous one
    const startDelay = i * hopDuration;

    const startTimeout = setTimeout(() => {
      _pendingTimeouts.delete(startTimeout);
      // Flash edge
      _increment(_activeAnimations, edgeId, direction);
      edgeFlasher.setColor(edgeId, direction, edgeColor);
      // Flash source node overlay
      if (nodeId) {
        _increment(_activeNodeAnimations, nodeId, nodeDirection);
        setNodeOverlayColor(nodeId, nodeDirection, edgeColor);
      }
      // Flash receiving node overlay
      if (nextNodeId) {
        const recvDirection = direction === 'out' ? 'inbound' : 'outbound';
        _increment(_activeNodeAnimations, nextNodeId, recvDirection);
        setNodeOverlayColor(nextNodeId, recvDirection, edgeColor);
      }
    }, startDelay);
    _pendingTimeouts.add(startTimeout);

    // Revert after this hop's duration (only if no other animation is active)
    const revertDelay = startDelay + hopDuration;
    const revertTimeout = setTimeout(() => {
      _pendingTimeouts.delete(revertTimeout);
      // Revert edge
      const remainingEdge = _decrement(_activeAnimations, edgeId, direction);
      if (remainingEdge === 0) {
        edgeFlasher.setColor(edgeId, direction, null);
      }
      // Revert source node
      if (nodeId) {
        const remainingNode = _decrement(_activeNodeAnimations, nodeId, nodeDirection);
        if (remainingNode === 0) {
          setNodeOverlayColor(nodeId, nodeDirection, null);
        }
      }
      // Revert receiving node
      if (nextNodeId) {
        const recvDirection = direction === 'out' ? 'inbound' : 'outbound';
        const remainingRecv = _decrement(_activeNodeAnimations, nextNodeId, recvDirection);
        if (remainingRecv === 0) {
          setNodeOverlayColor(nextNodeId, recvDirection, null);
        }
      }
    }, revertDelay);
    _pendingTimeouts.add(revertTimeout);
  }
}

/**
 * Cancel all pending trace animations and reset edge states.
 * Call when switching away from trace mode to prevent lingering timeouts.
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
  _activeNodeAnimations.clear();

  // Reset all edges to resting color
  for (const edgeId of edgeIds) {
    edgeFlasher.setColor(edgeId, 'out', null);
    edgeFlasher.setColor(edgeId, 'in', null);
  }
}
