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

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Napplet Protocol SDK**

A portable SDK for the napplet protocol — sandboxed Nostr mini-apps that run in restrictive iframes and delegate functionality (signing, storage, relay access) to a host shell via NIP-01 postMessage wire format. Extracted from [hyprgate](https://github.com/sandwichfarm/hyprgate) into standalone `@napplet/*` npm packages. Includes a 66-test protocol conformance suite and an interactive Chat + Bot demo playground.

**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

### Constraints

- **ESM-only**: No CJS output — all packages are ESM
- **Zero framework deps**: No Svelte, React, Vue — framework-agnostic SDK
- **nostr-tools peer dep**: shim and shell depend on nostr-tools >=2.23.3 <3.0.0
- **iframe sandbox**: No allow-same-origin — everything proxied via postMessage
- **Monorepo tooling**: pnpm workspaces + turborepo + tsup + changesets
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - Strict, ESM-only across all packages
- JavaScript (ES2022 target) - Build output and runtime
## Runtime
- Node.js 22.x (specified in CI: `.github/workflows/ci.yml`)
- pnpm 10.8.0 (configured in `package.json`)
- Lockfile: `pnpm-lock.yaml` (present)
## Frameworks
- Vite 6.3.0 (peer dependency for `@napplet/vite-plugin`)
- nostr-tools 2.23.3 (peer dependency for `@napplet/shim` and `@napplet/shell`; direct dependency for `@napplet/vite-plugin`)
- tsup 8.5.0 - Used in all three packages (`packages/*/tsup.config.ts`) for bundling TypeScript to ESM
- turborepo 2.5.0 - Monorepo orchestration (configured in `turbo.json`)
- TypeScript 5.9.3 - Compiler and type checking
- changesets 2.30.0 - Versioning, changelog, and npm publishing (`pnpm version-packages`, `pnpm publish-packages`)
## Key Dependencies
- nostr-tools 2.23.3 - Cryptographic signing and verification (Schnorr signatures, Ed25519 key generation, event finalization)
- @changesets/cli 2.30.0 - Manages versioning and publishes packages to npm
## Configuration
- VITE_DEV_PRIVKEY_HEX (optional) - Hex-encoded private key for signing NIP-5A manifests at build time in `@napplet/vite-plugin`
- `tsconfig.json` (root) - Shared TypeScript config with ES2022 target, ESNext module, bundler resolution
- `packages/*/tsconfig.json` - Per-package TypeScript configs
- `packages/*/tsup.config.ts` - Per-package build configs (ESM format, source maps, type declarations)
- `turbo.json` - Task pipeline (build → type-check, test depends on build)
## Platform Requirements
- Node.js 22.x or compatible
- pnpm 10.8.0+
- Unix-like environment (Linux, macOS) or Windows with appropriate toolchain
- Node.js 18+ (ESM support required)
- Browsers supporting ES2022 (napplet iframe runtime)
- Vite-based build system for napplet applications using `@napplet/vite-plugin`
## Build Output
- ESM-only (no CommonJS)
- Type declarations (`.d.ts`) and source maps included
- Distribution: `packages/*/dist/`
- npm registry: `@napplet/shim`, `@napplet/shell`, `@napplet/vite-plugin` (all at v0.1.0, not yet published)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- TypeScript source files use lowercase with hyphens: `relay-shim.ts`, `origin-registry.ts`, `pseudo-relay.ts`, `audio-manager.ts`, `acl-store.ts`, `storage-proxy.ts`
- Type-specific suffix: `types.ts` for interface/type definitions
- Configuration files: `tsup.config.ts`, `turbo.json`, `tsconfig.json`
- Exported functions use camelCase: `createPseudoRelay()`, `subscribe()`, `publish()`, `query()`, `emit()`, `on()`
- Internal/private helper functions use camelCase with leading underscore when unexported: `sendEvent()`, `handleRelayMessage()`, `handleAuthChallenge()`
- Initialization functions: `installStorageShim()`, `installKeyboardShim()`, `installNostrDb()`
- Getter functions: `getPublicKey()`, `getPublicKey()`, `getUserPubkey()`
- Factory function names: `createPseudoRelay()` for main entry points
- camelCase for local variables and module-level state: `pendingRequests`, `keypair`, `eventBuffer`, `seenEventIds`
- UPPER_SNAKE_CASE for constants: `REQUEST_TIMEOUT_MS`, `RING_BUFFER_SIZE`, `DEFAULT_STORAGE_QUOTA`, `SIGNER_SUB_ID`
- Map/Set names: descriptive nouns without prefix, e.g., `subscriptions`, `pendingChallenges`, `sources`
- Private state uses underscore prefix if exported: `_setInterPaneEventSender()`, `_resolveKeypairReady`
- PascalCase for interfaces and types: `NostrEvent`, `NostrFilter`, `ShellHooks`, `PseudoRelay`, `NappKeypair`, `AclEntry`, `ConsentRequest`, `AudioSource`
- Suffix conventions: `*Hooks` for integration point interfaces, `*Like` for minimal protocol interfaces (e.g., `RelayPoolLike`, `WorkerRelayLike`)
## Code Style
- No explicit linter/formatter configured in package (ESLint/Prettier)
- TypeScript strict mode enabled: `strict: true` in `tsconfig.json`
- 2-space indentation observed throughout codebase
- No explicit line length limit enforced, but typical lines are <100 characters
- Semicolons required (TypeScript module convention)
- TypeScript strict mode enforced via `tsconfig.json` with `"strict": true`
- Module resolution: `"moduleResolution": "bundler"` for modern ESM bundlers
- No explicit ESLint config found; relying on TypeScript compiler checks
- Comments in code disallow implicit `any`: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
## Import Organization
- No path aliases configured; all imports are explicit relative paths
- Monorepo packages imported via `@napplet/shim`, `@napplet/shell`, `@napplet/vite-plugin` in package.json
- ESM-only: `verbatimModuleSyntax: true` in tsconfig enforces explicit `import type` for types
## Error Handling
- Silent catches for non-critical errors: `catch { /* intentional */ }` or `catch { /* best-effort */ }`
- Explicit error tags in NIP-01 events: `[['error', 'reason']]` for structured error responses
- Promise rejection with descriptive Error objects: `reject(new Error('Signer request timed out'))`
- Try-catch around localStorage access: localStorage may be unavailable or throw
- Validation failures return early with explicit error responses (no exceptions thrown for validation)
- Prefixed error reasons: `'auth-required: ...'`, `'invalid: ...'`, `'duplicate: ...'`, `'quota exceeded: ...'`
- Storage errors: `'missing key tag'`, `'storage:read capability denied'`, `'storage write failed'`
## Logging
- `console.log()` for informational messages (build logs, manifest generation status)
- Plugin logging prefixed: `[nip5a-manifest]` in vite-plugin
- Intentional error swallowing with comments explaining why
- No dedicated logging library; output only during build or critical paths
## Comments
- File headers explaining module purpose (required for main modules)
- Section dividers using `// ─── Section Name ──────────────...` format
- JSDoc comments for public API functions
- Inline comments explaining non-obvious logic (protocol violations, special cases)
- Comments in catch blocks explaining why errors are ignored
- Required for all exported functions
- Format: `@param`, `@returns`, `@example` tags
- Example blocks using markdown triple-backticks
## Function Design
- Functions range from 5-100 lines
- Helper functions in `pseudo-relay.ts` (e.g., `checkReplay()`, `matchesFilter()`) are typically 10-15 lines
- Main message handlers (`handleEvent()`, `handleAuth()`) span 50-100 lines due to complex protocol handling
- Prefer explicit parameters over object spreading
- Use single object parameter for optional settings: `options?: { relay?: string; group?: string }`
- Callback-based API: `onEvent`, `onEose`, `callback` patterns for subscription
- Type parameters for flexibility: `hooks: ShellHooks` for dependency injection
- Functions return Promise for async operations: `Promise<NostrEvent>`, `Promise<unknown>`
- Subscription functions return objects with teardown methods: `{ close(): void }`
- Factory functions return interface types: `createPseudoRelay(): PseudoRelay`
- Early returns for validation failures: `if (!condition) return;`
## Module Design
- Prefer named exports: `export function subscribe()`, `export const audioManager = { ... }`
- Default exports only for config files (tsup.config.ts, etc.)
- Public API clearly delineated: `// ─── Public API exports ────...` comments
- Type exports with `export type` when appropriate
- `packages/shell/src/index.ts` acts as main barrel export
- Re-exports all public interfaces and factory functions
- Organized by concern: types, factories, utilities, protocol constants
## Module-Level State
- Local state managed within IIFE closures in factory functions
- Module-level Maps for registries: `const registry = new Map<Window, string>()`
- Explicit initialization and cleanup functions: `installStorageShim()`, `cleanup()`
- State persistence for ACL: `aclStore.persist()`, `aclStore.load()` with localStorage
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Framework-agnostic (no Svelte, React, Vue dependencies)
- Dependency injection pattern via `ShellHooks` interface for host integration
- postMessage-based bidirectional communication with NIP-01 wire format
- Session-scoped ephemeral keypairs per napplet for AUTH handshake
- Composite-keyed ACL system (pubkey:dTag:aggregateHash) for capability enforcement
- Storage and signing proxies enforce zero-access to localStorage, relay pools, or host signer keys
## Layers
- Purpose: SDK for sandboxed iframe applications. Provides high-level relay API, NIP-07 proxy, inter-pane pubsub, storage proxy client
- Location: `packages/shim/src/`
- Contains: `subscribe`, `publish`, `query`, `emit`, `on`, `nappStorage` APIs; relay message shim; NIP-07/NIP-44 signer proxy; storage client; keyboard forwarding
- Depends on: nostr-tools (peer dependency) for event signing
- Used by: Napplet iframe applications running within a shell host
- Purpose: NIP-01 message router and protocol handler. Core of the shell runtime. Handles AUTH, REQ, EVENT, CLOSE messages; routes to relay pool or local cache; enforces ACL
- Location: `packages/shell/src/pseudo-relay.ts`
- Contains: Message dispatch logic, subscription lifecycle, event delivery, ACL checks, replay attack prevention
- Depends on: All registries and proxy handlers in shell
- Used by: Shell host to attach to window.message listener
- **NappKeyRegistry** (`packages/shell/src/napp-key-registry.ts`): Bidirectional mapping (windowId ↔ pubkey). Stores verified napp identity after AUTH handshake. Tracks pending aggregate hash updates.
- **OriginRegistry** (`packages/shell/src/origin-registry.ts`): Maps origin URL → windowId. Prevents origin spoofing during registration.
- **ACL Store** (`packages/shell/src/acl-store.ts`): Capability lookup by composite key `pubkey:dTag:aggregateHash`. Default permissive; explicitly blocks or revokes capabilities.
- **Storage Proxy** (`packages/shell/src/storage-proxy.ts`): Shell-side handler for napp storage requests. Intercepts kind 29001 events with topic "shell:storage-*"; stores in scoped localStorage; enforces quota.
- **Manifest Cache** (`packages/shell/src/manifest-cache.ts`): Caches NIP-5A manifest data (kind 35128 events) by dTag. Used to resolve aggregate hash on napp registration.
- **Audio Manager** (`packages/shell/src/audio-manager.ts`): Manages web audio context and plays notification sounds from ephemeral audio sources
- **Topics** (`packages/shell/src/topics.ts`): Command constants for shell inter-pane routing (e.g., `shell:storage-get`, `shell:relay-scoped-connect`)
- **Vite Plugin** (`packages/vite-plugin/src/index.ts`): Build-time manifest generation. Computes per-file SHA-256 hashes, aggregate hash, signs kind 35128 manifest event, injects meta tags into index.html
## Data Flow
## Key Abstractions
- Purpose: Identifies a napplet instance for its session. Created on first AUTH challenge.
- Examples: `packages/shim/src/napp-keypair.ts`
- Pattern: Stored in sessionStorage; loaded/created deterministically per nappType; used to sign all outbound events
- Purpose: Framework-agnostic integration point. Host app provides relay pool, auth state, window manager, etc.
- Examples: `packages/shell/src/types.ts` (ShellHooks, RelayPoolHooks, AuthHooks, WindowManagerHooks, etc.)
- Pattern: createPseudoRelay(hooks) accepts all hooks; implementations are async-aware to allow real relay subscriptions
- Purpose: Fine-grained access control per napplet version
- Examples: 'relay:read', 'relay:write', 'sign:event', 'sign:nip04', 'sign:nip44', 'storage:read', 'storage:write', 'hotkey:forward'
- Pattern: Checked on every sensitive operation (publish, subscribe, signer request, storage access)
- Purpose: Gate destructive signing kinds (0: metadata, 3: contacts, 5: relay list, 10002: nip46 relay list)
- Examples: Raised when napplet attempts to sign kind 0, 3, 5, or 10002
- Pattern: Shell emits onConsentNeeded callback; host app displays prompt; user approves/denies
## Entry Points
## Error Handling
- **Signer Requests:** Napplet sends kind 29001 with unique ID, awaits kind 29002 response with matching id tag. Response includes error tag or result tag.
- **Storage Requests:** Napplet sends kind 29001 storage event, awaits kind 29001 response with id tag. Response includes error tag or value/found tags.
- **Relay Errors:** Shell sends NOTICE (NIP-01 server notice) or closes subscription via CLOSED verb.
- **Invalid Events:** Replay check returns error string. ACL denial is silent (event not delivered). Signature verification failure → drop event.
## Cross-Cutting Concerns
- Event signature verification via nostr-tools `verifyEvent` (shell crypto hook)
- Filter validation: NIP-01 filter schema (kinds, authors, ids, tags, limits)
- Storage key validation: Scoped prefix prevents cross-napp access
- NIP-42 AUTH challenge-response with Schnorr signature verification
- Ephemeral keypair per napplet instance (session-scoped)
- Aggregate hash resolution from manifest for version-specific ACL
- iframe sandbox without allow-same-origin prevents DOM/cookie access
- postMessage * origin (permissive in current impl; frame filtering could be added)
- Storage scoping by pubkey:dTag:aggregateHash prevents cross-napp data access
- No shared globals or prototype pollution
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
