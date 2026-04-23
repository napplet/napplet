---
plan: 40-01
phase: 40-remaining-rename-gaps
status: complete
completed: "2026-04-02"
requirements_closed:
  - SESS-03
  - TERM-01
---

# Plan 40-01 Summary: TypeScript Identifier Renames

## What Was Built

Renamed two TypeScript identifiers that remained stale after the v0.7.0 ontology audit:

1. **SESS-03**: `loadOrCreateKeypair(_nappType: string)` → `createEphemeralKeypair()` in `@napplet/shim`
2. **TERM-01**: `Nip5aManifestOptions.nappType` → `nappletType` in `@napplet/vite-plugin` and all consumers

## Tasks Completed

| Task | Description | Status |
|------|-------------|--------|
| 1 | Rename loadOrCreateKeypair to createEphemeralKeypair (SESS-03) | Complete |
| 2 | Rename nappType to nappletType in vite-plugin and 4 consumer configs (TERM-01) | Complete |

## Key Files Modified

- `packages/shim/src/napplet-keypair.ts` — function renamed, parameter removed
- `packages/shim/src/index.ts` — import and call sites updated, unused `nappletType` local vars removed
- `packages/shim/src/keyboard-shim.ts` — comment updated
- `packages/vite-plugin/src/index.ts` — interface field, JSDoc, and all 7 `options.nappType` usages renamed
- `apps/demo/napplets/chat/vite.config.ts` — `nappletType: 'demo-chat'`
- `apps/demo/napplets/bot/vite.config.ts` — `nappletType: 'demo-bot'`
- `tests/fixtures/napplets/publish-napplet/vite.config.ts` — `nappletType: 'publish-test'`
- `tests/fixtures/napplets/auth-napplet/vite.config.ts` — `nappletType: 'auth-test'`
- `tests/fixtures/napplets/auth-napplet/src/main.ts` — comment updated

## Verification

```
grep -r 'loadOrCreateKeypair' packages/ → 0 hits ✓
grep 'nappType' packages/vite-plugin/src/index.ts → 0 hits ✓
pnpm type-check → 0 errors ✓
```

## Self-Check: PASSED

All acceptance criteria met. Type-check green.
