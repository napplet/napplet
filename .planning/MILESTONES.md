# Milestones

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
