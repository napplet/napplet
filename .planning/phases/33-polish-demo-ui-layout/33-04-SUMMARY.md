---
phase: 33
plan: 04
name: Remove orphan edge definition for non-existent topology-napplets container
status: complete
duration: "~5 minutes"
completed_date: 2026-04-01
subsystem: demo-ui
tags: [topology, bug-fix, dead-code-removal]
dependency_graph:
  requires: []
  provides:
    - "Orphan edge definition removed"
    - "LeaderLine initialization clean"
  affects:
    - apps/demo topology rendering
    - flow animator edge highlighting
tech_stack:
  patterns:
    - "TypeScript strict mode"
    - "ESM modules"
  added: []
key_files:
  modified:
    - "apps/demo/src/topology.ts"
    - "apps/demo/src/flow-animator.ts"
  created: []
decisions: []
---

# Phase 33 Plan 04: Remove Orphan Edge Definition Summary

**Objective:** Remove orphan edge definition that references a non-existent `topology-napplets` container element.

**Core issue:** The topology edge list included an edge connecting `topology-napplets` (a layout container section, not a topology node) to the shell node. LeaderLine could not properly initialize this edge since `topology-napplets` is a `<section>` element, not a data-node with proper topology semantics. Individual napplet-to-shell edges already provide all necessary connections.

## Tasks Completed

### Task 1: Remove orphan topology-napplets edge definition

**Executed:** Yes

**Changes:**

1. **apps/demo/src/topology.ts** (lines 152-157)
   - Removed the 6-line edge definition: `{ id: NAPPLETS_SHELL_EDGE_ID, from: 'topology-napplets', to: SHELL_NODE_ID }`
   - Removed constant `NAPPLETS_SHELL_EDGE_ID = 'topology-edge-napplets-shell'` (no longer used)
   - Removed getter function `getNappletsShellEdgeId()` (dead code)
   - Edges array now starts directly with napplet-to-shell edges via `...napplets.map()`

2. **apps/demo/src/flow-animator.ts** (lines 11-19, 96-101)
   - Removed `getNappletsShellEdgeId` from imports
   - Removed the orphan edge ID from the `buildHighlightPath` edges array
   - Flow animator now highlights only the correct topology path: napplet → shell → acl → runtime → [service]

**Verification:**

- TypeScript type-check: `pnpm type-check` passed (all 14 packages successful)
- Grep for orphan references: `topology-napplets` only appears in the HTML section element (line 364), which is correct
- Grep for unused function: No references to `getNappletsShellEdgeId` or `NAPPLETS_SHELL_EDGE_ID` remain in codebase

**Success Criteria Met:**

- [x] Edge definition with `from: 'topology-napplets'` removed from apps/demo/src/topology.ts
- [x] No grep match for `topology-napplets` in the edges array initialization context
- [x] TypeScript compilation succeeds (`pnpm type-check` exits 0)
- [x] No dead code or orphan references remain

## Deviations from Plan

**1. [Rule 2 - Auto-add missing critical functionality] Removed orphan reference in flow-animator.ts**
- **Found during:** Task 1 verification
- **Issue:** flow-animator.ts was importing and using `getNappletsShellEdgeId()` in `buildHighlightPath()` (line 98), trying to flash an edge that no longer exists in the topology
- **Fix:** Removed the import and the edge ID from the edges array in flow-animator.ts to keep flow animation synchronized with actual topology
- **Files modified:** apps/demo/src/flow-animator.ts
- **Commit:** e37b43f

**2. [Rule 1 - Auto-fix bugs] Removed dead code**
- **Found during:** Task 1 cleanup
- **Issue:** The constant `NAPPLETS_SHELL_EDGE_ID` and getter function `getNappletsShellEdgeId()` were only defined and no longer used anywhere after removing the edge
- **Fix:** Removed both the constant definition and the getter function from topology.ts to maintain code hygiene
- **Files modified:** apps/demo/src/topology.ts
- **Commit:** e37b43f

## Commit Log

| Hash   | Message                                        |
|--------|------------------------------------------------|
| e37b43f | fix(33-04): remove orphan topology-napplets edge definition |

## Result

Orphan edge definition successfully removed. The topology edge list now contains only legitimate connections:
- Individual napplet-to-shell edges (per napplet)
- Shell → ACL edge
- ACL → Runtime edge
- Runtime → [Service] edges (per service)

No edge references non-existent container elements. LeaderLine initialization should proceed cleanly without attempting to find `topology-napplets` as a DOM element with data-node semantics.

The demo topology now accurately reflects the actual architecture with no orphan element references.
