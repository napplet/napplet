---
phase: 15
plan: 1
status: complete
started: 2026-03-31
completed: 2026-03-31
---

# Summary: 15-01 — Define RuntimeHooks.services Interface and Reserve Service Discovery Kind

## What Was Built

Added the typed service extension interface to the shell package and reserved the SERVICE_DISCOVERY bus kind constant in @napplet/core.

### Key Changes

1. **SERVICE_DISCOVERY constant** — Added `BusKind.SERVICE_DISCOVERY: 29010` to `packages/core/src/constants.ts` (where BusKind is canonically defined, not in shell's types.ts as the plan originally assumed).

2. **Service extension types** — Added `ServiceDescriptor`, `ServiceHandler`, and `ServiceRegistry` interfaces to `packages/shell/src/types.ts` with full JSDoc and @example blocks.

3. **ShellHooks.services** — Added optional `services?: ServiceRegistry` field to the ShellHooks interface.

4. **Public API exports** — Exported all three new types from `packages/shell/src/index.ts`.

### Deviation from Plan

The plan assumed BusKind was defined in `packages/shell/src/types.ts`. After Phase 12 (Core Package), BusKind lives in `packages/core/src/constants.ts`. The SERVICE_DISCOVERY constant was added there instead. The re-export chain (`core -> shell`) means it's available from both packages automatically.

## Key Files

### Created
- (none)

### Modified
- `packages/core/src/constants.ts` — Added SERVICE_DISCOVERY: 29010 to BusKind
- `packages/shell/src/types.ts` — Added ServiceDescriptor, ServiceHandler, ServiceRegistry interfaces and services field on ShellHooks
- `packages/shell/src/index.ts` — Exported the three new types

## Verification

- `pnpm build` — all 13 packages build successfully
- `pnpm type-check` — zero TypeScript errors
- `BusKind.SERVICE_DISCOVERY === 29010`
- `ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry` exported from @napplet/shell
- `ShellHooks.services` is optional, typed as `ServiceRegistry`
- All new types have JSDoc with @example blocks
- Zero behavioral changes — additive only

## Self-Check: PASSED
