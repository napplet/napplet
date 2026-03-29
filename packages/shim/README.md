# @napplet/shim

Napplet SDK for building Nostr-native iframe applications.

## Install

```bash
npm install @napplet/shim
```

## Usage

```ts
import { subscribe, publish, query, emit, on, nappStorage } from '@napplet/shim';

// Subscribe to kind 1 notes
const sub = subscribe({ kinds: [1] }, (event) => {
  console.log('Got event:', event);
}, () => {
  console.log('End of stored events');
});

// One-shot query
const events = await query({ kinds: [0], authors: ['pubkey...'] });

// Publish a note
await publish({ kind: 1, content: 'Hello from napplet!', tags: [], created_at: Math.floor(Date.now() / 1000) });

// Inter-pane communication
emit('my-topic', [], JSON.stringify({ hello: 'world' }));
on('my-topic', (payload) => console.log(payload));

// Persistent storage
await nappStorage.setItem('key', 'value');
const val = await nappStorage.getItem('key');
```

## API

- `subscribe(filters, onEvent, onEose, options?)` — NIP-01 subscription through shell
- `publish(template, options?)` — Sign and publish through shell
- `query(filters)` — One-shot query (Promise-based)
- `emit(topic, extraTags?, content?)` — Broadcast inter-pane event
- `on(topic, callback)` — Subscribe to inter-pane events
- `nappStorage` — Async localStorage-like API (getItem, setItem, removeItem, clear, keys)

## License

MIT
