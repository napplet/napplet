# Coding Conventions

**Analysis Date:** 2026-03-29

## Naming Patterns

**Files:**
- TypeScript source files use lowercase with hyphens: `relay-shim.ts`, `origin-registry.ts`, `pseudo-relay.ts`, `audio-manager.ts`, `acl-store.ts`, `storage-proxy.ts`
- Type-specific suffix: `types.ts` for interface/type definitions
- Configuration files: `tsup.config.ts`, `turbo.json`, `tsconfig.json`

**Functions:**
- Exported functions use camelCase: `createPseudoRelay()`, `subscribe()`, `publish()`, `query()`, `emit()`, `on()`
- Internal/private helper functions use camelCase with leading underscore when unexported: `sendEvent()`, `handleRelayMessage()`, `handleAuthChallenge()`
- Initialization functions: `installStorageShim()`, `installKeyboardShim()`, `installNostrDb()`
- Getter functions: `getPublicKey()`, `getPublicKey()`, `getUserPubkey()`
- Factory function names: `createPseudoRelay()` for main entry points

**Variables:**
- camelCase for local variables and module-level state: `pendingRequests`, `keypair`, `eventBuffer`, `seenEventIds`
- UPPER_SNAKE_CASE for constants: `REQUEST_TIMEOUT_MS`, `RING_BUFFER_SIZE`, `DEFAULT_STORAGE_QUOTA`, `SIGNER_SUB_ID`
- Map/Set names: descriptive nouns without prefix, e.g., `subscriptions`, `pendingChallenges`, `sources`
- Private state uses underscore prefix if exported: `_setInterPaneEventSender()`, `_resolveKeypairReady`

**Types:**
- PascalCase for interfaces and types: `NostrEvent`, `NostrFilter`, `ShellHooks`, `PseudoRelay`, `NappKeypair`, `AclEntry`, `ConsentRequest`, `AudioSource`
- Suffix conventions: `*Hooks` for integration point interfaces, `*Like` for minimal protocol interfaces (e.g., `RelayPoolLike`, `WorkerRelayLike`)

## Code Style

**Formatting:**
- No explicit linter/formatter configured in package (ESLint/Prettier)
- TypeScript strict mode enabled: `strict: true` in `tsconfig.json`
- 2-space indentation observed throughout codebase
- No explicit line length limit enforced, but typical lines are <100 characters
- Semicolons required (TypeScript module convention)

**Linting:**
- TypeScript strict mode enforced via `tsconfig.json` with `"strict": true`
- Module resolution: `"moduleResolution": "bundler"` for modern ESM bundlers
- No explicit ESLint config found; relying on TypeScript compiler checks
- Comments in code disallow implicit `any`: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`

## Import Organization

**Order:**
1. External library imports from node_modules (e.g., `nostr-tools`, `vite`)
2. Relative imports from same or parent packages (e.g., `./relay-shim.js`, `./types.js`)
3. Type imports using `import type` syntax for type-only imports

**Path Aliases:**
- No path aliases configured; all imports are explicit relative paths
- Monorepo packages imported via `@napplet/shim`, `@napplet/shell`, `@napplet/vite-plugin` in package.json
- ESM-only: `verbatimModuleSyntax: true` in tsconfig enforces explicit `import type` for types

**Example pattern** from `packages/shim/src/index.ts`:
```typescript
import { finalizeEvent } from 'nostr-tools/pure';
import { loadOrCreateKeypair } from './napp-keypair.js';
import type { NappKeypair } from './napp-keypair.js';
import { setKeyboardShimKeypair, installKeyboardShim } from './keyboard-shim.js';
import { BusKind, AUTH_KIND, PSEUDO_RELAY_URI, PROTOCOL_VERSION } from './types.js';
import type { NostrEvent } from './types.js';
```

## Error Handling

**Patterns:**
- Silent catches for non-critical errors: `catch { /* intentional */ }` or `catch { /* best-effort */ }`
- Explicit error tags in NIP-01 events: `[['error', 'reason']]` for structured error responses
- Promise rejection with descriptive Error objects: `reject(new Error('Signer request timed out'))`
- Try-catch around localStorage access: localStorage may be unavailable or throw
- Validation failures return early with explicit error responses (no exceptions thrown for validation)

**Example pattern** from `packages/shim/src/index.ts`:
```typescript
try {
  payload = event.content ? JSON.parse(event.content) : {};
} catch {
  payload = {};
}
```

**Error messaging:**
- Prefixed error reasons: `'auth-required: ...'`, `'invalid: ...'`, `'duplicate: ...'`, `'quota exceeded: ...'`
- Storage errors: `'missing key tag'`, `'storage:read capability denied'`, `'storage write failed'`

## Logging

**Framework:** console (native browser/Node.js console API)

**Patterns:**
- `console.log()` for informational messages (build logs, manifest generation status)
- Plugin logging prefixed: `[nip5a-manifest]` in vite-plugin
- Intentional error swallowing with comments explaining why
- No dedicated logging library; output only during build or critical paths

**Example** from `packages/vite-plugin/src/index.ts`:
```typescript
console.log('[nip5a-manifest] ${options.nappType}: manifest signed by ${pubkey.slice(0, 8)}...');
console.log('[nip5a-manifest] VITE_DEV_PRIVKEY_HEX not set — skipping manifest generation');
console.error(`[nip5a-manifest] dist directory not found: ${distPath}`);
```

## Comments

**When to Comment:**
- File headers explaining module purpose (required for main modules)
- Section dividers using `// ─── Section Name ──────────────...` format
- JSDoc comments for public API functions
- Inline comments explaining non-obvious logic (protocol violations, special cases)
- Comments in catch blocks explaining why errors are ignored

