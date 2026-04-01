# Phase 32 Debug: Amber/Red State Classification Issues

**Date:** 2026-04-01  
**Phase:** 32 (Demo UI/UX Bug Fixes)  
**UAT Finding:** Two bugs in flow animator state classification logic

---

## Issues Identified

### Issue 1: Signer node doesn't flash amber on infrastructure failures

**Symptom:**
When a signing request fails (e.g., no signer configured), the Signer service node stays green (active) instead of flashing amber. The Shell, ACL, and Runtime nodes correctly cascade to amber for infrastructure failures, but the Signer node is missing.

**Root Cause:**
The Signer service node flashing depends on messages reaching `flow-animator.ts` and being classified. However:

1. When no signer is configured, `createSignerService` sends an `OK` message with reason `"error: no signer configured"` (line 103 in `packages/services/src/signer-service.ts`)
2. This message **does** reach the flow animator and is classified as amber (correct)
3. However, the Signer node is **only added to the highlight path** if the message is a SIGNER_REQUEST or SIGNER_RESPONSE
4. For other messages traveling the napplet→shell→acl→runtime path, the service target is NOT detected

**Evidence from code:**

`flow-animator.ts` lines 52-67 (`detectServiceTarget`):
```typescript
function detectServiceTarget(topology: DemoTopology, msg: TappedMessage): string | null {
  if (
    (msg.parsed.eventKind === BusKind.SIGNER_REQUEST || msg.parsed.eventKind === BusKind.SIGNER_RESPONSE) &&
    topology.services.includes('signer')
  ) {
    return 'signer';  // ← Only detects SIGNER_REQUEST (kind 29001) or SIGNER_RESPONSE (kind 29002)
  }
  if (
    typeof msg.parsed.topic === 'string' &&
    msg.parsed.topic.startsWith('notifications:') &&
    topology.services.includes('notifications')
  ) {
    return 'notifications';
  }
  return null;
}
```

The highlight path builder (`buildHighlightPath`) includes the Signer node only if `detectServiceTarget` returns `'signer'`. This works for SIGNER_REQUEST messages (eventKind 29001) but the corresponding **OK response to the signer request is not classified as a signer message** — it's a generic OK verb.

**The OK response looks like:**
```
['OK', eventId, false, 'error: no signer configured']
```

The OK message has `verb='OK'` but no `eventKind`. It doesn't trigger signer detection. So the Signer node is never added to the highlight path for the error case.

---

### Issue 2: ACL denials show amber instead of red

**Symptom:**
When a capability is revoked (e.g., `relay:publish`), the nodes flash amber instead of red. Red should be reserved for explicit ACL denials. Only `state:read` and `state:write` denials currently show red.

**Root Cause:**
The `isAmber` classification in `flow-animator.ts` is too broad. It checks for keywords in the OK reason string without distinguishing ACL denials from infrastructure failures.

**Current logic** (lines 146-154 in `flow-animator.ts`):
```typescript
// Amber: infrastructure failures — not explicit ACL denials, but expected
// demo-environment failures (no signer, relay stub, timeout, not wired).
const isAmber = isOkFalse && typeof msg.raw?.[3] === 'string' && (
  msg.raw[3].includes('no signer') ||
  msg.raw[3].includes('relay') ||
  msg.raw[3].includes('timeout') ||
  msg.raw[3].includes('not wired') ||
  msg.raw[3].includes('mock')
);
```

**The problem:**
When a capability is explicitly denied by the ACL, the runtime sends:
```
['OK', eventId, false, 'denied: relay:publish']
```

The reason string contains the keyword `'relay'`, which matches the amber check. This causes ACL denials to be classified as amber instead of red.

**What should happen:**
- Infrastructure failures (no signer, relay timeout, not wired) → amber ✓
- ACL denials (denied: relay:publish, denied: sign:event) → red ✗

**Message format distinction:**

| Scenario | OK Message Format | Reason String |
|----------|-------------------|----------------|
| Infrastructure: no signer | `['OK', id, false, 'error: no signer configured']` | Does NOT start with `denied:` |
| Infrastructure: relay timeout | `['OK', id, false, 'error: relay timeout']` or similar | Does NOT start with `denied:` |
| ACL Denial: relay revoked | `['OK', id, false, 'denied: relay:publish']` | **Starts with `denied:`** |
| ACL Denial: state write revoked | `['OK', id, false, 'denied: state:write']` | **Starts with `denied:`** |

**Evidence:**
- Runtime `enforce.ts` line 201: `formatDenialReason()` returns `denied: ${capability}`
- Runtime `runtime.ts` line 444: Sends denial via `sendOk(false, formatDenialReason(result.capability))`
- Tests confirm this: `demo-audit-correctness.spec.ts` line 89 expects `'denied: relay:write'`

---

## Message Flow for OK Responses

```
EVENT (SIGNER_REQUEST, kind 29001)
  ↓
signer-service.ts: handleMessage()
  ↓
OK response sent: ['OK', eventId, false, reason]
  ↓
flow-animator.ts: tap.onMessage()
  - Checks: isOkFalse = (msg.verb === 'OK' && msg.raw?.[2] === false)
  - Parses reason from raw[3]
  - Classifies as amber or red
  - Builds highlight path (but Signer node NOT included unless original message was SIGNER_REQUEST)
```

