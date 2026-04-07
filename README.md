# napplet

Monorepo for the **napplet** SDK -- libraries for building Nostr-native iframe applications ("napplets").

A **napplet** is a sandboxed web app that runs inside a **shell** (window manager). The shell and napplet communicate over `postMessage` using the NIP-01 wire format. The napplet never touches `localStorage`, relay connections, or signing keys directly -- the shell proxies everything through a `ShellBridge`.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [@napplet/core](packages/core) | `@napplet/core` | Shared protocol types and constants. `NostrEvent`, `NostrFilter`, `BusKind`, `ServiceDescriptor`, topic constants -- imported by all other packages. |
| [@napplet/shim](packages/shim) | `@napplet/shim` | Side-effect-only window installer for napplet iframes. Importing `@napplet/shim` installs the `window.napplet` global and registers with the shell. Zero crypto dependencies. No named exports. |
| [@napplet/sdk](packages/sdk) | `@napplet/sdk` | Named TypeScript exports wrapping `window.napplet` for bundler consumers. Provides `relay`, `ipc`, `services`, `storage` as importable objects. |
| [@napplet/vite-plugin](packages/vite-plugin) | `@napplet/vite-plugin` | Vite plugin for NIP-5A manifest generation. Computes per-file SHA-256 hashes, signs a kind 35128 manifest event at build time, and injects `requires` meta tags. |

## Architecture

### Package Dependency Graph

```
@napplet/shim ──► @napplet/core
@napplet/sdk  ──► @napplet/core

@napplet/vite-plugin  (build-time only, depends on nostr-tools)
```

### Napplet-Side Communication

```
Shell (host page)                          Napplet (sandboxed iframe)
──────────────────────────                 ──────────────────────────
@kehto/shell (or any shell)                @napplet/shim
  ShellBridge                                subscribe / publish / query
  ├── NIP-01 message routing                 emit / on (inter-pane events)
  ├── Identity via message.source            nappletState (proxied storage)
  ├── ACL enforcement                        window.nostr (NIP-07 proxy)
  ├── Service dispatch (kind 29010)          window.napplet.services.has(...)
  └── Signer + storage proxy

◄────────────── postMessage (NIP-01 wire format) ──────────────►

@napplet/vite-plugin (build time)
  └── NIP-5A manifest generation + requires tag injection
```

The iframe sandbox is `allow-scripts allow-forms allow-popups allow-modals allow-downloads` -- **no `allow-same-origin`**. This means napplets cannot access the host shell's DOM, cookies, localStorage, or service workers. All persistent state goes through the shell's proxies.

## Origin

These packages were extracted from [hyprgate](https://github.com/sandwichfarm/hyprgate), a Nostr-native window manager shell. The extraction made the protocol portable -- any shell can host napplets, and any web app can become a napplet by importing `@napplet/shim`.

The shell-side runtime packages (ACL, protocol engine, browser adapter, service handlers) were subsequently extracted into the [@kehto](https://github.com/sandwichfarm/kehto) monorepo, leaving `@napplet` as the focused napplet-side SDK.

The protocol is documented in the [NIP-5D specification draft](specs/NIP-5D.md). The runtime spec lives in [@kehto](https://github.com/sandwichfarm/kehto).

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

- **[@kehto](https://github.com/sandwichfarm/kehto)** -- Shell-side runtime packages (`@kehto/runtime`, `@kehto/shell`, `@kehto/acl`, `@kehto/services`). Provides the protocol engine, ACL enforcement, and browser adapter for hosting napplets.
- **[hyprgate](https://github.com/sandwichfarm/hyprgate)** -- Reference shell implementation (Svelte/SvelteKit)
- **[NIP-5D](specs/NIP-5D.md)** -- Protocol specification for the napplet-shell protocol

## License

MIT
