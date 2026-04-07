# @napplet/sdk

> Named TypeScript exports for napplet developers using a bundler. Wraps `window.napplet` at call time.

## Getting Started

### Prerequisites

- `@napplet/shim` must be imported (side-effect) to install `window.napplet` before SDK methods are called
- A shell host running [@kehto/shell](https://github.com/sandwichfarm/kehto) or another napplet protocol shell implementation

### How It Works

1. Import `@napplet/shim` in your entry point to install the `window.napplet` global
2. Import named exports from `@napplet/sdk` -- `relay`, `ipc`, `services`, `storage`
3. Each SDK method delegates to its `window.napplet.*` counterpart at call time
4. If `window.napplet` is not installed when a method is called, a descriptive error is thrown

### Installation

```bash
npm install @napplet/sdk @napplet/shim
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
| `subscribe(filters, onEvent, onEose, options?)` | `Subscription` | Open a live relay subscription through the shell's relay pool |
| `publish(template, options?)` | `Promise<NostrEvent>` | Sign and broadcast via the shell's signer proxy |
| `query(filters)` | `Promise<NostrEvent[]>` | One-shot query: subscribe, collect until EOSE, resolve |

### `ipc`

Inter-napplet communication between napplets. Mirrors `window.napplet.ipc`.

Messages are sent as JSON envelope objects (`{ type: 'ifc.emit', topic, payload }`) and received as
(`{ type: 'ifc.event', topic, payload, sender }`).

| Method | Returns | Description |
|--------|---------|-------------|
| `emit(topic, extraTags?, content?)` | `void` | Broadcast an IFC event to other napplets via the shell |
| `on(topic, callback)` | `{ close(): void }` | Subscribe to IFC events on a topic |

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

### `shell`

Shell capability query interface. Access via `window.napplet.shell.supports()` after importing `@napplet/shim`.

> Note: The SDK does not export a top-level `shell` object. Use `window.napplet.shell.supports('relay')` directly, or
> import the `RELAY_DOMAIN` constant from `@napplet/sdk` for type-safe capability checks.

| Method | Returns | Description |
|--------|---------|-------------|
| `supports(capability)` | `boolean` | Check whether the shell supports a NUB domain or sandbox permission |

**Example:**

```ts
import '@napplet/shim';
import { RELAY_DOMAIN } from '@napplet/sdk';

if (window.napplet.shell.supports(RELAY_DOMAIN)) {
  // shell supports relay operations
}
```

### Namespace Import

`import * as napplet from '@napplet/sdk'` produces an object structurally identical to `window.napplet`:

```ts
import * as napplet from '@napplet/sdk';

napplet.relay.subscribe({ kinds: [1] }, (e) => console.log(e));
napplet.storage.setItem('key', 'value');
```

## Types

All protocol types are re-exported from `@napplet/core` and the NUB packages:

```ts
import type {
  // Protocol types (from @napplet/core)
  NostrEvent,
  NostrFilter,
  ServiceInfo,
  Subscription,
  EventTemplate,
  NappletMessage,
  NubDomain,
  ShellSupports,
  // NUB message types (re-exported from NUB packages)
  RelayNubMessage,
  SignerNubMessage,
  StorageNubMessage,
  IfcNubMessage,
} from '@napplet/sdk';
```

### Core Protocol Types

| Type | Description |
|------|-------------|
| `NostrEvent` | Standard Nostr event object |
| `NostrFilter` | Relay subscription filter |
| `ServiceInfo` | Service descriptor: `{ name, version, description? }` |
| `Subscription` | Handle with `close()` method |
| `EventTemplate` | Unsigned event for `relay.publish()` |
| `NappletMessage` | Base JSON envelope type for all protocol messages |
| `NubDomain` | String literal union of NUB domain names |
| `ShellSupports` | Interface for the shell capability query API |

### NUB Message Types

These are discriminated union types covering all messages in each NUB domain. Useful for writing typed message
handlers in shell implementations or protocol-aware code.

| Type | NUB Package | Description |
|------|-------------|-------------|
| `RelayNubMessage` | `@napplet/nub-relay` | Discriminated union of all relay domain messages |
| `SignerNubMessage` | `@napplet/nub-signer` | Discriminated union of all signer domain messages |
| `StorageNubMessage` | `@napplet/nub-storage` | Discriminated union of all storage domain messages |
| `IfcNubMessage` | `@napplet/nub-ifc` | Discriminated union of all IFC domain messages |

Individual message types (e.g., `RelaySubscribeMessage`, `SignerSignEventMessage`) are also re-exported from
`@napplet/sdk` for fine-grained typing.

## NUB Domain Constants

Each NUB domain has a string constant re-exported from its package:

```ts
import { RELAY_DOMAIN, SIGNER_DOMAIN, STORAGE_DOMAIN, IFC_DOMAIN } from '@napplet/sdk';
// Values: 'relay', 'signer', 'storage', 'ifc'
```

These constants are re-exported from the individual NUB packages. Use them with the shell capability query
API for type-safe conditional logic:

```ts
import { RELAY_DOMAIN, SIGNER_DOMAIN } from '@napplet/sdk';

if (window.napplet.shell.supports(RELAY_DOMAIN)) {
  // relay operations are available
}

if (window.napplet.shell.supports(SIGNER_DOMAIN)) {
  // signer delegation is available
}
```

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
| **What it does** | Named exports wrapping `window.napplet` | Installs `window.napplet` + shell registration |
| **Dependencies** | `@napplet/core` (types only) | None (types from `@napplet/core`) |
| **Side effects** | None | Yes -- installs globals, registers with shell |
| **Required** | Optional convenience | Required in every napplet |

**Typical usage:** Import both -- shim for runtime, SDK for developer API:

```ts
import '@napplet/shim';                              // required: installs window.napplet
import { relay, ipc, storage } from '@napplet/sdk';  // optional: typed API
```

If you are writing a vanilla napplet with no build step, use `window.napplet.*` directly after importing the shim -- the SDK is not required.

## Protocol Reference

- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification
- [@napplet/shim](../shim/) -- Window installer package
- [@napplet/core](../core/) -- Shared protocol types

## License

MIT
