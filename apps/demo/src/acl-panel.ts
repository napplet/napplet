/**
 * acl-panel.ts -- Per-napplet ACL control panel.
 *
 * Renders toggle buttons above each napplet using inline styles
 * (UnoCSS can't detect dynamically-assigned classes).
 */

import { getNapplets, toggleCapability, toggleBlock } from './shell-host.js';
import type { NappletDebugger } from './debugger.js';
import type { Capability } from '@napplet/shell';

export const DEMO_CAPABILITY_LABELS: Record<Capability, string> = {
  'relay:read': 'Relay Subscribe',
  'relay:write': 'Relay Publish / Inter-Pane Send',
  'cache:read': 'Cache Read',
  'cache:write': 'Cache Write',
  'sign:event': 'Signer Requests',
  'sign:nip04': 'NIP-04 Encrypt/Decrypt',
  'sign:nip44': 'NIP-44 Encrypt/Decrypt',
  'state:read': 'State Read',
  'state:write': 'State Write',
  'hotkey:forward': 'Hotkey Forward',
};

export const DEMO_CAPABILITY_HINTS: Record<Capability, string> = {
  'relay:read': 'relay subscribe / inter-pane receive',
  'relay:write': 'relay publish / inter-pane send',
  'cache:read': 'cache read access',
  'cache:write': 'cache write access',
  'sign:event': 'signer requests',
  'sign:nip04': 'NIP-04 encryption/decryption',
  'sign:nip44': 'NIP-44 encryption/decryption',
  'state:read': 'state read',
  'state:write': 'state write',
  'hotkey:forward': 'hotkey forward',
};

const DEMO_CAPABILITIES: { cap: Capability; label: string }[] = [
  { cap: 'relay:read', label: DEMO_CAPABILITY_LABELS['relay:read'] },
  { cap: 'relay:write', label: DEMO_CAPABILITY_LABELS['relay:write'] },
  { cap: 'sign:event', label: DEMO_CAPABILITY_LABELS['sign:event'] },
  { cap: 'state:read', label: DEMO_CAPABILITY_LABELS['state:read'] },
  { cap: 'state:write', label: DEMO_CAPABILITY_LABELS['state:write'] },
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
    toggle.title = `${cap} (${DEMO_CAPABILITY_HINTS[cap]}) — click to revoke`;
    toggle.dataset.enabled = 'true';

    toggle.addEventListener('click', () => {
      const enabled = toggle.dataset.enabled === 'true';
      const newState = !enabled;
      toggle.dataset.enabled = String(newState);
      applyBtnStyle(toggle, newState);
      toggle.title = `${cap} (${DEMO_CAPABILITY_HINTS[cap]}) — click to ${newState ? 'revoke' : 'grant'}`;

      toggleCapability(windowId, cap, newState);
      debugger_?.addSystemMessage(
        `${newState ? 'GRANT' : 'REVOKE'} ${cap} (${DEMO_CAPABILITY_HINTS[cap]}) on ${info.name}`
      );
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
