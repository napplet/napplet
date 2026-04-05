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

The build-time manifest is for verifying the hash computation workflow locally, not for deploying to relays.

### When to Use This

- You are building a napplet and testing locally with @napplet/shell
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

If the shell does not have all required services, the napplet can detect this at runtime via `discoverServices()` or the shell can show a compatibility warning.

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

Use the `requires` option when your napplet needs specific shell services (like audio playback or push notifications) to function correctly.

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

The host shell reads `<meta name="napplet-requires">` during napplet initialization and compares against registered services. Napplets can also check at runtime:

```ts
import { hasService } from '@napplet/shim';

if (!(await hasService('audio'))) {
  console.warn('Audio service not available — some features disabled');
}
```

## How It Works

### Dev Mode (`transformIndexHtml`)

Injects two meta tags into the HTML `<head>`:

```html
<meta name="napplet-aggregate-hash" content="">
<meta name="napplet-napp-type" content="<nappletType>">
```

The empty aggregate hash tells the shell this is a development build. The napplet shim reads these tags during AUTH to include in the handshake.

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
}
```

## Protocol Reference

- [Napplet Runtime Reference](../../RUNTIME-SPEC.md)
- [NIP-5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) -- Nsite specification
- [Aggregate Hash PR](https://github.com/nostr-protocol/nips/pull/2287) -- NIP-5A aggregate hash extension (not yet merged)

## License

MIT
