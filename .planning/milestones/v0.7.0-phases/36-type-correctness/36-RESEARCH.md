# Phase 36: Type Correctness - Research

**Researched:** 2026-04-01
**Domain:** TypeScript type deduplication — internal codebase refactoring
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** `ConsentRequest.type` field stays optional in `@napplet/runtime` (`type?: 'destructive-signing' | 'undeclared-service'`). No callsite changes required.
- **D-02:** Shell's local `ConsentRequest` in `types.ts` (lines 71-76) is removed entirely.
- **D-03:** `packages/shell/src/index.ts` re-exports `ConsentRequest` directly from `@napplet/runtime` — replaces current re-export from `./types.js`.
- **D-04:** `shell-bridge.ts` import of `ConsentRequest` switches from `./types.js` to `@napplet/runtime`; the `handler as ConsentHandler` cast at line 173 is removed.
- **D-05:** `packages/shell/src/state-proxy.ts` is dead code — zero imports. Remove it.
- **D-06:** Phase 35 plan 35-01 touches `state-proxy.ts` (task 35-01-10); Phase 36 executes after Phase 35 is complete, so state-proxy.ts will have `BusKind.IPC_PEER` when Phase 36 deletes it. Verify zero imports before deletion.
- **D-07:** Phase 36 removes `state-proxy.ts` unconditionally after confirming zero imports.

### Claude's Discretion
None — all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<research_summary>
## Summary

This phase is entirely internal codebase surgery: no new libraries, no external dependencies, no protocol changes. All relevant decisions were captured during the `/gsd:discuss-phase` conversation and are locked in CONTEXT.md.

The type consolidation pattern used here already exists in `shell/index.ts`: enforcement types (`createEnforceGate`, `CapabilityResolution`, etc.) are re-exported directly from `@napplet/runtime` at lines 55-56. `ConsentRequest` follows the same pattern.

The `state-proxy.ts` dead code was confirmed via exhaustive grep (`grep -rn "state-proxy"` returns zero hits in production imports). The runtime extracted its own `state-handler.ts` in Phase 13 with a cleaner API (persistence hooks instead of direct localStorage). The shell version was left behind.

**Primary recommendation:** Two focused plans — Plan 36-01 for TYPE-01 (ConsentRequest consolidation, 3 files), Plan 36-02 for TYPE-02 (state-proxy.ts deletion + validation). No research into external libraries needed.
</research_summary>

<standard_stack>
## Standard Stack

No external libraries involved. This is pure TypeScript refactoring.

### Established Pattern (already in codebase)
| Pattern | Location | Description |
|---------|----------|-------------|
| Re-export from upstream | `shell/src/index.ts` lines 55-56 | `export { createEnforceGate, ... } from '@napplet/runtime'` |
| `export type { X } from 'pkg'` | `shell/src/index.ts` lines 16-18 | Protocol types re-exported from `@napplet/core` |
| Import type from runtime | `shell/src/shell-bridge.ts` line 13 | `import type { Runtime, ConsentHandler } from '@napplet/runtime'` |

### Alternatives Considered
None — pattern is already established in the codebase. Following the existing convention is the only correct choice.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern: Upstream Type Re-export
**What:** Shell re-exports types defined upstream (in runtime or core) rather than duplicating them.
**When to use:** Any type that crosses package boundaries and is canonical in a lower-level package.
**Example (existing pattern at shell/src/index.ts:55-56):**
```typescript
// Enforcement gate (re-exported from @napplet/runtime for backwards compatibility)
export { createEnforceGate, resolveCapabilities, formatDenialReason } from '@napplet/runtime';
export type { CapabilityResolution, EnforceResult, EnforceConfig, IdentityResolver, AclChecker } from '@napplet/runtime';
```

**ConsentRequest follows the same pattern:**
```typescript
// In shell/src/index.ts:
export type { ConsentRequest } from '@napplet/runtime';  // replaces ./types.js
```

