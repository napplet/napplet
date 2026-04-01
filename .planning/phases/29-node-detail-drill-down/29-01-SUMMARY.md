---
plan: 29-01
phase: 29-node-detail-drill-down
status: complete
completed: 2026-04-01
---

# Plan 29-01: Node Detail Model and Compact Summary Surfaces — Complete

## What Was Built

Created `apps/demo/src/node-details.ts` as the canonical node-detail adapter. The module:
- Defines `NodeDetail`, `SummaryField`, `InspectorSection`, `NodeActivityEntry` types
- Implements `buildNodeDetails()` for all five roles: napplet, shell, acl, runtime, service
- Implements `buildAllNodeDetails()` to enrich an entire topology in one call
- Implements `installActivityProjection()` to project live tap messages into per-node bounded ring buffers (12 entries max)
- All nodes return `drillDownSupported: true`

Updated `apps/demo/src/topology.ts` to add `data-node-id` attributes and `.node-summary` slots on every node card.

Created `apps/demo/src/node-inspector.ts` with `initNodeInspector()` and `setSelectedNodeId()`.

Updated `apps/demo/src/main.ts` to wire up the detail adapter, summary refreshes, inspector init, and per-node click selection.

Updated `apps/demo/index.html` to:
- Add two-pane layout (`#flow-area-inner`, `#topology-pane`, `#inspector-pane`)
- Add CSS for `.node-summary`, inspector pane, and `.inspector-selected` state
- Move topology rendering target from `#flow-area` to `#topology-pane`

## Test Results

22 tests in `tests/unit/demo-node-details-model.test.ts` — all pass.

## Key Files

- `apps/demo/src/node-details.ts` — NEW: node-detail adapter
- `apps/demo/src/node-inspector.ts` — NEW: inspector pane module
- `apps/demo/src/topology.ts` — MODIFIED: data-node-id + node-summary slots
- `apps/demo/src/main.ts` — MODIFIED: wired detail adapter and inspector
- `apps/demo/index.html` — MODIFIED: two-pane layout and CSS
- `tests/unit/demo-node-details-model.test.ts` — NEW: 22 model regression tests

## Self-Check: PASSED
