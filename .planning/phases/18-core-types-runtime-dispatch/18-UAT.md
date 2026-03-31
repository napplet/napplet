---
status: complete
phase: 18-core-types-runtime-dispatch
source: 18-01-SUMMARY.md, 18-02-SUMMARY.md, 18-03-SUMMARY.md, 18-SUMMARY.md
started: 2026-03-31T17:30:00Z
updated: 2026-03-31T17:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. ServiceDescriptor importable from @napplet/core
expected: `import { ServiceDescriptor } from '@napplet/core'` compiles without error. Run `pnpm type-check` — exits 0 with no errors.
result: pass

### 2. ServiceHandler and ServiceRegistry importable from @napplet/runtime
expected: `import { ServiceHandler, ServiceRegistry } from '@napplet/runtime'` compiles without error. Shell and other packages can import from runtime without type errors.
result: pass

### 3. INTER_PANE events route to registered service handlers
expected: A service registered under name `audio` (in the `services` registry passed to `createRuntime`) receives INTER_PANE events whose topic starts with `audio:`. Events with non-matching topics (e.g., `other:foo`) are not routed to the audio handler. This is verified by the dispatch unit tests — run `pnpm test` and confirm all pass.
result: pass

### 4. onWindowDestroyed called on window teardown
expected: When a napplet window is destroyed (via `runtime.destroyWindow(windowId)`), any registered service handler's `onWindowDestroyed(windowId)` is called. Verified by unit tests — `pnpm test` passes.
result: skipped
reason: wiring confirmed by code review — destroyWindow() calls notifyServiceWindowDestroyed() at runtime.ts:953; no test harness available inline

### 5. No duplicate ServiceDescriptor/ServiceHandler/ServiceRegistry in @napplet/shell
expected: `packages/shell/src/types.ts` no longer contains its own definition of those interfaces. Importing `ServiceDescriptor` from `@napplet/shell` still works (re-export). Run `grep -c "export interface ServiceDescriptor" packages/shell/src/types.ts` — should return 0.
result: pass

## Summary

total: 5
passed: 4
issues: 0
pending: 0
skipped: 1

## Gaps

[none yet]
