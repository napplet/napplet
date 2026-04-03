/**
 * flow-animator.ts -- Animates the visual protocol flow.
 *
 * Flashes topology nodes and edges as messages move through the layered
 * architecture view.
 */

import { BusKind } from '@napplet/shell';
import type { MessageTap, TappedMessage } from './shell-host.js';
import type { DemoTopology, EdgeFlasher } from './topology.js';
import {
  getAclRuntimeEdgeId,
  getNappletEdgeId,
  getNappletNodeId,
  getRuntimeServiceEdgeId,
  getShellAclEdgeId,
  getShellNodeId,
} from './topology.js';
import { recordEdgeColor, getEdgeColor, onColorStateChange, getPersistenceMode } from './color-state.js';
import { animateTrace } from './trace-animator.js';
import { demoConfig } from './demo-config.js';
const TOPOLOGY_NODE_ACL = 'topology-node-acl';
const TOPOLOGY_NODE_RUNTIME = 'topology-node-runtime';
const TOPOLOGY_NODE_SERVICE_SIGNER = 'topology-node-service-signer';
const TOPOLOGY_NODE_SERVICE_NOTIFICATIONS = 'topology-node-service-notifications';

function flashClass(el: Element, cls: string): void {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), demoConfig.get('demo.FLASH_DURATION'));
}

function flashEdge(edgeId: string, cls: 'active' | 'blocked'): void {
  const edge = document.getElementById(edgeId);
  if (edge) flashClass(edge, cls);
}



function getNappletName(topology: DemoTopology, windowId?: string): string | null {
  if (!windowId) return null;
  const frame = document.getElementById(windowId);
  const containerId = frame?.parentElement?.id;
  if (!containerId) return null;

  const napplet = topology.napplets.find((candidate) => candidate.frameContainerId === containerId);
  return napplet?.name ?? null;
}

function detectServiceTarget(topology: DemoTopology, msg: TappedMessage): string | null {
  if (
    (msg.parsed.eventKind === BusKind.SIGNER_REQUEST || msg.parsed.eventKind === BusKind.SIGNER_RESPONSE) &&
    topology.services.includes('signer')
  ) {
    return 'signer';
  }

  // NEW: Detect signer errors via OK response with signer-related reason
  if (
    msg.verb === 'OK' &&
    typeof msg.parsed.reason === 'string' &&
    (msg.parsed.reason.includes('no signer') || msg.parsed.reason.includes('signer')) &&
    topology.services.includes('signer')
  ) {
    return 'signer';
  }

  // Notifications detection
  if (
    typeof msg.parsed.topic === 'string' &&
    msg.parsed.topic.startsWith('notifications:') &&
    topology.services.includes('notifications')
  ) {
    return 'notifications';
  }
  return null;
}

function isNotificationTopic(msg: TappedMessage): boolean {
  return typeof msg.parsed.topic === 'string' && msg.parsed.topic.startsWith('notifications:');
}

/**
 * Identify which node in the highlight path is the failure point.
 * ACL denials → ACL node. Infrastructure errors → runtime or relevant service.
 * Falls back to the last node in the path if source is unclear.
 */
function identifyFailureNode(nodes: string[], msg: TappedMessage): number {
  const reasonString = typeof msg.raw?.[3] === 'string' ? msg.raw[3] : '';

  // ACL denial: failure at the ACL node
  if (reasonString.startsWith('denied:')) {
    const aclIndex = nodes.indexOf(TOPOLOGY_NODE_ACL);
    if (aclIndex !== -1) return aclIndex;
  }

  // Infrastructure error (no signer, timeout, etc.): failure at runtime or service
  if (
    reasonString.includes('no signer') ||
    reasonString.includes('signer')
  ) {
    const signerIndex = nodes.indexOf(TOPOLOGY_NODE_SERVICE_SIGNER);
    if (signerIndex !== -1) return signerIndex;
  }

  if (
    reasonString.includes('relay') ||
    reasonString.includes('timeout') ||
    reasonString.includes('not wired') ||
    reasonString.includes('mock')
  ) {
    const runtimeIndex = nodes.indexOf(TOPOLOGY_NODE_RUNTIME);
    if (runtimeIndex !== -1) return runtimeIndex;
  }

  // Fallback: last node in path
  return nodes.length - 1;
}

function buildHighlightPath(topology: DemoTopology, msg: TappedMessage): { nodes: string[]; edges: string[] } | null {
  const nappletName = getNappletName(topology, msg.windowId);
  if (!nappletName) return null;

  const serviceTarget = detectServiceTarget(topology, msg);
  const nodes: string[] = [
    getNappletNodeId(nappletName),
    getShellNodeId(),
    TOPOLOGY_NODE_ACL,
    TOPOLOGY_NODE_RUNTIME,
  ];
  const edges: string[] = [
    getNappletEdgeId(nappletName),
    getShellAclEdgeId(),
    getAclRuntimeEdgeId(),
  ];

  function getServiceNodeIdForTarget(target: string): string {
    if (target === 'signer') return TOPOLOGY_NODE_SERVICE_SIGNER;
    if (target === 'notifications') return TOPOLOGY_NODE_SERVICE_NOTIFICATIONS;
    return `topology-node-service-${target}`;
  }

  if (msg.direction === 'napplet->shell' && serviceTarget) {
    nodes.push(getServiceNodeIdForTarget(serviceTarget));
    edges.push(getRuntimeServiceEdgeId(serviceTarget));
  }

  if (msg.direction === 'shell->napplet' && serviceTarget) {
    nodes.unshift(getServiceNodeIdForTarget(serviceTarget));
    edges.unshift(getRuntimeServiceEdgeId(serviceTarget));
  }

  // Also flash notification node for host-originated notification events (no napplet windowId)
  if (isNotificationTopic(msg) && !nappletName) {
    nodes.push(TOPOLOGY_NODE_SERVICE_NOTIFICATIONS);
    edges.push(getRuntimeServiceEdgeId('notifications'));
    nodes.push(TOPOLOGY_NODE_RUNTIME);
    edges.push(getAclRuntimeEdgeId());
    return { nodes, edges };
  }

  return { nodes, edges };
}

