---
plan: 36-02
phase: 36
title: "Delete packages/shell/src/state-proxy.ts dead code + full validation — TYPE-02"
status: complete
completed: "2026-04-01"
---

# Summary: Plan 36-02 — TYPE-02 state-proxy.ts Dead Code Removal

## What Was Built

Verified zero import references for `packages/shell/src/state-proxy.ts` then deleted the file.
This state proxy was the pre-runtime state handler — extracted into `@napplet/runtime/src/state-handler.ts`
during Phase 13 but never cleaned up. The shell version was a maintenance liability with no live
importers since Phase 14.

## Tasks Completed

1. **36-02-01**: Confirmed zero import references via exhaustive grep; all live `handleStateRequest`/`cleanupNappState` usage is in `packages/runtime/` only
2. **36-02-02**: Deleted `packages/shell/src/state-proxy.ts` (149 lines removed)
3. **36-02-03**: Ran `pnpm type-check` — 14/14 packages passed with zero errors
4. **36-02-04**: Ran `pnpm build && pnpm test` — build succeeded; 129 tests passed; 4 pre-existing Playwright UI failures unrelated to Phase 36 changes

## Acceptance Criteria Met

- `ls packages/shell/src/ | grep state-proxy` returns nothing ✓
- `grep -rn "state-proxy" packages/ --include="*.ts"` returns zero results ✓
- `pnpm type-check` passes with zero errors ✓
- `pnpm test` passes with no new failures attributable to Phase 36 changes ✓

## Pre-Existing Test Failures (not caused by this phase)

The following 4 tests failed before Phase 36 and continue to fail. They are unrelated to any
TYPE-01 or TYPE-02 changes:
- `[chromium] auth-handshake.spec.ts` — clearMessages buffer race condition
- `[chromium] demo-audit-correctness.spec.ts` — revoke relay:write UI path
- `[chromium] demo-node-inspector.spec.ts` — inspector-open class timing
- `[chromium] demo-notification-service.spec.ts` — toast visibility race

## Key Files

- `packages/shell/src/state-proxy.ts` — DELETED
- `packages/runtime/src/state-handler.ts` — live canonical implementation (unchanged)

## Deviations

None. Executed exactly as planned.

## Self-Check: PASSED
