/**
 * main.ts -- Demo playground entry point.
 *
 * Boots shell, renders the topology view, loads napplets, wires debugger,
 * ACL panels, flow animator, and node-detail summaries.
 */
import 'virtual:uno.css';
import {
  bootShell,
  DEMO_NAPPLETS,
  getDemoHostAuditSummary,
  getDemoHostPubkey,
  getDemoTopologyInputs,
  getDemoServiceNames,
  getNapplets,
  loadNapplet,
} from './shell-host.js';
import './debugger.js';
import type { NappletDebugger } from './debugger.js';
import { classifyTappedMessagePath } from './debugger.js';
import { renderAclPanels, setDebugger } from './acl-panel.js';
import { initFlowAnimator } from './flow-animator.js';
import { buildDemoTopology, renderDemoTopology, getServiceNodeId } from './topology.js';
import type { SignerConnectionStateView } from './topology.js';
import {
  buildAllNodeDetails,
  buildNodeDetails,
  installActivityProjection,
} from './node-details.js';
import type { NodeDetail } from './node-details.js';
import { initNodeInspector, setSelectedNodeId } from './node-inspector.js';
import {
  onStateChange,
  connectNip07,
  disconnectSigner,
  recordSignerRequest,
  getSignerConnectionState,
} from './signer-connection.js';

// Boot the shell (now includes signer)
const { tap } = bootShell();
const topology = buildDemoTopology(getDemoTopologyInputs());

// Render topology into the left topology pane
const topologyPane = document.getElementById('topology-pane');
if (topologyPane) {
  topologyPane.innerHTML = renderDemoTopology(topology);
}

// Connect debugger to tap
const debuggerEl = document.getElementById('debugger') as NappletDebugger;
if (debuggerEl) {
  debuggerEl.connectTap(tap);
  setDebugger(debuggerEl);
  debuggerEl.addSystemMessage(`shell booted -- host pubkey: ${getDemoHostPubkey().substring(0, 16)}...`);
  debuggerEl.addSystemMessage(getDemoHostAuditSummary());
}

// ─── Signer Node Display ─────────────────────────────────────────────────────

const signerNodeId = getServiceNodeId('signer');

/**
 * Update the signer service node in the topology to reflect current connection state.
 * Operates surgically on the node element without re-rendering the whole topology.
 */
function updateSignerNodeDisplay(state: SignerConnectionStateView): void {
  const signerNode = document.getElementById(signerNodeId);
  if (!signerNode) return;

  // Remove existing dynamic content (everything before node-summary)
  const nodeSummary = signerNode.querySelector('.node-summary');
  // Clear children except the node-summary
  const toRemove: Element[] = [];
  for (const child of signerNode.children) {
    if (!child.classList.contains('node-summary')) {
      toRemove.push(child);
    }
  }
  for (const el of toRemove) el.remove();

  let innerHtml = '';

  if (state.isConnecting) {
    innerHtml = `
      <div class="topology-node-kicker">service</div>
      <div class="topology-node-title">signer</div>
      <div class="topology-node-meta signer-status-connecting">connecting...</div>
    `;
  } else if (state.method === 'none') {
    const errorHtml = state.error
      ? `<div class="topology-node-meta signer-status-error">${state.error}</div>`
      : '';
    innerHtml = `
      <div class="topology-node-kicker">service</div>
      <div class="topology-node-title">signer</div>
      ${errorHtml}
      <div class="topology-node-meta signer-status-disconnected">not connected</div>
      <button class="signer-connect-btn" data-action="open-signer-connect">Connect Signer</button>
    `;
  } else {
    // Connected
    const truncatedPubkey = state.pubkey
      ? `${state.pubkey.substring(0, 8)}...${state.pubkey.substring(state.pubkey.length - 4)}`
      : '';
    const relayHtml = state.relay
      ? `<span class="signer-relay">${state.relay}</span>`
      : '';

    // Recent requests (last 5, most recent first)
    const recentSlice = [...state.recentRequests].reverse().slice(0, 5);
    const requestRowsHtml = recentSlice.length > 0
      ? recentSlice.map((r) => `
          <div class="signer-request-row ${r.success ? 'ok' : 'err'}">
            <span class="signer-req-method">${r.method}</span>
            ${r.kind !== undefined ? `<span class="signer-req-kind">k${r.kind}</span>` : ''}
            <span class="signer-req-status">${r.success ? '✓' : '✗'}</span>
          </div>
        `).join('')
      : '<div class="signer-no-requests">no requests yet</div>';

    innerHtml = `
      <div class="topology-node-kicker">service</div>
      <div class="topology-node-title">signer</div>
      <div class="topology-node-meta signer-status-connected">
        <span class="signer-method-badge">${state.method === 'nip07' ? 'nip-07' : 'nip-46'}</span>
        <span class="signer-pubkey">${truncatedPubkey}</span>
        ${relayHtml}
      </div>
      <div class="signer-recent-requests">
        <div class="signer-recent-label">recent</div>
        ${requestRowsHtml}
      </div>
      <button class="signer-disconnect-btn" data-action="disconnect-signer">disconnect</button>
    `;
  }

  // Insert the dynamic content before node-summary
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = innerHtml;
  if (nodeSummary) {
    for (const child of [...tempDiv.children]) {
      signerNode.insertBefore(child, nodeSummary);
    }
  } else {
    signerNode.innerHTML = innerHtml;
  }
}

// Subscribe to signer connection state changes
onStateChange((state) => {
  updateSignerNodeDisplay(state);

  // Log to debugger
  if (state.method !== 'none' && !state.isConnecting && !state.error) {
    debuggerEl?.addSystemMessage(
      `signer connected via ${state.method}: ${state.pubkey?.substring(0, 16)}...`
    );
  }
  if (state.error) {
    debuggerEl?.addSystemMessage(`signer connection error: ${state.error}`);
  }
});

