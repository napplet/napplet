# @napplet/nub-config

> TypeScript message types, shim, and SDK helpers for the config NUB domain (per-napplet declarative configuration, JSON Schema-driven).

## Installation

```bash
npm install @napplet/nub-config
```

## Overview

NUB-CONFIG provides per-napplet declarative configuration. A napplet declares a JSON Schema describing its config surface (at build time via `@napplet/vite-plugin`, or at runtime via `config.registerSchema`); the shell renders the settings UI, validates and persists values scoped by `(dTag, aggregateHash)`, and delivers live validated + defaulted values back to the napplet via snapshot + push.

Key features:

1. **Schema-driven** -- napplet declares a JSON Schema (manifest or runtime); shell is the validator of record
2. **Shell is sole writer** -- napplets read and subscribe only; no `config.set` wire message exists
3. **Scoped storage** -- values keyed by `(dTag, aggregateHash)` per NIP-5D, giving per-type and per-version isolation
4. **Live push stream** -- initial snapshot + updates on change, full-object delivery (no diffs)
5. **Deep-linkable settings UI** -- `config.openSettings({ section })` asks the shell to open its settings UI scrolled to a named section
6. **Manifest-driven** -- `@napplet/vite-plugin` embeds the schema in the NIP-5A manifest and injects `<meta name="napplet-config-schema">` so the shim reads it synchronously at install time
7. **Core Subset validated at build + registerSchema time** -- `pattern`, `$ref`, and `x-napplet-secret` combined with `default` are rejected by both the vite-plugin and the shell

## Message Types

All messages use the NIP-5D JSON envelope wire format (`{ type: "config.<action>", ...payload }`).

### Napplet -> Shell

| Type | Payload | Description |
|------|---------|-------------|
| `config.registerSchema` | `id`, `schema`, `version?` | Register a schema at runtime (correlated by `id`) |
| `config.get` | `id` | Request current validated + defaulted values (correlated by `id`) |
| `config.subscribe` | *(none)* | Start live push stream (ref-counted; wire-level fires on 0->1) |
| `config.unsubscribe` | *(none)* | Stop live push stream (ref-counted; wire-level fires on 1->0) |
| `config.openSettings` | `section?` | Ask the shell to open its settings UI (fire-and-forget) |

### Shell -> Napplet

| Type | Payload | Description |
|------|---------|-------------|
| `config.registerSchema.result` | `id`, `ok`, `code?`, `error?` | Positive ACK or schema-rejection reason |
| `config.values` | `id?`, `values` | Dual-use: correlated response to `config.get` OR push on subscription |
| `config.schemaError` | `code`, `error` | Uncorrelated error push (manifest parse failure, `no-schema`, etc.) |

## Usage

```ts
import type {
  ConfigRegisterSchemaMessage,
  ConfigValuesMessage,
  ConfigNubMessage,
  NappletConfigSchema,
  ConfigValues,
  ConfigSchemaErrorCode,
} from '@napplet/nub-config';

import { DOMAIN } from '@napplet/nub-config';
// DOMAIN === 'config'
```

### Manifest-driven schema (recommended)

Declare the schema once in `vite.config.ts` via `@napplet/vite-plugin`'s `configSchema` option. The plugin embeds the schema in the kind 35128 NIP-5A manifest as a `['config', JSON.stringify(schema)]` tag and writes a `<meta name="napplet-config-schema">` tag into the built `index.html` head so the shim reads it synchronously at napplet startup.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  plugins: [
    nip5aManifest({
      nappletType: 'com.example.weather',
      configSchema: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark'], default: 'dark', title: 'Theme' },
          pollIntervalSeconds: { type: 'integer', minimum: 10, maximum: 3600, default: 60 },
        },
        required: ['theme'],
      },
    }),
  ],
});
```

No further wiring is required -- the shim reads the embedded schema before the napplet's first microtask runs, so `window.napplet.config.schema` is populated the moment your code starts executing.

### Runtime schema (escape hatch)

For schemas that genuinely cannot be known at build time (user-driven plugin surfaces, data-driven configuration discovery), call `registerSchema` at runtime and await the positive ACK before relying on the schema.

```ts
import { registerSchema } from '@napplet/nub-config';

