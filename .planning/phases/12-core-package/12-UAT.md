---
status: complete
phase: 12-16 (milestone v0.3.0)
source: 12-01-SUMMARY.md, 12-02-SUMMARY.md, 12-03-SUMMARY.md, 13-01-SUMMARY.md, 13-02-SUMMARY.md, 13-03-SUMMARY.md, 13-04-SUMMARY.md, 13-05-SUMMARY.md, 14-01-SUMMARY.md, 14-02-SUMMARY.md, 14-03-SUMMARY.md, 15-01-SUMMARY.md, 15-02-SUMMARY.md, 16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md
started: 2026-03-31T13:27:00Z
updated: 2026-03-31T13:40:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Core package zero-dependency build
expected: `@napplet/core` has zero runtime deps and zero peer deps. Build succeeds producing ESM output.
result: pass

### 2. Core exports correctness
expected: Core exports BusKind (9 kinds), TOPICS (29 entries), ALL_CAPABILITIES (10 caps), DESTRUCTIVE_KINDS (Set of 0,3,5,10002), AUTH_KIND (22242), SHELL_BRIDGE_URI ("napplet://shell"), PROTOCOL_VERSION ("2.0.0"), BusKind.SERVICE_DISCOVERY (29010).
result: pass

### 3. Runtime browser-agnostic constraint
expected: `@napplet/runtime` source files contain no browser API calls (window, document, localStorage, postMessage, etc.) — only type references and comments.
result: pass

### 4. Runtime public API surface
expected: 7 factory functions (createRuntime, createEnforceGate, createNappKeyRegistry, createAclState, createManifestCache, createReplayDetector, createEventBuffer), 6 utility functions, 1 constant (RING_BUFFER_SIZE). Exactly 14 exports total.
result: pass

### 5. Shell re-exports reference equality
expected: Shell's BusKind, AUTH_KIND, TOPICS, ALL_CAPABILITIES, DESTRUCTIVE_KINDS are the exact same object references as core's — not copies.
result: pass

### 6. Package dependency DAG
expected: core(none) → acl(none) → runtime(core+acl) → shell(core+runtime). Shim depends on core only. No circular dependencies.
result: pass

### 7. Service extension interface
expected: BusKind.SERVICE_DISCOVERY === 29010. ServiceDescriptor, ServiceHandler, ServiceRegistry types exported from @napplet/shell. ShellHooks has optional `services` field.
result: pass

### 8. SPEC.md service discovery documentation
expected: SPEC.md contains Section 11 "Service Discovery [OPEN]" with subsections covering kind 29010 protocol, tag schema, lifecycle, and backwards compatibility.
result: pass

### 9. Core unit tests
expected: 13 tests pass covering all exports — BusKind constants, AUTH_KIND, SHELL_BRIDGE_URI, ALL_CAPABILITIES, DESTRUCTIVE_KINDS, TOPICS, type compile checks.
result: pass

### 10. Runtime unit tests
expected: 26 tests pass covering AUTH handshake, REQ/EVENT/CLOSE/COUNT dispatch, ACL enforcement, message queuing, and lifecycle.
result: pass

### 11. Shell-runtime-acl-core integration tests
expected: 19 tests pass verifying four-package chain — core exports, shell re-exports match, ACL uses core types, runtime works in Node.js, enforcement gate chain, full round-trip.
result: pass

### 12. Full monorepo build
expected: `pnpm build` completes with all 13 tasks successful, 0 failures.
result: pass

### 13. Full monorepo type-check
expected: `pnpm type-check` completes with all tasks successful, 0 TypeScript errors.
result: issue
reported: "runtime type-check fails — dispatch.test.ts uses setTimeout 8 times but runtime tsconfig excludes DOM lib. 8 TS2304 errors. 11/12 type-check tasks pass, runtime fails."
severity: major

## Summary

total: 13
passed: 12
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "pnpm type-check completes with all tasks successful, 0 TypeScript errors"
  status: failed
  reason: "User reported: runtime type-check fails — dispatch.test.ts uses setTimeout 8 times but runtime tsconfig excludes DOM lib. 8 TS2304 errors. 11/12 type-check tasks pass, runtime fails."
  severity: major
  test: 13
  root_cause: "dispatch.test.ts uses setTimeout() for async waits but runtime's tsconfig.json has lib: ['ES2022'] without DOM — setTimeout is not declared. Test runs fine under vitest (which provides Node globals) but tsc --noEmit fails."
  artifacts:
    - path: "packages/runtime/src/dispatch.test.ts"
      issue: "8 uses of setTimeout without type declaration"
    - path: "packages/runtime/tsconfig.json"
      issue: "lib: ['ES2022'] intentionally excludes DOM"
  missing:
    - "Add declare function setTimeout(...) at top of dispatch.test.ts, or create a separate tsconfig for tests that includes DOM types"
  debug_session: ""
