---
phase: 46
plan: 2
title: "Storage rekeying - remove pubkey from scope"
status: complete
---

# Summary: 46-02 Storage Rekeying - Remove Pubkey from Scope

## What was built
Changed storage scoping from `napplet-state:{pubkey}:{dTag}:{aggregateHash}:{userKey}` to `napplet-state:{dTag}:{aggregateHash}:{userKey}`. Added triple-read migration for backward compatibility: new format, legacy with pubkey, old `napp-state:` prefix. State-clear and state-keys merge across both formats.

## Key files
- `packages/runtime/src/state-handler.ts` — scopedKey(), legacyScopedKey(), handleStateRequest(), cleanupNappState()

## Decisions
- Pubkey completely removed from new storage key format
- Triple-read migration reads all three historical formats
- state-keys deduplicates across prefixes using Set
- state-clear clears both new and legacy prefixes
- cleanupNappState() still accepts pubkey param for legacy cleanup

## Self-Check: PASSED
