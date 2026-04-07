# napplet

Monorepo for the **napplet** SDK -- libraries for building Nostr-native iframe applications ("napplets").

A **napplet** is a sandboxed web app that runs inside a **shell** (window manager). The shell and napplet communicate over `postMessage` using a JSON envelope format (`{ type, ...payload }`) defined by NIP-5D. The napplet never touches `localStorage`, relay connections, or signing keys directly -- the shell proxies everything through a `ShellBridge`.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [@napplet/core](packages/core) | `@napplet/core` | JSON envelope types (`NappletMessage`, `NubDomain`), NUB dispatch infrastructure (`registerNub`, `dispatch`), protocol constants and Nostr types. Imported by all other packages. |
| [@napplet/shim](packages/shim) | `@napplet/shim` | Side-effect-only window installer for napplet iframes. Importing `@napplet/shim` installs the `window.napplet` global and registers with the shell. Sends JSON envelope messages via postMessage. Zero named exports. |
| [@napplet/sdk](packages/sdk) | `@napplet/sdk` | Named TypeScript exports wrapping `window.napplet` for bundler consumers. Provides `relay`, `ipc`, `services`, `storage` objects plus NUB message type re-exports. |
| @napplet/nub-relay | `@napplet/nub-relay` | Relay NUB: typed JSON envelope message definitions for relay proxy operations (subscribe, publish, query). |
| @napplet/nub-signer | `@napplet/nub-signer` | Signer NUB: typed message definitions for NIP-07/NIP-44 signing delegation. |
| @napplet/nub-storage | `@napplet/nub-storage` | Storage NUB: typed message definitions for scoped key-value storage proxy. |
| @napplet/nub-ifc | `@napplet/nub-ifc` | IFC NUB: typed message definitions for inter-frame communication (topic pub/sub and named channels). |
| [@napplet/vite-plugin](packages/vite-plugin) | `@napplet/vite-plugin` | Vite plugin for NIP-5D manifest generation. Computes per-file SHA-256 hashes, signs a kind 35128 manifest event at build time, and injects `requires` meta tags. |

## Architecture

### Package Dependency Graph

```
@napplet/shim ──► @napplet/core
                ──► @napplet/nub-signer (types)
                ──► @napplet/nub-ifc    (types)
@napplet/sdk  ──► @napplet/core
                ──► @napplet/nub-relay   (types)
                ──► @napplet/nub-signer  (types)
                ──► @napplet/nub-storage (types)
                ──► @napplet/nub-ifc     (types)

@napplet/nub-relay   ──► @napplet/core
@napplet/nub-signer  ──► @napplet/core
@napplet/nub-storage ──► @napplet/core
@napplet/nub-ifc     ──► @napplet/core

@napplet/vite-plugin  (build-time only, depends on nostr-tools)
```

### Napplet-Side Communication

```
Shell (host page)                          Napplet (sandboxed iframe)
──────────────────────────                 ──────────────────────────
@kehto/shell (or any shell)                @napplet/shim
  ShellBridge                                window.napplet.relay (subscribe/publish/query)
  ├── JSON envelope message routing          window.napplet.ipc   (emit/on)
  ├── Identity via message.source            window.napplet.storage (get/set/remove)
  ├── ACL enforcement                        window.napplet.shell.supports(domain)
  ├── NUB dispatch (relay/signer/storage)    window.nostr (NIP-07 proxy)
  └── IFC routing

◄────────── postMessage: { type: 'relay.subscribe', id, filters } ──────────►
◄────────── postMessage: { type: 'relay.event', subId, event }    ──────────►

@napplet/vite-plugin (build time)
  └── NIP-5D manifest generation + requires tag injection
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
