---
phase: 16
plan: 3
status: complete
started: "2026-03-31"
completed: "2026-03-31"
---

# Summary: Plan 16-03 — Integration Test for Shell-Runtime-ACL-Core Chain

## What was built

Created 19 integration tests verifying the four-package chain:
- **Core exports** (1 test): All constants importable and correct
- **Shell re-exports match core** (8 tests): BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, ALL_CAPABILITIES, DESTRUCTIVE_KINDS, TOPICS are the exact same objects; type aliases are assignable
- **ACL uses core types** (3 tests): grant/check with Identity and bitfield, block/unblock, toKey
- **Runtime in Node.js** (3 tests): createRuntime with mock hooks, exposed registries, AUTH challenge
- **Enforcement gate chain** (2 tests): resolveCapabilities with BusKind, createEnforceGate allow/deny
- **Full chain** (1 test): runtime -> enforce -> acl -> core round-trip with capability revocation

Also updated root `vitest.config.ts` with resolve aliases for workspace packages.

## Key files

### Created
- `tests/unit/shell-runtime-integration.test.ts` — 19 test cases

### Modified
- `vitest.config.ts` — Added resolve aliases for @napplet/* packages

## Self-Check: PASSED
