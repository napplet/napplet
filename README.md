# napplet

Monorepo for the **napplet** SDK — libraries for building and hosting Nostr-native iframe applications ("napplets").

A **napplet** is a sandboxed web app that runs inside a **shell** (window manager). The shell and napplet communicate over `postMessage` using the NIP-01 wire format. The napplet never touches `localStorage`, relay connections, or signing keys directly — the shell proxies everything through a `ShellBridge`.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [@napplet/shim](packages/shim) | `@napplet/shim` | Napplet SDK. Provides `subscribe`, `publish`, `query`, `emit`, `on`, `nappState`, and service discovery — everything a napplet needs to communicate with its host shell. |
| [@napplet/shell](packages/shell) | `@napplet/shell` | Shell runtime browser adapter. `createShellBridge(hooks)` factory — handles postMessage routing, NIP-42 AUTH, ACL enforcement, signer proxy, storage proxy, and service dispatch. |
| [@napplet/acl](packages/acl) | `@napplet/acl` | Pure capability enforcement module. Bitfield-based ACL with `check()`, `grant()`, `revoke()`, `block()` — zero browser dependencies. |
| [@napplet/core](packages/core) | `@napplet/core` | Shared protocol types and constants. `NostrEvent`, `NostrFilter`, `BusKind`, `ServiceDescriptor`, topic constants — imported by all other packages. |
| [@napplet/runtime](packages/runtime) | `@napplet/runtime` | Environment-agnostic protocol engine. `createRuntime(hooks)` with `RuntimeHooks` interface — all NIP-01 routing, AUTH, subscription management, service dispatch. |
| [@napplet/services](packages/services) | `@napplet/services` | Concrete service implementations. `createAudioService()`, `createNotificationService()` — ready-to-use `ServiceHandler` instances for `RuntimeHooks.services`. |
| [@napplet/vite-plugin](packages/vite-plugin) | `@napplet/vite-plugin` | Vite plugin for NIP-5A manifest generation. Computes per-file SHA-256 hashes, signs a kind 35128 manifest event at build time, and injects `requires` meta tags. |

## Architecture

### Package Dependency Graph

```
@napplet/shim       @napplet/services
      │                    │
      ▼                    ▼
@napplet/core ──► @napplet/runtime ──► @napplet/shell
      ▲
@napplet/acl ────────────────────────► @napplet/runtime

@napplet/vite-plugin  (build-time only, depends on nostr-tools)
```

### Runtime Communication Flow

```
Shell (host page)                          Napplet (sandboxed iframe)
──────────────────────────                 ──────────────────────────
@napplet/shell                             @napplet/shim
  createShellBridge(hooks)                   subscribe / publish / query
  ├── @napplet/runtime (engine)              emit / on (inter-pane events)
  │     ├── NIP-01 message routing           nappState (proxied storage)
  │     ├── NIP-42 AUTH handshake            window.nostr (NIP-07 proxy)
  │     ├── ACL enforcement                  window.napplet.discoverServices()
  │     ├── Service dispatch (kind 29010)
  │     └── Signer + storage proxy
  └── @napplet/acl (capability checks)

◄────────────── postMessage (NIP-01 wire format) ──────────────►

@napplet/vite-plugin (build time)
  └── NIP-5A manifest generation + requires tag injection
```

The iframe sandbox is `allow-scripts allow-forms allow-popups allow-modals allow-downloads` — **no `allow-same-origin`**. This means napplets cannot access the shell's DOM, cookies, localStorage, or service workers. All persistent state goes through the shell's proxies.

## Origin

These packages were extracted from [hyprgate](https://github.com/sandwichfarm/hyprgate), a Nostr-native window manager shell. The extraction (Phase 27 of hyprgate's v1.4 milestone) made the protocol portable — any shell can host napplets, and any web app can become a napplet by importing `@napplet/shim`.

The protocol is documented in a [NIP specification draft](https://github.com/sandwichfarm/hyprgate/blob/main/specs/NIP-napplet-shell-protocol.md) (999 lines, RFC 2119 normative language).

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

- **hyprgate** — Reference shell implementation (Svelte/SvelteKit)
- **@napplet/create** — Scaffolding CLI (`npx @napplet/create`) — lives in hyprgate repo at `packages/create/`
- **NIP specification** — Protocol spec at `hyprgate/specs/NIP-napplet-shell-protocol.md`

## License

MIT
