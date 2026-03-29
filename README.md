# napplet

Monorepo for the **napplet** SDK — libraries for building and hosting Nostr-native iframe applications ("napplets").

A **napplet** is a sandboxed web app that runs inside a **shell** (window manager). The shell and napplet communicate over `postMessage` using the NIP-01 wire format. The napplet never touches `localStorage`, relay connections, or signing keys directly — the shell proxies everything through a pseudo-relay.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [@napplet/shim](packages/shim) | `@napplet/shim` | Napplet SDK. Provides `subscribe`, `publish`, `query`, `emit`, `on`, `nappStorage` — the full API a napplet uses to talk to its host shell. |
| [@napplet/shell](packages/shell) | `@napplet/shell` | Shell runtime. `createPseudoRelay(hooks)` factory that handles NIP-01 routing, AUTH handshake, ACL enforcement, signer proxy, storage proxy, and audio management. Framework-agnostic. |
| [@napplet/vite-plugin](packages/vite-plugin) | `@napplet/vite-plugin` | Vite plugin for NIP-5A manifest generation. Computes per-file SHA-256 hashes and signs a kind 35128 manifest event at build time. |

## Architecture

```
Shell (host page)                    Napplet (sandboxed iframe)
─────────────────                    ─────────────────────────
@napplet/shell                       @napplet/shim
  createPseudoRelay(hooks)             subscribe / publish / query
  ├── NIP-01 message routing           emit / on (inter-pane events)
  ├── NIP-42 AUTH handshake            nappStorage (proxied localStorage)
  ├── Signer proxy (NIP-07/46)         window.nostr (NIP-07 proxy)
  ├── Storage proxy (scoped)
  ├── ACL enforcement          ◄── postMessage (NIP-01 wire format) ──►
  └── Audio management

@napplet/vite-plugin (build time)
  └── NIP-5A manifest generation
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
