---
phase: 32-fix-demo-ui-ux-bugs
plan: 02
subsystem: ui
tags: [demo, topology, leader-line, svg, edges, arrows]

requires: []
provides:
  - leader-line dependency in apps/demo/package.json
  - EdgeFlasher interface exported from topology.ts
  - initTopologyEdges() exported from topology.ts
  - Two directional Leader Line instances per topology edge
  - ResizeObserver for automatic repositioning
  - EdgeFlasher wired into flow-animator and main.ts

affects: []

tech-stack:
  added: [leader-line 1.0.8]
  patterns: [EdgeFlasher interface for edge animation abstraction]

key-files:
  created: []
  modified:
    - apps/demo/package.json
    - apps/demo/vite.config.ts
    - apps/demo/src/topology.ts
    - apps/demo/src/flow-animator.ts
    - apps/demo/src/main.ts
    - apps/demo/index.html

key-decisions:
  - "leader-line is a UMD/IIFE library; added to optimizeDeps.include in vite.config.ts for proper bundling"
  - "No @types/leader-line on npm; used @ts-ignore on import line"
  - "Two LeaderLine instances per edge: -out (from→to) and -in (to→from) with ±12px socket gravity offset"
  - "renderNodeEdge() calls removed from renderDemoTopology(); CSS bar rules replaced with comment"
  - "EdgeFlasher optional parameter in initFlowAnimator allows graceful fallback"
  - "position: relative added to .topology-layout for correct SVG overlay positioning"

patterns-established:
  - "EdgeFlasher interface: flash(edgeId, cls) with 500ms color change + reset"
  - "initTopologyEdges() called after topology HTML inserted into DOM"
---

## What was done

Replaced CSS-bar edge placeholders in the topology view with real dynamic connecting lines using Leader Line (SVG library).

**package.json**: Added `"leader-line": "^1.0.7"` (resolved to 1.0.8).

**vite.config.ts**: Added `optimizeDeps: { include: ['leader-line'] }` for proper UMD bundling.

**topology.ts**: Added LeaderLine import (with @ts-ignore), `EdgeFlasher` interface, and `initTopologyEdges()` function. The function creates two LeaderLine instances per edge (outbound and inbound, with ±12px socket gravity offset). A ResizeObserver repositions lines on layout changes. The `flash()` method changes line color for 500ms then resets to resting state. Removed all `renderNodeEdge()` calls from `renderDemoTopology()`.

**flow-animator.ts**: Imported `EdgeFlasher` type, added optional `edgeFlasher` parameter to `initFlowAnimator()`. When provided, delegates edge flashing to `edgeFlasher.flash()`; falls back to `flashEdge()` DOM lookup if not.

**main.ts**: Imported `initTopologyEdges`, calls it after topology HTML insertion, passes returned `EdgeFlasher` to `initFlowAnimator()`.

**index.html**: Added `position: relative` to `.topology-layout`. Old `.topology-edge` CSS bar rules removed (replaced with comment).

## Verification

- grep 'leader-line' apps/demo/package.json → present
- grep -c 'LeaderLine' apps/demo/src/topology.ts → ≥2
- grep 'EdgeFlasher' apps/demo/src/topology.ts → present
- grep 'EdgeFlasher' apps/demo/src/flow-animator.ts → present
- grep 'initTopologyEdges' apps/demo/src/main.ts → present
- pnpm --filter @napplet/demo build → success (316kB bundle)