await registerSchema({
  type: 'object',
  properties: {
    theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' },
    pollIntervalSeconds: { type: 'integer', minimum: 10, maximum: 3600, default: 60 },
  },
  required: ['theme'],
}, 1);
// Promise resolves on config.registerSchema.result { ok: true }
// Rejects with Error(code + ': ' + message) on { ok: false }
```

### Shim API

```ts
import {
  get,
  subscribe,
  openSettings,
  registerSchema,
  onSchemaError,
} from '@napplet/nub-config';

// One-shot snapshot
const values = await get();
applyTheme(values.theme);

// Live subscription (initial snapshot + push on every change)
const sub = subscribe((values) => {
  applyTheme(values.theme);
  setPollInterval(values.pollIntervalSeconds);
});

// Deep-link to a settings section
openSettings({ section: 'appearance' });

// Listen for background schema failures (manifest parse errors, no-schema, etc.)
const off = onSchemaError((err) => {
  console.error('[config]', err.code, err.error);
});

// Clean up
sub.close();
off();
```

### SDK Helpers

The aggregated `@napplet/sdk` exposes the same surface under a `config` namespace, which avoids bare-name collisions with other NUBs' SDK wrappers.

```ts
import { config } from '@napplet/sdk';

const values = await config.get();

const sub = config.subscribe((values) => {
  applyTheme(values.theme);
});

config.openSettings({ section: 'appearance' });

await config.registerSchema({
  type: 'object',
  properties: { theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' } },
}, 1);

const off = config.onSchemaError((err) => {
  console.error('[config]', err.code, err.error);
});

// Readonly accessor for the currently-registered schema
console.log(config.schema);

sub.close();
off();
```

### FromSchema type inference (opt-in)

`json-schema-to-ts` is declared as an **optional** `peerDependency`. Omit it and the subscribe callback's `values` parameter is typed as `ConfigValues` (`Record<string, unknown>`); install it and `FromSchema<typeof schema>` derives precise literal-union types from the schema itself -- no separate TypeScript interface to keep in sync.

```ts
import type { FromSchema } from 'json-schema-to-ts';
import { subscribe } from '@napplet/nub-config';

const schema = {
  type: 'object',
  properties: {
    theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' },
  },
  required: ['theme'],
} as const;

type MyConfig = FromSchema<typeof schema>;

subscribe((values: MyConfig) => {
  // values.theme is typed as 'light' | 'dark'
});
```

```bash
npm install --save-dev json-schema-to-ts
```

Without this install, `subscribe`'s callback parameter is `ConfigValues` and field access goes through the `Record<string, unknown>` index signature.

### Supporting Types

```ts
type ConfigValues = Record<string, unknown>;

type ConfigSchemaErrorCode =
  | 'invalid-schema'
  | 'pattern-not-allowed'
  | 'ref-not-allowed'
  | 'secret-with-default'
  | 'depth-exceeded'
  | 'unsupported-type'
  | 'unsupported-keyword'
  | 'no-schema';

// x-napplet-* extensions (potentialities; shell MAY honor)
interface NappletConfigSchemaExtensions {
  'x-napplet-secret'?: boolean;
  'x-napplet-section'?: string;
  'x-napplet-order'?: number;
}
```

## Core Subset

NUB-CONFIG restricts usage to a JSON Schema Core Subset defined in the spec. See the linked spec for the authoritative rules; at a glance:

- **Supported types** -- `string`, `number`, `integer`, `boolean`, `object` (top-level), `array` of primitives
- **Keywords** -- `default`, `title`, `description`, `enum`, `enumDescriptions`, `minimum`/`maximum`, `minLength`/`maxLength`
- **NOT allowed** -- `pattern` (ReDoS risk per CVE-2025-69873), `$ref` / `definitions`, `x-napplet-secret: true` combined with a `default`

Both the vite-plugin (at build time) and the shell (at `config.registerSchema` time) reject schemas that violate the subset, using the same error-code vocabulary.

## Domain Registration

The `@napplet/nub-config` barrel is side-effect-free -- no `registerNub()` call fires on import. Domain wiring happens in `@napplet/shim`'s central dispatcher, which calls `installConfigShim()` at install time and routes `config.*` messages through `handleConfigMessage()`. Consumers either cherry-pick (`import { installConfigShim } from '@napplet/nub-config'`) for custom hosts, or get the wiring transitively via `import '@napplet/shim'`.

## Protocol Reference

- [NUB-CONFIG spec (PR #13)](https://github.com/napplet/nubs/pull/13)
- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification

## License

MIT