**JSDoc/TSDoc:**
- Required for all exported functions
- Format: `@param`, `@returns`, `@example` tags
- Example blocks using markdown triple-backticks

**Example** from `packages/shim/src/relay-shim.ts`:
```typescript
/**
 * Open a live NIP-01 subscription through the shell's relay pool.
 *
 * Sends `['REQ', subId, ...filters]` via postMessage to the parent shell.
 * The shell queries its local cache and connected relays, streaming
 * matching events back via `['EVENT', subId, event]`.
 *
 * @param filters   One or more NIP-01 subscription filters
 * @param onEvent   Called for each matching event delivered by the shell
 * @param onEose    Called when the shell signals end of stored events (EOSE)
 * @param options   Optional: `{ relay, group }` for NIP-29 scoped relay subscriptions
 * @returns A Subscription handle with a `close()` method to tear down the subscription
 *
 * @example
 * ```ts
 * const sub = subscribe(
 *   { kinds: [1], limit: 20 },
 *   (event) => console.log('Got event:', event),
 *   () => console.log('EOSE'),
 * );
 * // Later: sub.close();
 * ```
 */
```

## Function Design

**Size:**
- Functions range from 5-100 lines
- Helper functions in `pseudo-relay.ts` (e.g., `checkReplay()`, `matchesFilter()`) are typically 10-15 lines
- Main message handlers (`handleEvent()`, `handleAuth()`) span 50-100 lines due to complex protocol handling

**Parameters:**
- Prefer explicit parameters over object spreading
- Use single object parameter for optional settings: `options?: { relay?: string; group?: string }`
- Callback-based API: `onEvent`, `onEose`, `callback` patterns for subscription
- Type parameters for flexibility: `hooks: ShellHooks` for dependency injection

**Return Values:**
- Functions return Promise for async operations: `Promise<NostrEvent>`, `Promise<unknown>`
- Subscription functions return objects with teardown methods: `{ close(): void }`
- Factory functions return interface types: `createPseudoRelay(): PseudoRelay`
- Early returns for validation failures: `if (!condition) return;`

## Module Design

**Exports:**
- Prefer named exports: `export function subscribe()`, `export const audioManager = { ... }`
- Default exports only for config files (tsup.config.ts, etc.)
- Public API clearly delineated: `// ─── Public API exports ────...` comments
- Type exports with `export type` when appropriate

**Barrel Files:**
- `packages/shell/src/index.ts` acts as main barrel export
- Re-exports all public interfaces and factory functions
- Organized by concern: types, factories, utilities, protocol constants

**Example** from `packages/shell/src/index.ts`:
```typescript
export { createPseudoRelay } from './pseudo-relay.js';
export type { PseudoRelay } from './pseudo-relay.js';
export type { ShellHooks, ... } from './types.js';
export { originRegistry } from './origin-registry.js';
```

## Module-Level State

**Patterns:**
- Local state managed within IIFE closures in factory functions
- Module-level Maps for registries: `const registry = new Map<Window, string>()`
- Explicit initialization and cleanup functions: `installStorageShim()`, `cleanup()`
- State persistence for ACL: `aclStore.persist()`, `aclStore.load()` with localStorage

**Example** from `packages/shell/src/pseudo-relay.ts`:
```typescript
export function createPseudoRelay(hooks: ShellHooks): PseudoRelay {
  // ─── Module-level state ──────────────────────────────────────
  const pendingChallenges = new Map<string, string>();
  const subscriptions = new Map<string, { windowId: string; filters: NostrFilter[] }>();
  // ... rest of implementation
}
```

---

*Convention analysis: 2026-03-29*
