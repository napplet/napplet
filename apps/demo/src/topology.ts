// Load leader-line - a UMD library that doesn't have proper ESM exports
// We need to require it in a way that makes it available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const LeaderLine: any;

export type TopologyNodeRole = 'napplet' | 'shell' | 'acl' | 'runtime' | 'service';

// Inline the signer state types here to avoid a circular import with signer-connection.ts
export type SignerConnectionMethod = 'nip07' | 'nip46' | 'none';

export interface SignerRequestRecord {
  timestamp: number;
  method: string;
  kind?: number;
  success: boolean;
}

export interface SignerConnectionStateView {
  method: SignerConnectionMethod;
  pubkey: string | null;
  relay: string | null;
  recentRequests: SignerRequestRecord[];
  isConnecting: boolean;
  error: string | null;
}

export interface DemoTopologyNappletInput {
  name: string;
  label: string;
  statusId: string;
  aclId: string;
  frameContainerId: string;
}

export interface DemoTopologyInput {
  hostPubkey: string;
  napplets: DemoTopologyNappletInput[];
  services: string[];
  signerState?: SignerConnectionStateView;
}

export interface DemoTopologyNode {
  id: string;
  parentId: string | null;
  role: TopologyNodeRole;
  label: string;
  name?: string;
}

export interface DemoTopologyEdge {
  id: string;
  from: string;
  to: string;
}

export interface DemoTopology {
  nodes: DemoTopologyNode[];
  edges: DemoTopologyEdge[];
  hostPubkey: string;
  napplets: DemoTopologyNappletInput[];
  services: string[];
  signerState?: SignerConnectionStateView;
}

const SHELL_NODE_ID = 'topology-node-shell';
const ACL_NODE_ID = 'topology-node-acl';
const RUNTIME_NODE_ID = 'topology-node-runtime';

function slugifyTopologyName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function getShellNodeId(): string {
  return SHELL_NODE_ID;
}

export function getAclNodeId(): string {
  return ACL_NODE_ID;
}

export function getRuntimeNodeId(): string {
  return RUNTIME_NODE_ID;
}

export function getNappletNodeId(name: string): string {
  return `topology-node-napplet-${slugifyTopologyName(name)}`;
}

export function getServiceNodeId(name: string): string {
  return `topology-node-service-${slugifyTopologyName(name)}`;
}

export function getNappletEdgeId(name: string): string {
  return `topology-edge-napplet-${slugifyTopologyName(name)}-shell`;
}

export function getShellAclEdgeId(): string {
  return 'topology-edge-shell-acl';
}

export function getAclRuntimeEdgeId(): string {
  return 'topology-edge-acl-runtime';
}

export function getRuntimeServiceEdgeId(name: string): string {
  return `topology-edge-runtime-service-${slugifyTopologyName(name)}`;
}

export function buildDemoTopology(input: DemoTopologyInput): DemoTopology {
  const napplets = [...input.napplets].sort((left, right) => left.name.localeCompare(right.name));
  const services = [...new Set(input.services)].sort((left, right) => left.localeCompare(right));
  const nodes: DemoTopologyNode[] = [
    ...napplets.map((napplet) => ({
      id: getNappletNodeId(napplet.name),
      parentId: null,
      role: 'napplet' as const,
      label: napplet.label,
      name: napplet.name,
    })),
    {
      id: SHELL_NODE_ID,
      parentId: null,
      role: 'shell',
      label: 'shell',
    },
    {
      id: ACL_NODE_ID,
      parentId: SHELL_NODE_ID,
      role: 'acl',
      label: 'acl',
    },
    {
      id: RUNTIME_NODE_ID,
      parentId: ACL_NODE_ID,
      role: 'runtime',
      label: 'runtime',
    },
    ...services.map((service) => ({
      id: getServiceNodeId(service),
      parentId: RUNTIME_NODE_ID,
      role: 'service' as const,
      label: service,
      name: service,
    })),
  ];

  const edges: DemoTopologyEdge[] = [
    ...napplets.map((napplet) => ({
      id: getNappletEdgeId(napplet.name),
      from: getNappletNodeId(napplet.name),
      to: SHELL_NODE_ID,
    })),
    {
      id: getShellAclEdgeId(),
      from: SHELL_NODE_ID,
      to: ACL_NODE_ID,
    },
    {
      id: getAclRuntimeEdgeId(),
      from: ACL_NODE_ID,
      to: RUNTIME_NODE_ID,
    },
    ...services.map((service) => ({
      id: getRuntimeServiceEdgeId(service),
      from: RUNTIME_NODE_ID,
      to: getServiceNodeId(service),
    })),
  ];

  return {
    nodes,
    edges,
    hostPubkey: input.hostPubkey,
    napplets,
    services,
    signerState: input.signerState,
  };
}

