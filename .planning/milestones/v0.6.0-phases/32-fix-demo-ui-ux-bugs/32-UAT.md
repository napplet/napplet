---
status: complete
phase: 32-fix-demo-ui-ux-bugs
source: [32-01-SUMMARY.md, 32-02-SUMMARY.md, 32-03-SUMMARY.md]
started: 2026-04-01T13:10:00.000Z
updated: 2026-04-01T13:30:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running demo server. Run: pnpm --filter @napplet/demo dev — server starts without errors, demo page loads, topology view visible with connecting lines between nodes.
result: pass

### 2. Amber state on infrastructure failures
expected: Trigger an infrastructure failure in the demo (e.g., attempt to sign without a signer connected, or force a relay timeout). The relevant node border turns orange/amber — NOT red. The blocked counter increments.
result: issue
reported: "Signer node stays green when sign request fails without signer connected. Shell/ACL/Runtime nodes show amber (cascading failure), but Signer itself should also flash amber."
severity: major

### 3. Red state reserved for ACL denials only
expected: Trigger an explicit ACL denial (a CLOSED message with denied/blocked reason). The node border turns red (not amber). Infrastructure failures (no signer, relay down) stay amber.
result: issue
reported: "Revoking relay publish from chat causes nodes to turn amber. Should be red (ACL denial), not amber. Red only appears for state read/write denials. The 'relay' keyword in isAmber logic is too broad — matches both infrastructure failures AND ACL denials."
severity: major

### 4. Leader Line SVG edges visible in topology
expected: Open the demo topology view. The connections between nodes are drawn as real SVG lines with arrow direction indicators — NOT flat CSS bars. Lines visually connect the node boxes.
result: pass
note: "Works well. User suggestion: right-angle routing instead of curved would be better visually (future polish, not blocking)."

### 5. Edge flash animation on message flow
expected: Send a message through the demo (e.g., publish an event or send a REQ). The Leader Line edge corresponding to that message path flashes color for ~500ms then returns to its resting color.
result: pass

### 6. CLAUDE.md NappKeypair docs corrected
expected: Run: grep 'Ephemeral in-memory' CLAUDE.md — the line is present at approximately line 235. Also run: grep -i 'sessionStorage' CLAUDE.md | grep -i 'napp.*key' — this returns empty (no stale reference).
result: pass

## Summary

total: 6
passed: 4
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Signer node should flash amber when infrastructure-failure signing requests occur"
  status: failed
  reason: "Signer node stays green; shell/acl/runtime show amber. Signer not flashing on failed signing attempts."
  severity: major
  test: 2
  artifacts: [flow-animator.ts]
  missing: ["Signer node emission of failure message"]

- truth: "ACL denials (denied/blocked) should show red, infrastructure failures should show amber"
  status: failed
  reason: "Revoking relay publish (ACL denial) shows amber, not red. The 'relay' keyword in isAmber logic matches both infrastructure AND ACL failure messages."
  severity: major
  test: 3
  artifacts: [flow-animator.ts]
  missing: ["Better distinction between denied: reason and infrastructure: reason patterns"]
