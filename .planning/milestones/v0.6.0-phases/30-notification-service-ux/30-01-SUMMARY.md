---
plan: 30-01
phase: 30-notification-service-ux
title: Register notification service and host-side notification state
status: complete
completed: 2026-04-01
commit: 065e0fb
---

## What Was Built

Wired the real `@napplet/services` notification service into the demo runtime and created the host-owned state controller that all later toast/inspector rendering will derive from.

## Key Files Created/Modified

- `apps/demo/src/notification-demo.ts` (created) — `createDemoNotificationController()` with snapshot subscription, `handleServiceChange()` callback, and concrete `createDemoNotification`/`requestList`/`markRead`/`dismiss` actions dispatched directly to the service handler
- `apps/demo/src/shell-host.ts` (modified) — imports `createNotificationService`, registers it in `createDemoHooks().services` with `onChange` callback and `maxPerWindow: 50`, exposes `getNotificationServiceHandler()` for host dispatch
- `apps/demo/src/main.ts` (modified) — creates controller before `bootShell()`, passes `handleServiceChange` as the onChange callback, connects the service handler, subscribes to snapshot updates, logs `notification service registered -- host callbacks active`

## Decisions Made

- Used `ServiceHandler.handleMessage()` directly for host-originated actions (bypasses runtime AUTH check which would block host-owned `__demo-host__` window ID)
- `notifications` added to `demoServiceNames` set so it appears in the topology
- `_notificationSnapshot` exposed at module level for later DOM rendering code

## Verification

- `pnpm --filter @napplet/demo build` — passes
- `pnpm type-check` — passes (14 tasks successful)
- Notification service registered and `notifications` appears in service names

## Self-Check: PASSED
