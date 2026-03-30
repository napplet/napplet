/**
 * shell-host.ts -- Demo shell host.
 *
 * Boots @napplet/shell with mock hooks, installs message tap,
 * loads demo napplet iframes, and exposes control APIs for the UI.
 */

import {
  createPseudoRelay,
  originRegistry,
  aclStore,
  nappKeyRegistry,
  type PseudoRelay,
  type ShellHooks,
  type Capability,
  type NostrEvent,
  type ConsentRequest,
  ALL_CAPABILITIES,
} from '@napplet/shell';
import { createSignerHooks, getDemoHostPubkey } from './signer-demo.js';

// Inline a simplified message tap since we can't import from tests/helpers in apps/
// (they are not a published package)

export interface TappedMessage {
  index: number;
  timestamp: number;
  direction: 'napplet->shell' | 'shell->napplet';
  verb: string;
  raw: unknown[];
  parsed: {
    subId?: string;
    eventKind?: number;
    eventId?: string;
    topic?: string;
    success?: boolean;
    reason?: string;
    pubkey?: string;
  };
}

export interface MessageTap {
  messages: TappedMessage[];
  recordOutbound(msg: unknown[]): void;
  install(shellWindow: Window): void;
  onMessage(callback: (msg: TappedMessage) => void): () => void;
  filter(criteria: { verb?: string; direction?: string }): TappedMessage[];
  clear(): void;
}

// --- Message Tap (simplified from tests/helpers/message-tap.ts) ---

const KNOWN_VERBS = new Set([
  'EVENT', 'REQ', 'CLOSE', 'AUTH', 'OK', 'EOSE', 'NOTICE', 'CLOSED', 'COUNT',
]);

function parseMessage(raw: unknown[]): TappedMessage['parsed'] {
  const verb = raw[0] as string;
  const parsed: TappedMessage['parsed'] = {};
  switch (verb) {
    case 'EVENT': {
      if (raw.length === 2 && typeof raw[1] === 'object' && raw[1] !== null) {
        const ev = raw[1] as Record<string, unknown>;
        parsed.eventId = ev.id as string;
        parsed.eventKind = ev.kind as number;
        parsed.pubkey = ev.pubkey as string;
        const tags = (ev.tags as string[][] | undefined) ?? [];
        const t = tags.find(t => t[0] === 't');
        if (t) parsed.topic = t[1];
      } else if (raw.length === 3) {
        parsed.subId = raw[1] as string;
        const ev = raw[2] as Record<string, unknown>;
        parsed.eventId = ev.id as string;
        parsed.eventKind = ev.kind as number;
        parsed.pubkey = ev.pubkey as string;
        const tags = (ev.tags as string[][] | undefined) ?? [];
        const t = tags.find(t => t[0] === 't');
        if (t) parsed.topic = t[1];
      }
      break;
    }
    case 'REQ': parsed.subId = raw[1] as string; break;
    case 'CLOSE': parsed.subId = raw[1] as string; break;
    case 'AUTH': {
      if (typeof raw[1] === 'object' && raw[1] !== null) {
        const ev = raw[1] as Record<string, unknown>;
        parsed.eventId = ev.id as string;
        parsed.eventKind = ev.kind as number;
        parsed.pubkey = ev.pubkey as string;
      }
      break;
    }
    case 'OK': {
      parsed.eventId = raw[1] as string;
      parsed.success = raw[2] as boolean;
      parsed.reason = raw[3] as string;
      break;
    }
    case 'EOSE': parsed.subId = raw[1] as string; break;
    case 'NOTICE': parsed.reason = raw[1] as string; break;
    case 'CLOSED': {
      parsed.subId = raw[1] as string;
      parsed.reason = raw[2] as string;
      break;
    }
  }
  return parsed;
}

