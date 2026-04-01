/**
 * flow-animator.ts -- Animates the visual protocol flow.
 *
 * Flashes topology nodes and edges as messages move through the layered
 * architecture view.
 */

import { BusKind } from '@napplet/shell';
import type { MessageTap, TappedMessage } from './shell-host.js';
import type { DemoTopology } from './topology.js';
import {
  getAclRuntimeEdgeId,
  getNappletEdgeId,
  getNappletNodeId,
  getNappletsShellEdgeId,
  getRuntimeServiceEdgeId,
  getShellAclEdgeId,
  getShellNodeId,
} from './topology.js';

const FLASH_DURATION = 500;
const TOPOLOGY_NODE_ACL = 'topology-node-acl';
const TOPOLOGY_NODE_RUNTIME = 'topology-node-runtime';
const TOPOLOGY_NODE_SERVICE_SIGNER = 'topology-node-service-signer';

function flashClass(el: Element, cls: string): void {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), FLASH_DURATION);
}

function flashEdge(edgeId: string, cls: 'active' | 'blocked'): void {
  const edge = document.getElementById(edgeId);
  if (edge) flashClass(edge, cls);
}

function flashNode(nodeId: string, cls: 'active' | 'blocked'): void {
  const node = document.getElementById(nodeId);
  if (node) flashClass(node, cls);
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
  return null;
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
    getNappletsShellEdgeId(),
    getShellAclEdgeId(),
    getAclRuntimeEdgeId(),
  ];

  if (msg.direction === 'napplet->shell' && serviceTarget) {
    nodes.push(serviceTarget === 'signer' ? TOPOLOGY_NODE_SERVICE_SIGNER : `topology-node-service-${serviceTarget}`);
    edges.push(getRuntimeServiceEdgeId(serviceTarget));
  }

  if (msg.direction === 'shell->napplet' && serviceTarget) {
    nodes.unshift(serviceTarget === 'signer' ? TOPOLOGY_NODE_SERVICE_SIGNER : `topology-node-service-${serviceTarget}`);
    edges.unshift(getRuntimeServiceEdgeId(serviceTarget));
  }

  return { nodes, edges };
}

export function initFlowAnimator(tap: MessageTap, topology: DemoTopology): void {
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
    const cls = isBlocked ? 'blocked' : 'active';

    const highlightPath = buildHighlightPath(topology, msg);
    if (highlightPath) {
      highlightPath.nodes.forEach((nodeId) => flashNode(nodeId, cls));
      highlightPath.edges.forEach((edgeId) => flashEdge(edgeId, cls));
    }

    totalMessages++;
    if (!counters[msg.verb]) counters[msg.verb] = { in: 0, out: 0, blocked: 0 };
    if (isBlocked) counters[msg.verb].blocked++;
    else if (msg.direction === 'napplet->shell') counters[msg.verb].out++;
    else counters[msg.verb].in++;
    renderCounters();
  });
}
