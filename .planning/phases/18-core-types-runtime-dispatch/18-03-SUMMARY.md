---
phase: 18-core-types-runtime-dispatch
plan: 03
status: complete
completed: 2026-03-31
commit: e05e4f8
---

# Plan 18-03: Shell migration — delete old service types, update shell imports

## Outcome

- `ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry` definitions removed from `packages/shell/src/types.ts`
- Shell now imports `ServiceDescriptor` from `@napplet/core` and `ServiceHandler`/`ServiceRegistry` from `@napplet/runtime`
- Re-exports added so consumers that import from `@napplet/shell` continue to work
- `packages/shell/src/hooks-adapter.ts` wires `shellHooks.services` through to `RuntimeHooks`

## Verification

- `pnpm build` passes
- `pnpm type-check` passes
- No duplicate type definitions remain
