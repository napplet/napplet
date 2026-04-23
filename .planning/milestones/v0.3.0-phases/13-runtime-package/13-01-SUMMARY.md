---
phase: 13
plan: 1
status: complete
started: 2026-03-31
completed: 2026-03-31
---

# Summary: Plan 13-01 — Scaffold @napplet/runtime Package and Define RuntimeHooks Interface

## What was built

Created the @napplet/runtime package from scratch with:
- `package.json` with workspace dependencies on @napplet/core and @napplet/acl
- `tsconfig.json` with ES2022 lib only (no DOM — enforces browser-agnostic constraint)
- `tsup.config.ts` for ESM-only build with type declarations
- `src/types.ts` defining RuntimeHooks and all sub-hook interfaces
- `src/index.ts` barrel export of all types

## Key decisions

- **AclCheckEvent defined in runtime types**: The shell's `AclCheckEvent` was not in @napplet/core, so it was defined in runtime's types.ts as a protocol-level concern.
- **RuntimeRelayPoolHooks.subscribe accepts relayUrls**: Added optional `relayUrls` parameter to decouple relay URL selection from subscription creation.
- **RuntimeRelayPoolHooks.isAvailable()**: Added availability check to replace null-returning `getRelayPool()` pattern.

## Key files

### Created
- `packages/runtime/package.json`
- `packages/runtime/tsconfig.json`
- `packages/runtime/tsup.config.ts`
- `packages/runtime/src/types.ts`
- `packages/runtime/src/index.ts`

## Self-Check: PASSED
- Package builds and type-checks cleanly
- No DOM lib in tsconfig
- Only @napplet/core and @napplet/acl as dependencies
