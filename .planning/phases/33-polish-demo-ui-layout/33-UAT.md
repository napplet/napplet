---
status: diagnosed
phase: 33-polish-demo-ui-layout
source: 33-01-SUMMARY.md, 33-02-SUMMARY.md, 33-03-SUMMARY.md, 33-04-SUMMARY.md, 33-05-SUMMARY.md
started: 2026-04-01T16:07:00Z
updated: 2026-04-01T16:12:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Napplet iframe fills its container
expected: |
  Open the demo app. The napplet iframe fills the .topology-frame-slot container without unused whitespace.
  No scrollbars within the iframe. Resizes responsively when inspector pane is adjusted.
result: pass

### 2. Topology edges render with 90-degree routing
expected: |
  All edges in the topology diagram render as orthogonal 90-degree lines (rectilinear paths).
  No smooth curves between nodes. Edges should follow cardinal directions.
result: issue
reported: "Edges still rendering as curves/diagonals instead of 90-degree orthogonal lines"
severity: major

### 3. Input and output sockets are visually distinct
expected: |
  Connection points (sockets) between nodes are clearly separated.
  Output sockets (right side with upward offset) and input sockets (left side with downward offset) are visually distinguishable.
result: issue
reported: "Socket gravity offsets not creating visual distinction between input/output sockets"
severity: major

### 4. No orphan edges visible
expected: |
  The topology diagram shows only legitimate connections between actual nodes.
  No edges point to undefined or missing container elements.
  All edges connect node-to-node with proper LeaderLine initialization.
result: pass

### 5. Service buttons execute without opening node inspector
expected: |
  Click service buttons (e.g., "Connect Signer", "Create Notification", "Mark Read", "Dismiss").
  Buttons execute their actions without triggering node selection or opening the node inspector pane.
  Clicking non-button areas of node cards still opens the inspector (normal behavior).
result: issue
reported: "All buttons open side panels instead of executing without opening inspector"
severity: major

## Summary

total: 5
passed: 2
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "All topology edges render as orthogonal 90-degree rectilinear lines"
  status: failed
  reason: "User reported: Edges still rendering as curves/diagonals instead of 90-degree orthogonal lines"
  severity: major
  test: 2
  root_cause: "Invalid Leader Line property: curve: 0 has no effect. Correct property is path: 'grid' for orthogonal routing"
  artifacts:
    - path: apps/demo/src/topology.ts
      issue: "BASE_OPTIONS uses invalid curve property instead of path: 'grid'"
  missing:
    - "Change curve: 0 to path: 'grid' in BASE_OPTIONS (line 197)"

- truth: "Input and output sockets are visually distinct with offset positioning"
  status: failed
  reason: "User reported: Socket gravity offsets not creating visual distinction between input/output sockets"
  severity: major
  test: 3
  root_cause: "Socket gravities are symmetric (same start/end values), which cancels visual distinction. Need opposite Y-offsets: start=[12,-8] and end=[12,8] for forward, start=[-12,8] and end=[-12,-8] for reverse"
  artifacts:
    - path: apps/demo/src/topology.ts
      issue: "Forward/reverse edges have same start/end socket gravity values, negating visual separation"
  missing:
    - "Adjust socket gravity: forward end to [12,8], reverse end to [-12,-8]"

- truth: "Service buttons execute their actions without opening node inspector panels"
  status: failed
  reason: "User reported: All buttons open side panels instead of executing without opening inspector"
  severity: major
  test: 5
  root_cause: "Node element listener fires first due to event bubbling, calls stopPropagation() before document-level button handlers execute. Button handlers never get called"
  artifacts:
    - path: apps/demo/src/main.ts
      issue: "wireNodeSelection() stops propagation for all clicks, preventing button handlers from executing"
  missing:
    - "Skip button clicks in wireNodeSelection() using target.closest('button') check before stopPropagation()"
