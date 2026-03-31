---
name: integrate-shell
description: Use when hosting napplets using @napplet/shell — covers createShellBridge(hooks) wiring, minimum viable ShellHooks implementation, iframe registration via originRegistry, NIP-42 AUTH challenge, consent handling for destructive signing kinds, and optional service registration
---

# Integrating @napplet/shell into a Host Application

## Overview

The shell (`@napplet/shell`) acts as a NIP-01 relay for sandboxed napplet iframes. It routes postMessage traffic, enforces ACL, proxies signing and storage requests, and manages the NIP-42 AUTH handshake. The host application provides relay pool, signer, and crypto hooks via dependency injection. This skill produces a working `createShellBridge()` integration with minimum viable hooks.

## Prerequisites

- Node.js 18+, pnpm
- `nostr-tools` >=2.23.3 available in the host project
- A Nostr relay pool (e.g., `@nostr-dev-kit/ndk`, `nostr-tools/pool`, or custom)
- A NIP-07 compatible signer (e.g., `window.nostr`, NDK signer, or test signer)

## Step 1 — Install

```bash
pnpm add @napplet/shell nostr-tools
```

## Step 2 — Implement minimum viable hooks

The `ShellHooks` interface is the primary integration point. The following shows all required hook groups with working stub implementations. Required groups are: `relayPool`, `relayConfig`, `auth`, `config`, `hotkeys`, `workerRelay`, `crypto`, and `windowManager`.

```ts
import { createShellBridge, type ShellHooks } from '@napplet/shell';
import { verifyEvent as _verifyEvent } from 'nostr-tools/pure';

// Track relay subscriptions for lifecycle management
const subscriptions = new Map<string, () => void>();

const hooks: ShellHooks = {
  // ─── Required: Relay pool ───────────────────────────────────────────────
  relayPool: {
    // Return your relay pool wrapped as RelayPoolLike — see note below
    getRelayPool: () => myRelayPoolAdapter,
    trackSubscription: (key, cleanup) => {
      subscriptions.set(key, cleanup);
    },
    untrackSubscription: (key) => {
      subscriptions.get(key)?.();
      subscriptions.delete(key);
    },
    // NIP-29 group relay support — omit body to disable
    openScopedRelay: (_windowId, _relayUrl, _subId, _filters, _sourceWindow) => {},
    closeScopedRelay: (_windowId) => {},
    publishToScopedRelay: (_windowId, _event) => false,
    selectRelayTier: (_filters) => [],   // return relay URLs for the given filters
    isAvailable: () => true,
  },

  // ─── Required: Relay config ─────────────────────────────────────────────
  relayConfig: {
    addRelay: (_tier, _url) => {},
    removeRelay: (_tier, _url) => {},
    getRelayConfig: () => ({ discovery: [], super: [], outbox: [] }),
    getNip66Suggestions: () => null,
  },

  // ─── Required: Auth state and signing ───────────────────────────────────
  auth: {
    getUserPubkey: () => currentUser?.pubkey ?? null,
    getSigner: () => window.nostr ?? null,
  },

  // ─── Required: Config ───────────────────────────────────────────────────
  config: {
    getNappUpdateBehavior: () => 'banner',
  },

  // ─── Required: Hotkeys ─────────────────────────────────────────────────
  hotkeys: {
    executeHotkeyFromForward: (e) => {
      // Forward keyboard events from napplets to the host shell's hotkey system
      // Omit if you do not support hotkey forwarding
    },
  },

  // ─── Required: Worker relay (local cache) ───────────────────────────────
  workerRelay: {
    getWorkerRelay: () => null, // return your local cache if available
  },

  // ─── Required: Crypto ──────────────────────────────────────────────────
  crypto: {
    // verifyEvent must return Promise<boolean>
    verifyEvent: async (event) => _verifyEvent(event),
  },

  // ─── Required: Window manager ──────────────────────────────────────────
  windowManager: {
    createWindow: (opts) => {
      // Open an iframe, assign a windowId, return it
      return openIframe(opts.iframeSrc ?? '') ?? null;
    },
  },

  // ─── Optional: DM hook (NIP-17 gift-wrap) ──────────────────────────────
  // dm: { sendDm: async (pubkey, msg) => ({ success: true }) },

  // ─── Optional: Services (static wiring) ────────────────────────────────
  // services: { audio: createAudioService() },
};
```

