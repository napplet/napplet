---
phase: 18-core-types-runtime-dispatch
plan: 02
status: complete
completed: 2026-03-31
commit: 97d5ba2
---

# Plan 18-02: ServiceHandler interface and runtime service dispatch

## Outcome

- `ServiceHandler` interface added to `packages/runtime/src/types.ts` with `handleMessage(windowId, message, send)` signature and optional `onWindowDestroyed(windowId)`
- `ServiceRegistry` type added as `Record<string, ServiceHandler>`
- `packages/runtime/src/service-dispatch.ts` created with `routeServiceMessage()` and `notifyServiceWindowDestroyed()`
- `packages/runtime/src/runtime.ts` updated: services registry initialised from `hooks.services`, INTER_PANE events routed via `routeServiceMessage()`, `notifyServiceWindowDestroyed()` called on window teardown
- All new exports added to `packages/runtime/src/index.ts`

## Verification

- `pnpm build` passes
- `pnpm type-check` passes
- INTER_PANE routing by topic prefix (colon-split) is live
