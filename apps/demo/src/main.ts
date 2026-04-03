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
  getNotificationServiceHandler,
  relay,
  toggleService,
} from './shell-host.js';
import type { Capability } from '@napplet/shell';
import {
  createDemoNotificationController,
} from './notification-demo.js';
import type { DemoNotificationSnapshot } from './notification-demo.js';
import './debugger.js';
import type { NappletDebugger } from './debugger.js';
import { classifyTappedMessagePath } from './debugger.js';
import { renderAclPanels, setDebugger } from './acl-panel.js';
import { initFlowAnimator } from './flow-animator.js';
import { cancelAllTraceAnimations } from './trace-animator.js';
import {
  initColorState,
  onColorStateChange,
  getNodeInboundColor,
  getNodeOutboundColor,
  setPersistenceMode,
  getPersistenceMode,
} from './color-state.js';
import type { PersistenceMode } from './color-state.js';
import { buildDemoTopology, renderDemoTopology, getServiceNodeId, initTopologyEdges, wireServiceToggles } from './topology.js';
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
  disconnectSigner,
  recordSignerRequest,
  getSignerConnectionState,
} from './signer-connection.js';
import { initSignerModal, openSignerModal } from './signer-modal.js';
import { demoConfig } from './demo-config.js';
import { openConstantsTab } from './node-inspector.js';
import { setAclRingSize } from './acl-history.js';

// ─── Notification Controller ─────────────────────────────────────────────────

// Create the controller before boot so we can pass its onChange into the shell.
// The controller accumulates service state and notifies subscribers on change.
const notificationController = createDemoNotificationController();

// Boot the shell (now includes signer and notifications)
const { tap } = bootShell((notifications) => {
  notificationController.handleServiceChange(notifications);
});

// Connect the service handler so the controller can dispatch actions
const notificationHandler = getNotificationServiceHandler();
if (notificationHandler) {
  notificationController.connectService(notificationHandler);
}

// ─── Notification Toast Rendering ────────────────────────────────────────────

// Track shown toast IDs so we don't re-show the same notification
const _shownToastIds = new Set<string>();

function renderToast(notification: import('@napplet/services').Notification): void {
  const layer = document.getElementById('notification-toast-layer');
  if (!layer) return;
  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.dataset.notifId = notification.id;
  toast.innerHTML = `
    <div class="notif-toast-title">${escapeHtml(notification.title)}</div>
    ${notification.body ? `<div class="notif-toast-body">${escapeHtml(notification.body)}</div>` : ''}
    <div class="notif-toast-cue">notifications:create via service</div>
  `;
  layer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, demoConfig.get('demo.TOAST_DISPLAY_MS'));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Notification Node Summary Rendering ────────────────────────────────────

function renderNotificationNodeSummary(snapshot: DemoNotificationSnapshot): void {
  const totalEl = document.getElementById('notif-total');
  const unreadEl = document.getElementById('notif-unread');
  const sourceCueEl = document.getElementById('notif-source-cue');
  const cueTextEl = sourceCueEl?.querySelector('.notif-cue-text');

  if (totalEl) totalEl.textContent = String(snapshot.notifications.length);
  if (unreadEl) unreadEl.textContent = String(snapshot.unreadCount);
  if (sourceCueEl && cueTextEl && snapshot.sourceLabel) {
    (cueTextEl as HTMLElement).textContent = snapshot.sourceLabel;
    (sourceCueEl as HTMLElement).style.display = '';
  }
}

// ─── Notification Inspector Rendering ────────────────────────────────────────

function renderNotificationInspector(snapshot: DemoNotificationSnapshot): void {
  const listEl = document.getElementById('notification-list');
  if (!listEl) return;

  if (snapshot.notifications.length === 0) {
    listEl.innerHTML = '<div class="notif-list-empty">no notifications yet</div>';
    return;
  }

  // Newest first
  const sorted = [...snapshot.notifications].reverse();
  listEl.innerHTML = sorted
    .map(
      (n) => `
      <div class="notif-item${n.read ? ' read' : ''}" data-notif-id="${n.id}">
        <div class="notif-item-title">${escapeHtml(n.title)}</div>
        ${n.body ? `<div class="notif-item-body">${escapeHtml(n.body)}</div>` : ''}
        <div class="notif-item-meta">
          <span class="notif-item-tag">notifications:create</span>
          <span>${n.read ? 'read' : 'unread'}</span>
        </div>
        <div class="notif-item-actions">
          ${!n.read ? `<button class="notif-item-btn read-btn" data-action="notif-read" data-notif-id="${n.id}">mark read</button>` : ''}
          <button class="notif-item-btn dismiss-btn" data-action="notif-dismiss" data-notif-id="${n.id}">dismiss</button>
        </div>
      </div>
    `
    )
    .join('');
}

