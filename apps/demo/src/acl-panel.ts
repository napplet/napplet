/**
 * acl-panel.ts -- Per-napplet ACL control panel.
 *
 * Renders toggle buttons above each napplet using inline styles
 * (UnoCSS can't detect dynamically-assigned classes).
 */

import { getNapplets, toggleCapability, toggleBlock } from './shell-host.js';
import type { NappletDebugger } from './debugger.js';
import type { Capability } from '@napplet/shell';

const DEMO_CAPABILITIES: { cap: Capability; label: string }[] = [
  { cap: 'relay:read', label: 'Read Shell' },
  { cap: 'relay:write', label: 'Write Shell' },
  { cap: 'sign:event', label: 'Sign' },
  { cap: 'state:read', label: 'Read State' },
  { cap: 'state:write', label: 'Write State' },
];

let debugger_: NappletDebugger | null = null;

export function setDebugger(dbg: NappletDebugger): void {
  debugger_ = dbg;
}

function applyBtnStyle(btn: HTMLButtonElement, on: boolean): void {
  btn.className = 'acl-btn px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ' +
    (on ? 'acl-btn-on' : 'acl-btn-off');
}

function renderNappletAcl(containerId: string, windowId: string, info: { name: string; authenticated: boolean }): void {
  const container = document.getElementById(containerId);
  if (!container || !info.authenticated) return;

  container.innerHTML = '';

  const row = document.createElement('div');
  row.className = 'flex flex-wrap gap-1.5';

  for (const { cap, label } of DEMO_CAPABILITIES) {
    const toggle = document.createElement('button');
    applyBtnStyle(toggle, true);
    toggle.textContent = label;
    toggle.title = `${cap} — click to revoke`;
    toggle.dataset.enabled = 'true';

    toggle.addEventListener('click', () => {
      const enabled = toggle.dataset.enabled === 'true';
      const newState = !enabled;
      toggle.dataset.enabled = String(newState);
      applyBtnStyle(toggle, newState);
      toggle.title = `${cap} — click to ${newState ? 'revoke' : 'grant'}`;

      toggleCapability(windowId, cap, newState);
      debugger_?.addSystemMessage(`${newState ? 'GRANT' : 'REVOKE'} ${cap} on ${info.name}`);
    });

    row.appendChild(toggle);
  }

  // Block button
  const blockBtn = document.createElement('button');
  blockBtn.className = 'acl-btn px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer acl-btn-block';
  blockBtn.textContent = 'Block';
  blockBtn.dataset.blocked = 'false';

  blockBtn.addEventListener('click', () => {
    const blocked = blockBtn.dataset.blocked === 'true';
    const newState = !blocked;
    blockBtn.dataset.blocked = String(newState);

    if (newState) {
      blockBtn.className = 'acl-btn px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer acl-btn-blocked';
      blockBtn.textContent = 'Blocked';
    } else {
      blockBtn.className = 'acl-btn px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer acl-btn-block';
      blockBtn.textContent = 'Block';
    }

    toggleBlock(windowId, newState);
    debugger_?.addSystemMessage(`${newState ? 'BLOCK' : 'UNBLOCK'} ${info.name}`);
  });

  row.appendChild(blockBtn);
  container.appendChild(row);
}

const rendered = new Set<string>();

export function renderAclPanels(onlyFor?: Set<string>): void {
  const napplets = getNapplets();

  for (const [windowId, info] of napplets) {
    // Skip if already rendered (don't wipe user's toggle state)
    if (rendered.has(info.name)) continue;
    // Skip if not in the target set
    if (onlyFor && !onlyFor.has(info.name)) continue;

    if (info.name === 'chat') {
      renderNappletAcl('chat-acl', windowId, info);
      rendered.add('chat');
    } else if (info.name === 'bot') {
      renderNappletAcl('bot-acl', windowId, info);
      rendered.add('bot');
    }
  }
}
