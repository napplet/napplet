---
phase: 16
plan: 1
status: complete
started: "2026-03-31"
completed: "2026-03-31"
---

# Summary: Plan 16-01 — Core Package Import Verification Tests

## What was built

Created 13 unit tests verifying all exports from @napplet/core:
- BusKind constants (all in 29000-29999 range)
- AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, REPLAY_WINDOW_SECONDS
- ALL_CAPABILITIES (10 capability strings)
- DESTRUCTIVE_KINDS (Set containing 0, 3, 5, 10002)
- TOPICS (state, auth, relay, audio topics)
- Type-level compile checks (NostrEvent, NostrFilter, Capability, BusKindValue, TopicKey, TopicValue)

## Key files

### Created
- `packages/core/src/index.test.ts` — 13 test cases
- `packages/core/vitest.config.ts` — Node environment, src/**/*.test.ts glob

### Modified
- `packages/core/package.json` — Added `test:unit` script

## Deviations

- Plan specified SHELL_BRIDGE_URI starts with `shell://` but actual value is `napplet://shell` (correct)
- Plan specified DESTRUCTIVE_KINDS is an array but actual implementation is a Set (correct)
- Added tests for REPLAY_WINDOW_SECONDS, BusKindValue, TopicKey, TopicValue beyond plan scope

## Self-Check: PASSED
