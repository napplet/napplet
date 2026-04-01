---
status: testing
phase: 32-fix-demo-ui-ux-bugs
source: [32-01-SUMMARY.md, 32-02-SUMMARY.md, 32-03-SUMMARY.md]
started: 2026-04-01T13:10:00.000Z
updated: 2026-04-01T13:10:00.000Z
---

## Current Test

<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running demo server. Run: pnpm --filter @napplet/demo dev
  The dev server starts without errors. The demo page loads in the browser
  and the topology view is visible with connecting lines between nodes.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running demo server. Run: pnpm --filter @napplet/demo dev — server starts without errors, demo page loads, topology view visible with connecting lines between nodes.
result: [pending]

### 2. Amber state on infrastructure failures
expected: Trigger an infrastructure failure in the demo (e.g., attempt to sign without a signer connected, or force a relay timeout). The relevant node border turns orange/amber — NOT red. The blocked counter increments.
result: [pending]

### 3. Red state reserved for ACL denials only
expected: Trigger an explicit ACL denial (a CLOSED message with denied/blocked reason). The node border turns red (not amber). Infrastructure failures (no signer, relay down) stay amber.
result: [pending]

### 4. Leader Line SVG edges visible in topology
expected: Open the demo topology view. The connections between nodes are drawn as real SVG lines with arrow direction indicators — NOT flat CSS bars. Lines visually connect the node boxes.
result: [pending]

### 5. Edge flash animation on message flow
expected: Send a message through the demo (e.g., publish an event or send a REQ). The Leader Line edge corresponding to that message path flashes color for ~500ms then returns to its resting color.
result: [pending]

### 6. CLAUDE.md NappKeypair docs corrected
expected: Run: grep 'Ephemeral in-memory' CLAUDE.md — the line is present at approximately line 235. Also run: grep -i 'sessionStorage' CLAUDE.md | grep -i 'napp.*key' — this returns empty (no stale reference).
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0

## Gaps

[none yet]
