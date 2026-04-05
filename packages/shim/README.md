# @napplet/shim

> Side-effect-only window installer for napplet iframes. Importing `@napplet/shim` installs the `window.napplet` global. No named exports.

## Getting Started

### Prerequisites

- A shell host running [@napplet/runtime](https://www.npmjs.com/package/@napplet/runtime) (or [@napplet/shell](https://www.npmjs.com/package/@napplet/shell) for browser environments)
- [nostr-tools](https://www.npmjs.com/package/nostr-tools) as a peer dependency

### How It Works

1. Import `@napplet/shim` in your napplet's entry point (side-effect only -- no named exports)
2. The shim generates an ephemeral keypair and completes the NIP-42 AUTH handshake with the shell
3. Once authenticated, `window.napplet` is populated with `relay`, `ipc`, `services`, and `storage` sub-objects
4. The shim also installs `window.nostr` (NIP-07 compatible) for transparent signer proxy access

### Installation

```bash
npm install @napplet/shim nostr-tools
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

// Clean up
sub.close();
ipcSub.close();
```

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
};
```

### `window.napplet.relay`

Relay operations through the shell's relay pool.

| Method | Returns | Description |
|--------|---------|-------------|
| `subscribe(filters, onEvent, onEose, options?)` | `Subscription` | Open a live NIP-01 subscription. `options.relay` and `options.group` for NIP-29 scoped relays. |
| `publish(template, options?)` | `Promise<NostrEvent>` | Sign and broadcast a Nostr event via the shell's signer proxy. |
| `query(filters)` | `Promise<NostrEvent[]>` | One-shot query: subscribe, collect events until EOSE, then resolve. |

### `window.napplet.ipc`

Inter-pane communication between napplets via the shell.

| Method | Returns | Description |
|--------|---------|-------------|
| `emit(topic, extraTags?, content?)` | `void` | Broadcast a signed kind 29003 event with the given `t` tag topic. |
| `on(topic, callback)` | `{ close(): void }` | Subscribe to inter-pane events on a topic. Callback receives `(payload, event)`. |

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

## TypeScript Support

Importing `@napplet/shim` activates a global Window type augmentation:

```ts
// This side-effect import gives TypeScript full autocompletion for window.napplet.*
import '@napplet/shim';

// TypeScript knows about window.napplet.relay, .ipc, .services, .storage
window.napplet.relay.subscribe({ kinds: [1] }, (event) => {
  // event is typed as NostrEvent
});
```

The `NappletGlobal` interface is defined in `@napplet/core` and augmented onto `Window` by the shim's type declarations.

**Note:** `@napplet/shim` has zero named exports -- `import { anything } from '@napplet/shim'` is a TypeScript error. For named imports, use `@napplet/sdk`.

## Shim vs SDK

| | `@napplet/shim` | `@napplet/sdk` |
|---|---|---|
| **Import style** | `import '@napplet/shim'` (side-effect) | `import { relay, ipc } from '@napplet/sdk'` |
| **What it does** | Installs `window.napplet` global + AUTH handshake | Named exports wrapping `window.napplet` |
| **When to use** | Always -- required to install the runtime | When you want typed imports in a bundler |
| **Named exports** | None | `relay`, `ipc`, `services`, `storage`, plus types |

**Typical usage:** Import both -- shim for window installation, SDK for typed API access:

```ts
import '@napplet/shim';
import { relay, ipc, storage } from '@napplet/sdk';
```

## Protocol Reference

- [Napplet Runtime Reference](../../RUNTIME-SPEC.md)
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) -- Basic protocol flow
- [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) -- Authentication

## License

MIT