export interface EdgeFlasher {
  /** Flash both -out and -in lines with the same color (backward compat). */
  flash(edgeId: string, cls: 'active' | 'blocked'): void;
  /** Flash only one direction's line. */
  flashDirection(edgeId: string, direction: 'out' | 'in', cls: 'active' | 'blocked'): void;
  /** Set a persistent color on one direction's line (no auto-revert). Pass null to reset to resting. */
  setColor(edgeId: string, direction: 'out' | 'in', cls: 'active' | 'blocked' | null): void;
}

import { demoConfig } from './demo-config.js';

const COLOR_ACTIVE = '#39ff14';
const COLOR_BLOCKED = '#ff3b3b';
const COLOR_RESTING = 'rgba(58,58,74,0.7)';

/** Create a zero-size invisible port div anchored at (xPct%, yPct%) inside parent. */
function makePort(parent: HTMLElement, xPct: number, yPct: number): HTMLElement {
  const port = document.createElement('div');
  port.style.cssText = `position:absolute;width:0;height:0;pointer-events:none;left:${xPct}%;top:${yPct}%;`;
  parent.appendChild(port);
  return port;
}

export function initTopologyEdges(topology: DemoTopology): EdgeFlasher {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = new Map<string, any>();
  const ports: HTMLElement[] = [];

  const BASE_OPTIONS = {
    color: COLOR_RESTING,
    size: 2,
    path: 'fluid',
    endPlug: 'arrow2',
    endPlugSize: 1.5,
  };

  for (const edge of topology.edges) {
    const fromEl = document.getElementById(edge.from);
    const toEl = document.getElementById(edge.to);
    if (!fromEl || !toEl) continue;

    // Ensure positioned context so absolute port children work
    if (getComputedStyle(fromEl).position === 'static') fromEl.style.position = 'relative';
    if (getComputedStyle(toEl).position === 'static') toEl.style.position = 'relative';

    // Port divs at exact boundary positions — LeaderLine socket on a 0×0 div
    // exits/enters perfectly perpendicular (90°) to the node edge.
    const fromOutPort = makePort(fromEl, 75, 100); // right side, bottom edge
    const toOutPort   = makePort(toEl,   75, 0);   // right side, top edge
    const toInPort    = makePort(toEl,   25, 0);   // left side, top edge
    const fromInPort  = makePort(fromEl, 25, 100); // left side, bottom edge
    ports.push(fromOutPort, toOutPort, toInPort, fromInPort);

    try {
      const outLine = new LeaderLine(fromOutPort, toOutPort, {
        ...BASE_OPTIONS,
        startSocket: 'bottom',
        endSocket: 'top',
        startSocketGravity: 80,
        endSocketGravity: 80,
      });
      lines.set(edge.id + '-out', outLine);

      const inLine = new LeaderLine(toInPort, fromInPort, {
        ...BASE_OPTIONS,
        startSocket: 'top',
        endSocket: 'bottom',
        startSocketGravity: 80,
        endSocketGravity: 80,
      });
      lines.set(edge.id + '-in', inLine);
    } catch { /* best-effort — may fail if elements not visible */ }
  }

  // Reposition lines when topology layout or inspector pane changes size
  const ro = new ResizeObserver(() => {
    lines.forEach((line) => { try { line.position(); } catch { /* best-effort */ } });
  });
  const topologyRoot = document.getElementById('topology-root');
  if (topologyRoot) ro.observe(topologyRoot);
  const flowAreaInner = document.getElementById('flow-area-inner');
  if (flowAreaInner) ro.observe(flowAreaInner);

  return {
    flash(edgeId: string, cls: 'active' | 'blocked'): void {
      const color = cls === 'active' ? COLOR_ACTIVE : COLOR_BLOCKED;
      for (const suffix of ['-out', '-in']) {
        const line = lines.get(edgeId + suffix);
        if (!line) continue;
        try {
          line.setOptions({ color, size: 3 });
          setTimeout(() => {
            try { line.setOptions({ color: COLOR_RESTING, size: 2 }); } catch { /* best-effort */ }
          }, demoConfig.get('demo.FLASH_DURATION_MS'));
        } catch { /* best-effort */ }
      }
    },

    flashDirection(edgeId: string, direction: 'out' | 'in', cls: 'active' | 'blocked'): void {
      const color = cls === 'active' ? COLOR_ACTIVE : COLOR_BLOCKED;
      const line = lines.get(`${edgeId}-${direction}`);
      if (!line) return;
      try {
        line.setOptions({ color, size: 3 });
        setTimeout(() => {
          try { line.setOptions({ color: COLOR_RESTING, size: 2 }); } catch { /* best-effort */ }
        }, demoConfig.get('demo.FLASH_DURATION_MS'));
      } catch { /* best-effort */ }
    },

    setColor(edgeId: string, direction: 'out' | 'in', cls: 'active' | 'blocked' | null): void {
      const color = cls === null ? COLOR_RESTING
        : cls === 'active' ? COLOR_ACTIVE
        : COLOR_BLOCKED;
      const size = cls === null ? 2 : 3;
      const line = lines.get(`${edgeId}-${direction}`);
      if (!line) return;
      try {
        line.setOptions({ color, size });
      } catch { /* best-effort */ }
    },
  };
}

