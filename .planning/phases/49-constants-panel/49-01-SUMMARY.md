---
phase: 49
plan: 1
status: complete
started: 2026-04-03
completed: 2026-04-03
---

# Summary: 49-01 Mutable Demo Config Object

## What was built
Created `apps/demo/src/demo-config.ts` — a mutable configuration registry holding all 23 protocol magic numbers (13 editable behavioral constants + 10 read-only protocol constants). The DemoConfig class provides get/set/reset/resetAll API with clamping, modification tracking, package/domain grouping, and a subscribe-based change notification system. All state is in-memory (session-scoped — resets on page reload).

## Key files
- **created:** `apps/demo/src/demo-config.ts`

## Deviations
None — implemented exactly as planned.

## Self-Check: PASSED
- `demoConfig.getAllDefs()` returns 23 constants
- `demoConfig.get('core.REPLAY_WINDOW_SECONDS')` returns 30
- `demoConfig.getByPackage()` returns groups for core, runtime, services, acl, demo, shim
- `demoConfig.getByDomain()` returns groups for timeouts, sizes, ui-timing, protocol
- `pnpm build` succeeds
- `pnpm type-check` succeeds
