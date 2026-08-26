# @napplet/sdk

> Named TypeScript exports for napplet developers using a bundler. Wraps
> `window.napplet` at call time.

`@napplet/sdk` gives napplet code typed, named imports that delegate to injected
`window.napplet.*` counterparts. It depends on [`@napplet/core`](./core) for
types only and has **no side effects**. If a method is called before the runtime
injected `window.napplet`, or before that domain is available, the SDK throws a
clear error.

- **npm:** [`@napplet/sdk`](https://www.npmjs.com/package/@napplet/sdk)
- **JSR:** [`@napplet/sdk`](https://jsr.io/@napplet/sdk)
- **Source:** [packages/sdk](https://github.com/napplet/napplet/tree/main/packages/sdk)

## Install

```bash
npm install @napplet/sdk
```

## Key exports

Top-level namespaced objects that mirror `window.napplet`:

- **`outbox`** — `getEvent`, `query`, `subscribe`, `publish`, `resolveRelays`
- **`common`** — profile lookup, follow/unfollow, reactions, reports, NIP-19 helpers
- **`lists`** — NIP-51 list read and mutation helpers
- **`count`** — count queries through the shell
- **`dm`** — shell-mediated encrypted direct-message helpers
- **`relay`** — low-level explicit relay proxy; use only for relay-local escape hatches
- **`inc`** — `emit`, `on` (plus deprecated `ifc*` migration aliases)
- **`intent`** — `invoke`, `open`, `available`, `handlers`, `onChanged`
- **`storage`** — `getItem`, `setItem`, `removeItem`, `keys`, plus `storage.instance.*` (per-instance scope)
- **`keys`** — `registerAction`, `unregisterAction`, `onAction`
- **`media`** — `createSession`, `reportState`, `onCommand`, …
- **`notify`** — `send`, `badge`, `onAction`, …
- **`config`** — `get`, `subscribe`, `openSettings`, `registerSchema`, `schema`
- **`resource`** — `info`, `bytes`, `bytesMany`, `bytesAsObjectURL`

`identity` is exported as a top-level object and through bare-name helpers:

- `identityGetPublicKey`, `identityOnChanged`

There is no top-level `shell` object. Detect capability availability from
runtime-injected domain presence (`window.napplet?.outbox`, `window.napplet?.dm`,
and so on).

The SDK also re-exports:

- the `*_DOMAIN` constants and `install*Shim` installers
- `resourceInfo`, `resourceBytes`, `resourceBytesMany`, `resourceBytesAsObjectURL`

It also re-exports the protocol types from `@napplet/core` and the per-domain
message-type unions (`RelayNapMessage`, `IdentityNapMessage`, …) and `*_DOMAIN`
constants from the NAP packages.

## Usage

```ts
import { outbox, common, inc, intent, storage, keys, config, resource } from '@napplet/sdk';

// Read kind 1 notes through outbox-aware routing
const { events } = await outbox.query(
  [{ kinds: [1], limit: 20 }],
  { timeoutMs: 3000 },
);
for (const result of events) console.log('Note:', result.event.content);

// Subscribe to live updates through the same outbox boundary
const sub = outbox.subscribe([{ kinds: [1], limit: 20 }], { timeoutMs: 3000 });
sub.on('event', (result) => console.log('New note:', result.event.content));

// Publish a signed note through the user's outbox/write relays
const published = await outbox.publish({
  kind: 1,
  content: 'Hello from my napplet!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});
if (!published.ok || !published.event) throw new Error(published.error ?? 'publish failed');

// Common social actions keep consent, event construction, signing, and relay routing in the shell
await common.react(published.event.id, '+');

// Inter-napplet messaging: payload is a local convention choice.
inc.emit('chat:message', { text: 'hi' });

const intentResult = await intent.open(
  'profile',
  { pubkey: 'abc123' },
  { convention: 'napplet:profile/open' },
);
if (!intentResult.ok || !intentResult.handled) throw new Error(intentResult.error);

// Scoped storage
await storage.setItem('theme', 'dark');

// Live per-napplet config
const configSub = config.subscribe((values) => applyTheme(values.theme));

// Fetch external bytes through the shell
const avatarBlob = await resource.bytes('blossom:sha256:abc123...', {
  servers: ['https://cdn.hzrd149.com'],
});
const avatarItems = await resource.bytesMany([
  { url: 'https://example.com/avatar.png' },
  { url: 'blossom:sha256:abc123...', servers: ['https://cdn.hzrd149.com'] },
]);
```

### INC convention URIs

`inc.emit(topic, payload?)` accepts a queried convention URI at the INC
developer boundary. The binding transposes a call such as
`inc.emit('napplet:profile/open?pubkey=abc123')` into the queryless stable topic
`napplet:profile/open` plus a shallow decoded text payload. `pubkey` is a local
convention choice; receiving code owns payload validation.

Subscribe using the stable topic, not the queried developer-facing URI:

```ts
inc.emit('napplet:profile/open?pubkey=abc123');
const profileOpen = inc.on('napplet:profile/open', (event) => {
  validateProfileOpenPayload(event.payload);
});
```

Routing remains exact after transposition, with no query-aware, prefix, or
wildcard matching. Fragments, malformed percent encoding, repeated decoded
names, and a query combined with an explicit payload reject before emission.
Manifest convention values and normalized wire identities stay queryless.

### Intent dispatch

Use `intent.invoke(request)` or `intent.open(archetype, payload?, opts?)`.

```ts
const result = await intent.open(
  'profile',
  { pubkey: 'abc123' },
  { convention: 'napplet:profile/open', behavior: { newWindow: true } },
);
if (!result.handled) throw new Error(result.error);
```

Results contain required `ok`, `archetype`, `action`, and `handled` fields plus
optional handler, window, convention, and error details.

These APIs defer to the living [NAP-INC](https://github.com/napplet/naps/blob/master/naps/NAP-INC.md) and [NAP-INTENT](https://github.com/napplet/naps/blob/master/naps/NAP-INTENT.md) documents.

### Typed config with `FromSchema`

`json-schema-to-ts` is an **optional** peer dependency. Install it to get
`FromSchema<typeof schema>` typing flowing into your `config.subscribe` callback;
skip it and `config.subscribe` still works with the default
`Record<string, unknown>` typing.

```ts
import { config } from '@napplet/sdk';
import type { FromSchema } from 'json-schema-to-ts';

const schema = {
  type: 'object',
  properties: { theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' } },
  required: ['theme'],
} as const;

const sub = config.subscribe((values: FromSchema<typeof schema>) => {
  // values.theme is typed 'light' | 'dark'
});
```

## Namespace import

`import * as napplet from '@napplet/sdk'` produces an object structurally
identical to `window.napplet`:

```ts
import * as napplet from '@napplet/sdk';
const { events } = await napplet.outbox.query([{ kinds: [1], limit: 20 }]);
```

## See also

- [Runtime injection vs. SDK](/guide/getting-started#runtime-injection-vs-sdk)
- [`@napplet/shim`](./shim) — runtime-side injected global installer
