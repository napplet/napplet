# Phase 40: Remaining Rename Gaps - Research

**Researched:** 2026-04-01
**Domain:** Codebase rename gap closure (TypeScript identifiers, SPEC.md topic strings, vite-plugin public API)
**Confidence:** HIGH

## Summary

Phase 40 closes three specific audit gaps identified in the v0.7.0 milestone audit that were missed or deferred during Phases 34, 35, and 38. All three gaps are well-scoped, low-risk string replacements with clear success criteria and no architectural decisions.

**Gap 1 (SESS-03):** `loadOrCreateKeypair()` in shim was deferred from Phase 38 (SEED-001 concern). The function must be renamed to `createEphemeralKeypair()` and its unused `_nappType` parameter removed. Four call sites and two comment references exist -- all internal to `@napplet/shim` (not publicly exported).

**Gap 2 (TERM-01):** `Nip5aManifestOptions.nappType` in the vite-plugin public API was missed during Phase 34's rename pass. Must become `nappletType`. This is a breaking change to the plugin config interface, but packages are pre-publish (v0.1.0, never published to npm) so no backward compatibility concern. The field is used in 4 vite.config.ts files (2 demo napplets, 2 test fixtures), the plugin README, and a skills file.

**Gap 3 (TERM-04/WIRE-02):** SPEC.md contains 6 stale `napp:` / `napp-state:` strings that should use `napplet:` / `napplet-state:` prefixes. The actual code (`packages/core/src/topics.ts`) was correctly renamed -- only the spec document is stale. Two READMEs (core, services) also have stale topic string comments.

**Primary recommendation:** Execute as three independent, small edits. No architectural decisions needed. All gaps are deterministic find-and-replace with a `pnpm type-check` gate.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SESS-03 | `loadOrCreateKeypair()` renamed to `createEphemeralKeypair()` -- name matches actual behavior; unused `_nappType` parameter removed | Gap 1 analysis: 1 definition, 2 call sites, 2 comment refs -- all in shim package. Not re-exported. |
| TERM-01 | All `napp*` TypeScript identifiers renamed to `napplet*` across all 7 packages | Gap 2 analysis: `Nip5aManifestOptions.nappType` is the sole remaining gap. 9 occurrences in index.ts, 4 consumer vite.config.ts files, README, skills file. |
| TERM-04 | SPEC.md corrected -- all uses of "napp" where "napplet" is intended replaced throughout | Gap 3 analysis: 6 stale strings at SPEC.md lines 202, 572, 599, 625, 654, 660-661. Two READMEs also stale. |
| WIRE-02 | SPEC.md and documentation updated -- INTER-PANE/inter-pane replaced with IPC-PEER/ipc-peer throughout | Gap 3 analysis: INTER-PANE correctly gone (0 hits). Remaining gap overlaps TERM-04 -- same stale topic prefix strings. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- ESM-only (no CJS output)
- Zero framework dependencies
- TypeScript strict mode
- `pnpm type-check` must pass across all packages
- `verbatimModuleSyntax: true` -- explicit `import type` for types
- All public API exports require JSDoc with @param, @returns, @example
- 2-space indentation, semicolons required
- GSD workflow enforcement -- all changes through GSD commands

## Standard Stack

No new libraries or dependencies. This phase is purely code/documentation edits to existing files.

### Tools Used
| Tool | Purpose |
|------|---------|
| `pnpm type-check` | TypeScript validation gate (turbo run type-check across all packages) |
| `grep -r` | Verification that stale strings are eliminated |

## Architecture Patterns

### No Architectural Changes

This phase involves no structural changes. All edits are:
1. Function rename + parameter removal (shim internal)
2. Interface field rename (vite-plugin public API)
3. String literal replacement (SPEC.md + READMEs)

## Don't Hand-Roll

Not applicable -- no new functionality is being built.

## Common Pitfalls