/**
 * Wire click handlers for service toggle icons on topology service nodes.
 * Must be called after renderDemoTopology() has been inserted into the DOM.
 *
 * @param onToggle - Callback invoked after toggle state changes (for external sync)
 */
export function wireServiceToggles(onToggle?: (name: string, enabled: boolean) => void): void {
  const toggleIcons = document.querySelectorAll<HTMLButtonElement>('.service-toggle-icon[data-service-toggle]');

  for (const icon of toggleIcons) {
    const serviceName = icon.dataset.serviceToggle;
    if (!serviceName) continue;

    icon.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent inspector opening

      const nodeEl = icon.closest<HTMLElement>('[data-service-name]');
      const isCurrentlyEnabled = !nodeEl?.classList.contains('service-disabled');
      const newEnabled = !isCurrentlyEnabled;

      if (onToggle) {
        onToggle(serviceName, newEnabled);
      }

      // Update visual state
      updateServiceNodeVisual(serviceName, newEnabled);
    });
  }
}

/**
 * Update a service node's visual state to reflect enabled/disabled.
 * Adds/removes 'service-disabled' class and updates toggle icon appearance.
 *
 * @param name - Service name (must match data-service-name attribute)
 * @param enabled - Whether the service is currently enabled
 */
export function updateServiceNodeVisual(name: string, enabled: boolean): void {
  const nodeId = getServiceNodeId(name);
  const nodeEl = document.getElementById(nodeId);
  if (!nodeEl) return;

  if (enabled) {
    nodeEl.classList.remove('service-disabled');
    nodeEl.style.opacity = '1';
    nodeEl.style.filter = '';
  } else {
    nodeEl.classList.add('service-disabled');
    nodeEl.style.opacity = '0.4';
    nodeEl.style.filter = 'grayscale(0.8)';
  }

  // Update toggle icon color
  const toggleIcon = nodeEl.querySelector<HTMLButtonElement>('.service-toggle-icon');
  if (toggleIcon) {
    toggleIcon.style.color = enabled ? '#39ff14' : '#ff3b3b';
    toggleIcon.title = `${enabled ? 'Disable' : 'Enable'} ${name} service`;
  }
}

