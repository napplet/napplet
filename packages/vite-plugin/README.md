# @napplet/vite-plugin

> Vite plugin for napplet local development -- injects aggregate hash meta tags and optionally generates NIP-5A manifests for testing.

**This is a development tool.** For production deployment of napplets to nsites, use community deploy tools like [nsyte](https://github.com/nicefarm/nsyte) which handle NIP-5A event creation and relay publishing.

## Getting Started

### What This Plugin Does

During **dev mode**, the plugin injects empty meta tags into your HTML so the napplet shim can find them:

```html
<meta name="napplet-aggregate-hash" content="">
<meta name="napplet-napp-type" content="my-napp">
```

At **build time** (with `VITE_DEV_PRIVKEY_HEX` set), the plugin:

1. Walks the `dist/` directory and computes SHA-256 of each file
2. Computes the aggregate hash per the NIP-5A algorithm
3. Creates a kind 35128 manifest event and signs it
4. Writes `.nip5a-manifest.json` to `dist/`
5. Updates the meta tag in `dist/index.html` with the computed hash
6. Injects `<meta name="napplet-config-schema">` into `dist/index.html` if a `configSchema` is declared or discovered
7. Embeds the schema as a `['config', ...]` tag on the kind 35128 manifest
8. Includes the schema bytes in `aggregateHash` via a synthetic `config:schema` path prefix

The build-time manifest is for verifying the hash computation workflow locally, not for deploying to relays.

### When to Use This

- You are building a napplet and testing locally with a shell implementation
- You want to verify aggregate hash computation before deploying

### When NOT to Use This

- Deploying napplets to production (use [nsyte](https://github.com/nicefarm/nsyte) or similar)
- Creating NIP-5A events for relay publishing (use dedicated deploy tools)
- Runtime dependencies -- this plugin runs at build/dev time only

## Installation

```bash
npm install -D @napplet/vite-plugin
```

Note: This is a **devDependency**. It is not needed at runtime.

## Quick Start

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  plugins: [
    nip5aManifest({ nappletType: 'my-napp' }),
  ],
});
```

## Configuration

### Plugin Options

#### nappletType (required)

**Type:** `string`

The napp type identifier (e.g., `'feed'`, `'chat'`, `'profile'`). This value is:

- Injected as the `content` of the `<meta name="napplet-napp-type">` tag
- Used as the `d` tag in the kind 35128 manifest event

#### requires (optional)

**Type:** `string[]`

An array of service names this napplet requires from its host shell (e.g., `['audio', 'notifications']`). When set:

- Injects a `<meta name="napplet-requires">` tag into HTML (comma-separated service names)
- Adds `['requires', 'service-name']` tags to the kind 35128 manifest event

If the shell does not support all required capabilities, the napplet can detect this at runtime via `window.napplet.shell.supports()` or the shell can show a compatibility warning.

#### configSchema (optional)

**Type:** `JSONSchema7 | string | undefined`

Declares a JSON Schema (draft-07+) describing the napplet's per-napplet configuration surface (NUB-CONFIG). At build time, the plugin:

- Validates the schema against the NUB-CONFIG Core Subset (see Build-Time Guards below)
- Embeds the schema as a `['config', JSON.stringify(schema)]` tag on the kind 35128 manifest event
- Includes the schema bytes in `aggregateHash` via a synthetic `config:schema` path prefix (any schema edit bumps the hash)
- Injects `<meta name="napplet-config-schema" content="{json}">` into `dist/index.html` so the napplet's shim can read it synchronously at install time

**Accepted forms:**

| Value | Behaviour |
|-------|-----------|
| `JSONSchema7` object | Used directly |
| `string` (path) | Resolved relative to the Vite project root; read + parsed as JSON |
| `undefined` (omitted) | Falls through to convention-file discovery |

**Discovery precedence** (when `configSchema` is not provided):

1. `options.configSchema` (inline object or path string) -- highest priority
2. `config.schema.json` at the project root -- convention file
3. `napplet.config.ts` / `napplet.config.js` / `napplet.config.mjs` at the project root, exporting a `configSchema` named export (or on the default export) -- dynamic import fallback

If none of the three paths resolve a schema, manifest/meta emission for the config tag is skipped silently -- build produces bytes identical to a pre-phase-114 napplet.

**Example (inline):**

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  plugins: [
    nip5aManifest({
      nappletType: 'my-napp',
      configSchema: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' },
          pollIntervalSeconds: { type: 'integer', minimum: 10, maximum: 3600, default: 60 },
        },
        required: ['theme'],
      },
    }),
  ],
});
```

**Example (convention file):**

```json
// config.schema.json (at project root)
{
  "type": "object",
  "properties": {
    "theme": { "type": "string", "enum": ["light", "dark"], "default": "dark" }
  },
  "required": ["theme"]
}
```

```ts
// vite.config.ts -- no configSchema option; picked up from config.schema.json
nip5aManifest({ nappletType: 'my-napp' });
```

**Example (napplet.config.ts fallback):**

```ts
// napplet.config.ts (at project root)
import type { JSONSchema7 } from 'json-schema';

export const configSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' },
  },
  required: ['theme'],
};
```

#### Build-Time Guards

The plugin validates the resolved schema against the NUB-CONFIG Core Subset at `configResolved` and throws a multi-line error (aborting the Vite build) on any of these rule violations:

| Error code | Trigger |
|------------|---------|
| `invalid-schema` | Root is not `{ type: "object", ... }` |
| `pattern-not-allowed` | Schema uses `pattern` anywhere in the tree (ReDoS risk per CVE-2025-69873) |
| `ref-not-allowed` | Schema uses `$ref` in any form |
| `secret-with-default` | A property marked `x-napplet-secret: true` also declares a `default` |

The walk recurses into `properties`, `items`, `additionalProperties`, `patternProperties`, `oneOf`, `anyOf`, `allOf`, `not`, `definitions`, and `$defs` -- the guard is wide even though the Core Subset is narrow.

### Environment Variables

#### VITE_DEV_PRIVKEY_HEX

**Type:** `string` (hex-encoded 32-byte private key)

If set, the plugin signs the manifest event at build time. If not set, manifest generation is gracefully skipped (dev mode works without it).

**Security:** NEVER use a real private key here. Use a dedicated test key generated for local development only:

```bash
# Generate a test key (using nostr-tools or similar)
node -e "import('nostr-tools/pure').then(m => console.log(Buffer.from(m.generateSecretKey()).toString('hex')))"
```

## Service Dependencies

Use the `requires` option when your napplet needs specific shell capabilities (like audio playback or push notifications) to function correctly.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  plugins: [
    nip5aManifest({
      nappletType: 'my-music-app',
      requires: ['audio', 'notifications'],
    }),
  ],
});
```

### What gets injected

With `requires: ['audio', 'notifications']`, the plugin injects into your HTML `<head>`:

```html
<meta name="napplet-aggregate-hash" content="">
<meta name="napplet-napp-type" content="my-music-app">
<meta name="napplet-requires" content="audio,notifications">
```

At build time (with `VITE_DEV_PRIVKEY_HEX` set), the manifest event also includes `requires` tags:

```json
{
  "kind": 35128,
  "tags": [
    ["d", "my-music-app"],
    ["x", "<sha256>", "index.js"],
    ["requires", "audio"],
    ["requires", "notifications"]
  ]
}
```

### Runtime compatibility checking

The host shell reads `<meta name="napplet-requires">` during napplet initialization and compares against its supported capabilities. Napplets can also check at runtime:

```ts
import '@napplet/shim';

