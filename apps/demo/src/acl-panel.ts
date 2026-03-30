/**
 * acl-panel.ts -- Per-napplet ACL control panel.
 *
 * Renders toggle buttons for each capability above each napplet.
 * Toggles call shell-host.toggleCapability() and log changes to the debugger.
 */

import { getNapplets, toggleCapability, toggleBlock } from './shell-host.js';
import type { NappletDebugger } from './debugger.js';
import type { Capability } from '@napplet/shell';

const DEMO_CAPABILITIES: { cap: Capability; label: string }[] = [
  { cap: 'relay:read', label: 'Read Relay' },
  { cap: 'relay:write', label: 'Write Relay' },
  { cap: 'sign:event', label: 'Sign' },
  { cap: 'storage:read', label: 'Read Storage' },
  { cap: 'storage:write', label: 'Write Storage' },
];

let debugger_: NappletDebugger | null = null;

export function setDebugger(dbg: NappletDebugger): void {
  debugger_ = dbg;
}

/**
 * Render ACL controls for a specific napplet into its dedicated container.
 */
function renderNappletAcl(containerId: string, windowId: string, info: { name: string; authenticated: boolean }): void {
  const container = document.getElementById(containerId);
  if (!container || !info.authenticated) return;

  container.innerHTML = '';

  const row = document.createElement('div');
  row.className = 'flex flex-wrap gap-1';

  // Capability toggles
  for (const { cap, label } of DEMO_CAPABILITIES) {
    const toggle = document.createElement('button');
    toggle.className = 'px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors toggle-on text-neon-green';
    toggle.textContent = label;
    toggle.title = `${cap} — click to revoke`;
    toggle.dataset.enabled = 'true';

    toggle.addEventListener('click', () => {
      const enabled = toggle.dataset.enabled === 'true';
      const newState = !enabled;
      toggle.dataset.enabled = String(newState);

      if (newState) {
        toggle.className = 'px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors toggle-on text-neon-green';
        toggle.title = `${cap} — click to revoke`;
      } else {
        toggle.className = 'px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors toggle-off text-neon-red';
        toggle.title = `${cap} — click to grant`;
      }

      toggleCapability(windowId, cap, newState);
      debugger_?.addSystemMessage(
        `${newState ? 'GRANT' : 'REVOKE'} ${cap} on ${info.name}`
      );
    });

    row.appendChild(toggle);
  }

  // Block toggle
  const blockBtn = document.createElement('button');
  blockBtn.className = 'px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors bg-surface-dark border-surface-border text-gray-500 hover:text-neon-red hover:border-neon-red/40';
  blockBtn.textContent = 'Block';
  blockBtn.dataset.blocked = 'false';

  blockBtn.addEventListener('click', () => {
    const blocked = blockBtn.dataset.blocked === 'true';
    const newState = !blocked;
    blockBtn.dataset.blocked = String(newState);

    if (newState) {
      blockBtn.className = 'px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors bg-neon-red/20 border-neon-red/40 text-neon-red';
      blockBtn.textContent = 'Blocked';
    } else {
      blockBtn.className = 'px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors bg-surface-dark border-surface-border text-gray-500 hover:text-neon-red hover:border-neon-red/40';
      blockBtn.textContent = 'Block';
    }

    toggleBlock(windowId, newState);
    debugger_?.addSystemMessage(
      `${newState ? 'BLOCK' : 'UNBLOCK'} ${info.name}`
    );
  });

  row.appendChild(blockBtn);
  container.appendChild(row);
}

/**
 * Render ACL controls for all napplets into their respective containers.
 * Call this after AUTH completes.
 */
export function renderAclPanels(): void {
  const napplets = getNapplets();

  for (const [windowId, info] of napplets) {
    if (info.name === 'chat') {
      renderNappletAcl('chat-acl', windowId, info);
    } else if (info.name === 'bot') {
      renderNappletAcl('bot-acl', windowId, info);
    }
  }

  // Re-render if any napplets not yet authenticated
  const hasUnauthenticated = Array.from(napplets.values()).some(n => !n.authenticated);
  if (hasUnauthenticated) {
    setTimeout(() => renderAclPanels(), 1000);
  }
}
