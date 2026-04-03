/**
 * node-details.ts -- Node detail adapter for the demo topology.
 *
 * Enriches each topology node with live, role-specific summary data and
 * provides the shared detail shape used by both collapsed node summaries
 * and the right-side inspector panel.
 *
 * Data-first: this module produces plain objects — no HTML strings.
 */

import type { DemoTopology, DemoTopologyNode, TopologyNodeRole } from './topology.js';
import type { NappletInfo, MessageTap, TappedMessage } from './shell-host.js';
import type { DemoProtocolPath } from './shell-host.js';
import { getAclDenials, getGlobalAclDenials } from './acl-history.js';
import type { AclHistoryEntry } from './acl-history.js';
import { DEMO_CAPABILITY_LABELS } from './acl-panel.js';
import type { Capability } from '@napplet/shell';

// ─── Activity History ────────────────────────────────────────────────────────

export interface NodeActivityEntry {
  path: DemoProtocolPath | string;
  direction: TappedMessage['direction'];
  blocked: boolean;
  timestamp: number;
}

const ACTIVITY_RING_SIZE = 12;

// Per-node bounded ring buffer of recent activity
const nodeActivityRings = new Map<string, NodeActivityEntry[]>();

function pushActivity(nodeId: string, entry: NodeActivityEntry): void {
  let ring = nodeActivityRings.get(nodeId);
  if (!ring) {
    ring = [];
    nodeActivityRings.set(nodeId, ring);
  }
  ring.push(entry);
  if (ring.length > ACTIVITY_RING_SIZE) ring.shift();
}

export function getNodeActivity(nodeId: string): NodeActivityEntry[] {
  return nodeActivityRings.get(nodeId) ?? [];
}

// ─── Summary Fields ──────────────────────────────────────────────────────────

export interface SummaryField {
  label: string;
  value: string;
}

// ─── Node Detail Record ──────────────────────────────────────────────────────

export interface NodeDetail {
  /** Stable topology node id, e.g. "topology-node-shell" */
  id: string;
  /** Node role for role-specific rendering */
  role: TopologyNodeRole;
  /** Human-readable node title / label */
  title: string;
  /** 2-4 compact summary fields for collapsed node view */
  summaryFields: SummaryField[];
  /** Richer sections for the inspector panel */
  inspectorSections: InspectorSection[];
  /** Recent per-node activity derived from live tap signals */
  recentActivity: NodeActivityEntry[];
  /** ACL denial history entries for this node (napplet role only). */
  aclDenials: AclHistoryEntry[];
  /** Whether drill-down / inspector is supported for this node */
  drillDownSupported: boolean;
}

export interface InspectorSection {
  heading: string;
  items: SummaryField[];
}

// ─── Live State Sources ──────────────────────────────────────────────────────

interface NodeDetailSources {
  /** All current napplets mapped by windowId */
  napplets: Map<string, NappletInfo>;
  /** Number of registered services */
  serviceCount: number;
  /** Registered service names */
  serviceNames: string[];
  /** Host public key (truncated) */
  hostPubkey: string;
  /** Total tapped message count */
  totalMessages: number;
  /** Total blocked messages */
  totalBlocked: number;
}

function truncate(s: string, max = 20): string {
  return s.length > max ? `${s.substring(0, max)}…` : s;
}

// ─── Role-Specific Detail Builders ───────────────────────────────────────────

function buildNappletDetail(
  node: DemoTopologyNode,
  sources: NodeDetailSources,
  options?: NodeDetailOptions,
): NodeDetail {
  const name = node.name ?? node.label;
  // Find the matching NappletInfo for this topology node
  let info: NappletInfo | undefined;
  let nappletWindowId = '';
  for (const [wid, ni] of sources.napplets) {
    if (ni.name === name) { info = ni; nappletWindowId = wid; break; }
  }

  const authStatus = info?.authenticated ? 'authenticated' : 'pending';
  const pubkeyDisplay = info?.pubkey ? truncate(info.pubkey, 12) : '—';
  const denials = nappletWindowId ? getAclDenials(nappletWindowId) : [];
  const activity = getNodeActivity(node.id);

  const summaryFields: SummaryField[] = [
    { label: 'auth', value: authStatus },
    { label: 'pubkey', value: pubkeyDisplay },
    { label: 'activity', value: `${activity.length} recent` },
  ];

  const inspectorSections: InspectorSection[] = [
    {
      heading: 'Current State',
      items: [
        { label: 'auth', value: authStatus },
        { label: 'pubkey', value: info?.pubkey ? truncate(info.pubkey, 24) : '—' },
        { label: 'dTag', value: info?.dTag ?? '—' },
        { label: 'aggregateHash', value: info?.aggregateHash ? truncate(info.aggregateHash, 16) : '—' },
      ],
    },
    {
      heading: 'ACL Capabilities',
      items: (() => {
        if (!info?.pubkey || !options?.checkCapability) {
          return [{ label: 'status', value: info?.pubkey ? 'checking...' : 'not authenticated' }];
        }
        const dTag = info.dTag ?? '';
        const hash = info.aggregateHash ?? '';
        const allCaps: Capability[] = [
          'relay:read', 'relay:write', 'cache:read', 'cache:write',
          'sign:event', 'sign:nip04', 'sign:nip44',
          'state:read', 'state:write', 'hotkey:forward',
        ];
        const items: SummaryField[] = [];
        for (const cap of allCaps) {
          const allowed = options.checkCapability(info.pubkey, dTag, hash, cap);
          const label = DEMO_CAPABILITY_LABELS[cap as Capability] ?? cap;
          items.push({ label, value: allowed ? 'granted' : 'revoked' });
        }
        items.push({ label: 'recorded denials', value: `${denials.length}` });
        return items;
      })(),
    },
  ];

  return {
    id: node.id,
    role: 'napplet',
    title: node.label,
    summaryFields,
    inspectorSections,
    recentActivity: activity,
    aclDenials: denials,
    drillDownSupported: true,
  };
}