function createMessageTap(): MessageTap {
  const messages: TappedMessage[] = [];
  const listeners: Array<(msg: TappedMessage) => void> = [];
  let idx = 0;

  function record(direction: TappedMessage['direction'], raw: unknown[]): void {
    const verb = (typeof raw[0] === 'string' && KNOWN_VERBS.has(raw[0])) ? raw[0] : 'UNKNOWN';
    const msg: TappedMessage = {
      index: idx++,
      timestamp: Date.now(),
      direction,
      verb,
      raw,
      parsed: parseMessage(raw),
    };
    messages.push(msg);
    for (const cb of listeners) { try { cb(msg); } catch { /* ignore */ } }
  }

  return {
    messages,
    recordOutbound(msg: unknown[]) { if (Array.isArray(msg)) record('shell->napplet', msg); },
    install(shellWindow: Window) {
      shellWindow.addEventListener('message', (event: MessageEvent) => {
        if (!Array.isArray(event.data)) return;
        record('napplet->shell', event.data);
      }, true);
    },
    onMessage(callback) {
      listeners.push(callback);
      return () => {
        const i = listeners.indexOf(callback);
        if (i !== -1) listeners.splice(i, 1);
      };
    },
    filter(criteria) {
      return messages.filter(m => {
        if (criteria.verb && m.verb !== criteria.verb) return false;
        if (criteria.direction && m.direction !== criteria.direction) return false;
        return true;
      });
    },
    clear() { messages.length = 0; idx = 0; },
  };
}

// --- Mock ShellHooks (simplified from tests/helpers/mock-hooks.ts) ---

function createDemoHooks(): ShellHooks {
  const signerHooks = createSignerHooks();
  return {
    relayPool: {
      getRelayPool: () => ({
        subscription: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        publish: () => {},
        request: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      }),
      trackSubscription: () => {},
      untrackSubscription: () => {},
      openScopedRelay: () => {},
      closeScopedRelay: () => {},
      publishToScopedRelay: () => false,
      selectRelayTier: () => [],
    },
    relayConfig: {
      addRelay: () => {},
      removeRelay: () => {},
      getRelayConfig: () => ({ discovery: [], super: [], outbox: [] }),
      getNip66Suggestions: () => null,
    },
    windowManager: { createWindow: () => null },
    auth: {
      getUserPubkey: signerHooks.getUserPubkey,
      getSigner: signerHooks.getSigner,
    },
    config: { getNappUpdateBehavior: () => 'auto-grant' },
    hotkeys: { executeHotkeyFromForward: () => {} },
    workerRelay: { getWorkerRelay: () => null },
    crypto: {
      verifyEvent: async (event: NostrEvent): Promise<boolean> => {
        const { verifyEvent } = await import('nostr-tools/pure');
        return verifyEvent(event as Parameters<typeof verifyEvent>[0]);
      },
    },
  };
}

// --- Proxy pattern (from harness.ts) ---

const proxyToReal = new WeakMap<object, Window>();

function createPostMessageProxy(realWin: Window, messageTap: MessageTap): Window {
  const proxy = new Proxy(realWin, {
    get(target, prop) {
      if (prop === 'postMessage') {
        return (msg: unknown, targetOrigin: string, transfer?: Transferable[]) => {
          if (Array.isArray(msg)) messageTap.recordOutbound(msg);
          return target.postMessage(msg, targetOrigin, transfer);
        };
      }
      try {
        const val = (target as unknown as Record<string | symbol, unknown>)[prop];
        return typeof val === 'function' ? (val as Function).bind(target) : val;
      } catch { return undefined; }
    },
  });
  proxyToReal.set(proxy, realWin);
  return proxy as unknown as Window;
}

// --- Napplet Frame Management ---

export interface NappletInfo {
  windowId: string;
  name: string;
  iframe: HTMLIFrameElement;
  pubkey?: string;
  dTag?: string;
  aggregateHash?: string;
  authenticated: boolean;
}

const napplets = new Map<string, NappletInfo>();
let nappletCounter = 0;

// --- Public API ---

export let tap: MessageTap;
export let relay: PseudoRelay;

export function getNapplets(): Map<string, NappletInfo> { return napplets; }
export function getNapplet(windowId: string): NappletInfo | undefined { return napplets.get(windowId); }

/**
 * Boot the shell: create pseudo-relay, install tap, wire up proxy.
 */