// ─── Notification Snapshot Subscriber ────────────────────────────────────────

// Track the latest notification snapshot for rendering
let _notificationSnapshot: DemoNotificationSnapshot = notificationController.getSnapshot();
notificationController.subscribe((snapshot) => {
  const prev = _notificationSnapshot;
  _notificationSnapshot = snapshot;

  // Show toasts for new notifications
  for (const n of snapshot.notifications) {
    if (!_shownToastIds.has(n.id)) {
      _shownToastIds.add(n.id);
      renderToast(n);
      debuggerEl?.addSystemMessage(`notifications:create via service — id:${n.id.slice(0, 16)}`);
    }
  }

  // Update summary fields in the node
  renderNotificationNodeSummary(snapshot);

  // If inspector is open, update it
  const inspector = document.getElementById('notification-inspector');
  if (inspector?.classList.contains('open')) {
    renderNotificationInspector(snapshot);
  }

  // Reflect dismissed notifications (remove from shown set)
  const currentIds = new Set(snapshot.notifications.map((n) => n.id));
  for (const id of [..._shownToastIds]) {
    if (!currentIds.has(id)) {
      _shownToastIds.delete(id);
    }
  }

  // Suppress TS unused-variable warning from old code
  void prev;
});

const topology = buildDemoTopology(getDemoTopologyInputs());

// Render topology into the left topology pane
const topologyPane = document.getElementById('topology-pane');
if (topologyPane) {
  topologyPane.innerHTML = renderDemoTopology(topology);
}

// Initialize Leader Line edges after topology HTML is in the DOM
const edgeFlasher = initTopologyEdges(topology);

// Wire service toggle icons on topology nodes
wireServiceToggles((name, enabled) => {
  toggleService(name, enabled);
});

// Initialize persistent color state tracking for topology edges
initColorState(topology);

// ─── Persistent Node Color Rendering ────────────────────────────────────
onColorStateChange(() => {
  for (const node of topology.nodes) {
    const inboundColor = getNodeInboundColor(node.id);
    const outboundColor = getNodeOutboundColor(node.id);

    // Update inbound overlay
    const inEl = document.querySelector<HTMLElement>(
      `[data-color-overlay="${node.id}"][data-color-direction="inbound"]`,
    );
    if (inEl) {
      inEl.classList.remove('node-color-active', 'node-color-blocked', 'node-color-amber');
      if (inboundColor) inEl.classList.add(`node-color-${inboundColor}`);
    }

    // Update outbound overlay
    const outEl = document.querySelector<HTMLElement>(
      `[data-color-overlay="${node.id}"][data-color-direction="outbound"]`,
    );
    if (outEl) {
      outEl.classList.remove('node-color-active', 'node-color-blocked', 'node-color-amber');
      if (outboundColor) outEl.classList.add(`node-color-${outboundColor}`);
    }
  }
});

// ─── Inject Notification Controls into the Notifications Node ────────────────

(function injectNotificationControls(): void {
  const notifNodeId = getServiceNodeId('notifications');
  const notifServiceNode = document.getElementById(notifNodeId);
  const template = document.getElementById('notification-node-controls-template') as HTMLTemplateElement | null;
  if (!notifServiceNode || !template) return;
  const clone = document.importNode(template.content, true);
  notifServiceNode.appendChild(clone);
})();

