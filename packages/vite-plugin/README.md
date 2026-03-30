# @napplet/vite-plugin

Vite plugin for NIP-5A manifest generation. Computes per-file SHA-256 hashes, an aggregate hash, and signs a kind 35128 manifest event at build time.

## Install

```bash
npm install -D @napplet/vite-plugin
```

## Usage

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

### Environment Variables

- `VITE_DEV_PRIVKEY_HEX` — hex-encoded 32-byte private key for signing manifests. If not set, manifest generation is skipped (graceful no-op for development).

## What it does

1. **transformIndexHtml** — Injects `<meta name="napplet-aggregate-hash" content="">` into HTML head
2. **closeBundle** (build only) — Walks dist/, computes per-file SHA-256 hashes, computes aggregate hash, signs a kind 35128 manifest event, writes `.nip5a-manifest.json`, and updates the meta tag in `index.html`

## License

MIT
