---
status: complete
phase: 21-shim-discovery-api
source: 21-01-SUMMARY.md, 21-02-SUMMARY.md
started: 2026-03-31T17:50:00Z
updated: 2026-03-31T17:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. discoverServices/hasService/hasServiceVersion exported from @napplet/shim
expected: Run `grep -n "discoverServices\|hasService\|ServiceInfo" packages/shim/src/index.ts` — all three functions and ServiceInfo type appear as exports.
result: pass

### 2. window.napplet global installed at shim load time
expected: Run `grep -n "window.napplet\|napplet:" packages/shim/src/index.ts` — shows the window.napplet installation block with discoverServices, hasService, hasServiceVersion attached.
result: pass

### 3. Session cache prevents duplicate REQs
expected: Run `grep -n "cachedServices\|null\|cache" packages/shim/src/discovery-shim.ts | head -10` — shows a module-level cache initialized to null, checked before sending kind 29010 REQ.
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
