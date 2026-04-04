---
status: complete
phase: 52-service-capability-toggles
source: 52-01-SUMMARY.md, 52-02-SUMMARY.md, 52-03-SUMMARY.md, 52-04-SUMMARY.md
started: 2026-04-04T10:35:00Z
updated: 2026-04-04T10:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Disable Service via Topology Toggle
expected: Service nodes in the topology have a toggle icon. Clicking it disables the service — the node dims (reduced opacity, grayscale) and the toggle icon changes color from green to red.
result: pass

### 2. Re-Enable Service via Topology Toggle
expected: Clicking the toggle icon on a disabled service node re-enables it — the node returns to full opacity and the toggle icon goes back to green.
result: pass

### 3. Disabled Service Blocks Messages
expected: After disabling a service (e.g., signer), the next napplet operation that depends on that service fails/is denied. The topology edge colors reflect the failure.
result: pass

### 4. Toggle Capability in Policy Matrix
expected: In the ACL policy modal, clicking a capability cell toggles it between allowed (green check) and revoked (red cross). The change takes effect on the next message.
result: pass

### 5. Toggle Service in Policy Matrix
expected: The policy modal has a services section with pill-style toggle switches. Toggling a service here disables/enables it, matching the topology toggle state.
result: issue
reported: "I cannot disable them from the modal, only enable. When I click to disable nothing happens. Toggling from topology works, but within the matrix can only enable."
severity: major

### 6. Cross-View Sync: Topology to Modal
expected: Disabling a service via the topology toggle icon is reflected in the policy modal — the service's toggle switch shows the disabled state when the modal is opened or refreshed.
result: pass

### 7. Cross-View Sync: Modal to Topology
expected: Toggling a service in the policy modal immediately updates the topology node visual — the node dims or brightens without closing the modal.
result: issue
reported: "The toggles in the policy modal are always disabled when I load the modal, even though services are actually enabled (green dots visible on topology nodes). Initial toggle state not read correctly on modal open."
severity: major

### 8. Cross-View Sync: Inline Panel to Modal
expected: Toggling a capability from the inline ACL panel in the inspector refreshes the policy modal if it's open, keeping both views in sync.
result: pass

## Summary

total: 8
passed: 6
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Service toggles in policy modal should disable services when clicked"
  status: failed
  reason: "User reported: I cannot disable them from the modal, only enable. When I click to disable nothing happens. Toggling from topology works, but within the matrix can only enable."
  severity: major
  test: 5
  root_cause: "Two issues: (1) Toggle button missing appearance:none — native GTK rendering on Linux/Chromium overrides inline background color, making toggle always appear OFF. User thinks first click enables but it actually disables (state was already enabled). (2) unregisterService wrapper unconditionally deleted from demoServiceNames, creating state confusion."
  artifacts:
    - path: "apps/demo/src/acl-modal.ts"
      issue: "Toggle button missing appearance:none CSS"
    - path: "apps/demo/src/shell-host.ts"
      issue: "unregisterService wrapper deleting from demoServiceNames"
  missing:
    - "Add appearance:none to toggle button cssText"
    - "Remove demoServiceNames.delete from unregister wrapper"
  debug_session: ""

- truth: "Service toggles in policy modal should reflect actual enabled/disabled state on modal open"
  status: failed
  reason: "User reported: The toggles in the policy modal are always disabled when I load the modal, even though services are actually enabled (green dots visible on topology nodes). Initial toggle state not read correctly on modal open."
  severity: major
  test: 7
  root_cause: "Toggle button element lacks appearance:none — native GTK button rendering on Linux/Chromium overrides the inline background:#39ff14, making all toggles appear gray/off regardless of isServiceEnabled() return value"
  artifacts:
    - path: "apps/demo/src/acl-modal.ts"
      issue: "Toggle button missing appearance:none;-webkit-appearance:none"
  missing:
    - "Add appearance:none;-webkit-appearance:none to toggle button cssText"
  debug_session: ""
