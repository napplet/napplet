# @napplet/runtime

> Protocol engine for hosting napplet iframes. Framework-agnostic.

## Getting Started

### Prerequisites

- A web application or server that creates sandboxed iframes (or equivalent isolated contexts)
- `@napplet/core` (installed automatically as a dependency)
- For browser use: a Nostr relay pool library and a NIP-07-compatible signer

### How It Works

1. Call `createRuntime(hooks)` with your environment's hooks — relay pool, signer, cache, persistence, crypto
2. Wire up your message transport: call `runtime.handleMessage(windowId, msg)` for every postMessage from a napplet iframe
3. When an iframe loads, call `runtime.sendChallenge(windowId)` to initiate the NIP-42 AUTH handshake
4. The runtime handles all protocol details: AUTH verification, subscription lifecycle, ACL enforcement, state routing, and service dispatch
5. Register optional services via `RuntimeAdapter.services` at creation time, or call `runtime.registerService()` dynamically

### Installation

```bash
npm install @napplet/runtime
```

## Quick Start

```ts
import { createRuntime, type RuntimeAdapter } from '@napplet/runtime';
import { verifyEvent } from 'nostr-tools';

const hooks: RuntimeAdapter = {
  // Required: send NIP-01 messages back to a napplet window
  sendToNapplet: (windowId, msg) => {
    iframeWindows.get(windowId)?.postMessage(msg, '*');
  },

  // Required: user identity and signer access
  auth: {
    getUserPubkey: () => myPubkey,
    getSigner: () => window.nostr ?? null,
  },

  // Required: runtime configuration
  config: {
    getNappUpdateBehavior: () => 'auto-grant',
  },

  // Required: crypto operations
  crypto: {
    verifyEvent: async (event) => verifyEvent(event),
    randomUUID: () => crypto.randomUUID(),
  },

  // Required: hotkey forwarding
  hotkeys: {
    executeHotkeyFromForward: (e) => myHotkeySystem.dispatch(e),
  },

  // Required: persistence adapters
  aclPersistence: {
    persist: (data) => localStorage.setItem('napplet:acl', data),
    load: () => localStorage.getItem('napplet:acl'),
  },
  manifestPersistence: {
    persist: (data) => localStorage.setItem('napplet:manifests', data),
    load: () => localStorage.getItem('napplet:manifests'),
  },
  statePersistence: {
    get: (key) => localStorage.getItem(key),
    set: (key, value) => { localStorage.setItem(key, value); return true; },
    remove: (key) => localStorage.removeItem(key),
    clear: (prefix) => {
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k));
    },
    keys: (prefix) => Object.keys(localStorage).filter(k => k.startsWith(prefix)),
    calculateBytes: (prefix) =>
      Object.entries(localStorage)
        .filter(([k]) => k.startsWith(prefix))
        .reduce((n, [, v]) => n + v.length * 2, 0),
  },

  // Required: window management
  windowManager: {
    createWindow: (opts) => myWindowManager.open(opts),
  },

  // Required: relay configuration
  relayConfig: {
    addRelay: (tier, url) => myRelayConfig.add(tier, url),
    removeRelay: (tier, url) => myRelayConfig.remove(tier, url),
    getRelayConfig: () => myRelayConfig.get(),
    getNip66Suggestions: () => [],
  },

  // Optional: relay pool (or use createRelayPoolService from @napplet/services)
  relayPool: myRelayPool,

  // Optional: services
  services: {
    audio: createAudioService({ onChange: updateAudioUI }),
  },
};

const runtime = createRuntime(hooks);

// Wire up postMessage handler
window.addEventListener('message', (event) => {
  const windowId = originRegistry.get(event.source as Window);
  if (windowId) runtime.handleMessage(windowId, event.data);
});

// When a napplet iframe loads
function onNappletLoad(windowId: string) {
  runtime.sendChallenge(windowId);
}

// Handle consent for destructive signing
runtime.registerConsentHandler((request) => {
  const allowed = confirm(`Allow signing kind ${request.event.kind}?`);
  request.resolve(allowed);
});
```

