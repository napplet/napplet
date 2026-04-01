/**
 * shell-host.ts -- Demo shell host.
 *
 * Boots @napplet/shell with mock hooks, installs message tap,
 * loads demo napplet iframes, and exposes control APIs for the UI.
 */

import {
  createShellBridge,
  originRegistry,
  type ShellBridge,
  type ShellHooks,
  type ServiceHandler,
  type Capability,
  type NostrEvent,
  type ConsentRequest,
} from '@napplet/shell';
import { createSignerService, createNotificationService } from '@napplet/services';
import type { Notification } from '@napplet/services';
import { getSigner, getSignerConnectionState } from './signer-connection.js';

// Static ephemeral host identity for shell node display (separate from signer identity)
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
const _hostSecretKey = generateSecretKey();
const _hostPubkey = getPublicKey(_hostSecretKey);

// Inline a simplified message tap since we can't import from tests/helpers in apps/
// (they are not a published package)

export interface TappedMessage {
  index: number;
  timestamp: number;
  direction: 'napplet->shell' | 'shell->napplet';
  verb: string;
  windowId?: string;
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
  recordOutbound(msg: unknown[], windowId?: string): void;
  install(shellWindow: Window): void;
  onMessage(callback: (msg: TappedMessage) => void): () => void;
  filter(criteria: { verb?: string; direction?: string }): TappedMessage[];
  clear(): void;
}

export interface DemoNappletDefinition {
  name: string;
  label: string;
  statusId: string;
  aclId: string;
  frameContainerId: string;
}

export type DemoProtocolPath =
  | 'auth'
  | 'relay-publish'
  | 'relay-subscribe'
  | 'inter-pane-send'
  | 'inter-pane-receive'
  | 'state-read'
  | 'state-write'
  | 'signer-request'
  | 'signer-response';

export interface DemoPathAuditEntry {
  path: DemoProtocolPath;
  capability: Capability | null;
  direction: 'host->runtime' | 'runtime->napplet' | 'napplet->runtime';
  explanation: string;
}

export type DemoSignerMode = 'service' | 'fallback';

export const DEMO_SIGNER_MODE: DemoSignerMode = 'service';

export const DEMO_NAPPLETS: DemoNappletDefinition[] = [
  {
    name: 'chat',
    label: 'chat',
    statusId: 'chat-status',
    aclId: 'chat-acl',
    frameContainerId: 'chat-frame-container',
  },
  {
    name: 'bot',
    label: 'bot',
    statusId: 'bot-status',
    aclId: 'bot-acl',
    frameContainerId: 'bot-frame-container',
  },
];

export const DEMO_PROTOCOL_PATHS: DemoPathAuditEntry[] = [
  {
    path: 'auth',
    capability: null,
    direction: 'napplet->runtime',
    explanation: 'AUTH handshakes establish napplet identity before capability checks begin.',
  },
  {
    path: 'relay-publish',
    capability: 'relay:write',
    direction: 'napplet->runtime',
    explanation: 'Regular EVENT publishes go through relay write enforcement before they fan out.',
  },
  {
    path: 'relay-subscribe',
    capability: 'relay:read',
    direction: 'napplet->runtime',
    explanation: 'REQ and relay delivery both rely on relay read permission.',
  },
  {
    path: 'inter-pane-send',
    capability: 'relay:write',
    direction: 'napplet->runtime',
    explanation: 'Non-state inter-pane events reuse the relay write sender gate before delivery.',
  },
  {
    path: 'inter-pane-receive',
    capability: 'relay:read',
    direction: 'runtime->napplet',
    explanation: 'Recipients need relay read permission to receive non-state inter-pane events.',
  },
  {
    path: 'state-read',
    capability: 'state:read',
    direction: 'napplet->runtime',
    explanation: 'shell:state-get and shell:state-keys topics are routed as state reads.',
  },
  {
    path: 'state-write',
    capability: 'state:write',
    direction: 'napplet->runtime',
    explanation: 'shell:state-set, remove, and clear topics require state write permission.',
  },
  {
    path: 'signer-request',
    capability: 'sign:event',
    direction: 'napplet->runtime',
    explanation: 'Kind 29001 signer requests are checked as sign:event before service dispatch.',
  },
  {
    path: 'signer-response',
    capability: 'sign:event',
    direction: 'runtime->napplet',
    explanation: 'Signer responses come back from the configured signer service after an allowed request.',
  },
];

