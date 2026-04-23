---
status: passed
phase: 12-core-package
verified: 2026-03-31
---

# Phase 12: Core Package — Verification

## Phase Goal
A zero-dependency @napplet/core package exists that all other packages import protocol types and constants from — no duplicate type definitions remain.

## Must-Have Verification

| ID | Requirement | Status | Evidence |
|----|------------|--------|----------|
| CORE-01 | @napplet/core package exists at packages/core/ | PASS | `test -d packages/core` exits 0 |
| CORE-02 | NostrEvent and NostrFilter types exported | PASS | `grep "export.*NostrEvent" packages/core/src/index.ts` matches |
| CORE-03 | BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION exported | PASS | All constants present in index.ts exports |
| CORE-04 | Capability type and ALL_CAPABILITIES exported | PASS | Both present in index.ts |
| CORE-05 | DESTRUCTIVE_KINDS exported | PASS | Present in index.ts |
| CORE-06 | TOPICS with state topic constants exported | PASS | STATE_GET, STATE_SET, STATE_REMOVE, STATE_CLEAR, STATE_KEYS, STATE_RESPONSE all present |
| CORE-07 | Shell imports ALL protocol types from @napplet/core | PASS | 7 shell source files import from '@napplet/core'; no local protocol definitions remain |
| CORE-08 | Shim imports ALL protocol types from @napplet/core | PASS | 2 shim source files import from '@napplet/core'; types.ts is thin re-export |
| CORE-09 | Zero external dependencies | PASS | `dependencies: {}`, no peerDependencies |

## Automated Checks

| Check | Status | Detail |
|-------|--------|--------|
| `pnpm build` (all 12 packages) | PASS | 12 successful, 0 failed |
| `pnpm type-check` (all 9 type-checkable) | PASS | 9 successful, 0 failed |
| No `export interface NostrEvent` in shell/src/ | PASS | 0 matches |
| No `export interface NostrEvent` in shim/src/ | PASS | 0 matches |
| No `export const BusKind = {` in shell/src/ | PASS | 0 matches |
| No `export const BusKind = {` in shim/src/ | PASS | 0 matches |
| No `export const PROTOCOL_VERSION` in shell/src/ | PASS | 0 matches |
| No hardcoded `'shell:state-get'` in enforce.ts | PASS | Uses TOPICS.STATE_GET |
| No hardcoded `'shell:state-get'` in state-proxy.ts | PASS | Uses TOPICS.STATE_GET |
| No hardcoded `'napp:state-response'` in state-shim.ts | PASS | Uses TOPICS.STATE_RESPONSE |
| Shell-specific types preserved (ShellHooks, NappKeyEntry, ConsentRequest) | PASS | All present in types.ts |
| Core package dist output exists | PASS | dist/index.js, dist/index.d.ts present |
| No DOM lib in core tsconfig | PASS | Only ES2022 |

## Backwards Compatibility

| Package | Public API | Status |
|---------|-----------|--------|
| @napplet/shell | All types re-exported for existing consumers | PASS |
| @napplet/shim | subscribe, publish, query, emit, on, nappState, nappStorage unchanged | PASS |
| @napplet/core | New package — no backwards compat needed | N/A |

## Summary

All 9 CORE requirements verified. The @napplet/core package is a zero-dependency single source of truth for protocol definitions. Both shell and shim have been rewired to import from core, eliminating all duplicate type definitions. Full monorepo builds and type-checks pass. Backwards compatibility is preserved through re-exports.