function renderNodeEdge(edgeId: string): string {
  return `<div id="${edgeId}" class="topology-edge" data-topology-edge="${edgeId}" aria-hidden="true"></div>`;
}

function truncatePubkey(pubkey: string): string {
  return pubkey.length > 20 ? `${pubkey.substring(0, 20)}...` : pubkey;
}

/**
 * Render the signer node content based on current connection state.
 */
function renderSignerNodeContent(signerState?: SignerConnectionStateView): string {
  if (!signerState || signerState.method === 'none') {
    const errorHtml = signerState?.error
      ? `<div class="topology-node-meta signer-status-error">${signerState.error}</div>`
      : '';
    return `
      <div class="topology-node-kicker">service</div>
      <div class="topology-node-title">signer</div>
      ${errorHtml}
      <div class="topology-node-meta signer-status-disconnected">not connected</div>
      <button class="signer-connect-btn" data-action="open-signer-connect">Connect Signer</button>
    `;
  }

  if (signerState.isConnecting) {
    return `
      <div class="topology-node-kicker">service</div>
      <div class="topology-node-title">signer</div>
      <div class="topology-node-meta signer-status-connecting">connecting...</div>
    `;
  }

  // Connected state
  const truncatedPubkey = signerState.pubkey
    ? `${signerState.pubkey.substring(0, 8)}...${signerState.pubkey.substring(signerState.pubkey.length - 4)}`
    : '';
  const relayHtml = signerState.relay
    ? `<span class="signer-relay">${signerState.relay}</span>`
    : '';

  return `
    <div class="topology-node-kicker">service</div>
    <div class="topology-node-title">signer</div>
    <div class="topology-node-meta signer-status-connected">
      <span class="signer-method-badge">${signerState.method === 'nip07' ? 'nip-07' : 'nip-46'}</span>
      <span class="signer-pubkey">${truncatedPubkey}</span>
      ${relayHtml}
    </div>
    <div class="signer-recent-requests" id="signer-recent-requests"><!-- populated by signer activity --></div>
    <button class="signer-disconnect-btn" data-action="disconnect-signer">disconnect</button>
  `;
}

/** Render the split-border directional color overlay divs for a topology node. */
function renderColorOverlays(nodeId: string): string {
  return `
    <div class="node-color-overlay node-color-inbound" data-color-overlay="${nodeId}" data-color-direction="inbound"></div>
    <div class="node-color-overlay node-color-outbound" data-color-overlay="${nodeId}" data-color-direction="outbound"></div>
  `;
}

