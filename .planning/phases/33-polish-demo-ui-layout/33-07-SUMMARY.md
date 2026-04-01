---
phase: 33-polish-demo-ui-layout
plan: 07
subsystem: demo-ui-topology
tags: [socket-gravity, leader-line, visual-distinction]
dependency_graph:
  requires: [33-03, 33-06]
  provides: [socket-gravity-symmetry]
  affects: [topology-edge-rendering]
tech_stack:
  added: []
  patterns: [leader-line-socket-positioning]
key_files:
  created: []
  modified:
    - apps/demo/src/topology.ts
decisions: []
metrics:
  duration_ms: ~120
  completed_date: "2026-04-01"
---

# Phase 33 Plan 07: Update Socket Gravity Offsets for Input/Output Distinction

**One-liner:** Fixed socket gravity symmetry by using opposite Y-offsets for start and end sockets, enabling visual distinction between input and output connection points.

## Summary

Completed Task 1: Updated socket gravity values in `apps/demo/src/topology.ts` to use opposite Y-offsets.

The forward and reverse edge configurations now use asymmetric gravity offsets that visually separate input and output sockets:

- **Forward edge (outLine)**: Start socket [12, -8] (right, upward), end socket [12, 8] (right, downward)
- **Reverse edge (inLine)**: Start socket [-12, 8] (left, downward), end socket [-12, -8] (left, upward)

This creates clear visual distinction between input and output connection points on node edges, with sockets appearing at different heights rather than overlapping.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update forward and reverse edge socket gravity offsets | df01aad | apps/demo/src/topology.ts |

## Execution Notes

- Line 211: `endSocketGravity: [12, -8]` → `endSocketGravity: [12, 8]` (forward edge)
- Line 218: `endSocketGravity: [-12, 8]` → `endSocketGravity: [-12, -8]` (reverse edge)
- Start socket gravity values unchanged (maintained symmetry at start points)
- TypeScript type-check passed with no compilation errors

## Verification

Socket gravity values confirmed in topology.ts:

```bash
$ grep "endSocketGravity" apps/demo/src/topology.ts
endSocketGravity: [12, 8],
endSocketGravity: [-12, -8],
```

All success criteria met:
- ✓ Forward edge endSocketGravity has opposite Y-offset [12, 8]
- ✓ Reverse edge endSocketGravity has opposite Y-offset [-12, -8]
- ✓ Start socket gravity values unchanged
- ✓ TypeScript compilation succeeds (pnpm type-check exit 0)

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues

None identified in this plan scope.

## Self-Check: PASSED

- Created files: (none expected)
- Modified files exist: ✓ apps/demo/src/topology.ts
- Commit exists: ✓ df01aad
- Socket gravity values verified: ✓ grep confirms both offsets in place
- TypeScript check: ✓ All 14 packages pass type-check
