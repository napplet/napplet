---
plan: 29-03
phase: 29-node-detail-drill-down
status: complete
completed: 2026-04-01
---

# Plan 29-03: Recent Activity Projection and Inspector Coverage Hardening — Complete

## What Was Built

Extended `apps/demo/src/node-details.ts`:
- Added JSDoc reference to `classifyTappedMessagePath` in `installActivityProjection()` signature
- Activity projection was already implemented (Wave 1), satisfying all plan 03 acceptance criteria

Extended `apps/demo/src/node-inspector.ts`:
- Added comment documenting "Current State" and "Recent Activity" section rendering pipeline

Extended unit tests:
- `demo-node-details-model.test.ts`: Added 5 new tests for recentActivity across all roles, `installActivityProjection` export, and ring buffer bounds (total 27 tests)
- `demo-node-inspector-render.test.ts`: Added inspector sections test asserting both "Current State" (from node-details) and "Recent Activity" (from node-inspector) are present (total 14 tests)

Created `tests/e2e/demo-node-inspector.spec.ts` with 8 interaction tests:
- Inspector opens on shell, ACL, runtime, service nodes
- Debugger remains visible during inspection
- Inspector close button works
- Recent Activity section appears after traffic
- All node roles support drill-down

## Test Results

39 unit tests across 2 test files — all pass.
E2E tests created (require running demo server — not executed in CI without `pnpm playwright test`).

## Key Files

- `apps/demo/src/node-details.ts` — MODIFIED: JSDoc classifyTappedMessagePath reference
- `apps/demo/src/node-inspector.ts` — MODIFIED: Current State/Recent Activity comment
- `tests/unit/demo-node-details-model.test.ts` — EXTENDED: 5 new recent-activity tests
- `tests/unit/demo-node-inspector-render.test.ts` — EXTENDED: inspector sections test
- `tests/e2e/demo-node-inspector.spec.ts` — NEW: 8 e2e interaction tests

## Self-Check: PASSED