function buildShellDetail(
  node: DemoTopologyNode,
  sources: NodeDetailSources,
): NodeDetail {
  const nappletCount = sources.napplets.size;
  const pubkeyDisplay = truncate(sources.hostPubkey, 16);
  const activity = getNodeActivity(node.id);

  const summaryFields: SummaryField[] = [
    { label: 'pubkey', value: pubkeyDisplay },
    { label: 'napplets', value: `${nappletCount}` },
    { label: 'messages', value: `${sources.totalMessages}` },
  ];

  const inspectorSections: InspectorSection[] = [
    {
      heading: 'Current State',
      items: [
        { label: 'host pubkey', value: sources.hostPubkey ? truncate(sources.hostPubkey, 32) : '—' },
        { label: 'loaded napplets', value: `${nappletCount}` },
        { label: 'total messages', value: `${sources.totalMessages}` },
        { label: 'blocked messages', value: `${sources.totalBlocked}` },
      ],
    },
  ];

  return {
    id: node.id,
    role: 'shell',
    title: node.label,
    summaryFields,
    inspectorSections,
    recentActivity: activity,
    aclDenials: [],
    drillDownSupported: true,
  };
}

function buildAclDetail(
  node: DemoTopologyNode,
  sources: NodeDetailSources,
): NodeDetail {
  const activity = getNodeActivity(node.id);
  const blockedMessages = sources.totalBlocked;
  const blockedActivity = activity.filter((entry) => entry.blocked).length;
  const globalDenials = getGlobalAclDenials();

  const summaryFields: SummaryField[] = [
    { label: 'denied', value: `${blockedMessages}` },
    { label: 'recent blocks', value: `${blockedActivity}` },
    { label: 'napplets', value: `${sources.napplets.size}` },
  ];

  const inspectorSections: InspectorSection[] = [
    {
      heading: 'Current State',
      items: [
        { label: 'total denied', value: `${blockedMessages}` },
        { label: 'recent denials (buffer)', value: `${globalDenials.length}` },
        { label: 'napplets under gate', value: `${sources.napplets.size}` },
      ],
    },
  ];

  return {
    id: node.id,
    role: 'acl',
    title: node.label,
    summaryFields,
    inspectorSections,
    recentActivity: activity,
    aclDenials: globalDenials,
    drillDownSupported: true,
  };
}

function buildRuntimeDetail(
  node: DemoTopologyNode,
  sources: NodeDetailSources,
): NodeDetail {
  const activity = getNodeActivity(node.id);
  const authedCount = [...sources.napplets.values()].filter((n) => n.authenticated).length;

  const summaryFields: SummaryField[] = [
    { label: 'services', value: `${sources.serviceCount}` },
    { label: 'authed napplets', value: `${authedCount}` },
    { label: 'messages routed', value: `${sources.totalMessages}` },
  ];

  const inspectorSections: InspectorSection[] = [
    {
      heading: 'Current State',
      items: [
        { label: 'registered services', value: sources.serviceNames.join(', ') || 'none' },
        { label: 'authenticated napplets', value: `${authedCount}` },
        { label: 'total messages routed', value: `${sources.totalMessages}` },
      ],
    },
  ];

  return {
    id: node.id,
    role: 'runtime',
    title: node.label,
    summaryFields,
    inspectorSections,
    recentActivity: activity,
    aclDenials: [],
    drillDownSupported: true,
  };
}

