---
phase: 21-shim-discovery-api
status: passed
verified: 2026-03-31
verifier: inline (no Task() API available)
requirements: [SHIM-01, SHIM-02, SHIM-03, SHIM-04]
---

# Phase 21: Shim Discovery API — Verification

## Goal

Napplet code can query available services and check version compatibility through a typed API on the window global.

## Verification Status: PASSED

All 20 must-have checks pass. Build and type-check clean.

## Must-Haves Verified

### Plan 21-01: discovery-shim.ts module

| Check | Status |
|-------|--------|
| `packages/shim/src/discovery-shim.ts` exists | PASS |
| `ServiceInfo` interface exported with `name: string` | PASS |
| `ServiceInfo` interface has `version: string` | PASS |
| `ServiceInfo` interface has `description?: string` | PASS |
| `discoverServices()` returns `Promise<ServiceInfo[]>` | PASS |
| `hasService(name)` exported | PASS |
| `hasServiceVersion(name, version)` exported | PASS |
| Uses `BusKind.SERVICE_DISCOVERY` (kind 29010) | PASS |
| Module-level `cachedServices` variable present | PASS |
| Cache guard: returns cached value on second call | PASS |

### Plan 21-02: window.napplet global and public exports

| Check | Status |
|-------|--------|
| `window.napplet` installed in `index.ts` | PASS |
| `discoverServices` imported and re-exported | PASS |
| `hasService` imported and re-exported | PASS |
| `hasServiceVersion` imported and re-exported | PASS |
| `ServiceInfo` type re-exported | PASS |
| `discoverServices` present in `dist/index.js` | PASS |
| `ServiceInfo` present in `dist/index.d.ts` | PASS |
| `pnpm --filter @napplet/shim type-check` exits 0 | PASS |
| `pnpm build` (turborepo) 14/14 tasks successful | PASS |

## Requirements Traceability

| Requirement | Description | Status |
|------------|-------------|--------|
| SHIM-01 | `discoverServices()` returns typed `ServiceInfo[]` | PASS |
| SHIM-02 | `hasService(name)` checks service availability by name | PASS |
| SHIM-03 | `hasServiceVersion(name, version)` checks exact version match | PASS |
| SHIM-04 | Discovery API accessible via `window.napplet` global | PASS |

## Regression Gate

- `@napplet/runtime` test suite: 39/39 tests pass
- `@napplet/services` has no test files (pre-existing, unrelated to this phase)
- No regressions detected in prior-phase test suites

## Human Verification Items

These items require runtime verification in a browser:

1. **window.napplet is available in iframe context** — Load a napplet iframe and confirm `window.napplet.discoverServices` is a function (no imports required)
2. **Cache behavior** — Call `discoverServices()` twice; second call should not emit a second REQ (verify in shell message logs)
3. **Shell integration** — When shell has registered services, `discoverServices()` returns the expected `ServiceInfo[]` array with correct `s`, `v`, `d` tags parsed

These are integration-level tests requiring a running shell+napplet environment. They are tracked for UAT.
