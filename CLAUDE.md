# CLAUDE.md

## Project Overview

This is the **napplet** monorepo — npm packages for the napplet protocol. Napplets are Nostr-native sandboxed iframe apps that communicate with a host shell over postMessage using NIP-01 wire format.

Extracted from [hyprgate](https://github.com/sandwichfarm/hyprgate) (Phases 26-27 of v1.4 milestone). The hyprgate repo is the reference implementation; this repo is the portable SDK.

## Packages

- `packages/shim` — **@napplet/shim** — Napplet-side SDK (subscribe, publish, query, emit, on, nappStorage)
- `packages/shell` — **@napplet/shell** — Shell-side runtime (createPseudoRelay factory, ACL, signer proxy, storage proxy, audio manager)
- `packages/vite-plugin` — **@napplet/vite-plugin** — NIP-5A manifest generation at build time

## Tech Stack

- **TypeScript** (strict, ESM-only)
- **tsup** for building each package
- **turborepo** for monorepo orchestration
- **pnpm** workspaces
- **changesets** for versioning and publishing
- **nostr-tools** as peer dependency (shim + shell) or direct dependency (vite-plugin)

## Key Concepts

- **Pseudo-relay**: The shell acts as a NIP-01 relay to the napplet. The napplet sends REQ/EVENT/CLOSE messages via postMessage; the shell routes them to real relays, local cache, or other napplets.
- **AUTH handshake**: NIP-42 challenge-response with ephemeral Ed25519 keypair per napplet session. Shell verifies Schnorr signature.
- **ACL**: Capabilities keyed on `(nappType, aggregateHash)`. Controls signing, storage, relay access.
- **Storage scoping**: nappStorage keys are scoped by `nappType:aggregateHash` so different napplets (and different versions of the same napplet) have isolated storage.
- **No allow-same-origin**: Napplet iframes cannot access shell DOM, localStorage, or cookies. Everything is proxied.

## Build & Test

```bash
pnpm install
pnpm build          # Build all via turborepo
pnpm type-check     # TypeScript validation
```

## Publishing (not yet published)

Packages are at v0.1.0 with changesets ready. To publish:
```bash
pnpm version-packages
pnpm publish-packages
```

## Relationship to hyprgate

- This repo contains the **portable, framework-agnostic** packages
- hyprgate contains the **Svelte reference implementation** that uses these packages
- The `@napplet/create` CLI lives in hyprgate at `packages/create/` (not here)
- The NIP specification draft lives in hyprgate at `specs/NIP-napplet-shell-protocol.md`
- When making protocol changes, update both repos

## Code Conventions

- ESM-only (no CJS output)
- Zero framework dependencies (no Svelte, React, etc.)
- All public API exports have JSDoc with @param, @returns, @example
- `ShellHooks` interface is the integration point — implementors provide relay pool, window manager, etc.
