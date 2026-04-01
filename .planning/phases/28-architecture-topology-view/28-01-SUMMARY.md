---
phase: 28-architecture-topology-view
plan: 01
subsystem: ui
tags: [demo, topology, architecture, runtime, acl]
requires:
  - phase: 27-demo-audit-correctness
    provides: demo correctness baseline and audited host/runtime paths
provides:
  - layered topology model derived from demo host/runtime inputs
  - architecture view markup separating napplets, shell, acl, runtime, and services
  - regression coverage for topology structure and rendered regions
affects: [29-node-detail-drill-down, 30-notification-service-ux, 31-signer-connection-ux]
tech-stack:
  added: []
  patterns: [shared topology model, runtime-backed service enumeration, generated architecture markup]
key-files:
  created: [apps/demo/src/topology.ts, tests/unit/demo-topology-model.test.ts, tests/unit/demo-topology-render.test.ts]
  modified: [apps/demo/index.html, apps/demo/src/main.ts, apps/demo/src/shell-host.ts]
key-decisions:
  - "Moved the architecture view to a generated layered topology so markup and animation share one source of truth."
  - "Derived visible services from demo host/runtime wiring instead of a UI-maintained placeholder list."
patterns-established:
  - "Demo topology ids are explicit and stable for runtime, acl, shell, napplets, and services."
  - "The main demo layout is rendered from topology.ts rather than hard-coded in index.html."
requirements-completed: [ARCH-01, ARCH-02]
duration: 9min
completed: 2026-04-01
---

# Phase 28 Plan 01 Summary

**Layered topology model and generated demo architecture view that separates napplets, shell, ACL, runtime, and wired services**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-01T11:04:44Z
- **Completed:** 2026-04-01T11:13:30Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added `apps/demo/src/topology.ts` as the shared topology source for node ids, hierarchy, edges, and rendered markup.
- Replaced the old fixed three-column demo scene with a layered architecture view rendered into `#flow-area`.
- Added model and render tests that lock the shell, ACL, runtime, napplet, and service structure.

## Task Commits

Inline execute-phase fallback in this Codex runtime used a single final phase commit instead of per-task subagent commits.

## Files Created/Modified

- `apps/demo/src/topology.ts` - topology model, ids, edges, and markup renderer
- `apps/demo/src/shell-host.ts` - demo topology inputs and runtime-backed service tracking
- `apps/demo/src/main.ts` - topology render bootstrap and napplet mounting
- `apps/demo/index.html` - topology host shell and layered architecture CSS
- `tests/unit/demo-topology-model.test.ts` - hierarchy and id regression coverage
- `tests/unit/demo-topology-render.test.ts` - rendered region regression coverage

## Decisions Made

- Generated the architecture view from shared topology data instead of duplicating structure in HTML and animation code.
- Kept napplet frame containers and ACL mount points inside generated napplet cards so existing demo behavior stayed intact.

## Deviations from Plan

None.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

Phase 29 can now attach node detail affordances to stable topology nodes instead of reverse-engineering the old flattened layout.
