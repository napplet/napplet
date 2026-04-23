---
plan: 36-01
phase: 36
title: "Consolidate ConsentRequest to @napplet/runtime canonical — TYPE-01"
status: complete
completed: "2026-04-01"
---

# Summary: Plan 36-01 — TYPE-01 ConsentRequest Consolidation

## What Was Built

Removed the stale `ConsentRequest` interface from `packages/shell/src/types.ts` and redirected
all shell-side references to the canonical definition in `@napplet/runtime`. The shell's local
copy was missing the `type` discriminator field and `serviceName` — a stale divergence introduced
before Phase 13 extracted the runtime.

## Tasks Completed

1. **36-01-01**: Removed stale ConsentRequest interface and JSDoc block from `packages/shell/src/types.ts`
2. **36-01-02**: Updated `packages/shell/src/shell-bridge.ts` — merged ConsentRequest into the `@napplet/runtime` import, removed the `as ConsentHandler` type cast
3. **36-01-03**: Updated `packages/shell/src/index.ts` — removed ConsentRequest from the `./types.js` re-export block, added `export type { ConsentRequest } from '@napplet/runtime'`
4. **36-01-04**: Ran `pnpm type-check` — 14/14 packages passed with zero errors

## Acceptance Criteria Met

- `grep "ConsentRequest" packages/shell/src/types.ts` returns zero results ✓
- `grep "ConsentRequest" packages/shell/src/shell-bridge.ts` shows import from `@napplet/runtime` ✓
- `grep "as ConsentHandler" packages/shell/src/shell-bridge.ts` returns zero results ✓
- `grep "ConsentRequest" packages/shell/src/index.ts` shows `from '@napplet/runtime'` ✓
- `pnpm type-check` passes with zero errors ✓

## Key Files

- `packages/shell/src/types.ts` — ConsentRequest removed (was lines 62-76)
- `packages/shell/src/shell-bridge.ts` — imports ConsentRequest from @napplet/runtime; cast removed
- `packages/shell/src/index.ts` — re-exports ConsentRequest from @napplet/runtime

## Deviations

None. Executed exactly as planned.

## Self-Check: PASSED
