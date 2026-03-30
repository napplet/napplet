/**
 * main.ts -- Demo playground entry point.
 *
 * Boots shell, loads napplets, wires debugger, ACL panel, and flow animator.
 */
import 'virtual:uno.css';
import { bootShell, loadNapplet, getDemoHostPubkey, getNapplets } from './shell-host.js';
import './debugger.js';
import type { NappletDebugger } from './debugger.js';
import { renderAclPanels, setDebugger } from './acl-panel.js';
import { initFlowAnimator } from './flow-animator.js';

// Boot the shell (now includes signer)
const { tap } = bootShell();

// Connect debugger to tap
const debuggerEl = document.getElementById('debugger') as NappletDebugger;
if (debuggerEl) {
  debuggerEl.connectTap(tap);
  setDebugger(debuggerEl);
  debuggerEl.addSystemMessage(`shell booted -- host pubkey: ${getDemoHostPubkey().substring(0, 16)}...`);
}

// Show pubkey in shell center panel
const shellPubkey = document.getElementById('shell-pubkey');
if (shellPubkey) shellPubkey.textContent = `pubkey: ${getDemoHostPubkey().substring(0, 20)}...`;

// Load demo napplets
const chatInfo = loadNapplet('chat', 'chat-frame-container');
const botInfo = loadNapplet('bot', 'bot-frame-container');

// Init flow animator — resolves napplet names from windowId
initFlowAnimator(tap, (windowId: string) => {
  const napplets = getNapplets();
  const info = napplets.get(windowId);
  return info?.name ?? null;
});

// Track which napplets have had their ACL panel rendered (render only once)
const aclRendered = new Set<string>();

// Update status indicators when napplets AUTH (only once per napplet)
tap.onMessage((msg) => {
  if (msg.verb === 'OK' && msg.parsed.success === true && msg.direction === 'shell->napplet') {
    setTimeout(() => {
      const chatStatus = document.getElementById('chat-status');
      const botStatus = document.getElementById('bot-status');

      if (chatInfo.authenticated && chatStatus && !aclRendered.has('chat')) {
        chatStatus.textContent = 'authenticated';
        chatStatus.style.color = '#39ff14';
        aclRendered.add('chat');
      }
      if (botInfo.authenticated && botStatus && !aclRendered.has('bot')) {
        botStatus.textContent = 'authenticated';
        botStatus.style.color = '#39ff14';
        aclRendered.add('bot');
      }

      // Only render ACL panels for newly authenticated napplets
      if (aclRendered.size > 0) {
        renderAclPanels(aclRendered);
      }
    }, 200);
  }

  // Log inter-pane events prominently
  if (msg.verb === 'EVENT' && msg.parsed.topic) {
    debuggerEl?.addSystemMessage(
      `inter-pane: ${msg.parsed.topic} (kind:${msg.parsed.eventKind})`
    );
  }
});

console.log('[napplet playground] initialized');
