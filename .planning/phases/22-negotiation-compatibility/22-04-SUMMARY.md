---
phase: 22-negotiation-compatibility
plan: "04"
subsystem: runtime
tags: [consent, undeclared-service, inter-pane, dispatch, runtime]
provides:
  - checkUndeclaredService() function for INTER_PANE dispatch-time consent
  - undeclaredServiceConsents per-session consent cache
  - ConsentRequest with type='undeclared-service' and serviceName raised when service used without declaration
affects:
  - packages/runtime/src/runtime.ts
tech-stack:
  patterns:
    - Two-step nappKeyRegistry lookup (getPubkey → getEntry) for windowId resolution
    - Session consent cache (Set<"windowId:serviceName">) prevents repeated prompts
key-files:
  modified:
    - packages/runtime/src/runtime.ts
key-decisions:
  - "Used two-step lookup from Task 4 from the start — no getByWindowId needed"
  - "Check placed BEFORE routeServiceMessage so consent gate fires even for service-routed topics"
  - "Shell: prefixes (checked earlier) bypass the undeclared check entirely"
requirements-completed:
  - NEG-05
duration: "4 min"
completed: "2026-03-31"
---

# Phase 22 Plan 04: Undeclared service consent at dispatch time — Summary

Added `checkUndeclaredService()` to the runtime and integrated it into the INTER_PANE handler. When a napplet sends an event with a service topic prefix (e.g., `audio:play`) for a registered service it did not declare in its manifest requires, the runtime raises a `ConsentRequest` with `type='undeclared-service'` and `serviceName`. Per-session consent caching (`undeclaredServiceConsents`) prevents repeated prompts for the same napplet+service combination.

**Duration:** 4 min | **Tasks:** 5 | **Files:** 1

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Add undeclaredServiceConsents Set to runtime state | fa676d6 | Done |
| 2 | Add checkUndeclaredService function | fa676d6 | Done |
| 3 | Integrate check into INTER_PANE dispatch | fa676d6 | Done |
| 4 | Use existing getPubkey + getEntry for windowId lookup | fa676d6 | Done (pre-implemented) |
| 5 | Build and type-check runtime | fa676d6 | Done |

## Verification

- `grep "checkUndeclaredService" packages/runtime/src/runtime.ts` — PASS
- `grep "undeclaredServiceConsents" packages/runtime/src/runtime.ts` — PASS
- `grep "undeclared-service" packages/runtime/src/runtime.ts` — PASS
- INTER_PANE handler checks for undeclared service usage before routeServiceMessage — PASS
- `pnpm --filter @napplet/runtime build` — PASS (exits 0)

## Deviations from Plan

None — plan executed exactly as written. Task 4's two-step lookup was implemented proactively in Task 2, so Task 4 was a no-op.

## Issues Encountered

None.

## Self-Check: PASSED
