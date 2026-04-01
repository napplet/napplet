---
phase: 33-polish-demo-ui-layout
plan: 09
subsystem: demo-ui-topology
tags: [socket-gravity, leader-line, vertical-layout, approach-angles]
dependency_graph:
  requires: [33-07]
  provides: [socket-gravity-vertical-approach]
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
  duration_ms: ~60
  completed_date: "2026-04-01"
---

# Phase 33 Plan 09: Fix Socket Gravity Approach Angles for Vertical Topology

**One-liner:** Changed socket gravity from X-dominant to Y-dominant values so edges exit from bottom/top of nodes rather than sides, matching the vertical flex-column topology layout.

## Summary

Fixed the "lines approach gravity points at wrong angles" partial from UAT retest.

Root cause: `.topology-layout` uses `flex-direction: column` (nodes stacked vertically). The previous gravity values `[±12, ±8]` were X-dominant (|12| > |8|), causing LeaderLine to attach to node SIDES and route in horizontal U-shapes. For a vertical layout, the correct approach is Y-dominant gravity so lines exit from BOTTOM of sources and enter TOP of targets.

Changes:
- **outLine**: `[12, -8]`/`[12, 8]` → `[8, 20]`/`[8, -20]`  
  (exits bottom-right of source, enters top-right of target)
- **inLine**: `[-12, 8]`/`[-12, -8]` → `[-8, -20]`/`[-8, 20]`  
  (exits top-left of lower node, enters bottom-left of upper node)

The small ±8 X offset preserves visual distinction between forward and reverse lines.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update socket gravity to Y-dominant values | aa67c9f | apps/demo/src/topology.ts |

## Verification

```bash
$ grep "startSocketGravity\|endSocketGravity" apps/demo/src/topology.ts
        startSocketGravity: [8, 20],
        endSocketGravity: [8, -20],
        startSocketGravity: [-8, -20],
        endSocketGravity: [-8, 20],
```

- ✓ outLine gravity: Y-dominant [8, 20] / [8, -20]
- ✓ inLine gravity: Y-dominant [-8, -20] / [-8, 20]
- ✓ TypeScript compilation succeeds (14/14 tasks pass)

## Self-Check: PASSED

- Created files: (none expected)
- Modified files exist: ✓ apps/demo/src/topology.ts
- Commit exists: ✓ aa67c9f
- Type-check: ✓ All 14 packages pass