### Pattern: Cast removal after type unification
**What:** When the shell and runtime `ConsentRequest` types diverge, shell-bridge.ts uses `handler as ConsentHandler` to suppress the type error. After unification (shell imports runtime's type), they are structurally identical and the cast becomes unnecessary.
**Before:**
```typescript
registerConsentHandler(handler: (request: ConsentRequest) => void): void {
  runtime.registerConsentHandler(handler as ConsentHandler);
}
```
**After:**
```typescript
registerConsentHandler(handler: (request: ConsentRequest) => void): void {
  runtime.registerConsentHandler(handler);
}
```
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

N/A — this phase is removal/refactoring only. No new code to write beyond redirecting imports.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Forgetting to update shell/types.ts imports
**What goes wrong:** After removing `ConsentRequest` from `shell/types.ts`, if `shell/types.ts` imports anything from `@napplet/runtime` for `ConsentRequest`'s JSDoc example, that import is gone — but the handler types in `types.ts` have no `ConsentRequest` reference at all since it will be removed entirely (the whole interface block, lines 62-76).
**How to avoid:** Remove the entire `ConsentRequest` interface block (lines 62-76 including JSDoc). No new import needed in `types.ts` since `ConsentRequest` will come from `@napplet/runtime` in `index.ts`.

### Pitfall 2: Leaving the import in shell-bridge.ts pointing to ./types.js
**What goes wrong:** If `shell-bridge.ts` line 20 still imports `ConsentRequest` from `./types.js` after the type is removed, TypeScript will report an error that `ConsentRequest` is not exported from `./types.js`.
**How to avoid:** Change the import on line 20 to import `ConsentRequest` from `@napplet/runtime` instead.

### Pitfall 3: Deleting state-proxy.ts while imports still exist
**What goes wrong:** If state-proxy.ts is deleted but something imports from it, TypeScript will fail.
**How to avoid:** Run `grep -rn "state-proxy" packages/ --include="*.ts"` before deletion. Confirmed zero at research time — verify again at execution time.

### Pitfall 4: shell/index.ts still references ConsentRequest from ./types.js
**What goes wrong:** After removing `ConsentRequest` from `shell/types.ts`, the re-export in `index.ts` at line 34 still points to `./types.js`. TypeScript error.
**How to avoid:** Change line 34 of `index.ts` to re-export `ConsentRequest` from `@napplet/runtime` instead of bundling it with the `from './types.js'` export block.
</common_pitfalls>

<code_examples>
## Code Examples

### shell/src/shell-bridge.ts — import line change
```typescript
// BEFORE (line 20):
import type { ShellHooks, ConsentRequest } from './types.js';

// AFTER:
import type { ShellHooks } from './types.js';
import type { ConsentRequest } from '@napplet/runtime';
```

### shell/src/shell-bridge.ts — cast removal (line 172-174)
```typescript
// BEFORE:
registerConsentHandler(handler: (request: ConsentRequest) => void): void {
  runtime.registerConsentHandler(handler as ConsentHandler);
},

// AFTER:
registerConsentHandler(handler: (request: ConsentRequest) => void): void {
  runtime.registerConsentHandler(handler);
},
```

### shell/src/index.ts — re-export source change (line 34)
```typescript
// BEFORE (ConsentRequest is inside the ./types.js block):
export type {
  ShellHooks,
  ...
  ConsentRequest,
  ...
} from './types.js';

// AFTER (ConsentRequest moves to its own line):
export type {
  ShellHooks,
  ...
  // ConsentRequest removed from here
  ...
} from './types.js';

// Add separate line:
export type { ConsentRequest } from '@napplet/runtime';
```
</code_examples>

<open_questions>
## Open Questions

1. **Will Phase 35 executor skip state-proxy.ts per D-06?**
   - What we know: Phase 35 Plan 35-01 Task 35-01-10 updates `state-proxy.ts` (`BusKind.INTER_PANE` → `BusKind.IPC_PEER`)
   - What's unclear: Phase 35 may or may not have been executed before Phase 36 runs
   - Recommendation: Phase 36 plan should include a pre-deletion verification step: check if `state-proxy.ts` still references `INTER_PANE` or `IPC_PEER`. Either way, delete the file — both are dead code. The TYPE-02 success criterion is file deletion, not the constant value.

2. **NappletKeyEntry deprecated alias in shell/types.ts**
   - What we know: `NappKeyEntry` deprecated alias is still in `shell/types.ts` (line 40-41) — this is unrelated to Phase 36 but co-located with the `ConsentRequest` removal
   - What's unclear: Whether the planner should note this as out of scope
   - Recommendation: Leave `NappKeyEntry` alias untouched — it's in scope for Phase 38 (Session Vocabulary). Phase 36 only removes `ConsentRequest`.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `packages/shell/src/types.ts` (lines 62-76 for stale `ConsentRequest`)
- Direct codebase inspection — `packages/runtime/src/types.ts` (lines 263-275 for canonical `ConsentRequest`)
- Direct codebase inspection — `packages/shell/src/index.ts` (existing re-export patterns)
- Direct codebase inspection — `packages/shell/src/shell-bridge.ts` (lines 20, 172-174 for affected sites)
- Direct codebase inspection — `packages/shell/src/state-proxy.ts` (the file to delete)
- Grep verification — `grep -rn "state-proxy" packages/ --include="*.ts"` → zero import hits
- Grep verification — `grep -rn "handleStateRequest\|cleanupNappState" packages/ --include="*.ts"` → runtime uses its own state-handler.ts, not shell's state-proxy.ts

### Secondary (MEDIUM confidence)
None needed — all findings from direct codebase inspection.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: TypeScript module re-exports, dead code removal
- Ecosystem: @napplet/shell, @napplet/runtime package boundary
- Patterns: Upstream type re-export (already established)
- Pitfalls: Import chain updates, dead code verification

**Confidence breakdown:**
- Standard stack: HIGH — no external dependencies
- Architecture: HIGH — pattern already exists in codebase
- Pitfalls: HIGH — identified all affected import sites via grep
- Code examples: HIGH — derived directly from current codebase

**Research date:** 2026-04-01
**Valid until:** N/A — internal codebase, no external dependencies
</metadata>

---

*Phase: 36-type-correctness*
*Research completed: 2026-04-01*
*Ready for planning: yes*
