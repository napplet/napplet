---
phase: 09-acl-enforcement-gate
plan: 02
status: complete
started: 2026-03-30T23:10:00Z
completed: 2026-03-30T23:20:00Z
---

# Plan 09-02 Summary: Wire Enforce Gate into All ShellBridge Handlers

## What was built

Wired the enforce() gate into every ShellBridge message handler, replacing all scattered ACL checks with the single enforcement function. After this plan, no message reaches a napplet iframe or exits to a relay without passing through enforce().

## Key files

### Modified
- `packages/shell/src/shell-bridge.ts` — Replaced all checkAcl() calls with enforce(), added resolveCapabilities() pre-check in handleEvent, added missing handleCount ACL check, removed redundant sign:event check from handleSignerRequest
- `packages/shell/src/state-proxy.ts` — Removed all 5 aclStore.check() calls (enforce gate in handleEvent handles them)

## Tasks completed

| # | Task | Status |
|---|------|--------|
| 1 | Initialize enforce gate in createShellBridge and remove checkAcl helper | Done |
| 2 | Replace all ACL checks in handleEvent, handleReq, handleCount, handleSignerRequest | Done |
| 3 | Replace ACL checks in state-proxy.ts with enforce gate pre-check | Done |
| 4 | Replace delivery-time ACL check in deliverToSubscriptions with enforce() | Done |

## Verification

- `grep -r 'checkAcl(' packages/shell/src/` returns 0 results (zero function calls)
- `grep -r 'aclStore.check(' packages/shell/src/state-proxy.ts` returns 0 results
- `grep -c 'enforce(' packages/shell/src/shell-bridge.ts` shows 4 enforce() call sites
- All denial messages use `formatDenialReason()` producing `denied: {capability}`
- handleCount now has an ACL check (previously missing)
- `pnpm build` succeeds (11/11 packages)
- `pnpm type-check` passes

## Enforcement call sites

1. **handleEvent** — resolveCapabilities(msg) + enforce(pubkey, caps.senderCap) — unified pre-dispatch check
2. **handleReq** — enforce(pubkey, 'relay:read') — subscription creation check
3. **handleCount** — enforce(pubkey, 'relay:read') — NEW check (previously missing)
4. **deliverToSubscriptions** — enforce(recipientPubkey, 'relay:read') — delivery-time recipient check

## Self-Check: PASSED

All acceptance criteria met. Zero checkAcl calls remain. All denial responses use consistent 'denied:' prefix format.
