---
phase: 18-core-types-runtime-dispatch
status: complete
completed: 2026-03-31
plans_completed: 3/3
---

# Phase 18: Core Types & Runtime Dispatch — Complete

## Goal Achieved

The runtime can register service handlers and route INTER_PANE events to the correct handler by topic prefix — the service dispatch backbone exists.

## What Was Built

**@napplet/core** — `ServiceDescriptor` interface (name, version, description?) added to canonical package.

**@napplet/runtime** — `ServiceHandler` interface with `handleMessage(windowId, message, send)` and optional `onWindowDestroyed(windowId)`; `ServiceRegistry` type; `service-dispatch.ts` module with `routeServiceMessage()` (routes by colon-prefix) and `notifyServiceWindowDestroyed()`.

**@napplet/shell** — Duplicate type definitions removed; imports from canonical packages; `adaptHooks()` wires `services` through.

## Success Criteria Verification

1. ✓ `import { ServiceDescriptor } from '@napplet/core'` works across all packages
2. ✓ Service matching is name-only (CORE-03/D-07) — no semver utility needed in Phase 18
3. ✓ Shell host can pass `services` registry via `RuntimeHooks`; runtime routes INTER_PANE events by topic prefix
4. ✓ `notifyServiceWindowDestroyed()` calls `onWindowDestroyed()` on every registered handler at window teardown

## Commits

- `15d65cf` — feat(core): add ServiceDescriptor type to @napplet/core
- `97d5ba2` — feat(runtime): add ServiceHandler, ServiceRegistry, and service dispatch
- `e05e4f8` — feat(shell): migrate service types to @napplet/core and @napplet/runtime