export const DEMO_PROTOCOL_PATH_INDEX: Record<DemoProtocolPath, DemoPathAuditEntry> =
  Object.fromEntries(DEMO_PROTOCOL_PATHS.map((entry) => [entry.path, entry])) as Record<DemoProtocolPath, DemoPathAuditEntry>;

export function getDemoHostAuditSummary(): string {
  const auditedPaths = DEMO_PROTOCOL_PATHS
    .map((entry) => `${entry.path}:${entry.capability ?? 'none'}`)
    .join(', ');
  return `host ready -- signer mode: ${DEMO_SIGNER_MODE}; audited paths: ${auditedPaths}`;
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

  function record(direction: TappedMessage['direction'], raw: unknown[], windowId?: string): void {
    const verb = (typeof raw[0] === 'string' && KNOWN_VERBS.has(raw[0])) ? raw[0] : 'UNKNOWN';
    const msg: TappedMessage = {
      index: idx++,
      timestamp: Date.now(),
      direction,
      verb,
      windowId,
      raw,
      parsed: parseMessage(raw),
    };
    messages.push(msg);
    for (const cb of listeners) { try { cb(msg); } catch { /* ignore */ } }
  }

  return {
    messages,
    recordOutbound(msg: unknown[], windowId?: string) { if (Array.isArray(msg)) record('shell->napplet', msg, windowId); },
    install(shellWindow: Window) {
      shellWindow.addEventListener('message', (event: MessageEvent) => {
        if (!Array.isArray(event.data)) return;
        // Resolve windowId from event.source
        let wid: string | undefined;
        for (const [id, info] of napplets) {
          if (info.iframe?.contentWindow === event.source) { wid = id; break; }
        }
        record('napplet->shell', event.data, wid);
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

function createDemoHooks(notificationOnChange?: (notifications: readonly Notification[]) => void): ShellHooks {
  const notificationService = createNotificationService({
    onChange: notificationOnChange,
    maxPerWindow: 50,
  });
  const services = {
    signer: createSignerService({
      getSigner,
    }),
    notifications: notificationService,
  };
  // Expose the notification service handler so the controller can dispatch to it directly
  _notificationServiceHandler = notificationService;
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
      getUserPubkey: () => getSignerConnectionState().pubkey ?? '',
      getSigner,
    },
    services,
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

function createPostMessageProxy(realWin: Window, messageTap: MessageTap, windowId?: string): Window {
  const proxy = new Proxy(realWin, {
    get(target, prop) {
      if (prop === 'postMessage') {
        return (msg: unknown, targetOrigin: string, transfer?: Transferable[]) => {
          if (Array.isArray(msg)) messageTap.recordOutbound(msg, windowId);
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
const demoServiceNames = new Set<string>(['signer', 'notifications']);
let nappletCounter = 0;

let _notificationServiceHandler: ServiceHandler | null = null;

/** Get the registered notification service handler for direct host dispatch. */
export function getNotificationServiceHandler(): ServiceHandler | null {
  return _notificationServiceHandler;
}

// --- Public API ---

export let tap: MessageTap;
export let relay: ShellBridge;

export function getNapplets(): Map<string, NappletInfo> { return napplets; }
export function getNapplet(windowId: string): NappletInfo | undefined { return napplets.get(windowId); }
export function getDemoNappletDefinitions(): DemoNappletDefinition[] {
  return DEMO_NAPPLETS.map((napplet) => ({ ...napplet }));
}
export function getDemoServiceNames(): string[] {
  return [...demoServiceNames].sort((left, right) => left.localeCompare(right));
}
export function getDemoTopologyInputs() {
  return {
    hostPubkey: getDemoHostPubkey(),
    napplets: getDemoNappletDefinitions(),
    services: getDemoServiceNames(),
    signerState: getSignerConnectionState(),
  };
}

/**
 * Get the demo host pubkey for display on the shell node.
 * This is the shell's own ephemeral identity, separate from the connected signer.
 */
export function getDemoHostPubkey(): string {
  return _hostPubkey;
}

/**
 * Get the current signer connection state for topology rendering and UI.
 */
export function getDemoSignerState() {
  return getSignerConnectionState();
}

/**
 * Boot the shell: create ShellBridge, install tap, wire up proxy.
 *
 * @param notificationOnChange - Called when the notification service state changes.
 *   Used by the demo notification controller to update host-side toast/summary UX.
 */
export function bootShell(notificationOnChange?: (notifications: readonly Notification[]) => void): { tap: MessageTap; relay: ShellBridge } {
  const hooks = createDemoHooks(notificationOnChange);
  tap = createMessageTap();
  tap.install(window);

  // Wrap originRegistry for outbound capture (same pattern as harness.ts)
  const _origGetIframeWindow = originRegistry.getIframeWindow.bind(originRegistry);
  originRegistry.getIframeWindow = (windowId: string) => {
    const win = _origGetIframeWindow(windowId);
    if (!win) return null;
    return createPostMessageProxy(win, tap, windowId);
  };

  const _origGetWindowId = originRegistry.getWindowId.bind(originRegistry);
  originRegistry.getWindowId = (win: Window) => {
    const result = _origGetWindowId(win);
    if (result) return result;
    const real = proxyToReal.get(win);
    if (real) return _origGetWindowId(real);
    return undefined;
  };

  relay = createShellBridge(hooks);
  const originalRegisterService = relay.runtime.registerService.bind(relay.runtime);
  relay.runtime.registerService = (name, handler) => {
    demoServiceNames.add(name);
    originalRegisterService(name, handler);
  };
  const originalUnregisterService = relay.runtime.unregisterService.bind(relay.runtime);
  relay.runtime.unregisterService = (name) => {
    demoServiceNames.delete(name);
    originalUnregisterService(name);
  };

  // Set consent handler for destructive kinds
  // In the demo, auto-approve after 500ms to show the flow
  relay.registerConsentHandler((request: ConsentRequest) => {
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
      // Find which napplet this OK belongs to by checking sessionRegistry
      for (const [wid, info] of napplets) {
        if (!info.authenticated) {
          const pubkey = relay.runtime.sessionRegistry.getPubkey(wid);
          if (pubkey) {
            const entry = relay.runtime.sessionRegistry.getEntry(pubkey);
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
  if (!info?.pubkey) { console.warn('[acl] toggleCapability: no pubkey for', windowId); return; }
  const dTag = info.dTag || '';
  const hash = info.aggregateHash || '';
  console.log(`[acl] ${enabled ? 'GRANT' : 'REVOKE'} ${capability} for ${info.name} (pubkey=${info.pubkey.substring(0, 8)}... dTag=${dTag} hash=${hash})`);
  if (enabled) {
    relay.runtime.aclState.grant(info.pubkey, dTag, hash, capability);
  } else {
    relay.runtime.aclState.revoke(info.pubkey, dTag, hash, capability);
  }
  // Verify the change took effect
  const check = relay.runtime.aclState.check(info.pubkey, dTag, hash, capability);
  console.log(`[acl] check ${capability} after ${enabled ? 'grant' : 'revoke'}: ${check}`);
}

/**
 * Block or unblock a napplet entirely.
 */
export function toggleBlock(windowId: string, blocked: boolean): void {
  const info = napplets.get(windowId);
  if (!info?.pubkey) return;
  if (blocked) {
    relay.runtime.aclState.block(info.pubkey, info.dTag || '', info.aggregateHash || '');
  } else {
    relay.runtime.aclState.unblock(info.pubkey, info.dTag || '', info.aggregateHash || '');
  }
}