### Pitfall 1: Missing Call Site Updates After Function Rename
**What goes wrong:** Renaming `loadOrCreateKeypair` to `createEphemeralKeypair` in the definition but forgetting a call site or import statement.
**Why it happens:** Function is imported and called in multiple files.
**How to avoid:** Full inventory already done. There are exactly 4 files:
  - `packages/shim/src/napplet-keypair.ts:31` -- definition (rename + remove `_nappType` param)
  - `packages/shim/src/index.ts:7` -- import statement
  - `packages/shim/src/index.ts:228` -- call site (remove argument)
  - `packages/shim/src/index.ts:344` -- call site (remove argument)
  - `packages/shim/src/keyboard-shim.ts:9,14` -- comments only (update references)
**Warning signs:** `pnpm type-check` will catch any missed call sites immediately.

### Pitfall 2: Forgetting Consumer Vite Config Updates for nappType -> nappletType
**What goes wrong:** Renaming the interface field but not updating the vite.config.ts files that pass the option.
**Why it happens:** Consumer files are spread across apps/ and tests/ directories.
**How to avoid:** Complete list of consumers:
  - `packages/vite-plugin/src/index.ts` -- definition (9 occurrences of `options.nappType` and field name)
  - `apps/demo/napplets/chat/vite.config.ts:8` -- `nappType: 'demo-chat'`
  - `apps/demo/napplets/bot/vite.config.ts:8` -- `nappType: 'demo-bot'`
  - `tests/fixtures/napplets/publish-napplet/vite.config.ts:8` -- `nappType: 'publish-test'`
  - `tests/fixtures/napplets/auth-napplet/vite.config.ts:8` -- `nappType: 'auth-test'`
  - `packages/vite-plugin/README.md` -- 3 occurrences (code examples, API docs)
  - `skills/build-napplet/SKILL.md` -- 2 occurrences (tutorial code)
**Warning signs:** `pnpm type-check` catches TypeScript files; README/skills require manual grep.

### Pitfall 3: Leaving the Dual-Read Fallback String Unchanged
**What goes wrong:** Confusing the SPEC.md `napp-state:` string (stale, needs update) with the runtime dual-read fallback `napp-state:` (intentional migration code, must stay).
**Why it happens:** Both use the same string literal but for different purposes.
**How to avoid:** The SPEC.md line 625 shows the canonical key format as `napp-state:` -- this must change to `napplet-state:` because the canonical format IS now `napplet-state:`. The code in `packages/runtime/src/state-handler.ts:93` has `napp-state:` as the OLD fallback key -- this is intentional (TERM-02 dual-read migration) and MUST NOT be changed.
**Warning signs:** Success criteria #3 only mentions SPEC.md. No runtime code should be touched for this string.

### Pitfall 4: SPEC.md nappType Pseudocode Variables
**What goes wrong:** Missing the `nappType` variable names in SPEC.md pseudocode at lines 289 and 1004 when fixing TERM-04.
**Why it happens:** Success criteria #3 only lists three specific string patterns (`napp:state-response`, `napp:audio-muted`, `napp-state:`). The pseudocode variables are a separate concern.
**How to avoid:** The actual code already uses `nappletType` (runtime.ts:246-247). SPEC.md pseudocode at lines 289 and 1004 still shows `nappType`. While the Phase 40 success criteria does not explicitly list this, TERM-04 requires "all uses of napp where napplet is intended replaced throughout." These pseudocode variables should be updated to `nappletType` as part of the SPEC.md pass.
**Warning signs:** Grep for `nappType` in SPEC.md -- should return 0 hits after completion.

### Pitfall 5: Test Helper nappType Not in Phase 40 Scope
**What goes wrong:** Renaming `nappType` in `tests/helpers/auth-event-builder.ts` and breaking existing tests unnecessarily.
**Why it happens:** TERM-01 says "all napp* TypeScript identifiers across all 7 packages." The test helpers are not in a package -- they're in `tests/`. The milestone audit explicitly marked this file's usage as acceptable.
**How to avoid:** The Phase 40 success criteria does NOT mention test helpers. The audit gap for TERM-01 specifically says "vite-plugin Nip5aManifestOptions.nappType not renamed." Leave `tests/helpers/auth-event-builder.ts` alone unless the user explicitly asks for it.
**Warning signs:** None -- tests will continue passing as-is.

## Code Examples

### Gap 1: createEphemeralKeypair Rename