if (!window.napplet.shell.supports('media')) {
  console.warn('Media NUB not available — some features disabled');
}
```

## How It Works

### Dev Mode (`transformIndexHtml`)

Injects two meta tags into the HTML `<head>`:

```html
<meta name="napplet-aggregate-hash" content="">
<meta name="napplet-napp-type" content="<nappletType>">
```

The empty aggregate hash tells the shell this is a development build. The shell reads these tags during napplet registration to resolve the aggregate hash for ACL scoping.

### Build Mode (`closeBundle`)

Only runs if `VITE_DEV_PRIVKEY_HEX` is set:

1. Walks `dist/` directory recursively
2. Computes SHA-256 hash of each file's contents
3. Creates sorted hash lines: `<sha256hex> <relativePath>\n`
4. Computes aggregate hash (SHA-256 of sorted concatenation)
5. Creates kind 35128 manifest event with `x` tags for each file and `requires` tags if configured
6. Signs with the test private key
7. Writes `.nip5a-manifest.json` to `dist/`
8. Updates the `napplet-aggregate-hash` meta tag in `dist/index.html`

## API Reference

### nip5aManifest(options)

Create a Vite plugin instance.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `Nip5aManifestOptions` | Plugin configuration |

**Returns:** `Plugin` (Vite plugin)

### Nip5aManifestOptions

```ts
interface Nip5aManifestOptions {
  /** Napplet type/dtag (e.g., 'feed', 'chat') */
  nappletType: string;
  /** Service dependencies this napplet requires (e.g., ['audio', 'notifications']). Optional. */
  requires?: string[];
  /**
   * JSON Schema (draft-07+) describing the napplet's config surface (NUB-CONFIG).
   * May be an inline object or a path string (resolved relative to the Vite
   * project root). Falls through to `config.schema.json` then `napplet.config.*`
   * discovery when omitted.
   */
  configSchema?: JSONSchema7 | string;
}
```

## Protocol Reference

- [NUB-CONFIG spec (PR #13)](https://github.com/napplet/nubs/pull/13) -- per-napplet declarative configuration
- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification
- [NIP-5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) -- Nsite specification
- [Aggregate Hash PR](https://github.com/nostr-protocol/nips/pull/2287) -- NIP-5A aggregate hash extension (not yet merged)

## License

MIT
