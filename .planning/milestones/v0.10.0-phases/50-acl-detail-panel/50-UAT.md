---
status: complete
phase: 50-acl-detail-panel
source: 50-01-SUMMARY.md, 50-02-SUMMARY.md, 50-03-SUMMARY.md, 50-04-SUMMARY.md
started: 2026-04-04T10:15:00Z
updated: 2026-04-04T10:22:00Z
---

## Current Test

[testing complete]

## Tests

### 1. ACL Capabilities in Napplet Inspector
expected: Select a napplet node in the topology. The inspector shows all 10 ACL capabilities with their granted/revoked status for that napplet.
result: pass

### 2. Rejection History
expected: After a napplet action is denied by ACL, the napplet's inspector shows the denial entry with capability label, timestamp, and message summary.
result: pass

### 3. Expandable Raw Event in Rejection
expected: Each rejection entry in the inspector has an expand toggle that reveals the raw JSON of the denied event/message.
result: pass

### 4. Open Policy Matrix from ACL Node
expected: Select the ACL node in the topology. The inspector shows an "Open Policy Matrix" button. Clicking it opens a full-screen modal.
result: pass

### 5. Policy Matrix Grid
expected: The policy matrix modal shows all napplets as rows, all 10 capabilities as columns. Cells are color-coded: green check (granted), red cross (revoked), gray dash (default).
result: pass

### 6. Close Policy Modal
expected: The policy matrix can be closed via the X button, pressing ESC, or clicking the backdrop.
result: pass

### 7. ACL Ring Buffer Size in Constants Panel
expected: ACL_RING_BUFFER_SIZE appears in the constants panel as an editable constant (range 5-500, default 50).
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
