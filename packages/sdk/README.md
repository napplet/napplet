# @napplet/sdk

> Named TypeScript exports for napplet developers using a bundler. Wraps `window.napplet` at call time.

## Getting Started

### Prerequisites

- `@napplet/shim` must be imported (side-effect) to install `window.napplet` before SDK methods are called
- A shell host running a napplet protocol shell implementation

### How It Works

1. Import `@napplet/shim` in your entry point to install the `window.napplet` global
2. Import named exports from `@napplet/sdk` -- `relay`, `ipc`, `storage`, `keys`
3. Each SDK method delegates to its `window.napplet.*` counterpart at call time
4. If `window.napplet` is not installed when a method is called, a descriptive error is thrown

### Installation

```bash
npm install @napplet/sdk @napplet/shim
```

## Quick Start

```ts
import '@napplet/shim';
import { relay, ipc, storage, keys, media, type NostrEvent } from '@napplet/sdk';

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

// Register keyboard action
const result = await keys.registerAction({
  id: 'editor.save', label: 'Save', defaultKey: 'Ctrl+S',
});

// Listen for bound key locally
const keySub = keys.onAction('editor.save', () => {
  console.log('Save triggered!');
});

// Create a media session
const { sessionId } = await media.createSession({
  title: 'My Song', artist: 'The Artist',
});
media.reportState(sessionId, { status: 'playing', position: 42.5, duration: 240 });

// Clean up
sub.close();
ipcSub.close();
keySub.close();
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

### `storage`

Sandboxed key-value storage. Mirrors `window.napplet.storage`. 512 KB quota per napplet.

| Method | Returns | Description |
|--------|---------|-------------|
| `getItem(key)` | `Promise<string \| null>` | Retrieve a stored value |
| `setItem(key, value)` | `Promise<void>` | Store a key-value pair |
| `removeItem(key)` | `Promise<void>` | Remove a stored key |
| `keys()` | `Promise<string[]>` | List all stored keys |

### `media`

Media session control. Mirrors `window.napplet.media`.

| Method | Returns | Description |
|--------|---------|-------------|
| `createSession(metadata?)` | `Promise<{ sessionId }>` | Create a new media session with optional metadata |
| `updateSession(sessionId, metadata)` | `void` | Update metadata for an existing session |
| `destroySession(sessionId)` | `void` | Destroy a session |
| `reportState(sessionId, state)` | `void` | Report playback state |
| `reportCapabilities(sessionId, actions)` | `void` | Declare supported media actions |
| `onCommand(sessionId, callback)` | `{ close(): void }` | Listen for shell media commands |
| `onControls(sessionId, callback)` | `{ close(): void }` | Listen for the shell's supported control list |

### `keys`

Keyboard forwarding and action keybindings. Mirrors `window.napplet.keys`.

| Method | Returns | Description |
|--------|---------|-------------|
| `registerAction(action)` | `Promise<{ actionId, binding? }>` | Declare a named action the shell can bind to a key |
| `unregisterAction(actionId)` | `void` | Remove a previously registered action |
| `onAction(actionId, callback)` | `{ close(): void }` | Register a local handler for a bound key (zero-latency, not a wire message) |

### `shell`

Namespaced capability query. Access via `window.napplet.shell.supports()` after importing `@napplet/shim`.

> Note: The SDK does not export a top-level `shell` object. Use `window.napplet.shell.supports()` directly.

| Method | Returns | Description |
|--------|---------|-------------|
| `supports(capability)` | `boolean` | Check shell support for a NUB (`nub:relay`) or permission (`perm:popups`). Bare NUB names also accepted (`relay`). |

**Example:**

```ts
import '@napplet/shim';

// NUB domains (bare shorthand or nub: prefix)
if (window.napplet.shell.supports('relay')) { /* ... */ }
if (window.napplet.shell.supports('nub:signer')) { /* ... */ }

// Permissions
if (window.napplet.shell.supports('perm:popups')) { /* ... */ }
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
  Subscription,
  EventTemplate,
  NappletMessage,
  NubDomain,
  NamespacedCapability,
  ShellSupports,
  // NUB message types (re-exported from NUB packages)
  RelayNubMessage,
  SignerNubMessage,
  StorageNubMessage,
  IfcNubMessage,
  KeysNubMessage,
  Action,
} from '@napplet/sdk';
```

### Core Protocol Types

| Type | Description |
|------|-------------|
| `NostrEvent` | Standard Nostr event object |
| `NostrFilter` | Relay subscription filter |
| `Subscription` | Handle with `close()` method |
| `EventTemplate` | Unsigned event for `relay.publish()` |
| `NappletMessage` | Base JSON envelope type for all protocol messages |
| `NubDomain` | String literal union of NUB domain names |
| `NamespacedCapability` | Union of `NubDomain \| nub:* \| perm:*` for `supports()` |
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
| `KeysNubMessage` | `@napplet/nub-keys` | Discriminated union of all keys domain messages |
| `MediaNubMessage` | `@napplet/nub-media` | Discriminated union of all media domain messages |

Individual message types (e.g., `RelaySubscribeMessage`, `SignerSignEventMessage`) are also re-exported from
`@napplet/sdk` for fine-grained typing.

## NUB Domain Constants

Each NUB domain has a string constant re-exported from its package:

```ts
import { RELAY_DOMAIN, SIGNER_DOMAIN, STORAGE_DOMAIN, IFC_DOMAIN, THEME_DOMAIN, KEYS_DOMAIN, MEDIA_DOMAIN } from '@napplet/sdk';
// Values: 'relay', 'signer', 'storage', 'ifc', 'theme', 'keys', 'media'
```

These constants are re-exported from the individual NUB packages. Use them with the shell capability query
API for type-safe conditional logic:

```ts
if (window.napplet.shell.supports('nub:relay')) {
  // relay operations are available
}

if (window.napplet.shell.supports('nub:signer')) {
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
import '@napplet/shim';                                      // required: installs window.napplet
import { relay, ipc, storage, keys, media } from '@napplet/sdk';  // optional: typed API
```

If you are writing a vanilla napplet with no build step, use `window.napplet.*` directly after importing the shim -- the SDK is not required.

## Protocol Reference

- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification
- [@napplet/shim](../shim/) -- Window installer package
- [@napplet/core](../core/) -- Shared protocol types

## License

MIT
