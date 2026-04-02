---
status: complete
phase: 43-demo-test-migration
source: [43-01-SUMMARY.md, 43-02-SUMMARY.md, 43-03-SUMMARY.md]
started: 2026-04-02T11:55:00.000Z
updated: 2026-04-02T11:55:00.000Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Demo loads without console errors
expected: Run `pnpm dev` and open the demo. Shell host loads, both napplet iframes render. No import errors in console. AUTH handshake completes.
result: issue
reported: "I am still seeing 'inter-pane' everywhere, it should be 'ipc-***'"
severity: major

### 2. Chat napplet sends and receives messages
expected: Type a message in chat and send. Message appears in the chat log. Relay subscribe shows incoming messages. No "window.napplet not installed" errors.
result: pass

### 3. Bot responds to chat via IPC
expected: Send a message in chat. Bot receives it via ipc.on and responds. Bot response appears in chat napplet (via ipc.emit round-trip through shell).
result: pass

### 4. Storage persists chat history
expected: Send a few messages. Reload the chat napplet (or the whole page). Chat history is restored from storage.getItem — previous messages reappear.
result: issue
reported: "Chat history is not loaded after reload. Before reload shows messages, after reload only shows 'AUTH complete -- ready to chat'. PUBKEY also changed (f2974ff → aa363a1) indicating new ephemeral keypair — storage scoped to old keypair is inaccessible."
severity: major

### 5. Build pipeline clean
expected: `pnpm build` completes with zero errors across all packages including demo napplets. `pnpm type-check` passes.
result: pass

## Summary

total: 5
passed: 3
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Demo UI should display 'ipc' terminology, not 'inter-pane' — Phase 35 renamed BusKind.INTER_PANE to BusKind.IPC_PEER"
  status: failed
  reason: "User reported: I am still seeing 'inter-pane' everywhere, it should be 'ipc-***'"
  severity: major
  test: 1
  artifacts: []
  missing: []

- truth: "Chat history should persist across page reloads via storage.getItem"
  status: failed
  reason: "User reported: chat history not loaded after reload. PUBKEY changed on reload (ephemeral keypair regenerated), so storage scope changed and old history is inaccessible."
  severity: major
  test: 4
  artifacts: []
  missing: []
