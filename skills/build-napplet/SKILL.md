---
name: build-napplet
description: Use when writing a napplet (sandboxed Nostr iframe app) using @napplet/shim — covers Vite project setup, NIP-5A manifest plugin, subscribe/publish/query relay API, scoped storage, inter-frame events, and the v0.28.0 resource NUB for sandboxed byte fetching (replaces direct fetch / <img src=externalUrl>, both of which the iframe CSP blocks)
---

# Building a Napplet with @napplet/shim

## Overview

A napplet is a sandboxed iframe app that communicates with a host shell via postMessage using NIP-01 wire format. The shim (`@napplet/shim`) provides the full client-side API — relay subscriptions, event signing proxy, scoped storage, and inter-frame messaging. The iframe runs without `allow-same-origin`; all host access is proxied over postMessage. The napplet never holds private keys — signing is delegated to the shell signer.

## Prerequisites

- Node.js 18+, pnpm (or npm/yarn)
- A Vite-based project (`pnpm create vite`)
- A host shell that implements the napplet protocol (NIP-5D)

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

## Step 8 — Inter-frame events (emit / on)

Inter-frame events let napplets communicate with each other through the shell. `window.napplet.ifc.emit()` broadcasts to all topic subscribers; `window.napplet.ifc.on()` subscribes to a specific topic.

```ts
import '@napplet/shim';
// or: import { ifc } from '@napplet/sdk';

// Broadcast an event to all napplets subscribed to 'profile:open'
window.napplet.ifc.emit('profile:open', [], JSON.stringify({ pubkey: '3bf0c63...' }));

// Subscribe to inter-frame events on a topic
const sub = window.napplet.ifc.on('profile:open', (payload: unknown) => {
  const { pubkey } = payload as { pubkey: string };
  console.log('Profile open requested for:', pubkey);
});

// Unsubscribe when done
sub.close();
```

The `emit()` signature: `emit(topic: string, extraTags?: string[][], content?: string): void`.

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

## Step 10 — Fetch external bytes (resource NUB, v0.28.0+)

The iframe sandbox (no `allow-same-origin`) plus strict CSP (`connect-src 'none'`) means `fetch()`, `<img src="https://...">`, `XMLHttpRequest`, and `new WebSocket(...)` are all blocked by the browser. Any external bytes — avatars, blossom-served images, NIP-19 resource resolution — flow through the shell via the resource NUB.

```ts
import '@napplet/shim';

// Fetch any URL the shell accepts. Returns a Blob.
const blob: Blob = await window.napplet.resource.bytes('https://example.com/avatar.png');
const objectUrl = URL.createObjectURL(blob);
imgEl.src = objectUrl;
// remember to URL.revokeObjectURL(objectUrl) when done

// Or use the synchronous handle helper:
const handle = window.napplet.resource.bytesAsObjectURL('blossom:sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
imgEl.src = handle.url;            // populated once the underlying fetch resolves
// later
handle.revoke();
```

Four canonical schemes are supported:

| Scheme | Example | Resolution |
|--------|---------|------------|
| `data:` | `data:image/png;base64,iVBORw0KGgo...` | Decoded in the napplet shim — zero shell round-trip |
| `https:` | `https://example.com/avatar.png` | Shell-side network fetch under policy (private-IP block at DNS time, MIME byte-sniffing, size cap, timeout, rate limit, redirect cap) |
| `blossom:sha256:<hex>` | `blossom:sha256:e3b0c44...` | Blossom hash → bytes; shell verifies hash before delivery |
| `nostr:<bech32>` | `nostr:nprofile1...` | Single-hop NIP-19 resolution against the shell's relay pool |

**Cancellation:** Pass an `AbortSignal` to cancel an in-flight fetch:

```ts
const ctrl = new AbortController();
const promise = window.napplet.resource.bytes(url, { signal: ctrl.signal });
ctrl.abort();   // sends resource.cancel to the shell; promise rejects with AbortError
```

**Errors:** The Promise rejects with an Error whose `code` is one of:
`not-found`, `blocked-by-policy`, `timeout`, `too-large`, `unsupported-scheme`, `decode-failed`, `network-error`, `quota-exceeded`.

Always branch on `code`, never on the `error` string.

**Capability detection:**

```ts
if (window.napplet.shell.supports('nub:resource')) {
  // resource.bytes(url) is available
}
if (window.napplet.shell.supports('resource:scheme:blossom')) {
  // blossom: scheme is available specifically
}
if (window.napplet.shell.supports('perm:strict-csp')) {
  // shell enforces strict CSP — direct fetch / <img src=externalUrl> WILL be blocked
}
```

SVG inputs are silently rasterized server-side to PNG/WebP — napplets never receive `image/svg+xml` bytes (the shell rasterizes in a sandboxed Worker with no network access). The `mime` returned to the napplet is shell-classified via byte-sniffing, never the upstream `Content-Type` header.

## Common pitfalls

- Do not call `window.nostr` before `@napplet/shim` is imported — it is installed synchronously at module load, but all signer calls are async and require the AUTH handshake to complete first.
- `nappletState` is scoped by version hash — clearing storage in one build version does not affect another build's stored data.
- Do not use `localStorage` directly — without `allow-same-origin` it will throw `SecurityError`. Use `nappletState` instead.
- `publish()` returns `Promise<NostrEvent>` — always `await` it. Errors surface as promise rejections (e.g., signer timeout, ACL denial).
- `query()` resolves after EOSE — it is a one-shot snapshot, not a live stream. Use `subscribe()` for live updates.
- `discoverServices()` results are session-cached. To refresh, the page must reload.
- `window.napplet.ifc.emit()` does not return a value and does not confirm delivery. Use inter-frame `window.napplet.ifc.on()` subscriptions for acknowledgment patterns.
- The `on()` callback receives `(payload: unknown, event: NostrEvent)` — always type-check `payload` before accessing properties.
- **Do not call `fetch()`, `<img src="https://...">`, `<link href="https://...">`, `XMLHttpRequest`, or `new WebSocket(...)` from a napplet.** The iframe sandbox + strict CSP (`connect-src 'none'`, `img-src blob: data:`) block all of them at the browser level. Use `window.napplet.resource.bytes(url)` instead — it returns a `Blob` you can pass to `URL.createObjectURL()` for `<img src>` use.
- **Do not use the upstream `Content-Type` for resource MIME decisions.** The shell byte-sniffs the response and delivers a classified `mime` field on the result; the upstream `Content-Type` header is attacker-controlled and never reaches the napplet.
