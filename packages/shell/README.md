# @napplet/shell

> Shell runtime for hosting Nostr-native napplet iframes. Framework-agnostic.

The shell acts as a NIP-01 pseudo-relay between napplet iframes and real Nostr relays. It handles AUTH handshake, ACL enforcement, storage isolation, signer delegation, and inter-pane communication. You provide the hooks for your relay pool, signer, and window manager -- the shell handles the protocol.

## Getting Started

### Prerequisites

- A web application that can create and manage iframes
- [nostr-tools](https://www.npmjs.com/package/nostr-tools) as a peer dependency
- A Nostr signer for the host user (NIP-07 extension, NIP-46 bunker, etc.)

### How It Works

1. Create a `PseudoRelay` by calling `createPseudoRelay(hooks)` with your application's hooks
2. Wire up `window.addEventListener('message', relay.handleMessage)` to capture iframe messages
3. When an iframe loads, register its window reference and call `relay.sendChallenge(windowId)`
4. The pseudo-relay handles AUTH verification, subscription management, event routing, and all protocol details

## Installation

```bash
npm install @napplet/shell nostr-tools
```

## Quick Start

```ts
import { createPseudoRelay, originRegistry } from '@napplet/shell';
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

const relay = createPseudoRelay(hooks);

// Listen for messages from napplet iframes
window.addEventListener('message', (event) => {
  relay.handleMessage(event);
});

// When an iframe loads, register and challenge it
function onIframeLoad(iframe: HTMLIFrameElement, windowId: string) {
  originRegistry.register(windowId, iframe.contentWindow!);
  relay.sendChallenge(windowId);
}

// Handle consent prompts for destructive signing operations
relay.onConsentNeeded((request) => {
  const allowed = confirm(`Allow ${request.event.kind} signing?`);
  request.resolve(allowed);
});
```

## API Reference

### createPseudoRelay(hooks)

Create a pseudo-relay instance with dependency injection.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `hooks` | `ShellHooks` | Host application integration hooks |

**Returns:** `PseudoRelay`

### PseudoRelay

| Method | Description |
|--------|-------------|
| `handleMessage(event: MessageEvent)` | Main message handler -- attach to `window.addEventListener('message', ...)` |
| `sendChallenge(windowId: string)` | Send a NIP-42 AUTH challenge to a napplet window |
| `injectEvent(topic: string, payload: unknown)` | Inject a shell-created event into subscription delivery |
| `cleanup()` | Clean up all state and remove listeners |
| `onConsentNeeded(handler)` | Register handler for destructive signing consent prompts |

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

### Standalone Utilities

These exports can be used independently without creating a full pseudo-relay.

| Export | Description |
|--------|-------------|
| `originRegistry` | Map `Window` references to windowIds and vice versa |
| `nappKeyRegistry` | Manage ephemeral napp key entries after AUTH |
| `aclStore` | ACL entry management: `grant`, `revoke`, `block`, `unblock`, `check`, `persist`, `load` |
| `audioManager` | Track which napplets are producing audio |
| `manifestCache` | Cache NIP-5A manifest verification results |
| `handleStorageRequest` | Handle storage proxy requests from napplets |
| `cleanupNappStorage` | Remove all storage for a specific napp identity |

### Protocol Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `BusKind` | `{ REGISTRATION: 29000, SIGNER_REQUEST: 29001, ... }` | Ephemeral bus kind numbers |
| `AUTH_KIND` | `22242` | NIP-42 authentication event kind |
| `PSEUDO_RELAY_URI` | `'napplet://shell'` | Pseudo-relay URI for AUTH relay tag |
| `PROTOCOL_VERSION` | `'2.0.0'` | Protocol version string |
| `ALL_CAPABILITIES` | `['relay:read', 'relay:write', ...]` | Complete list of ACL capabilities |
| `DESTRUCTIVE_KINDS` | `Set([0, 3, 5, 10002])` | Event kinds requiring user consent |
| `TOPICS` | `{ ... }` | Shell command topic constants |

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
  PseudoRelay,
  NostrEvent, NostrFilter,
  NappKeyEntry, AclEntry,
  Capability,
} from '@napplet/shell';
```

## Protocol Reference

- [Napplet Shell Protocol Specification](../../SPEC.md)
- [NIP-5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) -- Nsite specification
- [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) -- Client-to-relay authentication

## License

MIT
