# @napplet/shell

> Shell runtime for hosting Nostr-native napplet iframes. Framework-agnostic.

The shell acts as a NIP-01 ShellBridge between napplet iframes and real Nostr relays. It handles AUTH handshake, ACL enforcement, state isolation, signer delegation, and inter-pane communication. You provide the hooks for your relay pool, signer, and window manager -- the shell handles the protocol.

## Getting Started

### Prerequisites

- A web application that can create and manage iframes
- [nostr-tools](https://www.npmjs.com/package/nostr-tools) as a peer dependency
- A Nostr signer for the host user (NIP-07 extension, NIP-46 bunker, etc.)

### How It Works

1. Create a `ShellBridge` by calling `createShellBridge(hooks)` with your application's hooks
2. Wire up `window.addEventListener('message', relay.handleMessage)` to capture iframe messages
3. When an iframe loads, register its window reference and call `relay.sendChallenge(windowId)`
4. The ShellBridge handles AUTH verification, subscription management, event routing, and all protocol details

> **Architecture note:** `@napplet/shell` is a **browser adapter** over `@napplet/runtime`.
> `createShellBridge(hooks)` adapts `ShellHooks` (browser-oriented: `Window` references, `localStorage`, `postMessage`)
> into `RuntimeHooks` (environment-agnostic) via `adaptHooks()`, then creates a runtime engine.
>
> Advanced integrators can call `adaptHooks()` and `createRuntime()` directly to bypass the browser
> adapter and use a custom transport layer. See the [RuntimeHooks section](#runtimehooks-advanced) below.

## Installation

```bash
npm install @napplet/shell nostr-tools
```

## Quick Start

```ts
import { createShellBridge, originRegistry } from '@napplet/shell';
import type { ShellHooks } from '@napplet/shell';

// Provide your application's hooks
const hooks: ShellHooks = {
  relayPool: {
    getRelayPool: () => myPool,
    trackSubscription: (key, cleanup) => { /* track */ },
    untrackSubscription: (key) => { /* untrack */ },
    openScopedRelay: (wid, url, sub, filters, win) => { /* NIP-29 */ },
    closeScopedRelay: (wid) => { /* close */ },
    publishToScopedRelay: (wid, event) => false,
    selectRelayTier: (filters) => ['wss://relay.damus.io'],
  },
  relayConfig: {
    addRelay: (tier, url) => { /* add */ },
    removeRelay: (tier, url) => { /* remove */ },
    getRelayConfig: () => ({ discovery: [], super: [], outbox: [] }),
    getNip66Suggestions: () => [],
  },
  windowManager: {
    createWindow: (opts) => null,
  },
  auth: {
    getUserPubkey: () => myPubkey,
    getSigner: () => mySigner,
  },
  config: {
    getNappUpdateBehavior: () => 'auto-grant',
  },
  hotkeys: {
    executeHotkeyFromForward: (e) => { /* handle forwarded key */ },
  },
  workerRelay: {
    getWorkerRelay: () => null,
  },
  crypto: {
    verifyEvent: async (event) => {
      // Use nostr-tools verifyEvent
      const { verifyEvent } = await import('nostr-tools');
      return verifyEvent(event);
    },
  },
};

const bridge = createShellBridge(hooks);

// Listen for messages from napplet iframes
window.addEventListener('message', (event) => {
  bridge.handleMessage(event);
});

// When an iframe loads, register and challenge it
function onIframeLoad(iframe: HTMLIFrameElement, windowId: string) {
  originRegistry.register(windowId, iframe.contentWindow!);
  bridge.sendChallenge(windowId);
}

// Handle consent prompts for destructive signing operations
bridge.registerConsentHandler((request) => {
  const allowed = confirm(`Allow ${request.event.kind} signing?`);
  request.resolve(allowed);
});
```

## API Reference

### createShellBridge(hooks)

Create a ShellBridge instance with dependency injection.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `hooks` | `ShellHooks` | Host application integration hooks |

**Returns:** `ShellBridge`

### ShellBridge

| Method | Description |
|--------|-------------|
| `handleMessage(event: MessageEvent)` | Main message handler -- attach to `window.addEventListener('message', ...)` |
| `sendChallenge(windowId: string)` | Send a NIP-42 AUTH challenge to a napplet window |
| `injectEvent(topic: string, payload: unknown)` | Inject a shell-created event into subscription delivery |
| `destroy()` | Clean up all state and remove listeners |
| `registerConsentHandler(handler)` | Register handler for destructive signing consent prompts |

### ShellHooks Interface

The `ShellHooks` interface is the main integration point. Implementors provide relay pool, window manager, signer, and other capabilities.

| Hook | Interface | Description |
|------|-----------|-------------|
| `relayPool` | `RelayPoolHooks` | Relay pool connection, subscription tracking, scoped relays |
| `relayConfig` | `RelayConfigHooks` | Relay URL add/remove/get configuration |
| `windowManager` | `WindowManagerHooks` | Create new iframe windows |
| `auth` | `AuthHooks` | User pubkey and signer access |
| `config` | `ConfigHooks` | Napp update behavior policy |
| `hotkeys` | `HotkeyHooks` | Keyboard shortcut forwarding |
| `workerRelay` | `WorkerRelayHooks` | Local cache/OPFS relay integration |
| `crypto` | `CryptoHooks` | Event signature verification |
| `dm?` | `DmHooks` | Optional NIP-17 DM handling |

### Registering Services

Wire in service handlers via the optional `services` field on `ShellHooks`. Napplets discover available services using kind 29010 service discovery.

```ts
import { createShellBridge } from '@napplet/shell';
import { createAudioService } from '@napplet/services';
import type { ShellHooks, ServiceRegistry } from '@napplet/shell';

const services: ServiceRegistry = {
  audio: createAudioService(),
};

const hooks: ShellHooks = {
  // ... required hooks ...
  services,
};

const bridge = createShellBridge(hooks);
```

Each service handler in `ServiceRegistry` must implement:
- `descriptor: ServiceDescriptor` — service name and version (`{ name: string; version: string; description?: string }`)
- `handleMessage(windowId, message, send)` — handle incoming service requests
- `onWindowDestroyed?(windowId)` — optional cleanup when a napplet window closes

Napplets query registered services using `window.napplet.discoverServices()` (kind 29010) and communicate with them using the service topic protocol.

### Standalone Utilities

These exports can be used independently without creating a full ShellBridge.

| Export | Description |
|--------|-------------|
| `originRegistry` | Map `Window` references to windowIds and vice versa |
| `nappKeyRegistry` | Manage ephemeral napp key entries after AUTH |
| `aclStore` | ACL entry management: `grant`, `revoke`, `block`, `unblock`, `check`, `persist`, `load` |
| `audioManager` | Track which napplets are producing audio |
| `manifestCache` | Cache NIP-5A manifest verification results |
| `handleStateRequest` | Handle state proxy requests from napplets |
| `cleanupNappState` | Remove all state for a specific napp identity |

### Protocol Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `BusKind` | `{ REGISTRATION: 29000, SIGNER_REQUEST: 29001, ... }` | Ephemeral bus kind numbers |
| `AUTH_KIND` | `22242` | NIP-42 authentication event kind |
| `SHELL_BRIDGE_URI` | `'napplet://shell'` | ShellBridge URI for AUTH relay tag |
| `PROTOCOL_VERSION` | `'2.0.0'` | Protocol version string |
| `ALL_CAPABILITIES` | `['relay:read', 'relay:write', ...]` | Complete list of ACL capabilities |
| `DESTRUCTIVE_KINDS` | `Set([0, 3, 5, 10002])` | Event kinds requiring user consent |
| `TOPICS` | `{ ... }` | Shell command topic constants |

## RuntimeHooks (Advanced)

> For advanced integrators who want to bypass `@napplet/shell`'s browser adapter and use `@napplet/runtime` directly (e.g., custom transport layers, test environments, server-side hosting).

### How the adapter works

`createShellBridge(hooks)` internally calls `adaptHooks(shellHooks, deps)` to convert browser-oriented `ShellHooks` into environment-agnostic `RuntimeHooks`, then passes them to `createRuntime()`:

```ts
import { adaptHooks, type BrowserDeps } from '@napplet/shell';
import { createRuntime } from '@napplet/runtime';
import { originRegistry, manifestCache, aclStore, audioManager, nappKeyRegistry } from '@napplet/shell';

const deps: BrowserDeps = {
  originRegistry,
  manifestCache,
  aclStore,
  audioManager,
  nappKeyRegistry,
};

const runtimeHooks = adaptHooks(shellHooks, deps);
const runtime = createRuntime(runtimeHooks);
```

### RuntimeHooks Interface

`RuntimeHooks` is the environment-agnostic contract that `@napplet/runtime` requires. Unlike `ShellHooks`, it works without browser APIs.

| Hook | Interface | Description |
|------|-----------|-------------|
| `sendToNapplet` | `(windowId, msg[]) => void` | Send a NIP-01 message array to a napplet |
| `relayPool` | `RuntimeRelayPoolHooks` | Abstract relay subscribe/publish |
| `cache` | `RuntimeCacheHooks` | Local event cache (optional — return `isAvailable: false`) |
| `auth` | `RuntimeAuthHooks` | User pubkey and signer |
| `config` | `RuntimeConfigHooks` | Napp update behavior policy |
| `hotkeys` | `RuntimeHotkeyHooks` | Keyboard shortcut forwarding |
| `crypto` | `RuntimeCryptoHooks` | Event verification + UUID generation |
| `aclPersistence` | `RuntimeAclPersistence` | ACL persistence (get/set string) |
| `manifestPersistence` | `RuntimeManifestPersistence` | Manifest cache persistence |
| `statePersistence` | `RuntimeStatePersistence` | Napp state storage (scoped keys) |
| `windowManager` | `RuntimeWindowManagerHooks` | Create new napplet windows |
| `relayConfig` | `RuntimeRelayConfigHooks` | Relay URL configuration |
| `dm?` | `RuntimeDmHooks` | Optional NIP-17 DM handling |
| `onAclCheck?` | `(event: AclCheckEvent) => void` | ACL enforcement audit hook |
| `services?` | `ServiceRegistry` | Service handlers by name |

Import `RuntimeHooks` types from `@napplet/runtime`:

```ts
import type { RuntimeHooks, RuntimeRelayPoolHooks, RuntimeCacheHooks } from '@napplet/runtime';
import { createRuntime } from '@napplet/runtime';
```

## Types

```ts
import type {
  ShellHooks,
  RelayPoolHooks, RelayPoolLike,
  RelayConfigHooks,
  WindowManagerHooks,
  AuthHooks, ConfigHooks, HotkeyHooks,
  WorkerRelayHooks, WorkerRelayLike,
  CryptoHooks, DmHooks,
  ConsentRequest,
  ShellBridge,
  NostrEvent, NostrFilter,
  NappKeyEntry, AclEntry,
  AclCheckEvent,
  Capability,
  ServiceDescriptor, ServiceHandler, ServiceRegistry,
  BrowserDeps,
} from '@napplet/shell';
```

## Protocol Reference

- [Napplet Shell Protocol Specification](../../SPEC.md)
- [NIP-5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) -- Nsite specification
- [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) -- Client-to-relay authentication

## License

MIT
