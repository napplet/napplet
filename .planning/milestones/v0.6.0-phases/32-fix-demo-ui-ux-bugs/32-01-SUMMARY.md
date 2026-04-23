---
phase: 32-fix-demo-ui-ux-bugs
plan: 01
subsystem: ui
tags: [demo, animation, css, amber, three-state]

requires: []
provides:
  - Three-state visual classification (active/amber/blocked) in flow-animator.ts
  - Amber CSS rules for .node-box.amber and .topology-edge.amber in index.html
affects: []

tech-stack:
  added: []
  patterns: [three-state flash classification: active/amber/blocked]

key-files:
  created: []
  modified:
    - apps/demo/src/flow-animator.ts
    - apps/demo/index.html

key-decisions:
  - "Amber maps infrastructure failures (no signer, relay, timeout, mock) from OK:false messages"
  - "Red (blocked) is reserved for explicit ACL denials only (CLOSED with denied/blocked: reason)"
  - "Amber still increments the blocked counter — the visual distinction is enough"

patterns-established:
  - "isAmber check: isOkFalse && msg.raw[3] includes infrastructure reason strings"
  - "cls type: 'active' | 'amber' | 'blocked' threeway union on all flash functions"
---

## What was done

Added a third visual state (amber/orange) to the demo topology flow animator to distinguish infrastructure failures from explicit ACL denials.

**flow-animator.ts**: Updated `flashEdge()` and `flashNode()` type signatures to accept `'amber'`. Added `isAmber` classification logic in the `tap.onMessage` callback — amber triggers on `OK:false` messages whose reason string contains infrastructure keywords (no signer, relay, timeout, not wired, mock). The `cls` variable is now a three-way ternary.

**index.html**: Added `.node-box.amber { border-color: #ff9f0a; ... }` after the blocked rule. The topology-edge amber rule was added but later replaced by Leader Line in Plan 02.

## Verification

- grep -c 'amber' apps/demo/index.html → 1 (node-box amber rule present)
- grep -c 'isAmber' apps/demo/src/flow-animator.ts → 2 (declaration + assignment)
- 'active' | 'amber' | 'blocked' type union present in flow-animator.ts
- TypeScript compiles clean for modified files