export function initFlowAnimator(tap: MessageTap, topology: DemoTopology, edgeFlasher?: EdgeFlasher): void {
  const flowLog = document.getElementById('shell-flow-log');

  // Live counters grouped by verb
  const counters: Record<string, { in: number; out: number; blocked: number }> = {};
  let totalMessages = 0;

  function renderCounters(): void {
    if (!flowLog) return;
    const verbs = Object.keys(counters).sort();
    flowLog.innerHTML = `<div style="color:#666;margin-bottom:4px">${totalMessages} total messages</div>` +
      verbs.map((verb) => {
        const counter = counters[verb];
        const parts: string[] = [];
        if (counter.in > 0) parts.push(`<span style="color:#39ff14">↓${counter.in}</span>`);
        if (counter.out > 0) parts.push(`<span style="color:#00f0ff">↑${counter.out}</span>`);
        if (counter.blocked > 0) parts.push(`<span style="color:#ff3b3b">✗${counter.blocked}</span>`);
        return `<div><span style="color:#b388ff;font-weight:600">${verb}</span> ${parts.join(' ')}</div>`;
      }).join('');
  }

  tap.onMessage((msg) => {
    const isOkFalse = msg.verb === 'OK' && msg.raw?.[2] === false;
    const isClosedDenied = msg.verb === 'CLOSED' && typeof msg.raw?.[2] === 'string' &&
      (msg.raw[2].includes('denied') || msg.raw[2].startsWith('blocked:'));
    const isBlocked = isOkFalse || isClosedDenied;

    // Simple: red for any failure, green for success. No amber.
    const cls: 'active' | 'blocked' = isBlocked ? 'blocked' : 'active';

    const highlightPath = buildHighlightPath(topology, msg);

    // ─── Directional Color Dispatch ──────────────────────────────────────────
    if (highlightPath && edgeFlasher) {
      const { nodes, edges } = highlightPath;
      const isFailure = cls === 'blocked';
      const isTrace = getPersistenceMode() === 'trace';

      if (isTrace) {
        // Trace mode: hop-by-hop sweep animation, no persistent state, no node flashing
        const direction = msg.direction === 'napplet->shell' ? 'out' as const : 'in' as const;
        const failureEdgeIndex = isFailure ? identifyFailureNode(nodes, msg) : edges.length;
        animateTrace(edgeFlasher, edges, nodes, topology, cls, failureEdgeIndex, direction);
      } else if (!isFailure) {
        // Success: all edges get 'active' in the message direction
        const direction = msg.direction === 'napplet->shell' ? 'out' : 'in';
        for (const edgeId of edges) {
          edgeFlasher.flashDirection(edgeId, direction, 'active');
          recordEdgeColor(edgeId, direction, 'active');
        }
      } else {
        // Failure: identify failure point and split path
        const failureNodeIndex = identifyFailureNode(nodes, msg);
        const direction = msg.direction === 'napplet->shell' ? 'out' : 'in';

        for (let i = 0; i < edges.length; i++) {
          if (i < failureNodeIndex) {
            // Edge before failure: green in message direction
            edgeFlasher.flashDirection(edges[i], direction, 'active');
            recordEdgeColor(edges[i], direction, 'active');
          } else {
            // Edge at or after failure: failure color
            edgeFlasher.flashDirection(edges[i], direction, cls);
            recordEdgeColor(edges[i], direction, cls);
          }
        }
      }
    } else if (highlightPath) {
      // Fallback without edgeFlasher (unlikely but safe)
      highlightPath.edges.forEach((edgeId) => flashEdge(edgeId, cls));
    }

    totalMessages++;
    if (!counters[msg.verb]) counters[msg.verb] = { in: 0, out: 0, blocked: 0 };
    if (isBlocked) counters[msg.verb].blocked++;
    else if (msg.direction === 'napplet->shell') counters[msg.verb].out++;
    else counters[msg.verb].in++;
    renderCounters();

    // Log notification service activity with the exact topic string
    if (isNotificationTopic(msg) && flowLog) {
      const topicLabel = msg.parsed.topic ?? 'notifications:?';
      const existing = flowLog.querySelector(`[data-notif-topic="${topicLabel}"]`);
      if (!existing) {
        const entry = document.createElement('div');
        entry.dataset.notifTopic = topicLabel;
        entry.style.cssText = 'color:#39ff14;font-size:10px;margin-top:2px';
        entry.textContent = topicLabel;
        flowLog.appendChild(entry);
      }
    }
  });

  // ─── Persistent Edge Color Rendering ────────────────────────────────────
  if (edgeFlasher) {
    onColorStateChange(() => {
      for (const edge of topology.edges) {
        for (const dir of ['out', 'in'] as const) {
          const color = getEdgeColor(edge.id, dir);
          edgeFlasher.setColor(edge.id, dir, color);
        }
      }
    });
  }
}
