# @napplet/shim

> Side-effect-only window installer for napplet iframes. Importing `@napplet/shim` installs the `window.napplet` global. No named exports. No cryptographic dependencies -- the shim sends JSON envelope messages and the shell handles identity.

## Getting Started

### Prerequisites

- A shell host running a napplet protocol shell implementation

### How It Works

1. Import `@napplet/shim` in your napplet's entry point (side-effect only -- no named exports)
2. The shim registers with the shell via postMessage -- the shell assigns identity based on the iframe's `message.source` Window reference
3. Once registered, `window.napplet` is populated with `relay`, `ipc`, `services`, `storage`, and `shell` sub-objects
4. The shim also installs `window.nostr` (NIP-07 compatible) for transparent signer proxy access

### Installation

```bash
npm install @napplet/shim
```

## Quick Start

```ts
// Side-effect import -- installs window.napplet and window.nostr
import '@napplet/shim';

// Subscribe to kind 1 notes
const sub = window.napplet.relay.subscribe(
  { kinds: [1], limit: 20 },
  (event) => console.log('New note:', event.content),
  () => console.log('End of stored events'),
);

// Publish a signed note (signed via shell's signer proxy)
const signed = await window.napplet.relay.publish({
  kind: 1,
  content: 'Hello from my napplet!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});

// Listen for inter-pane events from other napplets
const ipcSub = window.napplet.ipc.on('profile:open', (payload) => {
  console.log('Profile requested:', payload);
});

// Use scoped storage (proxied through the shell)
await window.napplet.storage.setItem('theme', 'dark');
const theme = await window.napplet.storage.getItem('theme'); // 'dark'

// Discover available shell services
const services = await window.napplet.services.list();
if (await window.napplet.services.has('audio')) {
  console.log('Audio service available');
}

// Check shell NUB support before using a domain
if (window.napplet.shell.supports('signer')) {
  const pubkey = await window.nostr.getPublicKey();
}

// Clean up
sub.close();
ipcSub.close();
```

## Wire Format

The shim communicates with the shell using JSON envelope messages (`{ type: "domain.action", ...payload }`) as defined by NIP-5D.

### Outbound (napplet → shell)

Messages sent via `window.parent.postMessage(msg, '*')`:

```ts
{ type: 'relay.subscribe', id: string, subId: string, filters: NostrFilter[] }
{ type: 'relay.publish', id: string, event: EventTemplate }
{ type: 'relay.query', id: string, filters: NostrFilter[] }
{ type: 'relay.unsubscribe', subId: string }

{ type: 'signer.getPublicKey', id: string }
{ type: 'signer.signEvent', id: string, event: EventTemplate }
{ type: 'signer.getRelays', id: string }
{ type: 'signer.nip04.encrypt', id: string, pubkey: string, plaintext: string }
{ type: 'signer.nip04.decrypt', id: string, pubkey: string, ciphertext: string }
{ type: 'signer.nip44.encrypt', id: string, pubkey: string, plaintext: string }
{ type: 'signer.nip44.decrypt', id: string, pubkey: string, ciphertext: string }

{ type: 'ifc.emit', topic: string, payload?: unknown }
{ type: 'ifc.subscribe', id: string, topic: string }
{ type: 'ifc.unsubscribe', topic: string }

{ type: 'storage.get', id: string, key: string }
{ type: 'storage.set', id: string, key: string, value: string }
{ type: 'storage.remove', id: string, key: string }
{ type: 'storage.keys', id: string }
```

### Inbound (shell → napplet)

Messages received via `window.addEventListener('message', ...)`:

```ts
{ type: 'relay.event', subId: string, event: NostrEvent }
{ type: 'relay.eose', subId: string }
{ type: 'relay.publish.result', id: string, event?: NostrEvent, error?: string }
{ type: 'relay.query.result', id: string, events: NostrEvent[], error?: string }

{ type: 'signer.getPublicKey.result', id: string, pubkey?: string, error?: string }
{ type: 'signer.signEvent.result', id: string, event?: NostrEvent, error?: string }
{ type: 'signer.getRelays.result', id: string, relays?: Record<string, object>, error?: string }
{ type: 'signer.nip04.encrypt.result', id: string, ciphertext?: string, error?: string }
{ type: 'signer.nip44.encrypt.result', id: string, ciphertext?: string, error?: string }
{ type: 'signer.nip04.decrypt.result', id: string, plaintext?: string, error?: string }
{ type: 'signer.nip44.decrypt.result', id: string, plaintext?: string, error?: string }

{ type: 'ifc.event', topic: string, payload?: unknown, sender: string }

{ type: 'storage.get.result', id: string, value?: string | null, error?: string }
{ type: 'storage.set.result', id: string, error?: string }
{ type: 'storage.remove.result', id: string, error?: string }
{ type: 'storage.keys.result', id: string, keys?: string[], error?: string }
```

All request/response pairs are correlated by the `id` field. Signer request timeouts after 30 seconds.

## `window.napplet` Shape

