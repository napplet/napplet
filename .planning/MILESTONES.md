# Milestones

## v0.3.0 Runtime and Core (Shipped: 2026-03-31)

**Phases completed:** 6 phases, 18 plans, 38 tasks

**Key accomplishments:**

- Zero-dep @napplet/core package with all shared protocol types, constants, and topic definitions
- Shell imports all protocol types from @napplet/core — 232 lines of duplicate definitions removed
- Shim imports all protocol types from @napplet/core — 55 lines of duplicate definitions removed
- createShellBridge() rewired to delegate to createRuntime(adaptHooks(hooks)) — shell-bridge.ts reduced from 746 to 180 lines
- Shim types already re-exported from @napplet/core — verified builds and public API unchanged
- Cross-package dependency graph verified clean — full monorepo builds and type-checks with core -> acl -> runtime -> shell DAG
- Removed 8 dead exports from @napplet/shell, deleted duplicate enforce.ts, re-pointed enforce re-exports to @napplet/runtime

---

## v0.2.0 Shell Architecture Cleanup (Shipped: 2026-03-31)

**Phases completed:** 5 phases, 11 plans, 25 tasks

**Key accomplishments:**

- Renamed all PseudoRelay/createPseudoRelay/PSEUDO_RELAY_URI references to ShellBridge/createShellBridge/SHELL_BRIDGE_URI across shell, shim, demo, tests, spec, and docs — hard cut, zero aliases
- @napplet/acl package created with zero dependencies, 10 capability bit constants, and immutable AclState/AclEntry/Identity types enforced by ES2022-only tsconfig
- Implemented pure check() with 3-path decision logic and 9 state mutation functions — all zero-side-effect, immutable-by-construction
- @napplet/acl builds and type-checks with zero errors — complete public API (27 exports) verified self-contained with zero external dependencies

---

## v0.1.0 Alpha (Shipped: 2026-03-30)

**Phases completed:** 6 phases, 30 plans, 12 tasks

**Key accomplishments:**

- Added event.source === window.parent guard clauses to all three shim message handlers to prevent message forgery from co-loaded scripts
- Replaced comma-joined storage key serialization with repeated NIP ['key', name] tags to prevent data corruption on keys containing commas
- Renamed all hyprgate protocol identifiers to napplet across all packages, spec, and plugin docs -- zero hyprgate references remain in TypeScript source
- Added unified rejectAuth() helper to clear pending message queue and send NOTICE on all 5 AUTH rejection paths, fixing security race condition
- Playwright smoke test proves AUTH handshake completes between shell and napplet in real browser with sandboxed iframes and real Schnorr signatures

---
