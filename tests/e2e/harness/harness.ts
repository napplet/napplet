/**
 * harness.ts -- Shell test harness boot script.
 *
 * Boots @napplet/shell with mock ShellHooks, installs a message tap,
 * and exposes control functions for Playwright tests.
 *
 * Playwright API:
 *   await page.waitForFunction(() => window.__SHELL_READY__)
 *   await page.evaluate(() => window.__loadNapplet__('auth-napplet'))
 *   const msgs = await page.evaluate(() => window.__TEST_MESSAGES__)
 *   await page.evaluate(() => window.__clearMessages__())
 */

import { createPseudoRelay, originRegistry } from '@napplet/shell';
import type { PseudoRelay } from '@napplet/shell';
import { createMockHooks } from '@test/helpers';
import type { MockHooksResult } from '@test/helpers';
import { createMessageTap } from '@test/helpers';
import type { MessageTap, TappedMessage } from '@test/helpers';

// --- Types for window globals ---
declare global {
  interface Window {
    __SHELL_READY__: boolean;
    __TEST_MESSAGES__: TappedMessage[];
    __loadNapplet__: (name: string, params?: Record<string, string>) => string;
    __unloadNapplet__: (windowId: string) => void;
    __clearMessages__: () => void;
    __getRelay__: () => PseudoRelay;
    __getMockHooks__: () => MockHooksResult;
  }
}

// --- Initialize ---

const mockResult = createMockHooks();
const relay = createPseudoRelay(mockResult.hooks);
const tap = createMessageTap();

// Install the message tap (captures napplet->shell messages via addEventListener)
tap.install(window);

// Monkey-patch Window.prototype.postMessage to intercept outbound (shell->napplet) messages.
// The pseudo-relay calls sourceWindow.postMessage() and win.postMessage() internally.
// We need to capture these without modifying the relay code.
const _origPostMessage = Window.prototype.postMessage;
Window.prototype.postMessage = function (this: Window, message: unknown, targetOriginOrOptions?: unknown, transfer?: Transferable[]) {
  // Only capture messages sent to iframe windows (not to self/parent)
  if (this !== window && this !== window.parent && Array.isArray(message)) {
    tap.recordOutbound(message);
  }
  // Call original -- handle both overload signatures
  if (typeof targetOriginOrOptions === 'string') {
    return _origPostMessage.call(this, message, targetOriginOrOptions, transfer);
  }
  return _origPostMessage.call(this, message, targetOriginOrOptions as WindowPostMessageOptions);
};

// Attach the relay's message handler
window.addEventListener('message', relay.handleMessage);

// --- Napplet Management ---

let nappletCounter = 0;
const nappletFrames = new Map<string, HTMLIFrameElement>();

/**
 * Load a test napplet into a sandboxed iframe.
 * Returns the windowId assigned to this napplet.
 */
function loadNapplet(name: string, params?: Record<string, string>): string {
  const windowId = `test-napplet-${++nappletCounter}`;

  // Build napplet URL -- served from pre-built dist directories via Vite plugin
  let url = `/napplets/${name}/index.html`;
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams(params).toString();
    url += `?${search}`;
  }

  // Create sandboxed iframe (no allow-same-origin -- matches production security model)
  const iframe = document.createElement('iframe');
  iframe.id = windowId;
  iframe.className = 'napplet-frame';
  iframe.sandbox.add('allow-scripts');
  iframe.src = url;
  iframe.width = '400';
  iframe.height = '200';

  // Add to DOM
  const container = document.getElementById('frames');
  if (container) container.appendChild(iframe);
  nappletFrames.set(windowId, iframe);

  // Register origin and send AUTH challenge after iframe loads
  iframe.addEventListener('load', () => {
    if (iframe.contentWindow) {
      // Register the iframe's window in origin registry
      originRegistry.register(iframe.contentWindow, windowId);

      // Send AUTH challenge
      relay.sendChallenge(windowId);

      logStatus(`Loaded ${name} as ${windowId}, AUTH challenge sent`);
    }
  });

  return windowId;
}

/**
 * Unload a napplet iframe.
 */
function unloadNapplet(windowId: string): void {
  const iframe = nappletFrames.get(windowId);
  if (iframe) {
    originRegistry.unregister(windowId);
    iframe.remove();
    nappletFrames.delete(windowId);
    logStatus(`Unloaded ${windowId}`);
  }
}

// --- Expose to Playwright ---

window.__SHELL_READY__ = true;
window.__TEST_MESSAGES__ = tap.messages;
window.__loadNapplet__ = loadNapplet;
window.__unloadNapplet__ = unloadNapplet;
window.__clearMessages__ = () => tap.clear();
window.__getRelay__ = () => relay;
window.__getMockHooks__ = () => mockResult;

// --- Debug Logging ---

function logStatus(msg: string): void {
  const status = document.getElementById('status');
  if (status) status.textContent = msg;
  const log = document.getElementById('log');
  if (log) log.textContent += `[${new Date().toISOString()}] ${msg}\n`;
}

// Log all tapped messages for visual debugging
tap.onMessage((msg) => {
  logStatus(`${msg.direction} ${msg.verb} ${msg.parsed.subId || msg.parsed.eventId || ''}`);
});

logStatus('Shell ready -- waiting for napplet load commands');
