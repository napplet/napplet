/**
 * acl-modal.ts — Full-screen ACL policy matrix modal.
 *
 * Displays the system-wide ACL policy as a grid/table: rows are napplets,
 * columns are capabilities, cells show granted (green check), revoked (red cross),
 * or default (gray dash). Opens from the ACL node inspector button.
 */

import { DEMO_CAPABILITY_LABELS } from './acl-panel.js';
import { getNapplets, relay, toggleCapability, getDemoServiceNames, toggleService, isServiceEnabled } from './shell-host.js';
import type { Capability } from '@napplet/shell';

// ─── Constants ──────────────────────────────────────────────────────────────

const ALL_CAPABILITIES: Capability[] = [
  'relay:read',
  'relay:write',
  'cache:read',
  'cache:write',
  'sign:event',
  'sign:nip04',
  'sign:nip44',
  'state:read',
  'state:write',
  'hotkey:forward',
];

const MODAL_ID = 'acl-policy-modal';

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Open the ACL policy matrix modal.
 * Removes any existing modal first, builds the grid from live ACL state.
 */
export function openPolicyModal(): void {
  // Remove existing modal if any
  closePolicyModal();

  const napplets = getNapplets();
  const aclState = relay.runtime.aclState;

  // Build rows data
  const rows: Array<{
    name: string;
    windowId: string;
    blocked: boolean;
    caps: Map<Capability, 'granted' | 'revoked' | 'default'>;
  }> = [];

  for (const [windowId, info] of napplets) {
    if (!info.pubkey) continue; // skip unauthenticated
    const entry = aclState.getEntry(info.pubkey, info.dTag || '', info.aggregateHash || '');
    const caps = new Map<Capability, 'granted' | 'revoked' | 'default'>();

    for (const cap of ALL_CAPABILITIES) {
      const allowed = aclState.check(info.pubkey, info.dTag || '', info.aggregateHash || '', cap);
      if (entry) {
        // Has explicit entry — check if capability is in the granted list
        const isExplicitlyGranted = entry.capabilities.includes(cap);
        if (allowed && isExplicitlyGranted) {
          caps.set(cap, 'granted');
        } else if (allowed) {
          caps.set(cap, 'default'); // allowed by default policy, not explicitly granted
        } else {
          caps.set(cap, 'revoked');
        }
      } else {
        // No explicit entry — everything is default policy
        caps.set(cap, allowed ? 'default' : 'revoked');
      }
    }

    rows.push({
      name: info.name,
      windowId,
      blocked: entry?.blocked ?? false,
      caps,
    });
  }

  // Render modal
  const overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(2px)';

  const container = document.createElement('div');
  container.style.cssText = 'background:#13141f;border:1px solid #2a2d42;border-radius:12px;padding:24px;max-width:90vw;max-height:80vh;overflow:auto;color:#d0d4e8;font-family:inherit;min-width:600px';

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #1f2235';
  header.innerHTML = `
    <div>
      <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7981a0;margin-bottom:2px">system policy</div>
      <div style="font-size:18px;color:#f0f6ff">ACL Capability Matrix</div>
    </div>
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'close';
  closeBtn.style.cssText = 'background:transparent;border:1px solid #3a3a4a;color:#7981a0;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit';
  closeBtn.addEventListener('click', closePolicyModal);
  header.appendChild(closeBtn);
  container.appendChild(header);

  // Services section
  const servicesSection = document.createElement('div');
  servicesSection.style.cssText = 'margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #1f2235';

  const servicesLabel = document.createElement('div');
  servicesLabel.style.cssText = 'font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7981a0;margin-bottom:8px';
  servicesLabel.textContent = 'services';
  servicesSection.appendChild(servicesLabel);

  const servicesGrid = document.createElement('div');
  servicesGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';

  const serviceNames = getDemoServiceNames();
  for (const name of serviceNames) {
    const serviceItem = document.createElement('div');
    serviceItem.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;border:1px solid #2a2d42;background:#181926';

    const serviceNameSpan = document.createElement('span');
    serviceNameSpan.textContent = name;
    serviceNameSpan.style.cssText = 'font-size:11px;color:#d0d4e8;font-weight:500';
    serviceItem.appendChild(serviceNameSpan);

    // Toggle switch
    const toggle = document.createElement('button');
    const enabled = isServiceEnabled(name);
    toggle.style.cssText = `width:32px;height:16px;border-radius:8px;border:none;cursor:pointer;position:relative;transition:background 0.2s;background:${enabled ? '#39ff14' : '#3a3a4a'}`;

    const knob = document.createElement('span');
    knob.style.cssText = `display:block;width:12px;height:12px;border-radius:50%;background:#fff;position:absolute;top:2px;transition:left 0.2s;left:${enabled ? '18px' : '2px'}`;
    toggle.appendChild(knob);

    toggle.addEventListener('click', () => {
      const currentlyEnabled = isServiceEnabled(name);
      const newState = !currentlyEnabled;
      toggleService(name, newState);
      // Update toggle visual
      toggle.style.background = newState ? '#39ff14' : '#3a3a4a';
      knob.style.left = newState ? '18px' : '2px';
      // Update service name opacity
      serviceNameSpan.style.color = newState ? '#d0d4e8' : '#555';
    });

    serviceItem.appendChild(toggle);

    // Dim the label if disabled
    if (!enabled) {
      serviceNameSpan.style.color = '#555';
    }

    servicesGrid.appendChild(serviceItem);
  }

  servicesSection.appendChild(servicesGrid);
  container.appendChild(servicesSection);

  // Table
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px';

  // Table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const nappletTh = document.createElement('th');
  nappletTh.textContent = 'Napplet';
  nappletTh.style.cssText = 'text-align:left;padding:8px 6px;color:#7981a0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:1px solid #1f2235;white-space:nowrap';
  headerRow.appendChild(nappletTh);

  for (const cap of ALL_CAPABILITIES) {
    const th = document.createElement('th');
    th.textContent = DEMO_CAPABILITY_LABELS[cap];
    th.title = cap;
    th.style.cssText = 'text-align:center;padding:8px 4px;color:#7981a0;font-size:9px;letter-spacing:0.05em;text-transform:uppercase;border-bottom:1px solid #1f2235;white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis';
    headerRow.appendChild(th);
  }

  const blockedTh = document.createElement('th');
  blockedTh.textContent = 'Blocked';
  blockedTh.style.cssText = 'text-align:center;padding:8px 4px;color:#7981a0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:1px solid #1f2235';
  headerRow.appendChild(blockedTh);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement('tbody');
  if (rows.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyTd = document.createElement('td');
    emptyTd.colSpan = ALL_CAPABILITIES.length + 2;
    emptyTd.textContent = 'No authenticated napplets';
    emptyTd.style.cssText = 'padding:16px;text-align:center;color:#444;font-style:italic';
    emptyRow.appendChild(emptyTd);
    tbody.appendChild(emptyRow);
  }

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.style.cssText = 'border-bottom:1px solid #1a1b2e';

    const nameTd = document.createElement('td');
    nameTd.textContent = row.name;
    nameTd.style.cssText = 'padding:8px 6px;color:#d0d4e8;font-weight:600;white-space:nowrap';
    tr.appendChild(nameTd);

    for (const cap of ALL_CAPABILITIES) {
      const td = document.createElement('td');
      td.style.cssText = 'text-align:center;padding:8px 4px;font-size:14px;cursor:pointer;user-select:none';
      const state = row.caps.get(cap) ?? 'default';

      function renderCellState(cell: HTMLElement, cellState: 'granted' | 'revoked' | 'default'): void {
        if (cellState === 'granted') {
          cell.innerHTML = '<span style="color:#39ff14" title="granted — click to revoke">&#10003;</span>';
        } else if (cellState === 'revoked') {
          cell.innerHTML = '<span style="color:#ff3b3b" title="revoked — click to grant">&#10007;</span>';
        } else {
          cell.innerHTML = '<span style="color:#555" title="default (permissive) — click to revoke">&#8212;</span>';
        }
      }

      renderCellState(td, state);

      // Click to toggle: allowed (granted/default) -> revoked -> allowed
      td.addEventListener('click', () => {
        const info = napplets.get(row.windowId);
        if (!info?.pubkey) return;
        const isCurrentlyAllowed = aclState.check(info.pubkey, info.dTag || '', info.aggregateHash || '', cap);
        const newEnabled = !isCurrentlyAllowed;
        toggleCapability(row.windowId, cap, newEnabled);
        // Update cell visual immediately
        renderCellState(td, newEnabled ? 'granted' : 'revoked');
        // Update the row's caps map for consistency
        row.caps.set(cap, newEnabled ? 'granted' : 'revoked');
      });

      tr.appendChild(td);
    }

    const blockedTd = document.createElement('td');
    blockedTd.style.cssText = 'text-align:center;padding:8px 4px;font-size:14px';
    if (row.blocked) {
      blockedTd.innerHTML = '<span style="color:#ff3b3b;font-weight:bold" title="blocked">&#9679;</span>';
    } else {
      blockedTd.innerHTML = '<span style="color:#555" title="not blocked">&#8212;</span>';
    }
    tr.appendChild(blockedTd);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  // Legend
  const legend = document.createElement('div');
  legend.style.cssText = 'margin-top:16px;padding-top:12px;border-top:1px solid #1f2235;display:flex;gap:16px;font-size:10px;color:#7981a0';
  legend.innerHTML = `
    <span><span style="color:#39ff14">&#10003;</span> granted</span>
    <span><span style="color:#ff3b3b">&#10007;</span> revoked</span>
    <span><span style="color:#555">&#8212;</span> default (permissive)</span>
    <span><span style="color:#ff3b3b;font-weight:bold">&#9679;</span> blocked</span>
  `;
  container.appendChild(legend);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePolicyModal();
  });

  // Close on ESC
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closePolicyModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

/** Close the ACL policy modal if open. */
export function closePolicyModal(): void {
  const existing = document.getElementById(MODAL_ID);
  if (existing) existing.remove();
}

/** Check if the policy modal is currently open. */
export function isPolicyModalOpen(): boolean {
  return document.getElementById(MODAL_ID) !== null;
}

/**
 * Refresh the policy modal if it is currently open.
 * Called after external state changes (e.g., inline ACL panel toggle)
 * to keep the modal in sync.
 */
export function refreshPolicyModal(): void {
  if (isPolicyModalOpen()) {
    openPolicyModal(); // close-and-reopen rebuilds from live state
  }
}