After `import '@napplet/shim'`, the global `window.napplet` object has the following structure:

```ts
window.napplet = {
  relay: {
    subscribe(filters, onEvent, onEose, options?): Subscription;
    publish(template, options?): Promise<NostrEvent>;
    query(filters): Promise<NostrEvent[]>;
  },
  ipc: {
    emit(topic, extraTags?, content?): void;
    on(topic, callback): { close(): void };
  },
  services: {
    list(): Promise<ServiceInfo[]>;
    has(name, version?): Promise<boolean>;
  },
  storage: {
    getItem(key): Promise<string | null>;
    setItem(key, value): Promise<void>;
    removeItem(key): Promise<void>;
    keys(): Promise<string[]>;
  },
  shell: {
    supports(capability: string): boolean;
  },
};
```

### `window.napplet.relay`

Relay operations through the shell's relay pool via JSON envelope (relay.subscribe, relay.publish, relay.query messages).

| Method | Returns | Description |
|--------|---------|-------------|
| `subscribe(filters, onEvent, onEose, options?)` | `Subscription` | Open a relay subscription via JSON envelope. `options.relay` and `options.group` for NIP-29 scoped relays. |
| `publish(template, options?)` | `Promise<NostrEvent>` | Sign and broadcast a Nostr event via the shell's signer proxy. |
| `query(filters)` | `Promise<NostrEvent[]>` | One-shot query: sends a relay.query envelope, resolves when results arrive. |

### `window.napplet.ipc`

Inter-pane communication between napplets via the shell.

| Method | Returns | Description |
|--------|---------|-------------|
| `emit(topic, extraTags?, content?)` | `void` | Send an `ifc.emit` JSON envelope to the shell for delivery to matching topic subscribers. |
| `on(topic, callback)` | `{ close(): void }` | Subscribe to `ifc.event` JSON envelopes on a topic. Callback receives `(payload, event)`. |

### `window.napplet.services`

Service discovery for shell capabilities.

| Method | Returns | Description |
|--------|---------|-------------|
| `list()` | `Promise<ServiceInfo[]>` | Query available services. Results are cached for the session. |
| `has(name, version?)` | `Promise<boolean>` | Check if a named service (optionally at a specific version) is available. |

### `window.napplet.storage`

Sandboxed key-value storage proxied through the shell. Scoped by napplet identity -- napplets cannot read each other's data. 512 KB quota per napplet.

| Method | Returns | Description |
|--------|---------|-------------|
| `getItem(key)` | `Promise<string \| null>` | Retrieve a stored value. Returns `null` if key does not exist. |
| `setItem(key, value)` | `Promise<void>` | Store a key-value pair. Throws on quota exceeded. |
| `removeItem(key)` | `Promise<void>` | Remove a stored key. |
| `keys()` | `Promise<string[]>` | List all keys stored by this napplet. |

### `window.napplet.shell`

Capability query interface. `supports()` checks whether the shell declared support for a NUB domain.

```ts
window.napplet.shell.supports('relay');   // true if shell has a relay NUB
window.napplet.shell.supports('signer');  // true if shell can sign events
window.napplet.shell.supports('storage'); // true if shell provides storage proxy
window.napplet.shell.supports('ifc');     // true if shell has inter-frame communication
```

Currently returns `false` until the shell populates it at iframe creation time. Use as a feature gate before calling APIs that depend on a specific NUB domain.

## TypeScript Support

Importing `@napplet/shim` activates a global Window type augmentation:

```ts
// This side-effect import gives TypeScript full autocompletion for window.napplet.*
import '@napplet/shim';

// TypeScript knows about window.napplet.relay, .ipc, .services, .storage, .shell
window.napplet.relay.subscribe({ kinds: [1] }, (event) => {
  // event is typed as NostrEvent
});

window.napplet.shell.supports('signer'); // typed as (capability: string) => boolean
```

The `NappletGlobal` interface is defined in `@napplet/core` and augmented onto `Window` by the shim's type declarations.

**Note:** `@napplet/shim` has zero named exports -- `import { anything } from '@napplet/shim'` is a TypeScript error. For named imports, use `@napplet/sdk`.

## Shim vs SDK

| | `@napplet/shim` | `@napplet/sdk` |
|---|---|---|
| **Import style** | `import '@napplet/shim'` (side-effect) | `import { relay, ipc } from '@napplet/sdk'` |
| **What it does** | Installs `window.napplet` global + shell registration | Named exports wrapping `window.napplet` |
| **Dependencies** | `@napplet/nub-signer`, `@napplet/nub-ifc` (types only) | `@napplet/core` (types only) |
| **When to use** | Always -- required to install the runtime | When you want typed imports in a bundler |
| **Named exports** | None | `relay`, `ipc`, `services`, `storage`, plus types |

**Typical usage:** Import both -- shim for window installation, SDK for typed API access:

```ts
import '@napplet/shim';
import { relay, ipc, storage } from '@napplet/sdk';
```

## Protocol Reference

- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification

## License

MIT
