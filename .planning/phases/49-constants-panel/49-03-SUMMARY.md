---
phase: 49
plan: 3
status: complete
started: 2026-04-03
completed: 2026-04-03
---

# Summary: 49-03 Wire Config Into Demo Modules

## What was built
Replaced all hardcoded module-level constants in 5 demo source files with live reads from the `demoConfig` object. Each module now imports `demoConfig` and calls `demoConfig.get()` at usage time, meaning edited values from the constants panel take effect on the next operation.

Constants replaced:
- `FLASH_DURATION` (500ms) in `flow-animator.ts`
- `FLASH_DURATION_MS` (500ms) in `topology.ts`
- `TOAST_DISPLAY_MS` (5000ms) in `main.ts`
- `MAX_RECENT_REQUESTS` (20) in `signer-connection.ts`
- `HEADER_HEIGHT` (40px) and `ROW_HEIGHT` (28px) in `sequence-diagram.ts`

## Key files
- **modified:** `apps/demo/src/flow-animator.ts`
- **modified:** `apps/demo/src/topology.ts`
- **modified:** `apps/demo/src/main.ts`
- **modified:** `apps/demo/src/signer-connection.ts`
- **modified:** `apps/demo/src/sequence-diagram.ts`

## Deviations
None — all 5 modules wired as planned.

## Self-Check: PASSED
- No stale hardcoded constants remain in any of the 5 files
- All 5 files contain `demoConfig.get()` calls
- `pnpm build` and `pnpm type-check` succeed
