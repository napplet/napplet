---
status: testing
phase: 56-contextual-filtering
source: [56-01-SUMMARY.md]
started: 2026-04-04T12:50:00Z
updated: 2026-04-04T12:50:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Three Inspector Tabs Visible
expected: |
  Open the demo. Click any topology node. The inspector pane should show three tab buttons: "Node", "Constants", and "Kinds". All three should be visible and clickable.
awaiting: user response

## Tests

### 1. Three Inspector Tabs Visible
expected: Open the demo. Click any topology node. The inspector pane should show three tab buttons: "Node", "Constants", and "Kinds". All three should be visible and clickable.
result: pass

### 2. Kinds Tab Shows Read-Only Protocol Constants
expected: Click the "Kinds" tab. It should show 9 protocol kind numbers (AUTH Kind, Bus: Registration, Bus: Signer Request, etc.) as read-only reference cards with label, numeric value, and description. No sliders or edit controls.
result: [pending]

### 3. Constants Tab Shows Only Editable Values
expected: Click the "Constants" tab. It should show only editable behavioral constants (Replay Window, Ring Buffer Size, EOSE Timeout, etc.) with sliders and input controls. No read-only protocol kinds should appear here.
result: [pending]

### 4. Tab Persistence Across Node Selection
expected: Click the "Constants" tab. Then click a different topology node. The "Constants" tab should remain active — it should NOT reset back to the "Node" tab.
result: [pending]

### 5. Contextual Filtering — Node Selected
expected: Click a topology node (e.g., "runtime"). Switch to the Constants tab. It should show only constants relevant to the runtime role (Replay Window, Ring Buffer Size) plus global constants (demo timing values). Not all 16 editable constants.
result: [pending]

### 6. Contextual Filtering — No Node Selected
expected: Click away from all nodes (deselect). The Constants tab should show ALL editable constants — no filtering applied.
result: [pending]

### 7. Show-All Toggle
expected: With a node selected, click the Constants tab. A "Show all" toggle/button should appear at the top. Clicking it should show all editable constants regardless of the selected node. The toggle label should change to "Filter to [node role]".
result: [pending]

### 8. Toggle Resets on New Node Selection
expected: With a node selected and "Show all" active, click a different topology node. The filtering should re-engage (show-all resets), showing only constants relevant to the new node.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps

[none yet]
