/**
 * harness.ts -- Shell test harness boot script.
 *
 * Boots @napplet/shell with mock ShellAdapter, installs a message tap,
 * and exposes control functions for Playwright tests.
 *
 * Playwright API:
 *   await page.waitForFunction(() => window.__SHELL_READY__)
 *   await page.evaluate(() => window.__loadNapplet__('auth-napplet'))
 *   const msgs = await page.evaluate(() => window.__TEST_MESSAGES__)
 *   await page.evaluate(() => window.__clearMessages__())
 */

import { createShellBridge, originRegistry } from '@napplet/shell';
import type { ShellBridge, Capability } from '@napplet/shell';
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
    __getRelay__: () => ShellBridge;
    __getMockHooks__: () => MockHooksResult;
    __injectMessage__: (windowId: string, data: unknown[]) => void;
    __createSubscription__: (windowId: string, subId: string, filters: unknown[]) => void;
    __publishEvent__: (windowId: string, event: unknown) => void;
    __closeSubscription__: (windowId: string, subId: string) => void;
    __getChallenge__: (windowId: string) => string | undefined;
    __getNappletFrames__: () => string[];
    // --- Phase 4: Capability test globals ---
    __aclRevoke__: (pubkey: string, dTag: string, hash: string, cap: string) => void;
    __aclGrant__: (pubkey: string, dTag: string, hash: string, cap: string) => void;
    __aclBlock__: (pubkey: string, dTag: string, hash: string) => void;
    __aclUnblock__: (pubkey: string, dTag: string, hash: string) => void;
    __aclPersist__: () => void;
    __aclLoad__: () => void;
    __aclClear__: () => void;
    __aclCheck__: (pubkey: string, dTag: string, hash: string, cap: string) => boolean;
    __aclGetEntry__: (pubkey: string, dTag: string, hash: string) => unknown;
    __getNappPubkey__: (windowId: string) => string | undefined;
    __getNappEntry__: (windowId: string) => { pubkey: string; dTag: string; aggregateHash: string } | undefined;
    __setSigner__: (signer: unknown) => void;
    __setConsentHandler__: (mode: 'auto-approve' | 'auto-deny') => void;
    __injectShellEvent__: (topic: string, payload: unknown) => void;
    __getLocalStorageKeys__: () => string[];
    __getLocalStorageItem__: (key: string) => string | null;
    __setLocalStorageItem__: (key: string, value: string) => void;
    __clearLocalStorage__: () => void;
  }
}

// --- Initialize ---

const mockResult = createMockHooks();
const tap = createMessageTap();

// --- Outbound message interception ---
//
// The ShellBridge sends messages to napplets via:
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

const relay = createShellBridge(mockResult.hooks);

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

// --- Protocol Control Functions (Phase 3) ---

/**
 * Inject a raw NIP-01 message as if it came from the specified napplet iframe.
 * Constructs a MessageEvent with the iframe's contentWindow as source.
 */
window.__injectMessage__ = (windowId: string, data: unknown[]) => {
  const iframe = nappletFrames.get(windowId);
  if (!iframe?.contentWindow) throw new Error(`No iframe for windowId: ${windowId}`);
  const event = new MessageEvent('message', {
    data,
    source: iframe.contentWindow,
    origin: 'null',
  });
  window.dispatchEvent(event);
};

/**
 * Shorthand: inject a REQ message from the specified napplet.
 */
window.__createSubscription__ = (windowId: string, subId: string, filters: unknown[]) => {
  window.__injectMessage__(windowId, ['REQ', subId, ...filters]);
};

/**
 * Shorthand: inject an EVENT message from the specified napplet.
 */
window.__publishEvent__ = (windowId: string, event: unknown) => {
  window.__injectMessage__(windowId, ['EVENT', event]);
};

/**
 * Shorthand: inject a CLOSE message from the specified napplet.
 */
window.__closeSubscription__ = (windowId: string, subId: string) => {
  window.__injectMessage__(windowId, ['CLOSE', subId]);
};

/**
 * Get the pending AUTH challenge string for a windowId.
 * Finds challenges from the tap's outbound messages, indexed by napplet load order.
 */
window.__getChallenge__ = (windowId: string): string | undefined => {
  const challenges = tap.messages.filter(
    m => m.verb === 'AUTH' && m.direction === 'shell->napplet'
      && typeof m.raw[1] === 'string'
  );
  // Match challenge to windowId by napplet load order
  const nappletIndex = Array.from(nappletFrames.keys()).indexOf(windowId);
  if (nappletIndex >= 0 && nappletIndex < challenges.length) {
    return challenges[nappletIndex].raw[1] as string;
  }
  // Fallback: return the last challenge
  return challenges.length > 0 ? challenges[challenges.length - 1].raw[1] as string : undefined;
};

/**
 * Get list of all loaded napplet windowIds.
 */
window.__getNappletFrames__ = (): string[] => {
  return Array.from(nappletFrames.keys());
};

// --- Phase 4: Capability Test Control Functions ---

// ACL manipulation globals — use the runtime's ACL state (not the shell singleton)
const runtimeAcl = relay.runtime.aclState;
window.__aclRevoke__ = (pubkey, dTag, hash, cap) => runtimeAcl.revoke(pubkey, dTag, hash, cap as Capability);
window.__aclGrant__ = (pubkey, dTag, hash, cap) => runtimeAcl.grant(pubkey, dTag, hash, cap as Capability);
window.__aclBlock__ = (pubkey, dTag, hash) => runtimeAcl.block(pubkey, dTag, hash);
window.__aclUnblock__ = (pubkey, dTag, hash) => runtimeAcl.unblock(pubkey, dTag, hash);
window.__aclPersist__ = () => runtimeAcl.persist();
window.__aclLoad__ = () => runtimeAcl.load();
window.__aclClear__ = () => runtimeAcl.clear();
window.__aclCheck__ = (pubkey, dTag, hash, cap) => runtimeAcl.check(pubkey, dTag, hash, cap as Capability);
window.__aclGetEntry__ = (pubkey, dTag, hash) => runtimeAcl.getEntry(pubkey, dTag, hash);

// Napplet identity globals — use the runtime's sessionRegistry (not the shell singleton)
const runtimeRegistry = relay.runtime.sessionRegistry;
window.__getNappPubkey__ = (windowId: string) => runtimeRegistry.getPubkey(windowId);
window.__getNappEntry__ = (windowId: string) => {
  const pubkey = runtimeRegistry.getPubkey(windowId);
  if (!pubkey) return undefined;
  const entry = runtimeRegistry.getEntry(pubkey);
  if (!entry) return undefined;
  return { pubkey: entry.pubkey, dTag: entry.dTag, aggregateHash: entry.aggregateHash };
};

// Signer and consent globals
window.__setSigner__ = (signer: unknown) => mockResult.setSigner(signer);
window.__setConsentHandler__ = (mode: 'auto-approve' | 'auto-deny') => {
  relay.registerConsentHandler((request) => {
    request.resolve(mode === 'auto-approve');
  });
};

// Shell event injection
window.__injectShellEvent__ = (topic: string, payload: unknown) => relay.injectEvent(topic, payload);

// localStorage access globals
window.__getLocalStorageKeys__ = () => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
};
window.__getLocalStorageItem__ = (key: string) => localStorage.getItem(key);
window.__setLocalStorageItem__ = (key: string, value: string) => localStorage.setItem(key, value);
window.__clearLocalStorage__ = () => localStorage.clear();

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
