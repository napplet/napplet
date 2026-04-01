export type TopologyNodeRole = 'napplet' | 'shell' | 'acl' | 'runtime' | 'service';

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
}

const SHELL_NODE_ID = 'topology-node-shell';
const ACL_NODE_ID = 'topology-node-acl';
const RUNTIME_NODE_ID = 'topology-node-runtime';
const NAPPLETS_SHELL_EDGE_ID = 'topology-edge-napplets-shell';

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

export function getNappletsShellEdgeId(): string {
  return NAPPLETS_SHELL_EDGE_ID;
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
    {
      id: NAPPLETS_SHELL_EDGE_ID,
      from: 'topology-napplets',
      to: SHELL_NODE_ID,
    },
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
  };
}

function renderNodeEdge(edgeId: string): string {
  return `<div id="${edgeId}" class="topology-edge" data-topology-edge="${edgeId}" aria-hidden="true"></div>`;
}

function truncatePubkey(pubkey: string): string {
  return pubkey.length > 20 ? `${pubkey.substring(0, 20)}...` : pubkey;
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
            data-napplet-name="${napplet.name}"
          >
            <div class="topology-node-header">
              <span class="topology-node-kicker">napplet</span>
              <span class="topology-node-status" id="${napplet.statusId}">loading...</span>
            </div>
            <div class="topology-node-title">${napplet.label}</div>
            <div id="${napplet.aclId}" class="topology-acl-slot"></div>
            <div id="${napplet.frameContainerId}" class="topology-frame-slot"></div>
          </article>
          ${renderNodeEdge(getNappletEdgeId(napplet.name))}
        </div>
      `
    )
    .join('');

  const serviceCards = topology.services
    .map(
      (service) => `
        <div class="topology-service-branch">
          ${renderNodeEdge(getRuntimeServiceEdgeId(service))}
          <article
            id="${getServiceNodeId(service)}"
            class="node-box topology-node topology-service-card"
            data-topology-node="service"
            data-service-name="${service}"
          >
            <div class="topology-node-kicker">service</div>
            <div class="topology-node-title">${service}</div>
          </article>
        </div>
      `
    )
    .join('');

  return `
    <div id="topology-root" class="topology-layout">
      <section id="topology-napplets" class="topology-region" data-topology-region="napplets">
        <div class="topology-region-label">napplets</div>
        <div class="topology-napplet-grid">${nappletCards}</div>
      </section>

      ${renderNodeEdge(NAPPLETS_SHELL_EDGE_ID)}

      <section class="topology-layer">
        <article id="${SHELL_NODE_ID}" class="node-box topology-node topology-core-card" data-topology-node="shell">
          <div class="topology-node-kicker">host adapter</div>
          <div class="topology-node-title">shell</div>
          <div class="topology-node-copy">relay shell bridge and host identity</div>
          <div id="shell-pubkey" class="topology-node-meta">pubkey: ${truncatePubkey(topology.hostPubkey)}</div>
        </article>
      </section>

      ${renderNodeEdge(getShellAclEdgeId())}

      <section class="topology-layer">
        <article id="${ACL_NODE_ID}" class="node-box topology-node topology-core-card" data-topology-node="acl">
          <div class="topology-node-kicker">checkpoint</div>
          <div class="topology-node-title">acl</div>
          <div class="topology-node-copy">capability gate between napplets and runtime dispatch</div>
        </article>
      </section>

      ${renderNodeEdge(getAclRuntimeEdgeId())}

      <section class="topology-layer">
        <article id="${RUNTIME_NODE_ID}" class="node-box topology-node topology-core-card" data-topology-node="runtime">
          <div class="topology-node-kicker">dispatcher</div>
          <div class="topology-node-title">runtime</div>
          <div class="topology-node-copy">routes bus traffic and fans out to registered services</div>
          <div class="topology-flow-log">
            <div class="topology-flow-log-label">message flow</div>
            <div id="shell-flow-log" class="topology-flow-log-body"></div>
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
