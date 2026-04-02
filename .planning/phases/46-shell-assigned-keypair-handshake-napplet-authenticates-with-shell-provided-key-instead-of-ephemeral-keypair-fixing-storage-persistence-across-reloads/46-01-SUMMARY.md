---
phase: 46
plan: 1
title: "Core protocol types and shell secret infrastructure"
status: complete
---

# Summary: 46-01 Core Protocol Types and Shell Secret Infrastructure

## What was built
Added REGISTER and IDENTITY protocol verb constants and payload type interfaces to @napplet/core. Added ShellSecretPersistence, GuidPersistence, HashVerifierAdapter, VerificationCacheEntry, and CryptoAdapter.randomBytes to @napplet/runtime types. All new types exported from package index files.

## Key files
- `packages/core/src/constants.ts` — VERB_REGISTER, VERB_IDENTITY constants
- `packages/core/src/types.ts` — RegisterPayload, IdentityPayload interfaces
- `packages/core/src/index.ts` — re-exports new types and constants
- `packages/runtime/src/types.ts` — ShellSecretPersistence, GuidPersistence, HashVerifierAdapter, VerificationCacheEntry, CryptoAdapter.randomBytes

## Decisions
- Verb constants are string literals ('REGISTER', 'IDENTITY'), not event kinds
- CryptoAdapter gained randomBytes() for shell secret generation
- All new runtime adapter fields are optional (backward compatible)

## Self-Check: PASSED
