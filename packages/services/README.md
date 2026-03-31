# @napplet/services

> Reference service implementations for the napplet protocol.

## Getting Started

### Prerequisites

- `@napplet/runtime` (for the `ServiceHandler` interface)
- A runtime instance created via `createRuntime()` from `@napplet/runtime`

### How It Works

1. Create a service handler by calling a factory function (e.g., `createAudioService()`)
2. Register the handler with the runtime via `RuntimeHooks.services` at creation time, or call `runtime.registerService()` dynamically
3. The runtime automatically routes matching NIP-01 messages to the handler's `handleMessage()` method
4. Napplets discover available services by subscribing to kind 29010 — the runtime handles discovery automatically

### Installation

```bash
npm install @napplet/services @napplet/runtime
```

## Quick Start

```ts
import { createAudioService, createNotificationService } from '@napplet/services';
import type { AudioSource, Notification } from '@napplet/services';

const audio = createAudioService({ onChange: (sources) => updateUI(sources) });
const notifications = createNotificationService({ onChange: (list) => updateBadge(list) });

runtime.registerService('audio', audio);
runtime.registerService('notifications', notifications);
```

Or use `RuntimeHooks.services` at creation time:

```ts
const runtime = createRuntime({
  // ... other hooks ...
  services: {
    audio: createAudioService({ onChange: updateAudioUI }),
    notifications: createNotificationService({ onChange: updateNotificationBadge }),
  },
});
```

## API Reference

## User-Facing Services

These services manage napplet-created state and surface it to the shell host UI via callbacks.

### createAudioService(options?)

Tracks active audio sources per napplet window. Napplets announce audio state via `audio:*` topic events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `AudioServiceOptions` | Optional configuration |
| `options.onChange` | `(sources: ReadonlyMap<string, AudioSource>) => void` | Called when the audio source registry changes |

Returns: `ServiceHandler` registered as `'audio'`

```ts
import { createAudioService } from '@napplet/services';
import type { AudioSource } from '@napplet/services';

const audioService = createAudioService({
  onChange: (sources) => {
    for (const [windowId, source] of sources) {
      console.log(`${source.title} (${source.muted ? 'muted' : 'playing'})`);
    }
  },
});

runtime.registerService('audio', audioService);
```

Audio topics the service handles:

| Topic | Direction | Description |
|-------|-----------|-------------|
| `audio:register` | napplet → shell | Register an audio source (content: `{ nappClass, title }`) |
| `audio:unregister` | napplet → shell | Unregister the napplet's audio source |
| `audio:state-changed` | napplet → shell | Update audio source metadata (content: `{ title }`) |
| `audio:mute` | napplet → shell | Mute/unmute a window (content: `{ windowId?, muted }`) |
| `napp:audio-muted` | shell → napplet | Mute state notification sent back to napplet (content: `{ muted }`) |

### createNotificationService(options?)

Tracks notifications created by napplet windows. The shell host controls presentation via the `onChange` callback.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `NotificationServiceOptions` | Optional configuration |
| `options.onChange` | `(notifications: readonly Notification[]) => void` | Called when notifications change |
| `options.maxPerWindow` | `number` | Max notifications to retain per window. Default: 100. Oldest evicted on overflow. |

Returns: `ServiceHandler` registered as `'notifications'`

```ts
import { createNotificationService } from '@napplet/services';

const notifService = createNotificationService({
  onChange: (list) => {
    const unread = list.filter(n => !n.read);
    updateBadge(unread.length);
  },
  maxPerWindow: 50,
});

runtime.registerService('notifications', notifService);
```

Notification topics:

| Topic | Direction | Description |
|-------|-----------|-------------|
| `notifications:create` | napplet → shell | Create a notification (content: `{ title, body }`) |
| `notifications:dismiss` | napplet → shell | Dismiss a notification (content: `{ id }`) |
| `notifications:read` | napplet → shell | Mark a notification as read (content: `{ id }`) |
| `notifications:list` | napplet → shell | Request the current notification list |
| `notifications:created` | shell → napplet | Acknowledgment with assigned ID (content: `{ id }`) |
| `notifications:listed` | shell → napplet | Response with notification list (content: `{ notifications }`) |

## Infrastructure Services

These services wrap existing shell capabilities (relay pool, local cache, signer) as `ServiceHandler` implementations, making them available to the service registry.

### createSignerService(options)

Wraps a signer into a `ServiceHandler` that handles kind 29001 signer requests and responds with kind 29002 result events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.getSigner` | `() => RuntimeSigner \| null` | Returns the current signer, or null if unavailable |
| `options.onConsentNeeded?` | `(request) => void` | Called for destructive signing kinds (0, 3, 5, 10002) — present consent UI and call `resolve(allowed)` |

Returns: `ServiceHandler` registered as `'signer'`

```ts
import { createSignerService } from '@napplet/services';

