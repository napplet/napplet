---
status: passed
phase: 50-acl-detail-panel
requirements: [TRANS-03, TRANS-04]
verified_at: 2026-04-03
---

# Phase 50: ACL Detail Panel — Verification

## Success Criteria Check

### 1. User can select a napplet and see all current capabilities (granted and denied) in the detail panel
**Status: PASS**
- `buildNappletDetail()` in `node-details.ts` includes "ACL Capabilities" inspector section
- All 10 capabilities (relay:read, relay:write, cache:read, cache:write, sign:event, sign:nip04, sign:nip44, state:read, state:write, hotkey:forward) are listed with granted/revoked status
- `checkCapability` callback in `NodeDetailOptions` queries live ACL state via `relay.runtime.aclState.check()`
- Evidence: `grep "checkCapability" apps/demo/src/node-details.ts` shows the callback usage

### 2. User can see a history of ACL rejections for the selected napplet, each showing the rejected event, the missing capability, and a human-readable reason
**Status: PASS**
- `renderRejectionHistory()` and `renderRejectionEntry()` in `node-inspector.ts` display denial entries
- Each entry shows: capability label (from DEMO_CAPABILITY_LABELS), timestamp, message summary
- Expandable "raw" toggle shows full JSON of the triggering NIP-01 message
- Empty state: "no rejections recorded"
- Evidence: `grep "renderRejectionHistory" apps/demo/src/node-inspector.ts`

### 3. Rejected event context includes the full NIP-01 message (kind, tags, content summary) so the user understands what was attempted
**Status: PASS**
- `AclCheckEvent.message?: unknown[]` field added to both runtime and shell types
- All `enforce()` call sites in `runtime.ts` pass the raw `msg` array as third argument
- `event-buffer.ts` delivery checks pass synthetic `['EVENT', event]` for recipient-side checks
- Inspector renders message summary (verb + kind + topic) and full raw JSON via toggle
- Evidence: `grep "message?" packages/runtime/src/types.ts` and `grep "enforce(pubkey" packages/runtime/src/runtime.ts`

## Build Verification

- `pnpm build` -- 15/15 tasks successful
- `pnpm type-check` -- 16/16 tasks successful (FULL TURBO cache)
- No circular dependency errors
- No TypeScript strict mode violations

## Requirements Traceability

| Requirement | Description | Status |
|-------------|-------------|--------|
| TRANS-03 | Show per-napplet restrictions, capabilities | PASS |
| TRANS-04 | Rejection reasons with full event context | PASS |

## New Files Created

| File | Purpose |
|------|---------|
| `apps/demo/src/acl-history.ts` | Per-napplet ACL event ring buffer |
| `apps/demo/src/acl-modal.ts` | Full-screen ACL policy matrix modal |

## Files Modified

| File | Change |
|------|--------|
| `packages/runtime/src/types.ts` | Added `message?` field to AclCheckEvent |
| `packages/runtime/src/enforce.ts` | Updated enforce signature for message parameter |
| `packages/runtime/src/runtime.ts` | Pass msg at all enforce() call sites |
| `packages/runtime/src/event-buffer.ts` | Updated enforce signature, synthetic message for delivery |
| `packages/shell/src/types.ts` | Mirrored AclCheckEvent message field |
| `apps/demo/src/shell-host.ts` | onAclCheck callback, pushAclEvent import |
| `apps/demo/src/node-details.ts` | aclDenials, checkCapability, capability section |
| `apps/demo/src/node-inspector.ts` | Rejection history, policy button, click wiring |
| `apps/demo/src/main.ts` | checkCapability, setAclRingSize, relay import |
| `apps/demo/src/demo-config.ts` | ACL_RING_BUFFER_SIZE constant |

## Human Verification Items

None -- all success criteria are verifiable via code inspection and build output.
