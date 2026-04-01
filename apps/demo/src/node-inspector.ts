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

// ─── Module State ─────────────────────────────────────────────────────────────

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

  return `
    <div style="padding:0 16px 16px">
      ${sections}
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

function renderEmptyInspector(): string {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#3a3a4a;font-size:11px;text-align:center;padding:24px">
      <div style="margin-bottom:8px;font-size:24px;opacity:0.3">⬡</div>
      <div>select a node to inspect</div>
    </div>
  `;
}

function updateInspectorPane(): void {
  const pane = getInspectorPane();
  if (!pane) return;

  if (!_selectedNodeId || !_topology || !_getOptions) {
    pane.innerHTML = renderEmptyInspector();
    return;
  }

  const node: DemoTopologyNode | undefined = _topology.nodes.find(
    (n) => n.id === _selectedNodeId,
  );
  if (!node) {
    pane.innerHTML = renderEmptyInspector();
    return;
  }

  const options = _getOptions();
  const detail = buildNodeDetails(node, options);

  // Merge in live activity from ring buffer
  detail.recentActivity = getNodeActivity(_selectedNodeId);

  pane.innerHTML = `
    <div style="height:100%;display:flex;flex-direction:column;overflow:hidden">
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
}

function showInspector(nodeId: string): void {
  const inner = getFlowAreaInner();
  if (inner) inner.classList.add('inspector-open');
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
