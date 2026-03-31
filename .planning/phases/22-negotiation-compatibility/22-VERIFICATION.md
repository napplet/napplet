---
status: passed
phase: 22-negotiation-compatibility
verified_at: 2026-03-31
---

# Phase 22: Negotiation & Compatibility — Verification

## Phase Goal

Napplets declare service dependencies in their manifest, the runtime checks them at load time, and the shell host receives a compatibility report before the napplet starts real work.

**Result: PASSED** — All 9 requirements verified against actual codebase.

## Must-Have Verification

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| COMPAT-01 | Vite plugin injects requires tags into NIP-5A manifest | PASS | `requiresTags` in vite-plugin/src/index.ts + `napplet-requires` meta tag |
| NEG-06 | strictMode configurable via RuntimeHooks | PASS | `strictMode?: boolean` in RuntimeHooks interface |
| COMPAT-02 | CompatibilityReport surfaced via onCompatibilityIssue | PASS | `onCompatibilityIssue?: (report: CompatibilityReport) => void` in RuntimeHooks |
| NEG-01 | Runtime reads manifest requires and checks ServiceRegistry at napplet load | PASS | `checkCompatibility()` called in AUTH flow, reads `manifestCache.getRequires()` |
| NEG-02 | onCompatibilityIssue raised when services missing | PASS | `hooks.onCompatibilityIssue?.(report)` in checkCompatibility() |
| NEG-03 | Strict mode blocks loading when services missing | PASS | `hooks.strictMode → OK false + pendingAuthQueue.delete + return` |
| NEG-04 | Permissive mode loads with warning (default) | PASS | When `!hooks.strictMode`: onCompatibilityIssue fires but OK true is still sent |
| COMPAT-03 | Shell host receives compat info before napplet starts work | PASS | Check runs BEFORE `sendToNapplet(OK true)` and BEFORE queued message dispatch |
| NEG-05 | Undeclared service usage raises consent at dispatch time | PASS | `checkUndeclaredService()` in INTER_PANE handler with ConsentRequest type discriminator |

## Automated Checks

```
grep "requires.*string" packages/vite-plugin/src/index.ts → PASS
grep "napplet-requires" packages/vite-plugin/src/index.ts → PASS
grep "requiresTags" packages/vite-plugin/src/index.ts → PASS
pnpm --filter @napplet/vite-plugin build → PASS (exit 0)

grep "export interface CompatibilityReport" packages/runtime/src/types.ts → PASS
grep "export interface ServiceInfo" packages/runtime/src/types.ts → PASS
grep "undeclared-service" packages/runtime/src/types.ts → PASS
grep "onCompatibilityIssue" packages/runtime/src/types.ts → PASS
grep "strictMode" packages/runtime/src/types.ts → PASS
grep "requires.*string" packages/runtime/src/types.ts (ManifestCacheEntry) → PASS
pnpm --filter @napplet/runtime build → PASS (exit 0)

grep "checkCompatibility" packages/runtime/src/runtime.ts → PASS
grep "getRequires" packages/runtime/src/manifest-cache.ts → PASS
grep "registeredServices" packages/runtime/src/runtime.ts → PASS
grep "registerService" packages/runtime/src/runtime.ts → PASS
grep "checkUndeclaredService" packages/runtime/src/runtime.ts → PASS
grep "undeclaredServiceConsents" packages/runtime/src/runtime.ts → PASS
pnpm build (full workspace) → PASS (14/14 tasks, exit 0)
pnpm type-check (full workspace) → PASS (13/13 tasks, exit 0)
```

## Behavioral Verification

1. **Auth flow ordering** (COMPAT-03): `nappKeyRegistry.register` (line 311) → `checkCompatibility` (line 313) → if blocked: pendingAuthQueue.delete + return → `sendToNapplet OK true` (line 320) → dispatch queued messages (line 322-323). Ordering confirmed.

2. **Strict mode blocking** (NEG-03): `checkCompatibility` calls `hooks.sendToNapplet(['OK', eventId, false, 'blocked: ...'])` and returns `false`. The caller in AUTH flow checks `if (!isCompatible)` → `pendingAuthQueue.delete(windowId); return;` so queued messages are NOT dispatched.

3. **Permissive mode** (NEG-04): When `!hooks.strictMode`, `checkCompatibility` returns `true` even if services are missing. AUTH flow proceeds to OK true and queue dispatch.

4. **Requires empty shortcut**: `if (requires.length === 0) return true;` — no registry check performed for napplets with no service declarations.

5. **Undeclared service consent cache**: `undeclaredServiceConsents` Set tracks `windowId:serviceName` keys. Once approved, subsequent calls return `true` immediately without prompting.

6. **Shell command bypass**: `shell:*` topics are handled before the undeclared service check fires, so shell commands are not affected.

## Human Verification Items

None — all phase 22 behaviors are verifiable through code inspection and build output. No UI or runtime interaction required.

## Issues Found

None. Phase 22 implementation is complete and correct.
