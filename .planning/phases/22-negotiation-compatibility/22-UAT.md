---
status: complete
phase: 22-negotiation-compatibility
source: 22-01-SUMMARY.md, 22-02-SUMMARY.md, 22-03-SUMMARY.md, 22-04-SUMMARY.md
started: 2026-03-31T17:55:00Z
updated: 2026-03-31T17:55:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Vite plugin injects requires tags into manifest
expected: `grep -n "requires\|napplet-requires\|requiresTags" packages/vite-plugin/src/index.ts | head -15` — shows requires? option, napplet-requires meta tag injection, and requiresTags in manifest event.
result: pass

### 2. CompatibilityReport and onCompatibilityIssue types exist in runtime
expected: `grep -n "CompatibilityReport\|onCompatibilityIssue\|strictMode" packages/runtime/src/types.ts | head -10` — all three present.
result: pass

### 3. Compatibility check fires after AUTH — blocks in strict mode
expected: `grep -n "checkCompatibility\|strictMode\|registeredServices" packages/runtime/src/runtime.ts | head -15` — shows check integrated into AUTH flow with strict mode blocking path.
result: pass

### 4. Undeclared service consent raised at dispatch time
expected: `grep -n "checkUndeclaredService\|undeclared-service\|undeclaredServiceConsents" packages/runtime/src/runtime.ts | head -10` — shows consent gate in INTER_PANE handler with per-session consent cache.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
