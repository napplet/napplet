---
phase: 02-test-infrastructure
plan: 02
status: complete
started: 2026-03-30
completed: 2026-03-30
---

## Summary

Created mock ShellHooks factory with real nostr-tools crypto verification and in-memory relay pool for test isolation.

## What was built

- `tests/helpers/mock-relay-pool.ts` - In-memory relay pool implementing `RelayPoolLike` with NIP-01 filter matching
- `tests/helpers/mock-hooks.ts` - `createMockHooks()` factory returning complete ShellHooks with call tracking
- `tests/helpers/index.ts` - Barrel export for all test helpers

## Key design decisions

- Crypto hook uses real `verifyEvent` from nostr-tools for genuine AUTH signature validation
- Call log tracks subscription lifecycle and hotkey executions for assertion
- Overrides parameter allows tests to customize specific hooks
- `setSigner`/`setUserPubkey` helpers for auth-related tests

## Key files

- `tests/helpers/mock-hooks.ts` - Mock ShellHooks factory
- `tests/helpers/mock-relay-pool.ts` - In-memory relay pool

## Verification

- All 8 ShellHooks interfaces implemented (relayPool, relayConfig, windowManager, auth, config, hotkeys, workerRelay, crypto; dm is optional)
- Real nostr-tools verifyEvent imported
- `pnpm build` succeeds