**Before (current):**
```typescript
// packages/shim/src/napplet-keypair.ts
export function loadOrCreateKeypair(_nappType: string): NappletKeypair {
  const privkey = generateSecretKey();
  const pubkey = getPublicKey(privkey);
  return { privkey, pubkey };
}
```

**After:**
```typescript
// packages/shim/src/napplet-keypair.ts
export function createEphemeralKeypair(): NappletKeypair {
  const privkey = generateSecretKey();
  const pubkey = getPublicKey(privkey);
  return { privkey, pubkey };
}
```

**Call site update (packages/shim/src/index.ts):**
```typescript
// Before:
keypair = loadOrCreateKeypair(nappletType);
// After:
keypair = createEphemeralKeypair();
```

### Gap 2: nappletType Rename in Vite Plugin

**Before (current):**
```typescript
// packages/vite-plugin/src/index.ts
export interface Nip5aManifestOptions {
  nappType: string;
  requires?: string[];
}
```

**After:**
```typescript
export interface Nip5aManifestOptions {
  nappletType: string;
  requires?: string[];
}
```

All `options.nappType` references in the file become `options.nappletType`.

**Consumer update (vite.config.ts files):**
```typescript
// Before:
nip5aManifest({ nappType: 'demo-chat' })
// After:
nip5aManifest({ nappletType: 'demo-chat' })
```

### Gap 3: SPEC.md Topic String Updates

Six specific replacements:
1. Line 202: `napp:state-response` -> `napplet:state-response`
2. Line 572: `napp:state-response` -> `napplet:state-response`
3. Line 599: `napp:state-response` -> `napplet:state-response`
4. Line 625: `napp-state:{pubkey}:...` -> `napplet-state:{pubkey}:...`
5. Line 654: `napp:audio-muted` -> `napplet:audio-muted`
6. Lines 660-661: `napp:audio-muted` -> `napplet:audio-muted` (2 occurrences in prose)

Plus SPEC.md pseudocode updates:
7. Line 289: `nappType` -> `nappletType`
8. Line 1004: `nappType` -> `nappletType`

Plus README updates:
9. `packages/core/README.md:153` -- `'napp:state-response'` -> `'napplet:state-response'`
10. `packages/core/README.md:162` -- `'napp:audio-muted'` -> `'napplet:audio-muted'`
11. `packages/services/README.md:90` -- `napp:audio-muted` -> `napplet:audio-muted`

## Complete File Inventory

### Files Requiring Code Changes (TypeScript)

| File | Change | Gap |
|------|--------|-----|
| `packages/shim/src/napplet-keypair.ts` | Rename function, remove `_nappType` param, update JSDoc | SESS-03 |
| `packages/shim/src/index.ts` | Update import name (line 7), remove args at call sites (lines 228, 344) | SESS-03 |
| `packages/shim/src/keyboard-shim.ts` | Update 2 comment references (lines 9, 14) | SESS-03 |
| `packages/vite-plugin/src/index.ts` | Rename `nappType` field to `nappletType` in interface + all 8 `options.nappType` refs | TERM-01 |
| `apps/demo/napplets/chat/vite.config.ts` | `nappType` -> `nappletType` | TERM-01 |
| `apps/demo/napplets/bot/vite.config.ts` | `nappType` -> `nappletType` | TERM-01 |
| `tests/fixtures/napplets/publish-napplet/vite.config.ts` | `nappType` -> `nappletType` | TERM-01 |
| `tests/fixtures/napplets/auth-napplet/vite.config.ts` | `nappType` -> `nappletType` | TERM-01 |

### Files Requiring Documentation Changes

| File | Change | Gap |
|------|--------|-----|
| `SPEC.md` | 8 string replacements (6 topic prefixes + 2 pseudocode variables) | TERM-04, WIRE-02 |
| `packages/core/README.md` | 2 stale topic string comments | TERM-04 |
| `packages/services/README.md` | 1 stale topic string | TERM-04 |
| `packages/vite-plugin/README.md` | 3 `nappType` -> `nappletType` in examples | TERM-01 |
| `skills/build-napplet/SKILL.md` | 2 `nappType` -> `nappletType` in tutorial | TERM-01 |
| `tests/fixtures/napplets/auth-napplet/src/main.ts` | 1 stale comment: "Read nappType from" (line 5) | TERM-01 |

