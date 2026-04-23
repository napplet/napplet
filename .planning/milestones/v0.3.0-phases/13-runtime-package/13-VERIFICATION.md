---
status: passed
phase: 13
phase_name: runtime-package
verified: 2026-03-31
---

# Phase 13: Runtime Package — Verification Report

## Goal
A browser-agnostic @napplet/runtime package owns the full protocol engine — message dispatch, ACL enforcement, AUTH handshake, subscription lifecycle — depending only on @napplet/core and @napplet/acl.

## Success Criteria Verification

### 1. createRuntime(hooks: RuntimeHooks) callable without DOM or browser globals
**Status: PASSED**
- `packages/runtime/tsconfig.json` has `"lib": ["ES2022"]` only -- no DOM
- `grep -rn` for window., document., localStorage, sessionStorage, MessageEvent in runtime/src/ returns only comment matches
- `pnpm --filter @napplet/runtime type-check` passes without DOM lib
- `setTimeout`/`clearTimeout` declared locally to avoid needing DOM lib

### 2. Runtime handles all five NIP-01 verbs
**Status: PASSED**
- `handleAuth()` — NIP-42 challenge-response, signature verification, napp update detection
- `handleEvent()` — replay check, enforce, dispatch to signer/hotkey/inter-pane/default
- `handleReq()` — subscribe, replay cached events, query relay pool and cache
- `handleClose()` — remove subscription, untrack relay pool subscription
- `handleCount()` — count matching events in buffer
- Note: shell-bridge.ts still has its own copy (Phase 14 will rewire)

### 3. All protocol modules live in packages/runtime/src/
**Status: PASSED**
Files present:
- `enforce.ts` — ACL enforcement gate
- `napp-key-registry.ts` — Identity registry (factory pattern)
- `replay.ts` — Replay detection
- `event-buffer.ts` — Ring buffer + subscription delivery + filter matching
- `acl-state.ts` — ACL state container with persistence hooks
- `manifest-cache.ts` — Manifest cache with persistence hooks
- `state-handler.ts` — State request handler with persistence hooks
- `runtime.ts` — Main factory with full NIP-01 dispatch

### 4. RuntimeHooks interface exported and documented
**Status: PASSED**
- `RuntimeHooks` interface exported from `packages/runtime/dist/index.d.ts`
- 12 sub-hook interfaces (RuntimeRelayPoolHooks, RuntimeCacheHooks, RuntimeAuthHooks, etc.)
- JSDoc with @example block on RuntimeHooks interface
- A non-browser environment can implement all hooks (no DOM types required)

### 5. Only @napplet/core and @napplet/acl as dependencies
**Status: PASSED**
- `package.json` dependencies: `{"@napplet/core": "workspace:*", "@napplet/acl": "workspace:*"}`
- Zero peerDependencies
- No nostr-tools dependency (crypto delegated to hooks)

## Automated Checks

| Check | Result |
|-------|--------|
| `pnpm build` (full monorepo, 13 packages) | PASSED |
| `pnpm type-check` (full monorepo, 11 tasks) | PASSED |
| `pnpm --filter @napplet/runtime build` | PASSED (39.27 KB JS, 27.53 KB DTS) |
| `pnpm --filter @napplet/runtime type-check` | PASSED |
| No DOM lib in tsconfig | PASSED (0 DOM references) |
| No browser API usage in source | PASSED (only in comments) |
| Dependency count = 2 | PASSED (@napplet/core + @napplet/acl) |

## Public API Surface

**Factory functions (8):** createRuntime, createEnforceGate, createNappKeyRegistry, createAclState, createManifestCache, createReplayDetector, createEventBuffer

**Utility functions (6):** resolveCapabilities, formatDenialReason, matchesFilter, matchesAnyFilter, handleStateRequest, cleanupNappState

**Constants (1):** RING_BUFFER_SIZE

**Types (30+):** Runtime, RuntimeHooks, SendToNapplet, all sub-hook interfaces, ConsentRequest, ConsentHandler, NappKeyEntry, PendingUpdate, ManifestCacheEntry, AclEntryExternal, AclCheckEvent, and all container interfaces

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| RT-01: Package scaffolded | PASSED | package.json, tsconfig.json, tsup.config.ts |
| RT-02: RuntimeHooks defined | PASSED | types.ts with 12 sub-hook interfaces |
| RT-03: createRuntime factory | PASSED | runtime.ts exports createRuntime |
| RT-04: All 5 NIP-01 verbs | PASSED | handleAuth, handleEvent, handleReq, handleClose, handleCount |
| RT-05: enforce.ts moved | PASSED | enforce.ts with core imports |
| RT-06: Subscription lifecycle | PASSED | subscriptions Map, REQ/CLOSE handlers |
| RT-07: AUTH handshake | PASSED | handleAuth with challenge-response, sig verify |
| RT-08: Replay detection | PASSED | replay.ts with createReplayDetector |
| RT-09: Event buffer | PASSED | event-buffer.ts with ring buffer + delivery |
| RT-10: NappKeyRegistry moved | PASSED | napp-key-registry.ts as factory |
| RT-11: ACL state container | PASSED | acl-state.ts wrapping @napplet/acl |
| RT-12: No browser deps | PASSED | ES2022 lib only, all I/O via hooks |
| RT-13: Build/type-check | PASSED | Full monorepo build + type-check clean |

## human_verification
None required — all criteria are automatable.