// Connect debugger to tap
const debuggerEl = document.getElementById('debugger') as NappletDebugger;
if (debuggerEl) {
  debuggerEl.connectTap(tap);
  setDebugger(debuggerEl);
  debuggerEl.addSystemMessage(`shell booted -- host pubkey: ${getDemoHostPubkey().substring(0, 16)}...`);
  debuggerEl.addSystemMessage(getDemoHostAuditSummary());
  debuggerEl.addSystemMessage('notification service registered -- host callbacks active');
}

// ─── Config Change Logging ──────────────────────────────────────────────────

demoConfig.subscribe((key, value) => {
  debuggerEl?.addSystemMessage(`config changed: ${key} = ${value}`);
  if (key === 'demo.ACL_RING_BUFFER_SIZE') {
    setAclRingSize(value);
  }
});

// Suppress unused import warning — openConstantsTab is available for keyboard shortcuts
void openConstantsTab;

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

// Initialize signer connect modal
initSignerModal();

// Handle signer connect/disconnect button clicks
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('[data-action="open-signer-connect"]')) {
    e.stopPropagation();
    openSignerModal();
  }
  if (target.closest('[data-action="disconnect-signer"]')) {
    e.stopPropagation();
    disconnectSigner();
    debuggerEl?.addSystemMessage('signer disconnected');
  }

  // Notification node controls
  if (target.id === 'notification-node-create' || target.closest('#notification-node-create')) {
    e.stopPropagation();
    notificationController.createDemoNotification({
      title: 'Demo notification',
      body: 'Triggered from the notification service node',
      sourceLabel: 'notifications:create via service',
    });
    debuggerEl?.addSystemMessage('notifications:create dispatched from host node control');
  }
  if (target.id === 'notification-node-list' || target.closest('#notification-node-list')) {
    e.stopPropagation();
    notificationController.requestList();
    debuggerEl?.addSystemMessage('notifications:list requested');
    // Open inspector to show the list
    const inspector = document.getElementById('notification-inspector');
    inspector?.classList.add('open');
    renderNotificationInspector(_notificationSnapshot);
  }
  if (target.id === 'notification-node-mark-read' || target.closest('#notification-node-mark-read')) {
    e.stopPropagation();
    const newest = [..._notificationSnapshot.notifications].filter((n) => !n.read).pop();
    if (newest) {
      notificationController.markRead(newest.id);
      debuggerEl?.addSystemMessage(`notifications:read dispatched — id:${newest.id.slice(0, 16)}`);
    } else {
      debuggerEl?.addSystemMessage('notifications:read — no unread notifications');
    }
  }
  if (target.id === 'notification-node-dismiss' || target.closest('#notification-node-dismiss')) {
    e.stopPropagation();
    const newest = [..._notificationSnapshot.notifications].pop();
    if (newest) {
      notificationController.dismiss(newest.id);
      debuggerEl?.addSystemMessage(`notifications:dismiss dispatched — id:${newest.id.slice(0, 16)}`);
    } else {
      debuggerEl?.addSystemMessage('notifications:dismiss — no notifications to dismiss');
    }
  }

  // Inspector per-item controls
  if ((target as HTMLElement).dataset.action === 'notif-read') {
    e.stopPropagation();
    const id = (target as HTMLElement).dataset.notifId;
    if (id) {
      notificationController.markRead(id);
      debuggerEl?.addSystemMessage(`notifications:read from inspector — id:${id.slice(0, 16)}`);
    }
  }
  if ((target as HTMLElement).dataset.action === 'notif-dismiss') {
    e.stopPropagation();
    const id = (target as HTMLElement).dataset.notifId;
    if (id) {
      notificationController.dismiss(id);
      debuggerEl?.addSystemMessage(`notifications:dismiss from inspector — id:${id.slice(0, 16)}`);
    }
  }

  // Close notification inspector
  if (target.id === 'notification-inspector-close' || target.closest('#notification-inspector-close')) {
    e.stopPropagation();
    const inspector = document.getElementById('notification-inspector');
    inspector?.classList.remove('open');
  }

  // ─── Color Mode Toggle ──────────────────────────────────────────────────
  const colorModeBtn = target.closest<HTMLElement>('[data-color-mode]');
  if (colorModeBtn) {
    const mode = colorModeBtn.dataset.colorMode as PersistenceMode;
    if (mode) {
      // Cancel any pending trace animations before switching modes
      const wasTrace = getPersistenceMode() === 'trace';
      if (wasTrace) {
        cancelAllTraceAnimations(edgeFlasher, topology.edges.map((e) => e.id));
      }

      setPersistenceMode(mode);

      // Update active class on toggle buttons
      document.querySelectorAll('.color-mode-btn').forEach((b) => {
        b.classList.toggle('color-mode-active', (b as HTMLElement).dataset.colorMode === mode);
      });

      // When entering trace mode, clear persistent node color overlays
      if (mode === 'trace') {
        for (const node of topology.nodes) {
          const inEl = document.querySelector<HTMLElement>(
            `[data-color-overlay="${node.id}"][data-color-direction="inbound"]`,
          );
          const outEl = document.querySelector<HTMLElement>(
            `[data-color-overlay="${node.id}"][data-color-direction="outbound"]`,
          );
          if (inEl) inEl.classList.remove('node-color-active', 'node-color-blocked', 'node-color-amber');
          if (outEl) outEl.classList.remove('node-color-active', 'node-color-blocked', 'node-color-amber');
        }
      }

      debuggerEl?.addSystemMessage(`color mode changed: ${mode}`);
    }
  }
});

