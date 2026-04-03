---
status: complete
phase: 46-shell-assigned-keypair-handshake
source: [46-01-SUMMARY.md, 46-02-SUMMARY.md, 46-03-SUMMARY.md, 46-04-SUMMARY.md, 46-05-SUMMARY.md]
started: 2026-04-02T15:30:00.000Z
updated: 2026-04-02T15:30:00.000Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Chat history persists across page reload
expected: Send messages in chat, reload the page. Previous messages should reappear from storage. This was the core bug Phase 46 fixes.
result: pass
notes: Initially failed due to missing shellSecretPersistence/guidPersistence in demo adapter and race condition (origin registered after REGISTER sent). Fixed in commits 6d7bd16, 916b082, 0ed411d. After fixes, "loaded 2 history entries" confirmed.

### 2. Stable PUBKEY across reloads
expected: Note the PUBKEY shown in the chat napplet header. Reload the page. The PUBKEY should be the SAME after reload (shell-derived, deterministic from dTag+aggregateHash). Previously it changed every reload.
result: pass
notes: Confirmed — PUBKEY stable across reloads after demo adapter fixes.

### 3. Build pipeline clean
expected: `pnpm build` and `pnpm type-check` pass with zero errors across all packages.
result: pass
notes: 15/15 build, verified during fix iteration.

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
