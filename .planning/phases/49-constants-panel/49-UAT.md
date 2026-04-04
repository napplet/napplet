---
status: complete
phase: 49-constants-panel
source: 49-01-SUMMARY.md, 49-02-SUMMARY.md, 49-03-SUMMARY.md, 49-04-SUMMARY.md
started: 2026-04-04T10:00:00Z
updated: 2026-04-04T10:12:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Constants Tab Access
expected: In the demo, the inspector pane shows a tab bar at the top with "Node" and "Constants" tabs. Clicking the Constants tab opens the constants panel — even when no node is selected.
result: pass

### 2. Constants Listed by Package
expected: The constants panel shows all protocol magic numbers grouped by package (core, runtime, services, acl, demo, shim). Each group has a header and lists its constants with current values.
result: pass

### 3. Search/Filter Constants
expected: Typing in the search input at the top of the constants panel filters the list in real time — only constants whose name or group matches the query are shown.
result: pass

### 4. Grouping Mode Toggle
expected: Toggle buttons let you switch between package, domain, and flat grouping. Switching re-organizes the constant list under different headers (e.g., domain mode groups by timeouts, sizes, ui-timing, protocol).
result: pass

### 5. Edit an Editable Constant
expected: Editable constants (like FLASH_DURATION or TOAST_DISPLAY_MS) show a number input and a range slider. Changing the value via either control updates it immediately.
result: pass

### 6. Read-Only Constants Display
expected: Protocol constants (non-editable) display their value as text only — no input field or slider.
result: pass

### 7. Modified Value Indicator
expected: After editing a constant, a cyan dot appears next to it indicating it has been modified from its default.
result: pass

### 8. Flash Animation on Change
expected: When a constant value changes, the row briefly flashes to visually confirm the change.
result: pass

### 9. Per-Constant Reset
expected: Each modified constant has a reset button. Clicking it restores the constant to its default value and removes the modified indicator.
result: pass

### 10. Reset All
expected: A "Reset All" button at the top restores every constant to its default value in one click.
result: pass

### 11. Live Effect on Demo Behavior
expected: Changing an editable constant (e.g., FLASH_DURATION) affects the actual demo behavior on the next operation. For example, increasing flash duration makes the next flash animation visibly longer.
result: pass

### 12. Config Change Logged in Debugger
expected: When a constant is changed via the panel, an entry appears in the demo's debugger/log output showing what changed.
result: issue
reported: "there are so many things in the panel, and there is no overflow so I cannot even see everything in the panel, but it pushes the debug log down. It should instead be max-height to the top of the debug bar (whereever it is) with scroll overflow"
severity: major

## Summary

total: 12
passed: 11
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Constants panel should be contained within available space with scroll overflow, not push debug log off screen"
  status: failed
  reason: "User reported: there are so many things in the panel, and there is no overflow so I cannot even see everything in the panel, but it pushes the debug log down. It should instead be max-height to the top of the debug bar (whereever it is) with scroll overflow"
  severity: major
  test: 12
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