### Files NOT to Change

| File | Reason |
|------|--------|
| `packages/runtime/src/state-handler.ts:93` | `napp-state:` is the intentional dual-read fallback (TERM-02) |
| `tests/helpers/auth-event-builder.ts` | `nappType` property not in Phase 40 scope per audit |
| `.planning/*` | Planning artifacts document history; not production code |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `loadOrCreateKeypair(_nappType)` | Phase 38 added TODO(SEED-001) but did not rename | Phase 38 (2026-04-01) | Phase 40 completes the rename |
| `nappType` option in vite-plugin | Missed during Phase 34 rename pass | Phase 34 (2026-04-01) | Phase 40 completes the rename |
| `napp:*` topic prefix strings in SPEC.md | Code renamed in Phase 34; SPEC.md partially updated | Phase 34 (2026-04-01) | Phase 40 fixes remaining 6 stale strings |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (e2e) + vitest (unit) |
| Config file | `playwright.config.ts` (root), `packages/core/vitest.config.ts` |
| Quick run command | `pnpm type-check` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-03 | `createEphemeralKeypair()` replaces `loadOrCreateKeypair` | grep verification | `grep -r 'loadOrCreateKeypair' packages/ \| grep -v node_modules \| grep -v dist` -> 0 hits | N/A (grep) |
| TERM-01 | `nappletType` replaces `nappType` in vite-plugin | grep verification + type-check | `grep 'nappType' packages/vite-plugin/src/index.ts` -> 0 hits; `pnpm type-check` | N/A (grep) |
| TERM-04 | SPEC.md stale strings gone | grep verification | `grep -E 'napp:state-response\|napp:audio-muted\|napp-state:' SPEC.md` -> 0 hits | N/A (grep) |
| WIRE-02 | SPEC.md IPC-PEER docs correct | grep verification | `grep -E 'INTER.PANE\|INTER_PANE' SPEC.md` -> 0 hits (already passing) | N/A (grep) |

### Sampling Rate
- **Per task commit:** `pnpm type-check`
- **Per wave merge:** `pnpm type-check` + grep verifications
- **Phase gate:** Full `pnpm type-check` green + all grep verifications return 0 hits

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. No new test files needed. The verification is primarily grep-based string absence checks plus TypeScript compilation.

## Open Questions

1. **Test helper nappType property**
   - What we know: `tests/helpers/auth-event-builder.ts` has `nappType` property in `AuthEventOptions`. The milestone audit did not flag this as a gap. It is not in a package directory.
   - What's unclear: Whether the user wants this renamed too for completeness.
   - Recommendation: Do NOT rename in Phase 40. If desired, handle as a separate follow-up. The Phase 40 success criteria does not mention it.

2. **cleanupNappState function name**
   - What we know: `packages/runtime/src/state-handler.ts` exports `cleanupNappState()`. This was not flagged by the milestone audit as a TERM-01 gap.
   - What's unclear: Whether this was intentionally left as-is or simply missed.
   - Recommendation: Out of Phase 40 scope. The audit gap for TERM-01 specifically identifies only `Nip5aManifestOptions.nappType`.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all affected files
- `.planning/v0.7.0-MILESTONE-AUDIT.md` -- authoritative gap identification
- `.planning/REQUIREMENTS.md` -- requirement definitions
- `packages/core/src/topics.ts` -- confirmed code already renamed (topics are `napplet:*`)
- `packages/runtime/src/state-handler.ts` -- confirmed dual-read fallback is intentional

### Secondary (MEDIUM confidence)
- `.planning/phases/38-session-vocabulary/38-CONTEXT.md` -- SESS-03 deferral rationale (D-06)
- `.planning/phases/34-terminology-rename/34-04-PLAN.md` -- original rename scope

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure rename
- Architecture: HIGH -- no structural changes
- Pitfalls: HIGH -- complete file inventory verified by grep across entire repo
- File inventory: HIGH -- every occurrence of each string independently verified

**Research date:** 2026-04-01
**Valid until:** Indefinite -- this is a deterministic cleanup task with no external dependencies
