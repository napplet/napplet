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
3. Once authenticated, use `subscribe`, `publish`, `query`, `emit`, `on`, and `nappStorage` to interact with Nostr relays and other napplets

The shim also installs a `window.nostr` NIP-07 compatible interface that routes signing requests through the shell's signer proxy.

## Installation

```bash
npm install @napplet/shim nostr-tools
```

## Quick Start

```ts
import { subscribe, publish, on, nappStorage } from '@napplet/shim';

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
await nappStorage.setItem('theme', 'dark');
const theme = await nappStorage.getItem('theme'); // 'dark'

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

### nappStorage

Async localStorage-like API for sandboxed napplets. All operations are proxied through the shell and scoped by napplet identity -- napplets cannot read each other's data. Each napplet has a 512 KB quota enforced by the shell.

#### nappStorage.getItem(key: string): Promise\<string | null\>

Retrieve a stored value. Returns `null` if the key does not exist.

```ts
const value = await nappStorage.getItem('my-key');
```

#### nappStorage.setItem(key: string, value: string): Promise\<void\>

Store a key-value pair. Throws if the 512 KB quota is exceeded.

```ts
await nappStorage.setItem('my-key', 'my-value');
```

#### nappStorage.removeItem(key: string): Promise\<void\>

Remove a stored key.

```ts
await nappStorage.removeItem('my-key');
```

#### nappStorage.clear(): Promise\<void\>

Remove all stored data for this napplet. Does not affect other napplets.

```ts
await nappStorage.clear();
```

#### nappStorage.keys(): Promise\<string[]\>

List all keys stored by this napplet.

```ts
const allKeys = await nappStorage.keys();
```

## Types

```ts
import type { NostrEvent, NostrFilter, Subscription, EventTemplate } from '@napplet/shim';
```

| Type | Description |
|------|-------------|
| `NostrEvent` | Standard NIP-01 Nostr event |
| `NostrFilter` | NIP-01 subscription filter |
| `Subscription` | Handle with `close()` method |
| `EventTemplate` | Unsigned event for `publish()` (`kind`, `content`, `tags`, `created_at`) |

## Protocol Reference

- [Napplet Shell Protocol Specification](../../SPEC.md)
- [NIP-5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) -- Nsite specification
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) -- Basic protocol flow

## License

MIT
