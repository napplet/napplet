---
status: passed
phase: 09-acl-enforcement-gate
phase_number: "09"
requirements: [ENF-01, ENF-02, ENF-03, ENF-04, ENF-05]
verified_at: 2026-03-30T23:25:00Z
---

# Phase 9 Verification: ACL Enforcement Gate

## Goal
Every message that flows through ShellBridge passes through exactly one enforcement function -- no message reaches a napplet iframe or exits to a relay without an ACL check.

## Must-Have Verification

### SC-1: Single enforce() function that every handler calls before acting
**Status: PASSED**
- `enforce()` is called at 4 sites in shell-bridge.ts: handleEvent, handleReq, handleCount, deliverToSubscriptions
- Zero `checkAcl()` function calls remain in any shell source file
- Zero `aclStore.check()` calls remain in state-proxy.ts
- createEnforceGate() is the single factory, enforce() is the single chokepoint

### SC-2: Both sender and recipient capabilities checked on every message
**Status: PASSED**
- resolveCapabilities() maps every message type to senderCap (and recipientCap where applicable)
- handleEvent uses resolveCapabilities(msg) + enforce(pubkey, caps.senderCap) for unified pre-dispatch
- deliverToSubscriptions() calls enforce(recipientPubkey, 'relay:read') at delivery time
- handleCount now has an ACL check (previously missing)

### SC-3: Denied messages produce explicit responses with machine-readable format
**Status: PASSED**
- EVENT denied: `['OK', eventId, false, 'denied: {capability}']` via formatDenialReason
- REQ denied: `['CLOSED', subId, 'denied: relay:read']` via formatDenialReason
- COUNT denied: `['CLOSED', countId, 'denied: relay:read']` via formatDenialReason
- State ops denied: enforce gate pre-check (deny before handleStateRequest is called)
- Delivery denied: silent skip (no response, per D-08)

### SC-4: Enforcement decisions logged with identity, capability, and decision
**Status: PASSED**
- AclCheckEvent interface: { identity: { pubkey, dTag, hash }, capability, decision }
- ShellHooks.onAclCheck: optional callback fires on every enforce() call
- emitAuditEvent: emits 'acl:check' events on every enforce() call
- Both allows AND denials are logged (ENF-05)

## Requirement Traceability

| Requirement | Description | Status |
|-------------|-------------|--------|
| ENF-01 | Single enforce() chokepoint | PASSED |
| ENF-02 | Sender + recipient capability checks | PASSED |
| ENF-03 | No message without ACL check | PASSED |
| ENF-04 | Machine-readable denial format | PASSED |
| ENF-05 | Auditable enforcement trail | PASSED |

## Build Verification

- `pnpm type-check`: PASSED (all 7 packages)
- `pnpm build`: PASSED (all 11 packages)

## Automated Checks

```
grep -r 'checkAcl(' packages/shell/src/ | grep -v 'checkAcl:'  => 0 results
grep 'aclStore.check' packages/shell/src/state-proxy.ts         => 0 results
grep -c 'enforce(' packages/shell/src/shell-bridge.ts           => 4 call sites
grep 'formatDenialReason' packages/shell/src/shell-bridge.ts    => 3 denial sites
```

## Human Verification Items

None required. All success criteria are verifiable through code inspection and grep audits.
