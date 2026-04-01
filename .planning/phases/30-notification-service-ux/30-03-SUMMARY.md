---
plan: 30-03
phase: 30-notification-service-ux
title: Napplet-driven notification examples and regression coverage
status: complete
completed: 2026-04-01
---

## What Was Built

Added napplet-driven notification triggers to both demo napplets, created a full unit test suite for the notification service, and created a Playwright e2e spec covering the full notification UX lifecycle.

## Key Files Created/Modified

- `apps/demo/napplets/chat/src/main.ts` — Added `notifyCreate()` helper and call after `emit('chat:message')` with `title: 'Chat message sent'` and body containing the message text (truncated to 60 chars).
- `apps/demo/napplets/bot/src/main.ts` — Added `notifyCreate()` helper and calls in both `handleTeachCommand()` (rule learned) and `handleChatMessage()` (reply sent) with `title: 'Bot activity'`.
- `packages/services/src/notification-service.test.ts` (created) — 18 unit tests covering: descriptor values, message filtering, `notifications:create` (with onChange callback), `notifications:list` (per-window scoping), `notifications:read` (read-flip, idempotency), `notifications:dismiss`, `maxPerWindow` FIFO eviction, and `onWindowDestroyed` cleanup.
- `tests/e2e/demo-notification-service.spec.ts` (created) — 7 Playwright tests covering: node visibility, node-control create/toast path, list/inspector open, mark-read, dismiss, napplet-driven chat path, inspector per-item controls.

## Decisions Made

- `notifyCreate()` in napplets uses the same `emit()` call as other inter-pane topics — no host shortcut — so it exercises the real napplet→runtime→service dispatch path.
- Notification emission from napplets is best-effort (silent catch) so it does not break the main chat/bot flow if notifications capability is denied.
- Unit tests follow the `signer-service.test.ts` pattern exactly (direct `handleMessage` calls, `sent` array capture, no test helpers).
- E2e test uses a dedicated demo server on port 4174 (same pattern as `demo-audit-correctness.spec.ts`) with serial mode.

## Verification

- `grep notifications:create apps/demo/napplets/chat/src/main.ts apps/demo/napplets/bot/src/main.ts` — present in both files.
- `pnpm --filter @napplet/services test:unit -- notification-service` — 18 tests pass.
- `pnpm --filter @napplet/demo build` — passes.
- `pnpm type-check` — 14 tasks successful.
- `tests/e2e/demo-notification-service.spec.ts` exists and covers both node-control and napplet-driven paths.

## Self-Check: PASSED
