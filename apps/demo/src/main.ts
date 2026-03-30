/**
 * main.ts -- Demo playground entry point.
 *
 * Boots shell, loads napplets, wires debugger and ACL panel.
 */
import 'virtual:uno.css';
import { bootShell, loadNapplet } from './shell-host.js';
import './debugger.js';
import type { NappletDebugger } from './debugger.js';
import { renderAclPanel, setDebugger } from './acl-panel.js';

// Boot the shell
const { tap } = bootShell();

// Connect debugger to tap
const debuggerEl = document.getElementById('debugger') as NappletDebugger;
if (debuggerEl) {
  debuggerEl.connectTap(tap);
  setDebugger(debuggerEl);
}

// Load demo napplets
const chatInfo = loadNapplet('chat', 'chat-frame-container');
const botInfo = loadNapplet('bot', 'bot-frame-container');

// Update status indicators when napplets AUTH
tap.onMessage((msg) => {
  if (msg.verb === 'OK' && msg.parsed.success === true && msg.direction === 'shell->napplet') {
    // Re-render ACL panel when a napplet authenticates
    setTimeout(() => {
      renderAclPanel('acl-controls');

      // Update status text
      const chatStatus = document.getElementById('chat-status');
      const botStatus = document.getElementById('bot-status');
      if (chatInfo.authenticated && chatStatus) {
        chatStatus.textContent = 'authenticated';
        chatStatus.style.color = '#39ff14';
      }
      if (botInfo.authenticated && botStatus) {
        botStatus.textContent = 'authenticated';
        botStatus.style.color = '#39ff14';
      }
    }, 100);
  }
});

console.log('[napplet playground] initialized');
