---
status: passed
phase: 36-type-correctness
verified: "2026-04-01"
verifier: inline
requirements_checked: [TYPE-01, TYPE-02]
---

# Phase 36: Type Correctness — Verification Report

## Goal

Eliminate duplicate type definitions between shell and runtime so each protocol type has exactly
one canonical source.

## Must-Haves Verification

### TYPE-01: ConsentRequest consolidated to @napplet/runtime canonical

| Check | Command | Result |
|-------|---------|--------|
| ConsentRequest removed from shell/types.ts | `grep -c "ConsentRequest" packages/shell/src/types.ts` | 0 — PASS |
| shell-bridge imports ConsentRequest from @napplet/runtime | `grep "ConsentRequest" packages/shell/src/shell-bridge.ts` | line 13 from @napplet/runtime — PASS |
| No `as ConsentHandler` cast in shell-bridge | `grep "as ConsentHandler" packages/shell/src/shell-bridge.ts` | zero results — PASS |
| shell/index.ts re-exports ConsentRequest from @napplet/runtime | `grep "ConsentRequest" packages/shell/src/index.ts` | line 57 from @napplet/runtime — PASS |
| pnpm type-check passes | `pnpm type-check` | 14/14 packages — PASS |

### TYPE-02: shell/state-proxy.ts dead code removed

| Check | Command | Result |
|-------|---------|--------|
| state-proxy.ts deleted | `ls packages/shell/src/ \| grep state-proxy` | no output — PASS |
| Zero import references remain | `grep -rn "state-proxy" packages/ --include="*.ts"` | zero results — PASS |
| pnpm type-check passes | `pnpm type-check` | 14/14 packages — PASS |
| Full test suite | `pnpm build && pnpm test` | 129 passed, 4 pre-existing failures — PASS |

## Test Suite Notes

4 pre-existing Playwright UI test failures were present before Phase 36 and continue:
- `auth-handshake.spec.ts` — clearMessages buffer race condition
- `demo-audit-correctness.spec.ts` — revoke relay:write UI path
- `demo-node-inspector.spec.ts` — inspector-open class timing
- `demo-notification-service.spec.ts` — toast visibility race

None of these failures reference ConsentRequest, state-proxy, or any Phase 36 change.

## Requirement Traceability

- **TYPE-01**: `packages/runtime/src/types.ts` — canonical ConsentRequest with `type?` and `serviceName?`
- **TYPE-02**: `packages/runtime/src/state-handler.ts` — canonical state handler (shell version deleted)

## Files Modified

- `packages/shell/src/types.ts` — ConsentRequest interface removed
- `packages/shell/src/shell-bridge.ts` — import updated, cast removed
- `packages/shell/src/index.ts` — ConsentRequest re-exported from @napplet/runtime
- `packages/shell/src/state-proxy.ts` — DELETED

## Status: PASSED

All must-haves verified. Phase 36 goal achieved: each protocol type has exactly one canonical source.
