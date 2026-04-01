---
name: build-napplet
description: Use when writing a napplet (sandboxed Nostr iframe app) using @napplet/shim — covers Vite project setup, NIP-5A manifest plugin, subscribe/publish/query relay API, nappStorage, window.nostr NIP-07 proxy, inter-pane events, and service discovery
---

# Building a Napplet with @napplet/shim

## Overview

A napplet is a sandboxed iframe app that communicates with a host shell via postMessage using NIP-01 wire format. The shim (`@napplet/shim`) provides the full client-side API — relay subscriptions, event signing proxy, scoped storage, and inter-pane messaging. The iframe runs without `allow-same-origin`; all host access is proxied over postMessage. The napplet never holds private keys — signing is delegated to the shell signer.

## Prerequisites

- Node.js 18+, pnpm (or npm/yarn)
- A Vite-based project (`pnpm create vite`)
- A host shell running `@napplet/shell` (or a test harness that implements the NIP-01 postMessage protocol)

## Step 1 — Install dependencies

```bash
pnpm add @napplet/shim
pnpm add -D @napplet/vite-plugin
```

## Step 2 — Configure the Vite plugin

The vite plugin injects a `<meta name="napplet-aggregate-hash">` tag at build time, which the shim uses for version-scoped storage and ACL. The `nappletType` option is required.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  plugins: [
    nip5aManifest({
      nappletType: 'my-napplet',
      // requires: ['audio', 'notifications'], // optional: declared service dependencies
    }),
  ],
});
```

Set `VITE_DEV_PRIVKEY_HEX` env var to a hex-encoded 32-byte private key to produce signed NIP-5A manifests in CI. Dev builds work without it — the aggregate hash is still computed and injected.

## Step 3 — Subscribe to relay events

Import `subscribe` from `@napplet/shim`. The subscription is a live stream; use `sub.close()` to unsubscribe.

```ts
import { subscribe } from '@napplet/shim';
import type { NostrEvent } from '@napplet/shim';

const myPubkey = await window.nostr.getPublicKey();

const sub = subscribe(
  { kinds: [1], authors: [myPubkey], limit: 20 },
  (event: NostrEvent) => {
    console.log('New note:', event.content);
  },
  () => {
    console.log('EOSE — initial events loaded');
  },
);

// Later, when the component is destroyed:
sub.close();
```

## Step 4 — Publish an event

Import `publish` from `@napplet/shim`. Signing is delegated to the shell signer — the napplet never holds private keys. Always `await` the call.

```ts
import { publish } from '@napplet/shim';

const signed = await publish({
  kind: 1,
  content: 'Hello from a napplet!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});

console.log('Published event id:', signed.id);
```

## Step 5 — Query cached events

`query()` is a one-shot snapshot — it collects events until EOSE, then resolves. Use `subscribe()` for live updates.

```ts
import { query } from '@napplet/shim';

const events = await query({ kinds: [1], limit: 50 });
console.log(`Loaded ${events.length} notes from cache`);
```

## Step 6 — Use nappletState

Import `nappletState` from `@napplet/shim`. Storage is scoped by `nappletType:aggregateHash` — different napplet versions have isolated storage namespaces. Do not use `localStorage` directly (it throws `SecurityError` without `allow-same-origin`).

```ts
import { nappletState } from '@napplet/shim';

// Store a string value
await nappletState.setItem('last-seen', Date.now().toString());

// Retrieve a value (returns string | null)
const raw = await nappletState.getItem('last-seen');
const lastSeen = raw ? Number(raw) : 0;

// Store objects using JSON.stringify / JSON.parse
await nappletState.setItem('settings', JSON.stringify({ theme: 'dark', fontSize: 14 }));
const raw2 = await nappletState.getItem('settings');
const settings = raw2 ? JSON.parse(raw2) : {};

// Remove a key
await nappletState.removeItem('last-seen');
```

Additional methods: `nappletState.clear()` (removes all keys for this napplet), `nappletState.keys()` (returns all stored keys as `string[]`).

> **Deprecated aliases:** `nappStorage` and `nappState` are deprecated aliases for `nappletState`. They will be removed in v0.9.0.

## Step 7 — Use window.nostr (NIP-07 proxy)

`@napplet/shim` installs `window.nostr` automatically on import — no additional setup required. The private key never leaves the shell; all signing calls are proxied over postMessage.

```ts
// window.nostr is available immediately after importing @napplet/shim

// Get the user's public key
const pubkey: string = await window.nostr.getPublicKey();

// Sign an event (returns the signed NostrEvent)
const signed = await window.nostr.signEvent({
  kind: 1,
  content: 'Hello Nostr!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});

// NIP-04 encrypted DMs
const ciphertext = await window.nostr.nip04.encrypt(recipientPubkey, 'secret message');
const plaintext = await window.nostr.nip04.decrypt(senderPubkey, ciphertext);

// NIP-44 encryption
const encrypted = await window.nostr.nip44.encrypt(recipientPubkey, 'payload');
const decrypted = await window.nostr.nip44.decrypt(senderPubkey, encrypted);
```

## Step 8 — Inter-pane events (emit / on)

Inter-pane events let napplets communicate with each other through the shell. `emit()` broadcasts to all subscribers; `on()` subscribes to a specific topic.

```ts
import { emit, on } from '@napplet/shim';

// Broadcast an event to all napplets subscribed to 'profile:open'
emit('profile:open', [], JSON.stringify({ pubkey: '3bf0c63...' }));

// Subscribe to inter-pane events on a topic
const sub = on('profile:open', (payload: unknown) => {
  const { pubkey } = payload as { pubkey: string };
  console.log('Profile open requested for:', pubkey);
});

// Unsubscribe when done
sub.close();
```

The `emit()` signature: `emit(topic: string, extraTags: string[][] = [], content: string = '')`.

## Step 9 — Service discovery

Services are shell-side handlers that napplets communicate with via topic events. Discover what the shell provides before using service-specific APIs.

```ts
import { discoverServices, hasService, hasServiceVersion } from '@napplet/shim';

// List all available services
const services = await discoverServices();
// [{ name: 'audio', version: '1.0.0', description: '...' }, ...]

// Check if a specific service is available
if (await hasService('audio')) {
  // Safe to use audio service APIs
  emit('audio:register', [], JSON.stringify({ nappletClass: 'media-player', title: 'My Player' }));
}

// Check for a specific version
if (await hasServiceVersion('audio', '1.0.0')) {
  // Audio v1.0.0 features are available
}
```

`discoverServices()` results are session-cached — subsequent calls return the same array without a network round-trip. Cache is cleared on page reload.

## Common pitfalls

- Do not call `window.nostr` before `@napplet/shim` is imported — it is installed synchronously at module load, but all signer calls are async and require the AUTH handshake to complete first.
- `nappletState` is scoped by version hash — clearing storage in one build version does not affect another build's stored data.
- Do not use `localStorage` directly — without `allow-same-origin` it will throw `SecurityError`. Use `nappletState` instead.
- `publish()` returns `Promise<NostrEvent>` — always `await` it. Errors surface as promise rejections (e.g., signer timeout, ACL denial).
- `query()` resolves after EOSE — it is a one-shot snapshot, not a live stream. Use `subscribe()` for live updates.
- `discoverServices()` results are session-cached. To refresh, the page must reload.
- `emit()` does not return a value and does not confirm delivery. Use inter-pane `on()` subscriptions for acknowledgment patterns.
- The `on()` callback receives `(payload: unknown, event: NostrEvent)` — always type-check `payload` before accessing properties.