function buildServiceDetail(
  node: DemoTopologyNode,
  _sources: NodeDetailSources,
): NodeDetail {
  const name = node.name ?? node.label;
  const activity = getNodeActivity(node.id);
  const lastAction = activity.length > 0
    ? activity[activity.length - 1].path
    : '—';

  const summaryFields: SummaryField[] = [
    { label: 'service', value: name },
    { label: 'last action', value: lastAction },
    { label: 'activity', value: `${activity.length} recent` },
  ];

  const inspectorSections: InspectorSection[] = [
    {
      heading: 'Current State',
      items: [
        { label: 'service name', value: name },
        { label: 'last action', value: lastAction },
        { label: 'recent actions', value: `${activity.length}` },
      ],
    },
  ];

  return {
    id: node.id,
    role: 'service',
    title: node.label,
    summaryFields,
    inspectorSections,
    recentActivity: activity,
    aclDenials: [],
    drillDownSupported: true,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface NodeDetailOptions {
  napplets: Map<string, NappletInfo>;
  serviceNames: string[];
  hostPubkey: string;
  totalMessages: number;
  totalBlocked: number;
  /** Check a capability for a napplet. Returns true if allowed. */
  checkCapability?: (pubkey: string, dTag: string, hash: string, cap: string) => boolean;
}

/**
 * Build a node detail record for a single topology node.
 *
 * @param node - Topology node with stable id and role
 * @param options - Live demo state sources
 * @returns NodeDetail record for collapsed summary and inspector
 */
export function buildNodeDetails(
  node: DemoTopologyNode,
  options: NodeDetailOptions,
): NodeDetail {
  const sources: NodeDetailSources = {
    napplets: options.napplets,
    serviceCount: options.serviceNames.length,
    serviceNames: options.serviceNames,
    hostPubkey: options.hostPubkey,
    totalMessages: options.totalMessages,
    totalBlocked: options.totalBlocked,
  };

  switch (node.role) {
    case 'napplet': return buildNappletDetail(node, sources, options);
    case 'shell': return buildShellDetail(node, sources);
    case 'acl': return buildAclDetail(node, sources);
    case 'runtime': return buildRuntimeDetail(node, sources);
    case 'service': return buildServiceDetail(node, sources);
  }
}

/**
 * Build node detail records for all nodes in a topology.
 *
 * @param topology - Full demo topology
 * @param options - Live demo state sources
 * @returns Map from node id to NodeDetail
 */
export function buildAllNodeDetails(
  topology: DemoTopology,
  options: NodeDetailOptions,
): Map<string, NodeDetail> {
  const result = new Map<string, NodeDetail>();
  for (const node of topology.nodes) {
    result.set(node.id, buildNodeDetails(node, options));
  }
  return result;
}

/**
 * Wire up the activity projection — call once after the tap is installed.
 * Classifies each tapped message and pushes entries to the relevant node rings.
 *
 * @param tap - Live message tap from shell-host
 * @param topology - Demo topology for node id lookup
 * @param classifyPath - Path classifier from debugger (classifyTappedMessagePath); passed in to avoid circular imports
 */
export function installActivityProjection(
  tap: MessageTap,
  topology: DemoTopology,
  classifyPath: (msg: TappedMessage) => DemoProtocolPath | null,
): () => void {
  return tap.onMessage((msg) => {
    const path = classifyPath(msg) ?? msg.verb;
    const isOkFalse = msg.verb === 'OK' && msg.raw?.[2] === false;
    const isClosedDenied =
      msg.verb === 'CLOSED' &&
      typeof msg.raw?.[2] === 'string' &&
      (String(msg.raw[2]).includes('denied') || String(msg.raw[2]).startsWith('blocked:'));
    const blocked = isOkFalse || isClosedDenied;

    const entry: NodeActivityEntry = {
      path,
      direction: msg.direction,
      blocked,
      timestamp: msg.timestamp,
    };

    // Shell node sees every message
    pushActivity('topology-node-shell', entry);

    // ACL and runtime node see every message
    pushActivity('topology-node-acl', entry);
    pushActivity('topology-node-runtime', entry);

    // Service node: signer-related messages
    if (
      (path === 'signer-request' || path === 'signer-response') &&
      topology.services.includes('signer')
    ) {
      pushActivity('topology-node-service-signer', entry);
    }

    // Napplet node: messages belonging to a specific window
    if (msg.windowId) {
      for (const node of topology.nodes) {
        if (node.role === 'napplet' && node.name) {
          // Match windowId naming pattern: demo-{name}-{counter}
          if (msg.windowId.startsWith(`demo-${node.name}-`)) {
            pushActivity(node.id, entry);
          }
        }
      }
    }
  });
}
