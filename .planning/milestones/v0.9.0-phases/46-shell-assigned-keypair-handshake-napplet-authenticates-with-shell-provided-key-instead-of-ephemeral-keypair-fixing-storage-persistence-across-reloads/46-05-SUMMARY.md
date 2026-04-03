---
phase: 46
plan: 5
title: "Aggregate hash verification and caching"
status: complete
---

# Summary: 46-05 Aggregate Hash Verification and Caching

## What was built
Added shell-side aggregate hash verification to the REGISTER handler. ManifestCache gains in-memory verification cache (getVerification/setVerification/hasVerification/clearVerifications). REGISTER handler calls hashVerifier.computeHash when adapter is provided, caches results, triggers onHashMismatch on mismatch (user warning, not rejection). All new types exported from @napplet/runtime index.

## Key files
- `packages/runtime/src/manifest-cache.ts` — verificationCache Map, getVerification/setVerification/hasVerification/clearVerifications
- `packages/runtime/src/runtime.ts` — hash verification block in handleRegister()
- `packages/runtime/src/index.ts` — exports ShellSecretPersistence, GuidPersistence, HashVerifierAdapter, VerificationCacheEntry

## Decisions
- Verification cache is in-memory only (no persistence needed — events are immutable)
- Cache key is composite `dTag:aggregateHash` string
- Hash mismatch triggers callback but does NOT block registration (D-04)
- Missing hashVerifier gracefully skips verification (dev mode)
- Verification errors caught silently (best-effort)
- clear() on ManifestCache also clears verificationCache

## Self-Check: PASSED
