# @napplet/shim

> Napplet SDK for building Nostr-native sandboxed iframe applications.

A napplet is a sandboxed iframe app that communicates with a host shell over `postMessage` using NIP-01 wire format. The shim handles AUTH handshake, relay communication, storage, signer proxy, and inter-pane messaging automatically -- you write application logic, the shim handles the protocol.

## Getting Started

### Prerequisites

- A shell host running [@napplet/shell](https://www.npmjs.com/package/@napplet/shell)
- [nostr-tools](https://www.npmjs.com/package/nostr-tools) as a peer dependency

### How It Works

1. Import `@napplet/shim` in your napplet's entry point
2. The shim automatically generates an ephemeral keypair and completes the NIP-42 AUTH handshake with the shell
3. Once authenticated, use `subscribe`, `publish`, `query`, `emit`, `on`, and `nappState` to interact with Nostr relays and other napplets

The shim also installs a `window.nostr` NIP-07 compatible interface that routes signing requests through the shell's signer proxy.

## Installation

```bash
npm install @napplet/shim nostr-tools
```

## Quick Start

```ts
import { subscribe, publish, on, nappState, discoverServices, hasService } from '@napplet/shim';

// Subscribe to kind 1 notes
const sub = subscribe(
  { kinds: [1], limit: 20 },
  (event) => console.log('New note:', event.content),
  () => console.log('End of stored events'),
);

// Publish a signed note (signed via shell's signer proxy)
const signed = await publish({
  kind: 1,
  content: 'Hello from my napplet!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});

// Listen for inter-pane events from other napplets
const ipc = on('profile:open', (payload) => {
  console.log('Profile requested:', payload);
});

// Use scoped storage (proxied through the shell)
await nappState.setItem('theme', 'dark');
const theme = await nappState.getItem('theme'); // 'dark'

// Discover available shell services
const services = await discoverServices();
if (await hasService('audio')) {
  console.log('Audio service available');
}

// Clean up
sub.close();
ipc.close();
```

## API Reference

### subscribe(filters, onEvent, onEose?, options?)

Open a live NIP-01 subscription through the shell's relay pool.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filters` | `NostrFilter \| NostrFilter[]` | NIP-01 subscription filter(s) |
| `onEvent` | `(event: NostrEvent) => void` | Called for each matching event |
| `onEose` | `() => void` | Called when stored events are exhausted |
| `options` | `{ relay?: string; group?: string }` | Optional scoped relay for NIP-29 groups |

**Returns:** `Subscription` -- object with a `close()` method to tear down the subscription.

```ts
const sub = subscribe(
  { kinds: [1], authors: ['abc123...'] },
  (event) => console.log(event),
  () => console.log('EOSE'),
);
sub.close(); // Stop receiving events
```

### publish(template, options?)

Sign and publish a Nostr event through the shell. The event is signed via the shell's NIP-07 signer proxy, then broadcast to connected relays.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `template` | `EventTemplate` | Unsigned event (`kind`, `content`, `tags`, `created_at`) |
| `options` | `{ relay?: boolean }` | Set `true` to publish via scoped relay |

**Returns:** `Promise<NostrEvent>` -- the signed event.

```ts
const signed = await publish({
  kind: 1,
  content: 'Hello Nostr!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});
```

### query(filters)

One-shot query: subscribe, collect events until EOSE, then close and resolve.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filters` | `NostrFilter \| NostrFilter[]` | NIP-01 subscription filter(s) |

**Returns:** `Promise<NostrEvent[]>` -- array of matching events.

```ts
const profiles = await query({ kinds: [0], authors: [pubkey] });
```

### emit(topic, extraTags?, content?)

Broadcast an inter-pane event to other napplets via the shell. Creates a signed kind 29003 event with the given topic as a `t` tag.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topic` | `string` | | The `t` tag value (e.g., `'profile:open'`) |
| `extraTags` | `string[][]` | `[]` | Additional NIP-01 tags |
| `content` | `string` | `''` | Event content (typically JSON) |

**Returns:** `void`

```ts
emit('profile:open', [], JSON.stringify({ pubkey: '...' }));
```

### on(topic, callback)

Subscribe to inter-pane events on a specific topic. Events from other napplets with a matching `t` tag are delivered with their content JSON-parsed.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | `string` | The `t` tag value to listen for |
| `callback` | `(payload: unknown, event: NostrEvent) => void` | Called with parsed content and raw event |

**Returns:** `{ close(): void }` -- call `close()` to unsubscribe.

```ts
const sub = on('stream:channel-switch', (payload) => {
  console.log('Channel switch:', payload);
});
sub.close();
```

### window.napplet

The shim installs a `window.napplet` global that provides service discovery. This global is also accessible via the named exports.

```ts
// Via window global (available in any script context)
const services = await window.napplet.discoverServices();

// Via named import (preferred in TypeScript)
import { discoverServices } from '@napplet/shim';
const services = await discoverServices();
```

Note: the `window.napplet` global is set up at module initialization. The three functions below (`discoverServices`, `hasService`, `hasServiceVersion`) are mounted on this global and also available as named exports.

### discoverServices()

Query available services in the shell. Results are cached session-scoped — subsequent calls return the cache without sending another request.

**Returns:** `Promise<ServiceInfo[]>`

```ts
const services = await discoverServices();
console.log(`Shell provides ${services.length} services`);
for (const svc of services) {
  console.log(`${svc.name} v${svc.version}`);
}
```

### hasService(name)

Check whether a named service is available in the shell.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Service name to check (e.g., `'audio'`, `'notifications'`) |

**Returns:** `Promise<boolean>`

```ts
if (await hasService('audio')) {
  // Safe to use audio features
}
```

### hasServiceVersion(name, version)

Check whether a named service with a specific version is available.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Service name to check |
| `version` | `string` | Exact version string (e.g., `'1.0.0'`) |

**Returns:** `Promise<boolean>`

```ts
if (await hasServiceVersion('audio', '1.0.0')) {
  // Audio v1.0.0 features available
}
```

### nappState

Async localStorage-like API for sandboxed napplets. All operations are proxied through the shell and scoped by napplet identity -- napplets cannot read each other's data. Each napplet has a 512 KB quota enforced by the shell.

#### nappState.getItem(key: string): Promise\<string | null\>

Retrieve a stored value. Returns `null` if the key does not exist.

```ts
const value = await nappState.getItem('my-key');
```

#### nappState.setItem(key: string, value: string): Promise\<void\>

Store a key-value pair. Throws if the 512 KB quota is exceeded.

```ts
await nappState.setItem('my-key', 'my-value');
```

#### nappState.removeItem(key: string): Promise\<void\>

Remove a stored key.

```ts
await nappState.removeItem('my-key');
```

#### nappState.clear(): Promise\<void\>

Remove all stored data for this napplet. Does not affect other napplets.

```ts
await nappState.clear();
```

#### nappState.keys(): Promise\<string[]\>

List all keys stored by this napplet.

```ts
const allKeys = await nappState.keys();
```

## Types

```ts
import type { NostrEvent, NostrFilter, Subscription, EventTemplate, ServiceInfo } from '@napplet/shim';
```

| Type | Description |
|------|-------------|
| `NostrEvent` | Standard NIP-01 Nostr event |
| `NostrFilter` | NIP-01 subscription filter |
| `Subscription` | Handle with `close()` method |
| `EventTemplate` | Unsigned event for `publish()` (`kind`, `content`, `tags`, `created_at`) |
| `ServiceInfo` | Service descriptor from `discoverServices()`: `{ name: string; version: string; description?: string }` |

## Protocol Reference

- [Napplet Shell Protocol Specification](../../SPEC.md)
- [NIP-5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) -- Nsite specification
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) -- Basic protocol flow

## License

MIT