export function bootShell(): { tap: MessageTap; relay: PseudoRelay } {
  const hooks = createDemoHooks();
  tap = createMessageTap();
  tap.install(window);

  // Wrap originRegistry for outbound capture (same pattern as harness.ts)
  const _origGetIframeWindow = originRegistry.getIframeWindow.bind(originRegistry);
  originRegistry.getIframeWindow = (windowId: string) => {
    const win = _origGetIframeWindow(windowId);
    if (!win) return null;
    return createPostMessageProxy(win, tap);
  };

  const _origGetWindowId = originRegistry.getWindowId.bind(originRegistry);
  originRegistry.getWindowId = (win: Window) => {
    const result = _origGetWindowId(win);
    if (result) return result;
    const real = proxyToReal.get(win);
    if (real) return _origGetWindowId(real);
    return undefined;
  };

  relay = createPseudoRelay(hooks);

  // Set consent handler for destructive kinds
  // In the demo, auto-approve after 500ms to show the flow
  relay.onConsentNeeded((request: ConsentRequest) => {
    setTimeout(() => request.resolve(true), 500);
  });

  // Wrap handleMessage for outbound capture
  const _origHandle = relay.handleMessage;
  relay.handleMessage = (event: MessageEvent) => {
    if (!event.source || !Array.isArray(event.data)) {
      _origHandle(event);
      return;
    }
    const proxiedSource = createPostMessageProxy(event.source as Window, tap);
    const syntheticEvent = new Proxy(event, {
      get(target, prop) {
        if (prop === 'source') return proxiedSource;
        const val = (target as unknown as Record<string | symbol, unknown>)[prop];
        return typeof val === 'function' ? (val as Function).bind(target) : val;
      },
    });
    _origHandle(syntheticEvent);
  };

  window.addEventListener('message', relay.handleMessage);

  // Track AUTH completions
  tap.onMessage((msg) => {
    if (msg.verb === 'OK' && msg.parsed.success === true && msg.direction === 'shell->napplet') {
      // Find which napplet this OK belongs to by checking nappKeyRegistry
      for (const [wid, info] of napplets) {
        if (!info.authenticated) {
          const pubkey = nappKeyRegistry.getPubkey(wid);
          if (pubkey) {
            const entry = nappKeyRegistry.getEntry(pubkey);
            if (entry) {
              info.authenticated = true;
              info.pubkey = entry.pubkey;
              info.dTag = entry.dTag;
              info.aggregateHash = entry.aggregateHash;
            }
          }
        }
      }
    }
  });

  return { tap, relay };
}

/**
 * Load a demo napplet into a container element.
 */
export function loadNapplet(name: string, containerId: string): NappletInfo {
  const windowId = `demo-${name}-${++nappletCounter}`;
  const url = `/napplets/${name}/index.html`;

  const iframe = document.createElement('iframe');
  iframe.id = windowId;
  iframe.className = 'w-full h-full border-0';
  iframe.sandbox.add('allow-scripts');
  iframe.src = url;

  const container = document.getElementById(containerId);
  if (container) container.appendChild(iframe);

  const info: NappletInfo = {
    windowId,
    name,
    iframe,
    authenticated: false,
  };
  napplets.set(windowId, info);

  iframe.addEventListener('load', () => {
    if (iframe.contentWindow) {
      originRegistry.register(iframe.contentWindow, windowId);
      relay.sendChallenge(windowId);
    }
  });

  return info;
}

/**
 * Grant or revoke a capability on a napplet.
 */
export function toggleCapability(windowId: string, capability: Capability, enabled: boolean): void {
  const info = napplets.get(windowId);
  if (!info?.pubkey) return;
  if (enabled) {
    aclStore.grant(info.pubkey, info.dTag || '', info.aggregateHash || '', capability);
  } else {
    aclStore.revoke(info.pubkey, info.dTag || '', info.aggregateHash || '', capability);
  }
}

/**
 * Block or unblock a napplet entirely.
 */
export function toggleBlock(windowId: string, blocked: boolean): void {
  const info = napplets.get(windowId);
  if (!info?.pubkey) return;
  if (blocked) {
    aclStore.block(info.pubkey, info.dTag || '', info.aggregateHash || '');
  } else {
    aclStore.unblock(info.pubkey, info.dTag || '', info.aggregateHash || '');
  }
}

export { getDemoHostPubkey } from './signer-demo.js';
