---
plan: 01
phase: 34
status: complete
completed: 2026-04-01
commit: 3b5c6d5
---

# Plan 34-01 Summary: Core Type Renames

## What Was Done

Renamed core type identifiers in `packages/runtime/src/types.ts` and `packages/shell/src/types.ts`, and updated the topic string constants in `packages/core/src/topics.ts`.

### Changes

**`packages/runtime/src/types.ts`:**
- `NappKeyEntry` → `SessionEntry` (interface rename)
- Added `export type NappKeyEntry = SessionEntry` as `@deprecated` alias (removal v0.9.0)
- JSDoc: "napp's pubkey" → "napplet's pubkey", "napp build" → "napplet build"

**`packages/shell/src/types.ts`:**
- `NappKeyEntry` → `SessionEntry` (interface rename)
- Added `export type NappKeyEntry = SessionEntry` as `@deprecated` alias
- JSDoc: "napp pubkey" → "napplet pubkey"

**`packages/core/src/topics.ts`:**
- `STATE_RESPONSE: 'napp:state-response'` → `'napplet:state-response'`
- `AUDIO_MUTED: 'napp:audio-muted'` → `'napplet:audio-muted'`

## Verification

- `pnpm type-check`: 14 successful, 14 total
- Backward compat: `NappKeyEntry` deprecated alias present in both files
