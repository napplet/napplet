# @napplet/sdk

> Named TypeScript exports for napplet developers using a bundler. Wraps `window.napplet` at call time.

## Getting Started

### Prerequisites

- `@napplet/shim` must be imported (side-effect) to install `window.napplet` before SDK methods are called
- A shell host running [@napplet/runtime](https://www.npmjs.com/package/@napplet/runtime) or [@napplet/shell](https://www.npmjs.com/package/@napplet/shell)

### How It Works

1. Import `@napplet/shim` in your entry point to install the `window.napplet` global
2. Import named exports from `@napplet/sdk` -- `relay`, `ipc`, `services`, `storage`
3. Each SDK method delegates to its `window.napplet.*` counterpart at call time
4. If `window.napplet` is not installed when a method is called, a descriptive error is thrown

### Installation

```bash
npm install @napplet/sdk @napplet/shim nostr-tools
```

## Quick Start

```ts
import '@napplet/shim';
import { relay, ipc, storage, type NostrEvent } from '@napplet/sdk';

// Subscribe to kind 1 notes
const sub = relay.subscribe(
  { kinds: [1], limit: 20 },
  (event) => console.log('New note:', event.content),
  () => console.log('End of stored events'),
);

// Publish a signed note
const signed = await relay.publish({
  kind: 1,
  content: 'Hello from my napplet!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});

// Inter-pane messaging
ipc.emit('chat:message', [], JSON.stringify({ text: 'hi' }));
const ipcSub = ipc.on('bot:response', (payload) => {
  console.log('Bot says:', payload);
});

// Scoped storage
await storage.setItem('theme', 'dark');
const theme = await storage.getItem('theme'); // 'dark'

// Clean up
sub.close();
ipcSub.close();
```

## API Reference

### `relay`

Relay operations through the shell's relay pool. Mirrors `window.napplet.relay`.

| Method | Returns | Description |
|--------|---------|-------------|
| `subscribe(filters, onEvent, onEose?, options?)` | `Subscription` | Open a live NIP-01 subscription |
| `publish(template, options?)` | `Promise<NostrEvent>` | Sign and broadcast via the shell's signer proxy |
| `query(filters)` | `Promise<NostrEvent[]>` | One-shot query: subscribe, collect until EOSE, resolve |

### `ipc`

Inter-pane communication between napplets. Mirrors `window.napplet.ipc`.

| Method | Returns | Description |
|--------|---------|-------------|
| `emit(topic, extraTags?, content?)` | `void` | Broadcast a kind 29003 event with the given topic |
| `on(topic, callback)` | `{ close(): void }` | Subscribe to events on a topic |

### `services`

Service discovery. Mirrors `window.napplet.services`.

| Method | Returns | Description |
|--------|---------|-------------|
| `list()` | `Promise<ServiceInfo[]>` | Query available shell services (cached per session) |
| `has(name, version?)` | `Promise<boolean>` | Check if a service is available |

### `storage`

Sandboxed key-value storage. Mirrors `window.napplet.storage`. 512 KB quota per napplet.

| Method | Returns | Description |
|--------|---------|-------------|
| `getItem(key)` | `Promise<string \| null>` | Retrieve a stored value |
| `setItem(key, value)` | `Promise<void>` | Store a key-value pair |
| `removeItem(key)` | `Promise<void>` | Remove a stored key |
| `keys()` | `Promise<string[]>` | List all stored keys |

### Namespace Import

`import * as napplet from '@napplet/sdk'` produces an object structurally identical to `window.napplet`:

```ts
import * as napplet from '@napplet/sdk';

napplet.relay.subscribe({ kinds: [1] }, (e) => console.log(e));
napplet.storage.setItem('key', 'value');
```

## Types

All protocol types are re-exported from `@napplet/core`:

```ts
import type {
  NostrEvent,
  NostrFilter,
  ServiceInfo,
  Subscription,
  EventTemplate,
} from '@napplet/sdk';
```

| Type | Description |
|------|-------------|
| `NostrEvent` | Standard NIP-01 Nostr event |
| `NostrFilter` | NIP-01 subscription filter |
| `ServiceInfo` | Service descriptor: `{ name, version, description? }` |
| `Subscription` | Handle with `close()` method |
| `EventTemplate` | Unsigned event for `relay.publish()` |

## Runtime Guard

If `window.napplet` is not installed when an SDK method is called, a clear error is thrown:

```
Error: window.napplet not installed -- import @napplet/shim first
```

This protects against importing `@napplet/sdk` without the side-effect shim import.

## SDK vs Shim

| | `@napplet/sdk` | `@napplet/shim` |
|---|---|---|
| **Import style** | `import { relay } from '@napplet/sdk'` | `import '@napplet/shim'` (side-effect) |
| **What it does** | Named exports wrapping `window.napplet` | Installs `window.napplet` + AUTH handshake |
| **Dependencies** | `@napplet/core` (types only) | `nostr-tools` (peer) |
| **Side effects** | None | Yes -- installs globals, starts AUTH |
| **Required** | Optional convenience | Required in every napplet |

**Typical usage:** Import both -- shim for runtime, SDK for developer API:

```ts
import '@napplet/shim';                              // required: installs window.napplet
import { relay, ipc, storage } from '@napplet/sdk';  // optional: typed API
```

If you are writing a vanilla napplet with no build step, use `window.napplet.*` directly after importing the shim -- the SDK is not required.

## Protocol Reference

- [Napplet Shell Protocol Specification](../../SPEC.md)
- [@napplet/shim](../shim/) -- Window installer package
- [@napplet/core](../core/) -- Shared protocol types

## License

MIT