export function renderDemoTopology(topology: DemoTopology): string {
  const nappletCards = topology.napplets
    .map(
      (napplet) => `
        <div class="topology-napplet-branch">
          <article
            id="${getNappletNodeId(napplet.name)}"
            class="node-box topology-node topology-napplet-card"
            data-topology-node="napplet"
            data-node-id="${getNappletNodeId(napplet.name)}"
            data-napplet-name="${napplet.name}"
          >
            ${renderColorOverlays(getNappletNodeId(napplet.name))}
            <div class="topology-node-content">
              <div class="topology-node-header">
                <span class="topology-node-kicker">napplet</span>
                <span class="topology-node-status" id="${napplet.statusId}">loading...</span>
              </div>
              <div class="topology-node-title">${napplet.label}</div>
              <div class="node-summary" id="node-summary-${getNappletNodeId(napplet.name)}"></div>
              <div id="${napplet.aclId}" class="topology-acl-slot"></div>
              <div id="${napplet.frameContainerId}" class="topology-frame-slot"></div>
            </div>
          </article>
        </div>
      `
    )
    .join('');

  const serviceCards = topology.services
    .map(
      (service) => {
        const isSigner = service === 'signer';
        const innerContent = isSigner
          ? renderSignerNodeContent(topology.signerState)
          : `<div class="topology-node-kicker">service</div>
            <div class="topology-node-title">${service}</div>`;
        return `
        <div class="topology-service-branch">
          <article
            id="${getServiceNodeId(service)}"
            class="node-box topology-node topology-service-card${isSigner ? ' signer-node' : ''}"
            data-topology-node="service"
            data-node-id="${getServiceNodeId(service)}"
            data-service-name="${service}"
            style="position:relative"
          >
            <button
              class="service-toggle-icon"
              data-service-toggle="${service}"
              title="Toggle ${service} service"
              style="position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;border:1px solid #3a3a4a;background:#1a1b2e;color:#39ff14;font-size:10px;line-height:18px;text-align:center;cursor:pointer;z-index:10;padding:0"
            >&#9679;</button>
            ${renderColorOverlays(getServiceNodeId(service))}
            <div class="topology-node-content">
              ${innerContent}
              <div class="node-summary" id="node-summary-${getServiceNodeId(service)}"></div>
            </div>
          </article>
        </div>
      `;
      }
    )
    .join('');

  return `
    <div id="topology-root" class="topology-layout">
      <div id="color-mode-bar" style="display:flex;align-items:center;justify-content:flex-end;padding:0 4px;min-height:24px">
        <span style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#555">color mode</span>
        <div class="color-mode-toggle">
          <button class="color-mode-btn color-mode-active" data-color-mode="rolling">rolling</button>
          <button class="color-mode-btn" data-color-mode="decay">decay</button>
          <button class="color-mode-btn" data-color-mode="last-message">last</button>
          <button class="color-mode-btn" data-color-mode="trace">trace</button>
        </div>
      </div>
      <section id="topology-napplets" class="topology-region" data-topology-region="napplets">
        <div class="topology-region-label">napplets</div>
        <div class="topology-napplet-grid">${nappletCards}</div>
      </section>

      <section class="topology-layer">
        <article id="${SHELL_NODE_ID}" class="node-box topology-node topology-core-card" data-topology-node="shell" data-node-id="${SHELL_NODE_ID}">
          ${renderColorOverlays(SHELL_NODE_ID)}
          <div class="topology-node-content">
            <div class="topology-node-kicker">host adapter</div>
            <div class="topology-node-title">shell</div>
            <div class="topology-node-copy">relay shell bridge and host identity</div>
            <div id="shell-pubkey" class="topology-node-meta">pubkey: ${truncatePubkey(topology.hostPubkey)}</div>
            <div class="node-summary" id="node-summary-${SHELL_NODE_ID}"></div>
          </div>
        </article>
      </section>

      <section class="topology-layer">
        <article id="${ACL_NODE_ID}" class="node-box topology-node topology-core-card" data-topology-node="acl" data-node-id="${ACL_NODE_ID}">
          ${renderColorOverlays(ACL_NODE_ID)}
          <div class="topology-node-content">
            <div class="topology-node-kicker">checkpoint</div>
            <div class="topology-node-title">acl</div>
            <div class="topology-node-copy">capability gate between napplets and runtime dispatch</div>
            <div class="node-summary" id="node-summary-${ACL_NODE_ID}"></div>
          </div>
        </article>
      </section>

      <section class="topology-layer">
        <article id="${RUNTIME_NODE_ID}" class="node-box topology-node topology-core-card" data-topology-node="runtime" data-node-id="${RUNTIME_NODE_ID}">
          ${renderColorOverlays(RUNTIME_NODE_ID)}
          <div class="topology-node-content">
            <div class="topology-node-kicker">dispatcher</div>
            <div class="topology-node-title">runtime</div>
            <div class="topology-node-copy">routes bus traffic and fans out to registered services</div>
            <div class="node-summary" id="node-summary-${RUNTIME_NODE_ID}"></div>
            <div class="topology-flow-log">
              <div class="topology-flow-log-label">message flow</div>
              <div id="shell-flow-log" class="topology-flow-log-body"></div>
            </div>
          </div>
        </article>
      </section>

      <section id="topology-services" class="topology-region topology-services-region" data-topology-region="services">
        <div class="topology-region-label">runtime services</div>
        <div class="topology-service-grid">${serviceCards}</div>
      </section>
    </div>
  `;
}
