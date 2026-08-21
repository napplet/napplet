# @napplet/vite-plugin

> Vite build plugin that generates NIP-5A manifest sidecars for verification and deploy metadata handoff.

`@napplet/vite-plugin` runs at build time and is **not** a runtime dependency. It walks `dist/`, computes per-file SHA-256 hashes and the NIP-5A aggregate hash, and writes a NIP-5D **kind 35129** named-napplet manifest sidecar containing the `path`, aggregate `x`, `requires`, `config`, and `archetype` tags. A development key may sign that sidecar for local verification, but signing is not required for metadata handoff.

For `artifactMode: 'single-file'`, `largeAssetOptimization: 'auto'` is non-normative Vite-tool behavior: it starts only above 2 MiB, discovers a user's kind-10063 Blossom list through NIP-65 write/unmarked relays, offloads only supported bounded whole Blobs, and adds `resource` only after a complete local transaction. Private mapping/loader data is implementation metadata inside HTML, not a manifest tag or protocol requirement. One 50 MiB Blob, streaming, ranges, progress, BUD-04 mirroring, BUD-10 URI syntax, deletion, listing, transforms, payment, and report operations are not delivered. Consult [NIP-5A](https://github.com/nostr-protocol/nips/blob/master/5A.md), [NIP-5D](https://github.com/nostr-protocol/nips/pull/2303), [NAP-RESOURCE](https://github.com/napplet/naps/pull/80), and [NIP-B7](https://github.com/nostr-protocol/nips/blob/master/B7.md) for canonical sources.

::: tip
Use `napplet deploy` for production signing, Blossom upload, and relay publication. It reads build-owned metadata from `.nip5a-manifest.json` and constructs the event it publishes; the sidecar itself is not published as-is.
:::

- **npm:** [`@napplet/vite-plugin`](https://www.npmjs.com/package/@napplet/vite-plugin)
- **JSR:** [`@napplet/vite-plugin`](https://jsr.io/@napplet/vite-plugin)
- **Source:** [packages/vite-plugin](https://github.com/napplet/napplet/tree/main/packages/vite-plugin)

## Install

```bash
npm install -D @napplet/vite-plugin
```

## Quick start

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  plugins: [nip5aManifest({ nappletType: 'my-napp' })],
});
```

## Options

`nip5aManifest(options)` returns a Vite `Plugin`. The options:

| Option | Type | Purpose |
| --- | --- | --- |
| `nappletType` *(required)* | `string` | The napp type / manifest `d` tag. |
| `requires` | `string[]` | Bare NAP domain names this napplet needs, such as `outbox` or `storage`. Emits `["requires", …]` manifest tags. |
| `title` | `string` | Human-readable title. Sets/overrides the built HTML `<title>` (plain HTML, not a `napplet-*` meta; untouched when omitted). The napplet CLI reads it back out of the built `index.html` and emits the NIP-5A `["title", …]` manifest tag. |
| `description` | `string` | Human-readable description. Sets/overrides the built HTML `<meta name="description">` (plain HTML, not a `napplet-*` meta; untouched when omitted). The napplet CLI reads it back out and emits the NIP-5A `["description", …]` manifest tag. |
| `configSchema` | `NappletConfigSchema \| string` | A JSON Schema (draft-07+) for the napplet's NAP-CONFIG surface. Inline object or path; falls through to `config.schema.json` then `napplet.config.*` discovery. |
| `artifactMode` | `'external-assets' \| 'single-file'` | Default `'external-assets'`. `'single-file'` inlines local JS/CSS into `index.html` before hashing — for gateway-portable NIP-5A artifacts. |

## Generated manifest

At **build time**, the plugin walks `dist/`, computes hashes, and writes `.nip5a-manifest.json`. With `VITE_DEV_PRIVKEY_HEX` set it also signs the kind 35129 event; without a key it writes the unsigned template so deploy tooling can preserve its metadata:

```json
{
  "kind": 35129,
  "tags": [
    ["d", "my-music-app"],
    ["path", "/index.html", "<sha256>"],
    ["x", "<aggregateHash>", "aggregate"],
    ["requires", "outbox"],
    ["requires", "storage"]
  ]
}
```

## Build-time guards & diagnostics

- **Config schema validation** — the resolved schema is checked against the
  NAP-CONFIG Core Subset; `pattern`, `$ref`, a non-object root, or a
  `x-napplet-secret` with a `default` abort the build.
- **Inline scripts are supported** — NIP-5D loads a napplet as a single
  self-contained `/index.html` via `iframe.srcdoc` (opaque origin), so its JS is
  inline by design. The plugin does not reject inline `<script>` elements. With
  `artifactMode: 'single-file'` it folds local script/style assets into the HTML
  and leaves any pre-existing inline scripts intact.

## Environment

- **`VITE_DEV_PRIVKEY_HEX`** — hex-encoded 32-byte test private key. If set, the plugin signs the manifest at build time; if unset, the plugin still writes the unsigned manifest template. **Never use a real key** — generate a dedicated test key.

## See also

- [NIP-5D explained](/guide/nip-5d) — manifest & NAP negotiation
- [Core concepts](/guide/concepts#acl-capabilities) — how the aggregate hash keys ACL