## API Reference

### createRuntime(hooks)

Create the napplet protocol engine.

| Parameter | Type | Description |
|-----------|------|-------------|
| `hooks` | `RuntimeAdapter` | Host environment integration hooks (see RuntimeAdapter below) |

Returns: `Runtime` — the protocol engine instance.

### Runtime

The object returned by `createRuntime(hooks)`.

| Method | Description |
|--------|-------------|
| `handleMessage(windowId, msg)` | Route an incoming NIP-01 message from a napplet. Call this for every postMessage from a napplet iframe. |
| `sendChallenge(windowId)` | Send a NIP-42 AUTH challenge to a napplet window. Call when a napplet iframe loads. |
| `injectEvent(topic, payload)` | Inject a shell-originated event into subscription delivery. Use for shell → napplet notifications. |
| `registerConsentHandler(handler)` | Register a handler for destructive signing consent prompts (kinds 0, 3, 5, 10002). |
| `registerService(name, handler)` | Dynamically register a service handler after runtime creation. Replaces existing handler if name is taken. |
| `unregisterService(name)` | Remove a service handler by name. No-op if not registered. |
| `destroyWindow(windowId)` | Clean up all state associated with a napplet window (subscriptions, pending state, service cleanup). |
| `destroy()` | Tear down the runtime, persist state, clear all internal state. |

### RuntimeAdapter

The `RuntimeAdapter` interface is the complete integration contract. Implement every required hook to provide the runtime with its dependencies.

**Required hooks:**

| Hook | Type | Description |
|------|------|-------------|
| `sendToNapplet` | `SendToNapplet` | Send a NIP-01 message array to a napplet by windowId |
| `auth` | `RuntimeAuthHooks` | `getUserPubkey(): string \| null` and `getSigner(): RuntimeSigner \| null` |
| `config` | `RuntimeConfigHooks` | `getNappUpdateBehavior(): 'auto-grant' \| 'banner' \| 'silent-reprompt'` |
| `hotkeys` | `RuntimeHotkeyHooks` | `executeHotkeyFromForward(event)` — dispatches forwarded keyboard shortcuts |
| `crypto` | `RuntimeCryptoHooks` | `verifyEvent(event): Promise<boolean>` and `randomUUID(): string` |
| `aclPersistence` | `RuntimeAclPersistence` | `persist(data: string)` and `load(): string \| null` |
| `manifestPersistence` | `RuntimeManifestPersistence` | `persist(data: string)` and `load(): string \| null` |
| `statePersistence` | `RuntimeStatePersistence` | `get`, `set`, `remove`, `clear`, `keys`, `calculateBytes` — scoped key-value storage |
| `windowManager` | `RuntimeWindowManagerHooks` | `createWindow(opts): string \| null` — create new napplet windows |
| `relayConfig` | `RuntimeRelayConfigHooks` | `addRelay`, `removeRelay`, `getRelayConfig`, `getNip66Suggestions` |

**Optional hooks:**

| Hook | Type | Description |
|------|------|-------------|
| `relayPool?` | `RuntimeRelayPoolHooks` | Relay pool operations. Optional if using `createRelayPoolService` from `@napplet/services` instead. |
| `cache?` | `RuntimeCacheHooks` | Local event cache. Optional if using a cache service. |
| `dm?` | `RuntimeDmHooks` | `sendDm(recipientPubkey, message)` — NIP-17 gift-wrap DM sending |
| `onAclCheck?` | `(event: AclCheckEvent) => void` | Audit hook — called on every ACL enforcement check |
| `onPendingUpdate?` | `PendingUpdateNotifier` | Called when a napplet reconnects with a different version hash |
| `onCompatibilityIssue?` | `(report: CompatibilityReport) => void` | Called when a napplet's required services are unavailable |
| `strictMode?` | `boolean` | When `true`, block napplets whose required services are missing. Default: `false`. |
| `services?` | `ServiceRegistry` | Service handlers to register at creation time |

