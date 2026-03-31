---
status: awaiting_human_verify
trigger: "After Phase 9 (ACL Enforcement Gate) wired enforce() into ShellBridge, 91 of 108 e2e tests fail. All tests using loadNapplet('auth-napplet') are broken. The auth handshake between napplets and the shell bridge is failing."
created: 2026-03-30T00:00:00Z
updated: 2026-03-30T01:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Three root causes identified and fixed. All 122 e2e tests now pass (0 failures).
test: Full test suite run with `npx playwright test`
expecting: 122 passed, 0 failed
next_action: Await human verification

## Symptoms

expected: Auth-napplet loads in iframe, receives AUTH challenge, sends AUTH response, gets OK true, completes handshake. This worked before Phase 9.
actual: 91/108 tests fail. Tests that require AUTH handshake timeout or fail.
errors: Auth handshake not completing. Likely the new enforce() function is blocking messages that should be allowed during the pre-AUTH phase.
reproduction: Run `pnpm test` or any individual Playwright e2e test that uses loadNapplet('auth-napplet').
started: Started after Phase 9 execution (ACL Enforcement Gate). Phase 8 (ACL Pure Module) tests passed.

## Eliminated

- hypothesis: enforce() blocks AUTH messages during pre-AUTH phase
  evidence: handleMessage() dispatches AUTH verb directly to handleAuth() at line 610, bypassing enforce() entirely. enforce() is only called in handleEvent, handleReq, handleCount, and deliverToSubscriptions -- none of which run during AUTH.
  timestamp: 2026-03-30T00:10:00Z

- hypothesis: Timing issue where AUTH challenge arrives before napplet listener is installed
  evidence: This would have affected tests before Phase 9 too. The issue description states tests worked before Phase 9. Also, iframe load event fires after all scripts execute.
  timestamp: 2026-03-30T00:15:00Z

- hypothesis: originRegistry proxy wrapper breaks source window resolution
  evidence: The proxy -> real window fallback in getWindowId handles this case. The real window was registered in loadNapplet. The harness wrapper properly resolves both proxied and real windows.
  timestamp: 2026-03-30T00:15:00Z

## Evidence

- timestamp: 2026-03-30T00:05:00Z
  checked: auth-napplet build output (dist/assets/index-BwTQELnq.js)
  found: File is only 981 bytes. Contains NO shim code (no AUTH_KIND/22242, no finalizeEvent, no loadOrCreateKeypair, no handleAuthChallenge). Only contains the auth-napplet's own main.ts message listener.
  implication: The @napplet/shim import was tree-shaken out entirely.

- timestamp: 2026-03-30T00:06:00Z
  checked: packages/shim/package.json line 16
  found: "sideEffects": false -- tells bundlers this package has no side effects
  implication: Vite sees `import '@napplet/shim'` (no named exports used) + sideEffects:false = safe to remove entire import.

- timestamp: 2026-03-30T00:07:00Z
  checked: publish-napplet build output (35388 bytes)
  found: Contains shim code (22242, keypair generation, AUTH handling). Uses `import { publish } from '@napplet/shim'` (named import).
  implication: Named imports force module execution even with sideEffects:false. Side-effect-only imports do not.

- timestamp: 2026-03-30T00:08:00Z
  checked: Test error context (page snapshot)
  found: "shell->napplet AUTH" message recorded, but NO "napplet->shell AUTH" response. Napplet shows "Auth napplet loading..." (never completes).
  implication: Napplet has no AUTH handling code -- confirms shim was tree-shaken out.

- timestamp: 2026-03-30T00:09:00Z
  checked: git history for sideEffects:false
  found: Added in commit 6f0f2c6 (feat(packages): validate ESM compatibility). Pre-dates all e2e tests.
  implication: This has been broken since the beginning, but may not have been caught because tests might have been verified in a different way or the issue was masked.

- timestamp: 2026-03-30T00:20:00Z
  checked: Browser console logs during debug test with sideEffects fix applied
  found: handleEvent received EVENT, resolved capabilities, but enforce() call never returned. No sendOk log printed after enforce().
  implication: enforce() was hanging due to infinite recursion.

- timestamp: 2026-03-30T00:25:00Z
  checked: enforce() -> emitAuditEvent -> injectEvent -> deliverToSubscriptions -> enforce() call chain
  found: emitAuditEvent config callback calls relay.injectEvent('acl:check', ...) which injects a kind 29003 event into the routing pipeline. deliverToSubscriptions checks enforce() on each recipient, which calls emitAuditEvent again = infinite recursion.
  implication: The enforce gate has a re-entrant infinite recursion bug through the audit event emission path.

- timestamp: 2026-03-30T00:30:00Z
  checked: Audit events polluting napplet subscriptions
  found: MSG-06 sender received 4 spurious events (acl:check audit events) because they matched kind 29003 subscription filter. MSG-07 similar issue with p-tag targeted delivery contaminated by audit events.
  implication: emitAuditEvent via injectEvent sends internal audit events through the same routing pipeline as user events, polluting subscriptions.

- timestamp: 2026-03-30T00:35:00Z
  checked: Test expectation mismatches after enforce gate
  found: Tests expected old denial format ("relay:write capability denied") but enforce returns "denied: relay:write". Tests ACL-06/07 expected response EVENTs with error tags but enforce gate returns OK false before state-proxy is reached. Tests for inter-pane emit had swapped eventId/pubkey arguments (copy-paste bug).
  implication: Tests needed updating to match new enforce architecture.

## Resolution

root_cause: Three layered issues caused 89+ test failures:
1. **sideEffects:false in @napplet/shim** (packages/shim/package.json) — Vite tree-shakes out the entire shim when imported as `import '@napplet/shim'` (side-effect-only import). The auth-napplet has no AUTH handling code, so AUTH handshakes never complete.
2. **Infinite recursion in enforce()** — The emitAuditEvent callback in the enforce gate calls relay.injectEvent(), which routes through deliverToSubscriptions, which calls enforce() on recipients, which calls emitAuditEvent again — infinite recursion. This silently crashes the call stack, preventing OK responses from being sent.
3. **Audit event pollution** — Even with a recursion guard, audit events (kind 29003 with topic 'acl:check') were injected into the same routing pipeline as user events, polluting napplet subscriptions and causing spurious event deliveries.

fix:
1. Changed `"sideEffects": false` to `"sideEffects": true` in packages/shim/package.json — the shim IS side-effectful by design.
2. Removed emitAuditEvent from enforce() entirely — the onAclCheck callback already serves audit needs without going through the routing pipeline.
3. Removed emitAuditEvent from EnforceConfig interface and shell-bridge createEnforceGate call.
4. Updated test expectations: denial reason format from "X capability denied" to "denied: X" (matching formatDenialReason output). Rewrote ACL-06/07 to check for OK false instead of response EVENTs. Fixed inter-pane emit test argument order bug (eventId/pubkey were swapped).

verification: All 122 e2e tests pass. Auth handshake completes successfully. Enforce gate denials work correctly with proper denial reason format. No infinite recursion. No audit event pollution.

files_changed:
- packages/shim/package.json
- packages/shell/src/enforce.ts
- packages/shell/src/shell-bridge.ts
- tests/e2e/acl-enforcement.spec.ts
- tests/e2e/acl-matrix-relay.spec.ts
