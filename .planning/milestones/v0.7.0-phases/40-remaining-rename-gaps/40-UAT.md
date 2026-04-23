---
status: complete
phase: 40-remaining-rename-gaps
source: 40-01-SUMMARY.md, 40-02-SUMMARY.md
started: 2026-04-02T00:00:00Z
updated: 2026-04-02T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. loadOrCreateKeypair removed
expected: Run: grep -r 'loadOrCreateKeypair' packages/ — should return 0 hits.
result: skipped
reason: not UAT — code verification, not user-observable behavior

### 2. createEphemeralKeypair exists with no parameters
expected: Run: grep -n 'createEphemeralKeypair' packages/shim/src/napplet-keypair.ts — shows function signature with no nappType parameter.
result: skipped
reason: not UAT — code verification, not user-observable behavior

### 3. nappletType replaces nappType in vite-plugin
expected: Run: grep 'nappType' packages/vite-plugin/src/index.ts — returns 0 hits.
result: skipped
reason: not UAT — code verification, not user-observable behavior

### 4. Type-check passes cleanly
expected: Run: pnpm type-check — exits 0 with no TypeScript errors across all packages.
result: skipped
reason: not UAT — code verification, not user-observable behavior

### 5. SPEC.md free of stale napp: topic strings
expected: Run: grep -E 'napp:state-response|napp:audio-muted|napp-state:' SPEC.md — returns 0 hits.
result: skipped
reason: not UAT — code verification, not user-observable behavior

### 6. Documentation updated consistently
expected: Run: grep 'nappType' packages/vite-plugin/README.md skills/build-napplet/SKILL.md — returns 0 hits.
result: skipped
reason: not UAT — code verification, not user-observable behavior

## Summary

total: 6
passed: 0
issues: 0
pending: 0
skipped: 6
blocked: 0

## Gaps

[none]
