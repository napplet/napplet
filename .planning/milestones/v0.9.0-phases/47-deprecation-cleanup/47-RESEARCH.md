# Phase 47: Deprecation Cleanup - Research

**Researched:** 2026-04-02
**Phase:** 47 — Deprecation Cleanup
**Requirements:** DEP-03, DEP-04

## Research Summary

This phase is pure deletion of deprecated type aliases (`RuntimeHooks`, `ShellHooks`) and their deprecated test utility wrapper (`createMockRuntimeHooks`). The canonical replacements (`RuntimeAdapter`, `ShellAdapter`, `createMockRuntimeAdapter`) already exist and are in use — this phase removes the old names.

## Inventory of Deprecated Symbols

### RuntimeHooks (DEP-03)

| File | Line | What to do |
|------|------|------------|
| `packages/runtime/src/types.ts:574` | `export type RuntimeHooks = RuntimeAdapter;` | Delete the type alias and its JSDoc |
| `packages/runtime/src/index.ts:6` | `RuntimeHooks,  // @deprecated — use RuntimeAdapter` | Remove from re-export list |
| `packages/runtime/src/test-utils.ts:227-229` | `createMockRuntimeHooks` function | Delete the deprecated wrapper function and its JSDoc |
| `packages/runtime/src/dispatch.test.ts:13` | `import { createMockRuntimeHooks }` | Change to `createMockRuntimeAdapter` |
| `packages/runtime/src/dispatch.test.ts` | 10 call sites | Rename `createMockRuntimeHooks(` → `createMockRuntimeAdapter(` |
| `packages/runtime/src/discovery.test.ts:14` | `import { createMockRuntimeHooks }` | Change to `createMockRuntimeAdapter` |
| `packages/runtime/src/discovery.test.ts` | 7 call sites | Rename `createMockRuntimeHooks(` → `createMockRuntimeAdapter(` |
| `packages/runtime/README.md` | 10+ occurrences | Replace `RuntimeHooks` with `RuntimeAdapter` throughout |

### ShellHooks (DEP-04)

| File | Line | What to do |
|------|------|------------|
| `packages/shell/src/types.ts:242` | `export type ShellHooks = ShellAdapter;` | Delete the type alias and its JSDoc |
| `packages/shell/src/index.ts:23` | `ShellHooks,  // @deprecated — use ShellAdapter` | Remove from re-export list |
| `packages/shell/src/hooks-adapter.ts:53` | JSDoc comment referencing `ShellHooks`/`RuntimeHooks` | Update to `ShellAdapter`/`RuntimeAdapter` |
| `packages/shell/README.md` | 15+ occurrences | Replace `ShellHooks` with `ShellAdapter` and `RuntimeHooks` with `RuntimeAdapter` throughout |

### Cross-package References

| File | Occurrences | What to do |
|------|-------------|------------|
| `packages/services/README.md` | 3 occurrences of `RuntimeHooks.services` | Replace with `RuntimeAdapter.services` |

### Demo and Test References (missed by CONTEXT.md's 11-file list)

| File | Occurrences | What to do |
|------|-------------|------------|
| `apps/demo/src/shell-host.ts` | `type ShellHooks` import, return type, comment | Replace with `ShellAdapter` |
| `tests/helpers/mock-hooks.ts` | `ShellHooks` in import, interface, JSDoc, function sig, variable | Replace all with `ShellAdapter` |
| `tests/unit/shell-runtime-integration.test.ts` | `RuntimeHooks` type import, `createMockRuntimeHooks` import + 3 call sites | Replace with `RuntimeAdapter` and `createMockRuntimeAdapter` |
| `tests/e2e/harness/harness.ts` | `ShellHooks` in JSDoc comment (line 4) | Replace with `ShellAdapter` |

## Risk Assessment

- **Risk: None** — All canonical replacements already exist and are the primary types used in implementation code
- **Risk: Test breakage** — Low. Tests use `createMockRuntimeHooks` which wraps `createMockRuntimeAdapter`. Renaming call sites is mechanical.
- **Risk: External consumers** — Intentional. The entire point is that external consumers importing the old names get a build failure, directing them to use the new names.

## Dependencies

- `createMockRuntimeAdapter` already exists at `packages/runtime/src/test-utils.ts:181` — no new code needed
- `RuntimeAdapter` already exists at `packages/runtime/src/types.ts` — the canonical type
- `ShellAdapter` already exists at `packages/shell/src/types.ts` — the canonical type

## Validation Architecture

Not applicable — this phase is pure deletion with no new behavior. Validation is:
1. `pnpm build` succeeds (no type errors referencing removed aliases internally)
2. `pnpm type-check` passes
3. `grep -r "RuntimeHooks\|ShellHooks" packages/` returns zero matches in `.ts` files (only `.md` planning docs may reference for historical context)

## RESEARCH COMPLETE
