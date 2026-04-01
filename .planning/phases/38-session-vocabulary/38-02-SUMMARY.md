---
plan: 38-02
phase: 38-session-vocabulary
status: complete
completed_at: 2026-04-01
---

# Plan 38-02 Summary: Add SEED-001 TODO comment to napplet-keypair.ts

## What was done
- Added 4-line `// TODO(SEED-001):` comment block immediately before `export function loadOrCreateKeypair` in `packages/shim/src/napplet-keypair.ts`
- Comment documents that the placeholder always generates a random keypair and references the seed file path

## Verification
- `grep -n "TODO(SEED-001)" packages/shim/src/napplet-keypair.ts` → line 27 confirmed
- `grep -n "loadOrCreateKeypair"` → function name unchanged
- `grep "createEphemeralKeypair"` → 0 hits (not renamed)
- `pnpm --filter @napplet/shim type-check` → 0 errors