---

## Proposed Fixes

### Fix 1: Distinguish ACL denials from infrastructure errors

**Location:** `apps/demo/src/flow-animator.ts` lines 146-154

**Change the classification logic:**
```typescript
// Amber: infrastructure failures — expected demo-environment issues
// (no signer, relay stub, timeout, not wired, mock).
// Red: explicit ACL denials (deny: ...).
const reasonString = typeof msg.raw?.[3] === 'string' ? msg.raw[3] : '';
const isDenial = reasonString.startsWith('denied:');
const isInfrastructureError = !isDenial && (
  reasonString.includes('no signer') ||
  reasonString.includes('relay') ||
  reasonString.includes('timeout') ||
  reasonString.includes('not wired') ||
  reasonString.includes('mock')
);
const isAmber = isOkFalse && isInfrastructureError;
```

**Rationale:**
- ACL denials start with `'denied:'` prefix (per `enforce.ts` line 201)
- Infrastructure errors start with `'error:'` prefix (per `signer-service.ts` line 103, 159)
- Filter out denials FIRST before checking for infrastructure keywords
- This ensures `'denied: relay:publish'` is NOT caught by the `includes('relay')` check

---

### Fix 2: Include Signer node in the highlight path for signer errors

**Location:** `apps/demo/src/flow-animator.ts` lines 140-173 (buildHighlightPath logic)

**Two approaches:**

#### Option A: Track signer OK responses via tagging in signer-service
Modify `createSignerService` to tag the OK response or provide metadata indicating it's related to a signer request. The tap could track this association.

**Pros:** Clean, explicit association  
**Cons:** Changes signer-service contract; adds complexity to tap

#### Option B: Detect signer errors by reason string pattern
Add signer-specific error detection in `flow-animator.ts`:

```typescript
function detectServiceTarget(topology: DemoTopology, msg: TappedMessage): string | null {
  // Original detection for SIGNER_REQUEST/SIGNER_RESPONSE
  if (
    (msg.parsed.eventKind === BusKind.SIGNER_REQUEST || msg.parsed.eventKind === BusKind.SIGNER_RESPONSE) &&
    topology.services.includes('signer')
  ) {
    return 'signer';
  }

  // NEW: Detect signer errors via OK response with signer-related reason
  if (
    msg.verb === 'OK' &&
    typeof msg.parsed.reason === 'string' &&
    (msg.parsed.reason.includes('no signer') || msg.parsed.reason.includes('signer')) &&
    topology.services.includes('signer')
  ) {
    return 'signer';  // ← NEW: Classify as signer target
  }

  // Notifications detection
  if (
    typeof msg.parsed.topic === 'string' &&
    msg.parsed.topic.startsWith('notifications:') &&
    topology.services.includes('notifications')
  ) {
    return 'notifications';
  }
  return null;
}
```

**Pros:** 
- No changes to protocol or service contracts
- Simple pattern matching
- Works within flow-animator's existing architecture

**Cons:**
- Couples flow-animator to signer error messages
- May match unrelated errors containing "signer"

#### Recommended: Option B
Since this is a demo visualization issue and doesn't affect protocol correctness, Option B is pragmatic and non-invasive.

---

## Testing Strategy

After fixes applied, verify:

1. **Signer amber flash:**
   - Connect demo without signer configured
   - Send a signing request from napplet
   - Verify Signer node flashes amber (not green)
   - Verify Shell, ACL, Runtime also flash amber

2. **ACL denial red classification:**
   - Revoke `relay:publish` capability for napplet
   - Send publish event
   - Verify nodes flash red (not amber)
   - Verify message shows `'denied: relay:publish'` in debugger

3. **Infrastructure failure amber classification:**
   - Revoke capability then re-enable
   - Trigger infrastructure error (no signer, timeout)
   - Verify nodes flash amber (not red)
   - Verify message shows `'error: ...'` in debugger

---

## Files Involved

- **`apps/demo/src/flow-animator.ts`** — Classification logic (both fixes)
- **`packages/runtime/src/enforce.ts`** — Denial reason format (reference)
- **`packages/services/src/signer-service.ts`** — Error messages (reference)
- **`packages/core/src/constants.ts`** — BusKind definitions (reference)

---

## Summary

| Issue | Root Cause | Fix Location | Fix Type | Priority |
|-------|-----------|--------------|----------|----------|
| Signer node missing amber | Signer detection only checks SIGNER_REQUEST/RESPONSE, not OK responses | `flow-animator.ts` detectServiceTarget | Add OK reason pattern matching | Medium |
| ACL denials show amber | isAmber checks for "relay" keyword, catches "denied: relay:publish" | `flow-animator.ts` isAmber logic | Check `denied:` prefix FIRST | High |

Both fixes are isolated to `apps/demo/src/flow-animator.ts` and do not affect protocol or runtime behavior.
