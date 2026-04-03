/**
 * node-inspector.ts -- Right-side inspector pane for the demo topology.
 *
 * Renders a selected-node detail panel in the right side of the upper workspace.
 * The bottom debugger remains in its own section and is never covered.
 *
 * Layout contract:
 *   - inspector lives inside #inspector-pane (right side of #flow-area-inner)
 *   - #debugger-section stays outside and below the workspace
 *   - opening the inspector resizes the top workspace, not the debugger
 */

import type { DemoTopology, DemoTopologyNode } from './topology.js';
import {
  buildNodeDetails,
  getNodeActivity,
} from './node-details.js';
import type { NodeDetail, NodeDetailOptions, NodeActivityEntry } from './node-details.js';
import type { AclHistoryEntry } from './acl-history.js';
import { DEMO_CAPABILITY_LABELS } from './acl-panel.js';
import { openPolicyModal } from './acl-modal.js';
import { renderConstantsPanel, wireConstantsPanelEvents } from './constants-panel.js';

// ─── Module State ─────────────────────────────────────────────────────────────

type InspectorTab = 'node' | 'constants';
let _activeTab: InspectorTab = 'node';
let _selectedNodeId: string | null = null;
let _getOptions: (() => NodeDetailOptions) | null = null;
let _topology: DemoTopology | null = null;
let _updateTimer: ReturnType<typeof setInterval> | null = null;

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

function getInspectorPane(): HTMLElement | null {
  return document.getElementById('inspector-pane');
}

function getFlowAreaInner(): HTMLElement | null {
  return document.getElementById('flow-area-inner');
}

// ─── Inspector Rendering ──────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function renderActivityEntry(entry: NodeActivityEntry): string {
  const blocked = entry.blocked
    ? `<span style="color:#ff3b3b">✗</span>`
    : `<span style="color:#39ff14">✓</span>`;
  const direction = entry.direction === 'napplet->shell' ? '↑' : '↓';
  return `
    <div class="inspector-activity-entry" style="display:flex;gap:6px;align-items:baseline;padding:2px 0;font-size:10px;color:#a5abc2">
      ${blocked}
      <span style="color:#b388ff">${direction}</span>
      <span style="flex:1;color:#d0d4e8">${entry.path}</span>
      <span style="color:#666">${formatTimestamp(entry.timestamp)}</span>
    </div>
  `;
}

// ─── Rejection History Rendering ──────────────────────────────────────────────

function renderRejectionEntry(entry: AclHistoryEntry, idx: number): string {
  const capLabel = DEMO_CAPABILITY_LABELS[entry.capability as keyof typeof DEMO_CAPABILITY_LABELS] ?? entry.capability;
  const timeStr = formatTimestamp(entry.timestamp);

  // Summarize the NIP-01 message
  let messageSummary = '';
  if (entry.message && Array.isArray(entry.message)) {
    const verb = entry.message[0];
    const event = entry.message[1];
    if (typeof event === 'object' && event !== null) {
      const e = event as Record<string, unknown>;
      const kind = e.kind ?? '?';
      const topic = Array.isArray(e.tags)
        ? (e.tags as string[][]).find(t => t[0] === 't')?.[1]
        : undefined;
      messageSummary = `${verb} kind:${kind}${topic ? ` topic:${topic}` : ''}`;
    } else {
      messageSummary = String(verb);
    }
  }

  const rawId = `acl-raw-${idx}`;
  const rawJson = entry.message ? JSON.stringify(entry.message, null, 2) : 'no message context';

  return `
    <div style="padding:6px 0;border-bottom:1px solid #1a1b2e">
      <div style="display:flex;gap:6px;align-items:baseline;font-size:10px">
        <span style="color:#ff3b3b">&#10007;</span>
        <span style="color:#d0d4e8;flex:1">${capLabel}</span>
        <span style="color:#666">${timeStr}</span>
      </div>
      ${messageSummary ? `<div style="font-size:9px;color:#7981a0;margin-top:2px;padding-left:16px">${messageSummary}</div>` : ''}
      <div style="margin-top:3px;padding-left:16px">
        <button
          onclick="(function(){var el=document.getElementById('${rawId}');el.style.display=el.style.display==='none'?'block':'none'})()"
          style="background:transparent;border:none;color:#5a6080;font-size:9px;cursor:pointer;padding:0;text-decoration:underline"
        >raw</button>
        <pre id="${rawId}" style="display:none;margin:4px 0 0;padding:6px 8px;background:#0a0b14;border-radius:4px;font-size:9px;color:#7981a0;max-height:120px;overflow:auto;white-space:pre-wrap;word-break:break-all">${rawJson}</pre>
      </div>
    </div>
  `;
}

