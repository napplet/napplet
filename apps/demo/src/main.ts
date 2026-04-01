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
import { buildDemoTopology, renderDemoTopology } from './topology.js';
import {
  buildAllNodeDetails,
  buildNodeDetails,
  installActivityProjection,
} from './node-details.js';
import type { NodeDetail } from './node-details.js';
import { initNodeInspector, setSelectedNodeId } from './node-inspector.js';

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
