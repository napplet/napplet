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
const tap = createMessageTap();

// --- Outbound message interception ---
//
// The pseudo-relay sends messages to napplets via:
//   1. originRegistry.getIframeWindow(windowId).postMessage() -- for sendChallenge, deliverToSubscriptions
//   2. sourceWindow.postMessage() -- for handleAuth, handleEvent (sourceWindow = event.source)
//
// For cross-origin sandboxed iframes, we can't monkey-patch Window.prototype.postMessage
// because cross-origin windows use their own prototype chain. Instead, we:
//   1. Wrap originRegistry.getIframeWindow to return a postMessage-intercepting Proxy
//   2. Wrap relay.handleMessage to proxy event.source with postMessage interception
//      while keeping a side-channel so originRegistry.getWindowId still resolves

// Map from proxy to real window for origin registry resolution
const proxyToReal = new WeakMap<object, Window>();

function createPostMessageProxy(realWin: Window): Window {
  const proxy = new Proxy(realWin, {
    get(target, prop) {
      if (prop === 'postMessage') {
        return (msg: unknown, targetOrigin: string, transfer?: Transferable[]) => {
          if (Array.isArray(msg)) {
            tap.recordOutbound(msg);
          }
          return target.postMessage(msg, targetOrigin, transfer);
        };
      }
      // For everything else, return the real property
      try {
        const val = (target as any)[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      } catch {
        // Cross-origin property access can throw -- return undefined
        return undefined;
      }
    },
  });
  proxyToReal.set(proxy, realWin);
  return proxy as unknown as Window;
}

// Wrap originRegistry.getIframeWindow to return proxied windows
const _origGetIframeWindow = originRegistry.getIframeWindow.bind(originRegistry);
originRegistry.getIframeWindow = (windowId: string): Window | null => {
  const win = _origGetIframeWindow(windowId);
  if (!win) return null;
  return createPostMessageProxy(win);
};

// Wrap originRegistry.getWindowId to handle both real and proxied windows
const _origGetWindowId = originRegistry.getWindowId.bind(originRegistry);
originRegistry.getWindowId = (win: Window): string | undefined => {
  // First try the real window
  const result = _origGetWindowId(win);
  if (result) return result;
  // If not found, check if it's a proxy and try the real window
  const real = proxyToReal.get(win);
  if (real) return _origGetWindowId(real);
  return undefined;
};

const relay = createPseudoRelay(mockResult.hooks);

// Install the message tap (captures napplet->shell messages via addEventListener)
tap.install(window);

// Wrap relay.handleMessage to proxy event.source for outbound capture.
const _origHandleMessage = relay.handleMessage;
relay.handleMessage = (event: MessageEvent) => {
  if (!event.source || !Array.isArray(event.data)) {
    _origHandleMessage(event);
    return;
  }

  // Create a proxied version of event.source for postMessage interception
  const proxiedSource = createPostMessageProxy(event.source as Window);

  // Create a synthetic MessageEvent-like object with the proxied source
  const syntheticEvent = new Proxy(event, {
    get(target, prop) {
      if (prop === 'source') return proxiedSource;
      const val = (target as any)[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });

  _origHandleMessage(syntheticEvent);
};

// Attach the relay's wrapped message handler
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