// Show pubkey in shell node
const shellPubkey = document.getElementById('shell-pubkey');
if (shellPubkey) shellPubkey.textContent = `pubkey: ${getDemoHostPubkey().substring(0, 20)}...`;

// Load demo napplets into the rendered topology
const nappletInfos = DEMO_NAPPLETS.map((napplet) => loadNapplet(napplet.name, napplet.frameContainerId));
const chatInfo = nappletInfos.find((napplet) => napplet.name === 'chat');
const botInfo = nappletInfos.find((napplet) => napplet.name === 'bot');

initFlowAnimator(tap, topology, edgeFlasher);

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

// ─── Signer Request Tap Wiring ───────────────────────────────────────────────

tap.onMessage((msg) => {
  // Detect signer request (kind 29001 from napplet to shell, no topic = direct signer request)
  if (
    msg.verb === 'EVENT' &&
    msg.parsed.eventKind === 29001 &&
    msg.parsed.topic === undefined &&
    msg.direction === 'napplet->shell'
  ) {
    const raw = msg.raw;
    const event = (Array.isArray(raw) && raw.length > 1)
      ? (raw[1] as Record<string, unknown>)
      : null;
    const tags = (event?.tags as string[][] | undefined) ?? [];
    const method = tags.find((t) => t[0] === 'method')?.[1] ?? 'unknown';
    const eventTag = tags.find((t) => t[0] === 'event')?.[1];
    let kind: number | undefined;
    if (method === 'signEvent' && eventTag) {
      try {
        kind = (JSON.parse(eventTag) as { kind?: number }).kind;
      } catch { /* ignore malformed event tag */ }
    }

    recordSignerRequest({
      timestamp: msg.timestamp,
      method,
      kind,
      success: true, // preliminary; updated on OK false response heuristic below
    });
  }

  // Detect signer response failure — heuristic: most recent request within 5s
  if (
    msg.verb === 'OK' &&
    msg.parsed.success === false &&
    msg.direction === 'shell->napplet'
  ) {
    const state = getSignerConnectionState();
    const last = state.recentRequests[state.recentRequests.length - 1];
    if (last && Date.now() - last.timestamp < 5000) {
      recordSignerRequest({ ...last, success: false });
    }
  }
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
    checkCapability: (pubkey: string, dTag: string, hash: string, cap: string) =>
      relay.runtime.aclState.check(pubkey, dTag, hash, cap as Capability),
  };
}, topology);

// Wire per-node click → selection
function wireNodeSelection(): void {
  const allNodes = document.querySelectorAll('[data-node-id]');
  for (const el of allNodes) {
    el.addEventListener('click', (event) => {
      // Guard: Skip button clicks to allow button handlers to execute
      if ((event.target as HTMLElement).closest('button')) return;

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

  // Log ipc events prominently
  if (msg.verb === 'EVENT' && msg.parsed.topic) {
    debuggerEl?.addSystemMessage(
      `ipc: ${msg.parsed.topic} (kind:${msg.parsed.eventKind})`
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