### ServiceHandler

The `ServiceHandler` interface is implemented by every service. Register handlers with `RuntimeAdapter.services` or `runtime.registerService()`.

```ts
interface ServiceHandler {
  /** Service name and version metadata. */
  descriptor: ServiceDescriptor;

  /** Handle a raw NIP-01 message from a napplet. */
  handleMessage(
    windowId: string,
    message: unknown[],  // e.g., ['EVENT', event], ['REQ', subId, ...filters]
    send: (msg: unknown[]) => void,
  ): void;

  /** Optional: called when a napplet window is destroyed. Clean up window-specific state. */
  onWindowDestroyed?(windowId: string): void;
}
```

### ServiceRegistry

```ts
// ServiceRegistry maps service names to handlers
type ServiceRegistry = Record<string, ServiceHandler>;

// Register at creation time:
const hooks: RuntimeAdapter = {
  // ...
  services: {
    audio: createAudioService({ onChange: updateAudioUI }),
    notifications: createNotificationService({ onChange: updateBadge }),
  },
};

// Or register dynamically after creation:
runtime.registerService('audio', createAudioService({ onChange: updateAudioUI }));
```

### Service Discovery (kind 29010)

Napplets discover available shell services by subscribing to kind 29010 events. The runtime handles discovery internally — you do not need to write a REQ handler. When a napplet sends a `REQ` with `kinds: [29010]`, the runtime intercepts it, enumerates the service registry, sends one synthetic `EVENT` per service, then sends `EOSE`. If the registry is empty, `EOSE` is sent immediately with no events.

Each discovery event uses these tags:

```ts
// Each discovery event has these tags:
// ['s', 'audio']                   — service name
// ['v', '1.0.0']                   — service version
// ['d', 'Audio playback control']  — optional description
```

Napplet-side discovery pattern:

```ts
// Napplet: discover available services
const sub = subscribe(
  { kinds: [29010] },
  (event) => {
    const name = event.tags.find(t => t[0] === 's')?.[1];
    const version = event.tags.find(t => t[0] === 'v')?.[1];
    console.log(`Service available: ${name} v${version}`);
  },
  () => console.log('Discovery complete'),
);
```

The discovery functions are exported for custom shell implementations:

```ts
import { createServiceDiscoveryEvent, handleDiscoveryReq, isDiscoveryReq } from '@napplet/runtime';

// Check if a REQ is a discovery request
if (isDiscoveryReq(filters)) {
  handleDiscoveryReq(windowId, subId, services, sendFn, uuidFn);
}
```

## Types

```ts
import type {
  RuntimeAdapter,
  SendToNapplet,
  RuntimeRelayPoolHooks, RelaySubscriptionHandle,
  RuntimeCacheHooks,
  RuntimeAuthHooks, RuntimeSigner,
  RuntimeConfigHooks,
  RuntimeHotkeyHooks,
  RuntimeCryptoHooks,
  RuntimeAclPersistence,
  RuntimeManifestPersistence,
  RuntimeStatePersistence,
  RuntimeWindowManagerHooks,
  RuntimeRelayConfigHooks,
  RuntimeDmHooks,
  ConsentRequest, ConsentHandler,
  ServiceHandler, ServiceRegistry,
  AclCheckEvent,
  CompatibilityReport, ServiceInfo,
  NappKeyEntry,
} from '@napplet/runtime';

import type { Runtime } from '@napplet/runtime';
```

## Integration Note

For pre-built service implementations (audio, notifications, signer, relay pool, cache), see `@napplet/services`. Services implement the `ServiceHandler` interface and wire into the runtime via `RuntimeAdapter.services` or `runtime.registerService()`.

## Protocol Reference

- [Napplet Runtime Reference](../../RUNTIME-SPEC.md)
- [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) — AUTH handshake
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) — Basic protocol flow

## License

MIT
