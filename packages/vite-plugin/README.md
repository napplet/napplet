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
    nip5aManifest({ nappType: 'my-napp' }),
  ],
});
```

## Configuration

### Plugin Options

#### nappType (required)

**Type:** `string`

The napp type identifier (e.g., `'feed'`, `'chat'`, `'profile'`). This value is:

- Injected as the `content` of the `<meta name="napplet-napp-type">` tag
- Used as the `d` tag in the kind 35128 manifest event

### Environment Variables

#### VITE_DEV_PRIVKEY_HEX

**Type:** `string` (hex-encoded 32-byte private key)

If set, the plugin signs the manifest event at build time. If not set, manifest generation is gracefully skipped (dev mode works without it).

**Security:** NEVER use a real private key here. Use a dedicated test key generated for local development only:

```bash
# Generate a test key (using nostr-tools or similar)
node -e "import('nostr-tools/pure').then(m => console.log(Buffer.from(m.generateSecretKey()).toString('hex')))"
```

## How It Works

### Dev Mode (`transformIndexHtml`)

Injects two meta tags into the HTML `<head>`:

```html
<meta name="napplet-aggregate-hash" content="">
<meta name="napplet-napp-type" content="<nappType>">
```

The empty aggregate hash tells the shell this is a development build. The napplet shim reads these tags during AUTH to include in the handshake.

### Build Mode (`closeBundle`)

Only runs if `VITE_DEV_PRIVKEY_HEX` is set:

1. Walks `dist/` directory recursively
2. Computes SHA-256 hash of each file's contents
3. Creates sorted hash lines: `<sha256hex> <relativePath>\n`
4. Computes aggregate hash (SHA-256 of sorted concatenation)
5. Creates kind 35128 manifest event with `x` tags for each file
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
  /** Napp type/dtag (e.g., 'feed', 'chat') */
  nappType: string;
}
```

## Protocol Reference

- [Napplet Shell Protocol Specification](../../SPEC.md)
- [NIP-5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) -- Nsite specification
- [Aggregate Hash PR](https://github.com/nostr-protocol/nips/pull/2287) -- NIP-5A aggregate hash extension (not yet merged)

## License

MIT
