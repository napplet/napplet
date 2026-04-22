# napplet

Monorepo for the **napplet** SDK -- libraries for building NIP-5D Nostr Web Applets - "napplets"

A **napplet** is a sandboxed web app that runs inside a **shell** (window manager). The shell and napplet communicate over `postMessage` using a JSON envelope format (`{ type, ...payload }`) defined by NIP-5D. The napplet never touches `localStorage`, relay connections, or signing keys directly -- the shell proxies everything through NUB interfaces.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [@napplet/core](packages/core) | `@napplet/core` | JSON envelope types (`NappletMessage`, `NubDomain`), NUB dispatch infrastructure (`registerNub`, `dispatch`), protocol constants and Nostr types. Imported by all other packages. |
| [@napplet/shim](packages/shim) | `@napplet/shim` | Side-effect-only window installer for napplet iframes. Importing `@napplet/shim` installs the `window.napplet` global and registers with the shell. Sends JSON envelope messages via postMessage. Zero named exports. |
| [@napplet/sdk](packages/sdk) | `@napplet/sdk` | Named TypeScript exports wrapping `window.napplet` for bundler consumers. Provides `relay`, `ifc`, `services`, `storage` objects plus NUB message type re-exports. |
| [@napplet/nub](packages/nub) | `@napplet/nub` | Consolidated NUB package. 10 domain subpaths (relay, storage, ifc, keys, theme, media, notify, identity, config, resource) with barrel + granular (types/shim/sdk) exports. Tree-shakable (`sideEffects: false`). Includes the v0.28.0 `resource` NUB for sandboxed byte fetching. See [packages/nub/README.md](packages/nub/README.md) for the full subpath reference. |
| [@napplet/vite-plugin](packages/vite-plugin) | `@napplet/vite-plugin` | Vite plugin for NIP-5D manifest generation. Computes per-file SHA-256 hashes, signs a kind 35128 manifest event at build time, and injects `requires` meta tags. v0.28.0+ ships a `strictCsp` option for 10-directive browser-enforced CSP. |

## Architecture

### Package Dependency Graph

```
@napplet/shim ──┐
                ├──► @napplet/nub ──► @napplet/core
@napplet/sdk  ──┘

@napplet/vite-plugin  (build-time only, depends on nostr-tools)
```

### Napplet-Side Communication

```
Shell (any compatible shell)                @napplet/shim
  ShellBridge                                window.napplet.relay (subscribe/publish/query)
  ├── JSON envelope message routing          window.napplet.ifc   (emit/on)
  ├── Identity via message.source            window.napplet.storage (get/set/remove)
  ├── ACL enforcement                        window.napplet.resource (bytes/bytesAsObjectURL)
  ├── NUB dispatch (relay/signer/storage)    window.napplet.shell.supports(domain)
  └── IFC routing

◄────────── postMessage: { type: 'relay.subscribe', id, filters } ──────────►
◄────────── postMessage: { type: 'relay.event', subId, event }    ──────────►

@napplet/vite-plugin (build time)
  └── NIP-5D manifest generation + requires tag injection
```

The iframe sandbox requires only `allow-scripts` -- **no `allow-same-origin`**. Shells MAY add additional tokens (`allow-forms`, `allow-popups`, etc.) per shell policy. Napplets cannot access the host shell's DOM, cookies, localStorage, or service workers. All persistent state goes through the shell's proxies.

## v0.28.0 — Browser-Enforced Resource Isolation

v0.28.0 converts napplet iframe security from ambient trust ("napplets shouldn't fetch directly") to browser-enforced isolation ("napplets cannot fetch directly — the browser blocks it"):

- **New NUB:** `@napplet/nub/resource` ships a single scheme-pluggable primitive — `napplet.resource.bytes(url) → Blob`. URL space is scheme-pluggable: `https:` (shell-side network under policy), `blossom:sha256:<hex>` (hash-verified), `nostr:<bech32>` (single-hop NIP-19), `data:` (RFC 2397, decoded in-shim).
- **Strict CSP:** `@napplet/vite-plugin` ships a `strictCsp` option that emits a 10-directive baseline (`default-src 'none'` + `connect-src 'none'` in prod) as the first child of `<head>`. The browser blocks every `fetch()`, `<img src=externalUrl>`, `XMLHttpRequest`, and direct WebSocket; everything network-sourced flows through the resource NUB.
- **Optional sidecar:** Shells MAY pre-resolve resources referenced by `relay.event` envelopes via an opt-in (default-OFF) `resources?` field; napplet-side `resource.bytes(sidecarUrl)` calls then resolve from cache without a postMessage round-trip.
- **SVG rasterization:** Shells MUST rasterize SVG to PNG/WebP in a sandboxed Worker with no network — napplets never receive parseable XML.
- **Specs:** `specs/NIP-5D.md` ships a Security Considerations subsection; NUB-RESOURCE is drafted at `napplet/nubs`; NUB-RELAY/IDENTITY/MEDIA carry coordination amendments.
- **Shell-deployer guide:** `specs/SHELL-RESOURCE-POLICY.md` checklists the private-IP block list, sidecar opt-in, SVG caps, MIME allowlist, and redirect chain limits.

Demo napplets exercising the model end-to-end (profile viewer, feed napplet with inline images, scheme-mixed consumer) live in the **downstream shell repo** — this monorepo ships only the wire + SDK surface.

## Origin

The napplet protocol is documented in the [NIP-5D specification draft](specs/NIP-5D.md). Any shell can host napplets, and any web app can become a napplet by importing `@napplet/shim`.

## Development

```bash
pnpm install
pnpm build        # Build all packages via turborepo
pnpm type-check   # TypeScript validation
```

### Publishing

Uses [changesets](https://github.com/changesets/changesets) for versioning:

```bash
pnpm version-packages   # Apply changesets, bump versions
pnpm publish-packages   # Build + publish to npm
```

## Related

- **[NIP-5D](specs/NIP-5D.md)** -- Protocol specification for the napplet-shell protocol

## License

MIT