function renderRejectionHistory(denials: AclHistoryEntry[]): string {
  if (denials.length === 0) {
    return `<div style="color:#444;font-size:10px;padding:4px 0">no rejections recorded</div>`;
  }
  return denials
    .slice()
    .reverse()
    .map((entry, idx) => renderRejectionEntry(entry, idx))
    .join('');
}

// Renders inspector sections including "Current State" and "Recent Activity" blocks
function renderInspectorContent(detail: NodeDetail): string {
  const sectionItems = (items: Array<{ label: string; value: string }>) =>
    items
      .map(
        (item) => `
          <div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid #1f2235">
            <span style="color:#7981a0;font-size:10px;letter-spacing:0.12em;text-transform:uppercase">${item.label}</span>
            <span style="color:#d0d4e8;font-size:11px;text-align:right;word-break:break-all">${item.value}</span>
          </div>
        `
      )
      .join('');

  const sections = detail.inspectorSections
    .map(
      (section) => `
        <div class="inspector-section" style="margin-bottom:16px">
          <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7c86a7;margin-bottom:8px">${section.heading}</div>
          ${sectionItems(section.items)}
        </div>
      `
    )
    .join('');

  const activity = detail.recentActivity;
  const activityHtml = activity.length === 0
    ? `<div style="color:#444;font-size:10px;padding:4px 0">no recent activity</div>`
    : activity
        .slice()
        .reverse()
        .map(renderActivityEntry)
        .join('');

  // Policy button for ACL node
  const policyBtn = detail.role === 'acl'
    ? `
      <div style="padding:0 0 16px">
        <button
          id="inspector-open-policy"
          style="width:100%;padding:8px 12px;background:#1a1b2e;border:1px solid #2a2d42;border-radius:6px;color:#b388ff;font-size:11px;cursor:pointer;font-family:inherit;letter-spacing:0.05em"
        >Open Policy Matrix</button>
      </div>
    `
    : '';

  // ACL rejections section for napplet and acl nodes
  const denialsHtml = detail.aclDenials.length > 0 || detail.role === 'napplet' || detail.role === 'acl'
    ? `
      <div class="inspector-section" style="margin-bottom:16px">
        <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7c86a7;margin-bottom:8px">ACL Rejections</div>
        <div id="inspector-denials-list">
          ${renderRejectionHistory(detail.aclDenials)}
        </div>
      </div>
    `
    : '';

  return `
    <div style="padding:0 16px 16px">
      ${policyBtn}
      ${sections}
      ${denialsHtml}
      <div class="inspector-section" style="margin-bottom:16px">
        <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7c86a7;margin-bottom:8px">Recent Activity</div>
        <div id="inspector-activity-list">
          ${activityHtml}
        </div>
      </div>
    </div>
  `;
}

function renderInspectorHeader(detail: NodeDetail): string {
  return `
    <div style="padding:12px 16px 10px;border-bottom:1px solid #1f2235;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7981a0;margin-bottom:2px">${detail.role}</div>
        <div style="font-size:16px;color:#f0f6ff;text-transform:lowercase">${detail.title}</div>
      </div>
      <button
        id="inspector-close"
        aria-label="Close inspector"
        style="background:transparent;border:1px solid #3a3a4a;color:#7981a0;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit"
      >close</button>
    </div>
  `;
}

function renderTabBar(): string {
  const nodeActive = _activeTab === 'node';
  const constActive = _activeTab === 'constants';
  return `
    <div id="inspector-tab-bar" style="display:flex;border-bottom:1px solid #1f2235;padding:0 12px;gap:0;flex-shrink:0">
      <button data-inspector-tab="node"
        style="padding:8px 14px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;font-family:inherit;
               background:transparent;border:none;cursor:pointer;
               color:${nodeActive ? '#f0f6ff' : '#7981a0'};
               border-bottom:${nodeActive ? '2px solid #00f0ff' : '2px solid transparent'}">
        Node
      </button>
      <button data-inspector-tab="constants"
        style="padding:8px 14px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;font-family:inherit;
               background:transparent;border:none;cursor:pointer;
               color:${constActive ? '#f0f6ff' : '#7981a0'};
               border-bottom:${constActive ? '2px solid #00f0ff' : '2px solid transparent'}">
        Constants
      </button>
    </div>
  `;
}

function renderEmptyInspector(): string {
  return `
    <div style="height:100%;display:flex;flex-direction:column;overflow:hidden">
      ${renderTabBar()}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;color:#3a3a4a;font-size:11px;text-align:center;padding:24px">
        <div style="margin-bottom:8px;font-size:24px;opacity:0.3">&#x2B21;</div>
        <div>select a node to inspect</div>
      </div>
    </div>
  `;
}

