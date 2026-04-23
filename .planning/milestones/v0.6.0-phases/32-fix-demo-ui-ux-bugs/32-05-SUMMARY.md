---
phase: 32-fix-demo-ui-ux-bugs
plan: 05
type: execute
status: completed
---

# Plan 32-05: Fix detectServiceTarget (Signer node flashes amber on infrastructure failures)

## Summary
Enhanced `detectServiceTarget()` to catch signer-specific error messages via OK response reason patterns, so the Signer node now flashes amber when signing requests fail.

## Changes
**File:** `apps/demo/src/flow-animator.ts` (lines 52-67)

### What was changed
Added a new detection path to catch signer errors in OK responses:

**Before:**
```typescript
function detectServiceTarget(topology: DemoTopology, msg: TappedMessage): string | null {
  if (
    (msg.parsed.eventKind === BusKind.SIGNER_REQUEST || msg.parsed.eventKind === BusKind.SIGNER_RESPONSE) &&
    topology.services.includes('signer')
  ) {
    return 'signer';
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

**After:**
```typescript
function detectServiceTarget(topology: DemoTopology, msg: TappedMessage): string | null {
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
    return 'signer';
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

### Why it works
- The original detection only caught `SIGNER_REQUEST` (kind 29001) and `SIGNER_RESPONSE` (kind 29002) messages
- When a signer request fails (e.g., no signer configured), the shell responds with an OK message containing the error reason, but no eventKind field
- New path checks for `msg.verb === 'OK'` and reason patterns like `'no signer'` or `'signer'`
- This non-invasive pattern matching detects signer-specific errors without modifying service contracts
- Signer service existence verified before returning (topology.services check)

## Verification
✓ Grep command confirms new detection code in file:
```bash
grep -A 12 "NEW: Detect signer errors" apps/demo/src/flow-animator.ts
```
- Shows the OK message condition check
- Shows the reason pattern matching for 'no signer' and 'signer' keywords
- Shows the signer service registration check
- Shows the return statement

✓ Build verification: `pnpm --filter @napplet/demo build` succeeds

## Result
The Signer node now flashes amber along with Shell, ACL, and Runtime nodes when signing requests fail due to no signer being configured or other signer service issues.