// Handle signer connect/disconnect button clicks
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('[data-action="open-signer-connect"]')) {
    // Plan 31-01: direct NIP-07 connect (Plan 31-02 replaces with modal)
    connectNip07();
  }
  if (target.closest('[data-action="disconnect-signer"]')) {
    disconnectSigner();
    debuggerEl?.addSystemMessage('signer disconnected');
  }
});

// Show pubkey in shell node
const shellPubkey = document.getElementById('shell-pubkey');
if (shellPubkey) shellPubkey.textContent = `pubkey: ${getDemoHostPubkey().substring(0, 20)}...`;

// Load demo napplets into the rendered topology
const nappletInfos = DEMO_NAPPLETS.map((napplet) => loadNapplet(napplet.name, napplet.frameContainerId));
const chatInfo = nappletInfos.find((napplet) => napplet.name === 'chat');
const botInfo = nappletInfos.find((napplet) => napplet.name === 'bot');

initFlowAnimator(tap, topology);

// ─── Node Detail Counters ────────────────────────────────────────────────────
let totalMessages = 0;
let totalBlocked = 0;

tap.onMessage((msg) => {
  totalMessages++;
  const isOkFalse = msg.verb === 'OK' && msg.raw?.[2] === false;
  const isClosedDenied =
    msg.verb === 'CLOSED' &&
    typeof msg.raw?.[2] === 'string' &&
    (String(msg.raw[2]).includes('denied') || String(msg.raw[2]).startsWith('blocked:'));
  if (isOkFalse || isClosedDenied) totalBlocked++;
});

// Install per-node activity projection
installActivityProjection(tap, topology, classifyTappedMessagePath);

// ─── Compact Node Summary Rendering ─────────────────────────────────────────

function renderSummaryFields(detail: NodeDetail): string {
  return detail.summaryFields
    .map(
      (field) =>
        `<span class="node-summary-field"><span class="node-summary-label">${field.label}:</span> <span class="node-summary-value">${field.value}</span></span>`
    )
    .join('');
}

function refreshNodeSummaries(): void {
  const napplets = getNapplets();
  const options = {
    napplets,
    serviceNames: getDemoServiceNames(),
    hostPubkey: getDemoHostPubkey(),
    totalMessages,
    totalBlocked,
  };
  const details = buildAllNodeDetails(topology, options);
  for (const [nodeId, detail] of details) {
    const el = document.getElementById(`node-summary-${nodeId}`);
    if (el) {
      el.innerHTML = renderSummaryFields(detail);
    }
  }
}

// Refresh summaries periodically during active traffic
tap.onMessage(() => {
  refreshNodeSummaries();
});

// Initial render
refreshNodeSummaries();

// ─── Inspector Wiring ─────────────────────────────────────────────────────────

// Initialize the inspector panel
initNodeInspector(() => {
  // Called when inspector needs fresh data for the selected node
  const napplets = getNapplets();
  return {
    napplets,
    serviceNames: getDemoServiceNames(),
    hostPubkey: getDemoHostPubkey(),
    totalMessages,
    totalBlocked,
  };
}, topology);

// Wire per-node click → selection
function wireNodeSelection(): void {
  const allNodes = document.querySelectorAll('[data-node-id]');
  for (const el of allNodes) {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const nodeId = el.getAttribute('data-node-id');
      if (nodeId) {
        setSelectedNodeId(nodeId);
        // Eagerly build a single-node detail for quick UI response
        const node = topology.nodes.find((n) => n.id === nodeId);
        if (node) {
          buildNodeDetails(node, {
            napplets: getNapplets(),
            serviceNames: getDemoServiceNames(),
            hostPubkey: getDemoHostPubkey(),
            totalMessages,
            totalBlocked,
          });
        }
      }
    });
  }
}

// Wire after topology is rendered
wireNodeSelection();

// ─── ACL Panel Wiring ────────────────────────────────────────────────────────

// Track which napplets have had their ACL panel rendered (render only once)
const aclRendered = new Set<string>();

// Update status indicators when napplets AUTH (only once per napplet)
tap.onMessage((msg) => {
  if (msg.verb === 'OK' && msg.parsed.success === true && msg.direction === 'shell->napplet') {
    setTimeout(() => {
      const chatStatus = document.getElementById('chat-status');
      const botStatus = document.getElementById('bot-status');

      if (chatInfo?.authenticated && chatStatus && !aclRendered.has('chat')) {
        chatStatus.textContent = 'authenticated';
        chatStatus.style.color = '#39ff14';
        aclRendered.add('chat');
      }
      if (botInfo?.authenticated && botStatus && !aclRendered.has('bot')) {
        botStatus.textContent = 'authenticated';
        botStatus.style.color = '#39ff14';
        aclRendered.add('bot');
      }

      // Only render ACL panels for newly authenticated napplets
      if (aclRendered.size > 0) {
        renderAclPanels(aclRendered);
      }

      // Refresh summaries after auth state changes
      refreshNodeSummaries();
    }, 200);
  }

  // Log inter-pane events prominently
  if (msg.verb === 'EVENT' && msg.parsed.topic) {
    debuggerEl?.addSystemMessage(
      `inter-pane: ${msg.parsed.topic} (kind:${msg.parsed.eventKind})`
    );
  }
});

// Selected-node state (exported for inspector module access)
export let selectedNodeId: string | null = null;

export function setSelectedNode(id: string | null): void {
  selectedNodeId = id;
  setSelectedNodeId(id);
}

console.log('[napplet playground] initialized');
