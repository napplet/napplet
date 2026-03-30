/**
 * acl-panel.ts -- Per-napplet ACL control panel.
 *
 * Renders toggle switches for each capability on each loaded napplet.
 * Toggles call shell-host.toggleCapability() and log changes to the debugger.
 */

import { getNapplets, toggleCapability, toggleBlock } from './shell-host.js';
import type { NappletDebugger } from './debugger.js';
import type { Capability } from '@napplet/shell';

const DEMO_CAPABILITIES: Capability[] = [
  'relay:read',
  'relay:write',
  'sign:event',
  'storage:read',
  'storage:write',
];

let debugger_: NappletDebugger | null = null;

export function setDebugger(dbg: NappletDebugger): void {
  debugger_ = dbg;
}

/**
 * Render ACL controls for all loaded napplets into the target container.
 */
export function renderAclPanel(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const napplets = getNapplets();

  container.innerHTML = '';

  for (const [windowId, info] of napplets) {
    if (!info.authenticated) continue;

    const panel = document.createElement('div');
    panel.className = 'flex items-center gap-2 text-xs font-mono';
    panel.innerHTML = `<span class="text-neon-blue">${info.name}</span>`;

    // Capability toggles
    for (const cap of DEMO_CAPABILITIES) {
      const label = cap.split(':')[1]; // 'read', 'write', 'event'
      const prefix = cap.split(':')[0]; // 'relay', 'sign', 'storage'
      const shortLabel = `${prefix[0]}:${label[0]}`; // 'r:r', 'r:w', 's:e', etc.

      const toggle = document.createElement('button');
      toggle.className = 'px-1.5 py-0.5 rounded text-[10px] border cursor-pointer transition-colors toggle-on';
      toggle.textContent = shortLabel;
      toggle.title = cap;
      toggle.dataset.enabled = 'true';
      toggle.dataset.windowId = windowId;
      toggle.dataset.capability = cap;

      toggle.addEventListener('click', () => {
        const enabled = toggle.dataset.enabled === 'true';
        const newState = !enabled;
        toggle.dataset.enabled = String(newState);

        if (newState) {
          toggle.className = 'px-1.5 py-0.5 rounded text-[10px] border cursor-pointer transition-colors toggle-on';
        } else {
          toggle.className = 'px-1.5 py-0.5 rounded text-[10px] border cursor-pointer transition-colors toggle-off text-gray-600';
        }

        toggleCapability(windowId, cap, newState);
        debugger_?.addSystemMessage(
          `${newState ? 'GRANT' : 'REVOKE'} ${cap} on ${info.name}`
        );
      });

      panel.appendChild(toggle);
    }

    // Block toggle
    const blockBtn = document.createElement('button');
    blockBtn.className = 'px-1.5 py-0.5 rounded text-[10px] border cursor-pointer transition-colors bg-surface-dark border-surface-border text-gray-500 hover:text-neon-red hover:border-neon-red/40';
    blockBtn.textContent = 'block';
    blockBtn.dataset.blocked = 'false';

    blockBtn.addEventListener('click', () => {
      const blocked = blockBtn.dataset.blocked === 'true';
      const newState = !blocked;
      blockBtn.dataset.blocked = String(newState);

      if (newState) {
        blockBtn.className = 'px-1.5 py-0.5 rounded text-[10px] border cursor-pointer transition-colors bg-neon-red/20 border-neon-red/40 text-neon-red';
        blockBtn.textContent = 'blocked';
      } else {
        blockBtn.className = 'px-1.5 py-0.5 rounded text-[10px] border cursor-pointer transition-colors bg-surface-dark border-surface-border text-gray-500 hover:text-neon-red hover:border-neon-red/40';
        blockBtn.textContent = 'block';
      }

      toggleBlock(windowId, newState);
      debugger_?.addSystemMessage(
        `${newState ? 'BLOCK' : 'UNBLOCK'} ${info.name}`
      );
    });

    panel.appendChild(blockBtn);

    // Scenario hints
    const hints = document.createElement('div');
    hints.className = 'text-[9px] text-gray-600 ml-1';
    if (info.name === 'chat') {
      hints.textContent = 'try: revoke r:w (publish fails) | revoke r:r (no incoming)';
    } else if (info.name === 'bot') {
      hints.textContent = 'try: block (chat cant reach) | revoke s:e (cant respond)';
    }
    panel.appendChild(hints);

    container.appendChild(panel);
  }

  // Schedule a re-render if any napplets are not yet authenticated
  const hasUnauthenticated = Array.from(getNapplets().values()).some(n => !n.authenticated);
  if (hasUnauthenticated) {
    setTimeout(() => renderAclPanel(containerId), 1000);
  }
}