Note: `relayPool.getRelayPool()` must return an object implementing `RelayPoolLike` — a specific interface from `packages/shell/src/types.ts` with `subscription()`, `publish()`, and `request()` methods. Wrap your relay library with an adapter if it does not match this interface.

## Step 3 — Create the bridge and wire the message listener

```ts
const bridge = createShellBridge(hooks);

// Wire the global message listener — all napplet postMessage traffic routes here
// bridge.handleMessage is already bound — pass it directly
window.addEventListener('message', bridge.handleMessage);
```

## Step 4 — Register a napplet iframe

When an iframe loads, register it with `originRegistry` and then send the NIP-42 AUTH challenge. Messages from unregistered windows are dropped silently, so registration MUST happen before `sendChallenge`.

```ts
import { originRegistry } from '@napplet/shell';

function onIframeLoad(iframe: HTMLIFrameElement, windowId: string): void {
  if (!iframe.contentWindow) return;
  // Register BEFORE sendChallenge — order matters
  originRegistry.register(iframe.contentWindow, windowId);
  bridge.sendChallenge(windowId);
}

function onIframeUnload(windowId: string): void {
  originRegistry.unregister(windowId);
}
```

The `windowId` is an arbitrary string you assign (e.g., `'win-1'`, a UUID, or a semantic name). It is used throughout the bridge for routing messages to the correct iframe.

## Step 5 — Handle consent for destructive signing

Register a handler for signing kinds 0 (metadata), 3 (contacts), 5 (relay list), and 10002 (NIP-46 relay list). These kinds require explicit user approval. The `resolve(boolean)` callback approves or denies the request.

```ts
bridge.registerConsentHandler((request) => {
  const { event, pubkey, resolve } = request;

  // Show a user-facing prompt before allowing destructive signing
  const allowed = confirm(
    `Napplet (${pubkey.slice(0, 8)}...) wants to sign kind ${event.kind}.\n\nAllow?`
  );
  resolve(allowed);
});
```

For production use, replace `confirm()` with a proper modal component.

## Step 6 — Register a service (optional)

Services are shell-side handlers that napplets communicate with via inter-pane topic events. Register them after bridge creation via `bridge.runtime.registerService()`, or provide them statically in `hooks.services` at construction time.

```ts
import { createAudioService } from '@napplet/services';

// Dynamic registration — allows lazy loading or post-login setup
bridge.runtime.registerService('audio', createAudioService({
  onChange: (sources) => updateAudioUI(sources),
}));
```

Alternatively, pass services via `hooks.services` at construction time (static wiring, available before any napplet connects). See `skills/add-service/SKILL.md` for how to implement a custom service.

## Step 7 — Teardown

Remove the message listener manually before calling `destroy()` — the bridge does not remove it automatically.

```ts
// Remove listener BEFORE destroying — destroy() does not remove it
window.removeEventListener('message', bridge.handleMessage);
bridge.destroy();
```

After `bridge.destroy()`, do NOT call any bridge methods. Create a new bridge instance instead.

## Common pitfalls

- `originRegistry.register()` MUST be called before `bridge.sendChallenge()`. Messages from an unregistered window are dropped silently.
- `relayPool.getRelayPool()` must return an object implementing `RelayPoolLike` (the `subscription()`, `publish()`, and `request()` interface) — not the raw NDK or nostr-tools pool object. Wrap it with an adapter.
- `bridge.handleMessage` is already bound — pass it directly to `addEventListener`. Do not wrap it in another arrow function or the remove call will fail.
- `crypto.verifyEvent` must return `Promise<boolean>`. Wrap synchronous verifiers: `async (e) => _verifyEvent(e)`.
- `bridge.destroy()` does NOT remove the `window.message` listener. Always remove it manually first.
- Consent handler fires for kinds 0, 3, 5, 10002 only. All other signing kinds pass automatically unless the napplet's ACL explicitly blocks `sign:event`.
- After `bridge.destroy()`, do NOT call any bridge methods. Create a new bridge instance with `createShellBridge(hooks)` instead.
- `ShellHooks` requires ALL listed groups (`relayPool`, `relayConfig`, `auth`, `config`, `hotkeys`, `workerRelay`, `crypto`, `windowManager`). Omitting any required group causes a TypeScript error at compile time and a runtime error at bridge creation.
