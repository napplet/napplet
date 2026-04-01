---
phase: 32-fix-demo-ui-ux-bugs
plan: 04
type: execute
status: completed
---

# Plan 32-04: Fix isAmber logic (ACL denials show red, not amber)

## Summary
Fixed ACL denial classification to show red instead of amber by refactoring the `isAmber` logic in `flow-animator.ts`.

## Changes
**File:** `apps/demo/src/flow-animator.ts` (lines 146-154)

### What was changed
Refactored the isAmber detection logic to distinguish ACL denials from infrastructure errors:

**Before:**
```typescript
const isAmber = isOkFalse && typeof msg.raw?.[3] === 'string' && (
  msg.raw[3].includes('no signer') ||
  msg.raw[3].includes('relay') ||
  msg.raw[3].includes('timeout') ||
  msg.raw[3].includes('not wired') ||
  msg.raw[3].includes('mock')
);
```

**After:**
```typescript
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

### Why it works
- Extracts reason string into variable for clarity and reuse
- Checks if reason **starts with** `'denied:'` prefix first — this catches ALL ACL denials
- Only checks infrastructure keywords if **NOT** a denial (`!isDenial`)
- Ensures `'denied: relay:publish'` is classified as red (blocked), not amber (infrastructure)

## Verification
✓ Grep command confirms new pattern in file:
```bash
grep -A 5 "Classify failure type:" apps/demo/src/flow-animator.ts
```
- Shows `isDenial = reasonString.startsWith('denied:')`
- Shows `isInfrastructureError = !isDenial && (...)`
- Shows `const isAmber = isOkFalse && isInfrastructureError;`

✓ Build verification: `pnpm --filter @napplet/demo build` succeeds

## Result
ACL denials (e.g., revoked relay:publish capability) now correctly flash red nodes instead of amber. Infrastructure failures (no signer, relay timeout, not wired, mock) remain amber as expected.
