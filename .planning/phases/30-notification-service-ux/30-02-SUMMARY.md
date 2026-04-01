---
plan: 30-02
phase: 30-notification-service-ux
title: Notification node, inspector, and toast UX
status: complete
completed: 2026-04-01
---

## What Was Built

Rendered the notification service as a first-class part of the demo with visible UX surfaces for the node summary, toast layer, and inspector panel.

## Key Files Modified

- `apps/demo/src/main.ts` — Added `renderToast()`, `renderNotificationNodeSummary()`, `renderNotificationInspector()`, `injectNotificationControls()`, and click handlers for all notification node buttons and inspector item controls. Notification controller subscriber now shows toasts and updates summary/inspector on snapshot changes.
- `apps/demo/src/flow-animator.ts` — Extended `detectServiceTarget()` to recognize `notifications:*` topics; added `isNotificationTopic()` helper; added host-originated notification flash path; added per-topic label rendering in the flow log.
- `apps/demo/index.html` — Already had the correct containers from plan 30-01 (no changes needed).

## Decisions Made

- Notification controls injected from `<template id="notification-node-controls-template">` into the live topology service node after `renderDemoTopology()` completes, keeping the template approach and avoiding duplicate IDs.
- Toast display duration: 5000ms.
- Inspector opens automatically when the "list state" button is clicked.
- `escapeHtml()` defined locally in `main.ts` since it's a pure utility needed in the render functions.
- Flow-animator uses a `[data-notif-topic]` attribute to deduplicate topic labels in the flow log rather than re-appending on every message.

## Verification

- `grep` confirms all required DOM IDs and service cue strings are present.
- `pnpm --filter @napplet/demo build` — passes.
- `pnpm type-check` — 14 tasks successful.

## Self-Check: PASSED