const signerService = createSignerService({
  getSigner: () => window.nostr ?? null,
  onConsentNeeded: ({ event, resolve }) => {
    const allowed = confirm(`Allow signing kind ${event.kind}?`);
    resolve(allowed);
  },
});

runtime.registerService('signer', signerService);
```

### createRelayPoolService(options)

Wraps a relay pool as a `ServiceHandler` that handles REQ and EVENT messages, managing subscription lifecycle.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.subscribe` | `(filters, callback, urls?) => { unsubscribe() }` | Subscribe to relay events |
| `options.publish` | `(event) => void` | Publish an event to relays |
| `options.selectRelayTier` | `(filters) => string[]` | Select relay URLs for given filters |
| `options.isAvailable` | `() => boolean` | Whether the relay pool is connected |

Returns: `ServiceHandler` registered as `'relay'` or `'relay-pool'`

```ts
import { createRelayPoolService } from '@napplet/services';

const relayPoolService = createRelayPoolService({
  subscribe: (filters, cb, urls) => myPool.subscribe(filters, cb, urls),
  publish: (event) => myPool.publish(event),
  selectRelayTier: (filters) => myPool.selectRelays(filters),
  isAvailable: () => myPool.connected,
});

runtime.registerService('relay', relayPoolService);
```

### createCacheService(options)

Wraps a local event cache as a `ServiceHandler`. Cache subscriptions are one-shot queries — REQ triggers a query and immediate EOSE.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.query` | `(filters) => Promise<NostrEvent[]>` | Query cached events |
| `options.store` | `(event) => void` | Store an event. Best-effort. |
| `options.isAvailable` | `() => boolean` | Whether the cache is ready |

Returns: `ServiceHandler` registered as `'cache'`

```ts
import { createCacheService } from '@napplet/services';

const cacheService = createCacheService({
  query: (filters) => myIndexedDB.query(filters),
  store: (event) => myIndexedDB.store(event),
  isAvailable: () => true,
});

runtime.registerService('cache', cacheService);
```

### createCoordinatedRelay(options)

Composite service that combines a relay pool and local cache. Handles REQ by querying both sources, deduplicating events by ID, and sending a unified EOSE.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.relayPool` | `RelayPoolServiceOptions` | Relay pool implementation |
| `options.cache` | `CacheServiceOptions` | Local cache implementation |
| `options.eoseTimeoutMs?` | `number` | EOSE fallback timeout. Default: 15000ms |

Returns: `ServiceHandler` registered as `'relay'` (replaces separate relay and cache services)

```ts
import { createCoordinatedRelay } from '@napplet/services';

const relay = createCoordinatedRelay({
  relayPool: {
    subscribe: (f, cb, urls) => pool.subscribe(f, cb, urls),
    publish: (e) => pool.publish(e),
    selectRelayTier: (f) => pool.selectRelays(f),
    isAvailable: () => pool.connected,
  },
  cache: {
    query: (f) => db.query(f),
    store: (e) => db.store(e),
    isAvailable: () => db.ready,
  },
});

runtime.registerService('relay', relay);
```

## Types

```ts
import type {
  AudioSource, AudioServiceOptions,
  Notification, NotificationServiceOptions,
} from '@napplet/services';

import type {
  SignerServiceOptions,
  RelayPoolServiceOptions,
  CacheServiceOptions,
  CoordinatedRelayOptions,
} from '@napplet/services';
```

| Type | Description |
|------|-------------|
| `AudioSource` | Active audio source — `windowId`, `nappClass`, `title`, `muted` |
| `AudioServiceOptions` | Options for `createAudioService()` — `onChange` callback |
| `Notification` | Notification entry — `id`, `windowId`, `title`, `body`, `read`, `createdAt` |
| `NotificationServiceOptions` | Options for `createNotificationService()` — `onChange`, `maxPerWindow` |
| `SignerServiceOptions` | Options for `createSignerService()` — `getSigner`, `onConsentNeeded` |
| `RelayPoolServiceOptions` | Options for `createRelayPoolService()` — subscribe, publish, selectRelayTier, isAvailable |
| `CacheServiceOptions` | Options for `createCacheService()` — query, store, isAvailable |
| `CoordinatedRelayOptions` | Options for `createCoordinatedRelay()` — relayPool, cache, eoseTimeoutMs |

## Integration Note

All service factories return `ServiceHandler` from `@napplet/runtime`. Services are registered with the runtime via `runtime.registerService(name, handler)` or `RuntimeHooks.services`. Napplets discover registered services via kind 29010 — see `@napplet/runtime` for the discovery protocol details.

## Protocol Reference

- [Napplet Shell Protocol Specification](../../SPEC.md)
- [@napplet/runtime](../runtime/README.md) — service registration and kind 29010 discovery

## License

MIT