function wireTabHandlers(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('[data-inspector-tab]');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const target = tab.dataset.inspectorTab as InspectorTab;
      if (target === _activeTab) return;
      _activeTab = target;
      updateInspectorPane();
    });
  }
}

function updateInspectorPane(): void {
  const pane = getInspectorPane();
  if (!pane) return;

  // Constants tab is always accessible, even without a selected node
  if (_activeTab === 'constants') {
    // Ensure inspector is visible
    const inner = getFlowAreaInner();
    if (inner) inner.classList.add('inspector-open');

    pane.innerHTML = `
      <div style="height:100%;display:flex;flex-direction:column;overflow:hidden">
        ${renderTabBar()}
        <div style="flex:1;overflow-y:auto;padding-top:4px">
          ${renderConstantsPanel()}
        </div>
      </div>
    `;
    wireTabHandlers();
    wireConstantsPanelEvents(() => updateInspectorPane());
    return;
  }

  // Node tab: need a selected node
  if (!_selectedNodeId || !_topology || !_getOptions) {
    pane.innerHTML = renderEmptyInspector();
    wireTabHandlers();
    return;
  }

  const node: DemoTopologyNode | undefined = _topology.nodes.find(
    (n) => n.id === _selectedNodeId,
  );
  if (!node) {
    pane.innerHTML = renderEmptyInspector();
    wireTabHandlers();
    return;
  }

  const options = _getOptions();
  const detail = buildNodeDetails(node, options);

  // Merge in live activity from ring buffer
  detail.recentActivity = getNodeActivity(_selectedNodeId);

  pane.innerHTML = `
    <div style="height:100%;display:flex;flex-direction:column;overflow:hidden">
      ${renderTabBar()}
      ${renderInspectorHeader(detail)}
      <div style="flex:1;overflow-y:auto;padding-top:4px">
        ${renderInspectorContent(detail)}
      </div>
    </div>
  `;

  // Wire close button
  const closeBtn = document.getElementById('inspector-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => setSelectedNodeId(null));
  }

  // Wire policy modal button (ACL node only)
  const policyBtn = document.getElementById('inspector-open-policy');
  if (policyBtn) {
    policyBtn.addEventListener('click', () => openPolicyModal());
  }

  wireTabHandlers();
}

function showInspector(nodeId: string): void {
  const inner = getFlowAreaInner();
  if (inner) inner.classList.add('inspector-open');
  _activeTab = 'node';
  _selectedNodeId = nodeId;
  updateInspectorPane();

  // Mark the selected node
  document.querySelectorAll('[data-node-id]').forEach((el) => {
    el.classList.toggle('inspector-selected', el.getAttribute('data-node-id') === nodeId);
  });
}

function hideInspector(): void {
  const inner = getFlowAreaInner();
  if (inner) inner.classList.remove('inspector-open');
  _selectedNodeId = null;
  const pane = getInspectorPane();
  if (pane) pane.innerHTML = renderEmptyInspector();

  document.querySelectorAll('[data-node-id]').forEach((el) => {
    el.classList.remove('inspector-selected');
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Set the selected node id. Pass null to clear.
 *
 * @param id - Topology node id or null to deselect
 */
export function setSelectedNodeId(id: string | null): void {
  if (id === _selectedNodeId) return;
  if (id === null) {
    hideInspector();
  } else {
    showInspector(id);
  }
}

/**
 * Open the inspector with the constants tab active.
 * Does not require a node selection.
 */
export function openConstantsTab(): void {
  const inner = getFlowAreaInner();
  if (inner) inner.classList.add('inspector-open');
  _activeTab = 'constants';
  updateInspectorPane();
}

/** Get the currently active inspector tab. */
export function getActiveTab(): InspectorTab {
  return _activeTab;
}

/** Set the active inspector tab. */
export function setActiveTab(tab: InspectorTab): void {
  if (tab === _activeTab) return;
  _activeTab = tab;
  updateInspectorPane();
}

/**
 * Initialize the inspector pane, wiring up live update polling.
 *
 * @param getOptions - Callback to fetch current node-detail options
 * @param topology - Demo topology (static during session)
 */
export function initNodeInspector(
  getOptions: () => NodeDetailOptions,
  topology: DemoTopology,
): void {
  _getOptions = getOptions;
  _topology = topology;

  // Start polling for live updates while inspector is open
  if (_updateTimer) clearInterval(_updateTimer);
  _updateTimer = setInterval(() => {
    if (_selectedNodeId) updateInspectorPane();
  }, 1500);
}
