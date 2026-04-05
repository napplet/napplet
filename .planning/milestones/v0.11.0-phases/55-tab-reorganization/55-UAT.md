---
status: complete
phase: 55-tab-reorganization
source: [55-01-SUMMARY.md, 55-02-SUMMARY.md]
started: 2026-04-05T00:00:00Z
updated: 2026-04-05T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Three Inspector Tabs Visible
expected: Open the demo. Click any topology node. The inspector pane should show three tab buttons: "Node", "Constants", and "Kinds". All three should be visible and clickable.
result: pass

### 2. Kinds Tab Shows Read-Only Protocol Cards
expected: Click the "Kinds" tab. It should display 9 protocol kind reference cards (AUTH Kind, Bus: Registration, Bus: Signer Request, etc.) plus 1 other read-only constant. Each card shows a label, numeric value, and description. No sliders or edit controls — purely read-only.
result: pass

### 3. Constants Tab Shows Only Editable Values
expected: Click the "Constants" tab. It should show only editable behavioral constants (Replay Window, Ring Buffer Size, EOSE Timeout, etc.) with sliders and input controls. No read-only protocol kinds should appear here. The header should say "editable constants" (not "protocol constants").
result: pass

### 4. Tab Persistence Across Node Selection
expected: Click the "Constants" tab so it is active. Then click a different topology node. The "Constants" tab should remain active — it should NOT reset back to the "Node" tab.
result: pass

### 5. Polling Guard — Slider Not Destroyed
expected: On the "Constants" tab, click a slider and hold it or adjust it. Wait at least 2 seconds. The slider should stay where you put it — not jump back or get destroyed by the polling timer refreshing the pane.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
