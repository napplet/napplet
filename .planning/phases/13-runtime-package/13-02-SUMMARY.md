---
phase: 13
plan: 2
status: complete
started: 2026-03-31
completed: 2026-03-31
---

# Summary: Plan 13-02 — Move Enforce Gate and NappKeyRegistry to Runtime

## What was built

- `packages/runtime/src/enforce.ts`: ACL enforcement gate moved from shell, imports from @napplet/core instead of local types
- `packages/runtime/src/napp-key-registry.ts`: Identity registry converted from singleton with `window.dispatchEvent` to factory function with notifier callback

## Key decisions

- **Factory over singleton**: `createNappKeyRegistry(notifier?)` returns an instance instead of the shell's `nappKeyRegistry` singleton, enabling per-runtime-instance state.
- **Notifier callback replaces CustomEvent**: `notifier?.(windowId)` replaces `window.dispatchEvent(new CustomEvent(...))` for pending update notifications.
- **AclCheckEvent imported from local types.ts**: Since it's defined in runtime types, enforce.ts imports from `./types.js`.

## Key files

### Created
- `packages/runtime/src/enforce.ts`
- `packages/runtime/src/napp-key-registry.ts`

## Self-Check: PASSED
- No window, CustomEvent, or typeof window references
- Package builds and type-checks cleanly
