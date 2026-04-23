---
status: complete
phase: 20-concrete-services
source: 20-01-SUMMARY.md, 20-02-SUMMARY.md, 20-03-SUMMARY.md, 20-04-SUMMARY.md
started: 2026-03-31T17:45:00Z
updated: 2026-03-31T17:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. @napplet/services package builds and exports both factories
expected: Run `pnpm build` — 14 tasks succeed. Both `createAudioService` and `createNotificationService` exported.
result: pass

### 2. Audio service uses audio:* prefix only — no shell:audio-* legacy
expected: Run `grep -r "shell:audio" packages/services/src/` — returns nothing. Audio service strictly uses the new `audio:*` topic convention.
result: pass

### 3. Notification service generalizes the pattern
expected: `createNotificationService()` handles `notifications:create`, `notifications:dismiss`, `notifications:read`, `notifications:list`. Both services follow identical factory pattern.
result: pass

### 4. Full type-check clean across all packages
expected: Run `pnpm type-check` — exits 0 for all 13 packages including @napplet/services.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
