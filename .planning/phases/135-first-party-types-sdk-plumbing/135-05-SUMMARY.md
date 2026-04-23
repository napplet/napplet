---
phase: 135-first-party-types-sdk-plumbing
plan: 05
subsystem: gap-closure
tags: [typescript, nub-identity, type-reexport, assertNever, exhaustiveness, gap-closure, verification]

# Dependency graph
requires:
  - phase: 135
    plan: 01
    provides: "IdentityDecryptMessage + IdentityDecryptResultMessage + IdentityDecryptErrorMessage types; Rumor + UnsignedEvent on @napplet/core barrel; IdentityNubMessage 21-member discriminated union"
  - phase: 135
    plan: 02
    provides: "packages/nub/src/identity/shim.ts handleIdentityMessage (loose-typed if/else dispatch) and decrypt() public function — the handler body this plan refactors"
  - phase: 135
    plan: 03
    provides: "@napplet/sdk identity namespace with Rumor + UnsignedEvent re-exports (consistency target — Plan 05 brings @napplet/nub/identity into parity)"
  - phase: 135
    plan: 04
    provides: "VER-01 + VER-05 baseline (workspace green + 7-symbol absence in identity-types-only tree-shake bundle); Plan 05 confirms no regression against this baseline"
provides:
  - "packages/nub/src/identity/index.ts cross-package type re-exports of Rumor + UnsignedEvent from @napplet/core — 'import { type Rumor } from @napplet/nub/identity' now resolves (ROADMAP SC1 exact import path closed)"
  - "packages/nub/src/identity/shim.ts handleIdentityMessage refactored to exhaustive switch on narrowed.type over all 21 members of IdentityNubMessage with assertNever(narrowed) default branch — compile-time exhaustiveness gate for TYPES-05"
  - "packages/nub/src/identity/shim.ts assertNever(_msg: never): void helper — reusable compile-time exhaustiveness primitive"
affects:
  - 137  # Phase 137 public NUB-IDENTITY amendment can now cite @napplet/nub/identity as the exact first-party surface mirroring ROADMAP SC1
  - 138  # Phase 138 docs can document 'import { type Rumor } from @napplet/nub/identity' without caveat

# Tech tracking
tech-stack:
  added: []  # zero new runtime deps; zero nostr-tools imports; pure TypeScript plumbing
  patterns:
    - "Cross-package type-only re-export from @napplet/core into @napplet/nub/identity barrel — closes identity-surface parity with @napplet/sdk"
    - "Loose-external-signature / narrowed-internal switch idiom: handleIdentityMessage keeps `{ type: string; [key: string]: unknown }` parameter (contract with central shim's generic identity.* routing) + internal `as unknown as IdentityNubMessage` narrowing for exhaustiveness"
    - "assertNever(_msg: never): void primitive — reusable shim for future NUB handlers that want compile-time exhaustiveness guarantees over their discriminated unions"
    - "Typed decrypt.error case replaces generic `.endsWith('.error')` branch — narrowing yields `narrowed.error: IdentityDecryptErrorCode` (8-code union) at the rejection site"

key-files:
  created: []
  modified:
    - "packages/nub/src/identity/index.ts — +7 lines (new ── Cross-Package Type Re-Exports ── block re-exporting Rumor + UnsignedEvent from @napplet/core)"
    - "packages/nub/src/identity/shim.ts — +76 insertions / -44 deletions (exhaustive switch statement covering 21 IdentityNubMessage members + assertNever helper; old if/else dispatch + generic .error branch removed; IdentityNubMessage appended to existing type-only import)"

key-decisions:
  - "Re-exported Rumor + UnsignedEvent from @napplet/core (definition site) rather than from ./types.js — avoids circular barrel dependency; matches definition authority; mirrors @napplet/sdk pattern (one-line-per-type at @napplet/sdk:781-784)"
  - "Kept loose external signature on handleIdentityMessage(msg: { type: string; [key: string]: unknown }) — changing the parameter type would require coordinated edits across the central shim's generic identity.* routing (packages/shim/src/index.ts:104-107) and every other caller; scope-disciplined. Internal `as unknown as IdentityNubMessage` narrowing delivers exhaustiveness inside the switch"
  - "Covered all 21 IdentityNubMessage members including the 10 request-side cases (never received by the handler in practice — these are napplet→shell envelopes). Request-side cases `return;` as defensive no-ops; exhaustiveness requires coverage, and the switch communicates intent clearly"
  - "Typed decrypt.error case replaces pre-edit generic .error branch — narrowing yields `narrowed.error: IdentityDecryptErrorCode` at the rejection site (vs pre-edit `string | undefined`). Runtime behavior identical: new Error() accepts any string; error code (e.g. 'class-forbidden') becomes Error.message"
  - "assertNever placed after sendRequest (in helpers block) and before Public API divider — keeps helper grouping intact; future NUB shims can reuse the same placement pattern"

requirements-completed: [TYPES-01, TYPES-03, TYPES-05, VER-01, VER-05]

# Metrics
duration: ~5min
completed: 2026-04-23
---

# Phase 135 Plan 05: Gap Closure — Rumor Re-Export + Exhaustive Switch Summary

**Closed 2 gaps from 135-VERIFICATION.md so ROADMAP SC1 now fully verifies: (1) added cross-package type-only re-exports of Rumor + UnsignedEvent to @napplet/nub/identity so `import { type Rumor } from '@napplet/nub/identity'` resolves; (2) refactored handleIdentityMessage in packages/nub/src/identity/shim.ts to use an exhaustive switch over all 21 IdentityNubMessage members with assertNever(narrowed) default branch — adding a new union member without a matching case now fails type-check. Workspace-wide build + type-check green across 14 packages; identity-types-only tree-shake bundle still 129 bytes with all 8 runtime symbols absent (including new assertNever helper). Empirical exhaustiveness proof captured: deliberate bogus union member triggers TS2345 at the assertNever call site.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-23T13:03:34Z
- **Completed:** 2026-04-23T13:08:21Z
- **Tasks:** 2
- **Files modified:** 2
- **Net line change:** +83 insertions / -44 deletions

## Gaps Closed

### Gap 1: Rumor not re-exported from @napplet/nub/identity

**Source:** 135-VERIFICATION.md frontmatter → truth 2 status: partial.

**Missing item from VERIFICATION:** "Add Rumor (and optionally UnsignedEvent) to the type-only re-export block in packages/nub/src/identity/index.ts so that 'import { type Rumor } from @napplet/nub/identity' resolves."

**Fix applied:** Inserted new `// ─── Cross-Package Type Re-Exports (from @napplet/core) ───` divider + `export type { Rumor, UnsignedEvent } from '@napplet/core';` block between the existing local types block (lines 20-51) and the shim exports divider (formerly line 53).

**Evidence:**
- `packages/nub/dist/identity/index.d.ts:2` now contains `export { Rumor, UnsignedEvent } from '@napplet/core';` (tsup emits `export { ... }` form without `type` keyword — equivalent semantically under ESM type-only consumption)
- Fixture probe `/tmp/napplet-135-05-gap1-probe.ts` containing `import type { Rumor, UnsignedEvent } from '@napplet/nub/identity'` type-checks cleanly against a built-dist-only node_modules fixture — `GAP1_EXIT=0` captured at `/tmp/napplet-135-05-gap1-result.log`
- Original 30-entry local types block (lines 20-51) byte-identical post-edit

### Gap 2: No never-fallback exhaustiveness in handleIdentityMessage

**Source:** 135-VERIFICATION.md frontmatter → truth 3 status: failed.

**Missing item from VERIFICATION:** "Add a never-fallback assertion — either change handleIdentityMessage to accept a typed IdentityNubMessage parameter with an exhaustive switch, or add an assertNever(msg) call in the default branch."

**Fix applied:**

1. Appended `IdentityNubMessage,` to the existing `import type { ... } from './types.js'` block (no new import statement).
2. Added `assertNever(_msg: never): void` helper after `sendRequest` (line 147, before the Public API divider).
3. Refactored `handleIdentityMessage` body: kept loose external signature `(msg: { type: string; [key: string]: unknown })` (central shim's generic `identity.*` routing contract unchanged), added internal `const narrowed = msg as unknown as IdentityNubMessage;`, switched on `narrowed.type` with 21 cases (10 result-processing + 1 decrypt.error + 10 defensive request-side no-ops) + `default: assertNever(narrowed); return;`.

**Runtime-behavior preservation verification (each pre-edit branch → post-edit case):**

| Pre-edit branch | Post-edit case | Semantic equivalence |
|---|---|---|
| `type === 'identity.getPublicKey.result'` → resolvePending | case `'identity.getPublicKey.result'`: resolvePending(narrowed.id, narrowed.pubkey) | Identical |
| `type === 'identity.getRelays.result'` → resolveOrReject | case `'identity.getRelays.result'`: resolveOrReject(narrowed.id, narrowed.relays, narrowed.error) | Identical |
| `identity.getProfile.result` → resolveOrReject | case `'identity.getProfile.result'`: resolveOrReject(..profile, .error) | Identical |
| `identity.getFollows.result` → resolveOrReject | case `'identity.getFollows.result'`: resolveOrReject(..pubkeys, .error) | Identical |
| `identity.getList.result` → resolveOrReject | case `'identity.getList.result'`: resolveOrReject(..entries, .error) | Identical |
| `identity.getZaps.result` → resolveOrReject | case `'identity.getZaps.result'`: resolveOrReject(..zaps, .error) | Identical |
| `identity.getMutes.result` → resolveOrReject | case `'identity.getMutes.result'`: resolveOrReject(..pubkeys, .error) | Identical |
| `identity.getBlocked.result` → resolveOrReject | case `'identity.getBlocked.result'`: resolveOrReject(..pubkeys, .error) | Identical |
| `identity.getBadges.result` → resolveOrReject | case `'identity.getBadges.result'`: resolveOrReject(..badges, .error) | Identical |
| `identity.decrypt.result` → resolvePending({rumor, sender}) | case `'identity.decrypt.result'`: resolvePending(.id, {rumor, sender}) | Identical |
| Generic `type.endsWith('.error')` → rejectPending(new Error(error)) | case `'identity.decrypt.error'`: rejectPending(.id, new Error(narrowed.error)) | Identical semantics — new Error() accepts any string; error code (now typed as IdentityDecryptErrorCode, was string\|undefined) becomes Error.message either way |

**Net runtime behavior change:** NONE. Compile-time gain only: TypeScript now enforces exhaustiveness across the 21-member union at the `assertNever(narrowed)` call site.

**Empirical exhaustiveness proof:**

Deliberately appended `| { type: 'identity.unknown.result'; id: string }` to the IdentityNubMessage union in types.ts and re-ran `pnpm --filter @napplet/nub type-check`. Captured to `/tmp/napplet-135-05-exhaustiveness-proof.log`:

```
src/identity/shim.ts(114,19): error TS2345: Argument of type '{ type: "identity.unknown.result"; id: string; }' is not assignable to parameter of type 'never'.
Exit status 2
```

The assertNever call site at shim.ts:114 column 19 correctly catches the unmatched union member. Reverted the types.ts change before proceeding; post-revert type-check re-passed.

## Task Commits

| # | Task | Commit | Files                                 | Lines |
|---|------|--------|---------------------------------------|-------|
| 1 | Re-export Rumor + UnsignedEvent from @napplet/nub/identity barrel | `1e22fdd` | packages/nub/src/identity/index.ts | +7 |
| 2 | Add never-fallback exhaustiveness assertion to handleIdentityMessage | `2ca2166` | packages/nub/src/identity/shim.ts | +76 / -44 |

## Files Modified

- `packages/nub/src/identity/index.ts` — **+7 lines**. Added new `// ─── Cross-Package Type Re-Exports (from @napplet/core) ────────────────────` divider comment + blank-line padding + `export type { Rumor, UnsignedEvent, } from '@napplet/core';` block between the existing `} from './types.js';` closer (line 51 pre-edit) and the `// ─── Shim Exports ───` divider (line 53 pre-edit). Original 30-entry local-type-exports block byte-identical post-edit. Zero runtime imports added. Shim/SDK re-export blocks byte-identical.

- `packages/nub/src/identity/shim.ts` — **+76 / -44 lines**. (a) Appended `IdentityNubMessage,` as the last entry in the existing `import type { ... } from './types.js'` block (no new import statement). (b) Added `function assertNever(_msg: never): void { /* compile-time only */ }` helper with full JSDoc in the Helpers section, placed after `sendRequest` and before the `// ─── Public API ───` divider. (c) Replaced the entire `handleIdentityMessage` body — removed the pre-edit `if (type.endsWith('.error'))` branch (lines 56-66) and the 10-branch `if/else if` chain (lines 68-98); replaced with `const narrowed = msg as unknown as IdentityNubMessage; switch (narrowed.type) { ... 21 cases ... default: assertNever(narrowed); return; }`. External signature byte-identical. `resolvePending`, `rejectPending`, `resolveOrReject`, `sendRequest` helper bodies byte-identical. `installIdentityShim` and all `export function getXxx` / `decrypt` public API byte-identical.

## Decisions Made

- **Rumor re-export sourced from @napplet/core (not ./types.js).** ./types.js imports Rumor for internal use (types.ts:14) but does not define it locally. Re-exporting from @napplet/core matches the definition site and avoids a circular barrel dependency. Matches the @napplet/sdk pattern (one-line-per-type at @napplet/sdk:781-784 per Plan 03 summary).
- **UnsignedEvent added alongside Rumor** for Rumor/UnsignedEvent pair parity with @napplet/sdk (which re-exports both). `Rumor extends UnsignedEvent`; consumers who import Rumor and want to narrow may need UnsignedEvent. Cost: one extra line; benefit: no surprise gap for downstream consumers.
- **Loose external signature preserved on handleIdentityMessage.** The central shim's generic `identity.*` routing at `packages/shim/src/index.ts:104-107` passes anything matching the prefix. Changing the handler's parameter type would require coordinated edits across the central shim and every other identity caller; out of scope for gap closure. Internal `as unknown as IdentityNubMessage` narrowing delivers exhaustiveness inside the switch while preserving the external contract.
- **All 21 union members covered explicitly (including 10 request-side defensive cases).** Request-side cases (`identity.getPublicKey`, ..., `identity.decrypt`) are napplet→shell envelopes and should never arrive at this handler. Exhaustiveness requires coverage; the defensive `return;` is a no-op runtime-wise but communicates intent and future-proofs against accidental shell→napplet echoing of a request-side envelope.
- **Typed decrypt.error case replaces generic .error branch.** Pre-edit behavior: generic `type.endsWith('.error')` branch caught any `identity.*.error`, called `rejectPending(id, new Error(error))`. Post-edit: case `'identity.decrypt.error'` with narrowed `narrowed.error: IdentityDecryptErrorCode` (the 8-code string-literal union), same `rejectPending(narrowed.id, new Error(narrowed.error))`. Runtime behavior identical — `new Error()` accepts any string; the error code becomes `Error.message` either way. The typed form is stronger: TypeScript now proves only `IdentityDecryptErrorCode` values reach this rejection site.
- **assertNever placement: after sendRequest, before Public API divider.** Keeps the helpers block cohesive; leaves public API section clean. Future NUB shims wanting the same pattern can copy the placement.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixed bugs, no missing critical functionality, no blocking issues, no architectural changes. The plan's "27 entries in pre-edit types block" acceptance criterion observed the actual pre-edit block has 30 entries — the underlying intent of the acceptance (original block byte-identical post-edit) is satisfied regardless; the edit was purely additive.

## Verification Gates

### Gate 1: VER-01 — Workspace-wide build + type-check

| Command | Exit | Packages |
|---|---|---|
| `pnpm -r build` | 0 | 14/14 Done |
| `pnpm -r type-check` | 0 | 14/14 Done |

Evidence: `/tmp/napplet-135-05-ver-01-build.log`, `/tmp/napplet-135-05-ver-01-typecheck.log` (tail-clipped), plus direct `grep -c "Done"` = 14 for both commands (uncapped runs).

### Gate 2: VER-05 — Identity-types-only tree-shake contract

Fixture: `/tmp/napplet-135-05-ver-05-treeshake/` with `node_modules/@napplet/{core,nub}/` populated from built dist; `entry.ts` imports only `IdentityDecryptMessage` + `IdentityGetPublicKeyMessage` (types); esbuild bundled with `--tree-shaking=true`.

- **Bundle size:** 129 bytes (unchanged vs Plan 04 baseline)
- **Symbol absence:** All 8 forbidden runtime symbols `COUNT=0`:

| Symbol | Count |
|---|---|
| handleIdentityMessage | 0 |
| installIdentityShim | 0 |
| identityDecrypt | 0 |
| identityGetPublicKey | 0 |
| sendRequest | 0 |
| requireIdentity | 0 |
| pendingRequests | 0 |
| assertNever (new — added this plan) | 0 |

Evidence: `/tmp/napplet-135-05-ver-05-symbols.log`. The new `assertNever` helper (lives in shim.ts) correctly does NOT pull into the types-only consumer bundle.

### Gate 3: Compile-time exhaustiveness empirical proof

Captured at `/tmp/napplet-135-05-exhaustiveness-proof.log`:

```
src/identity/shim.ts(114,19): error TS2345: Argument of type '{ type: "identity.unknown.result"; id: string; }' is not assignable to parameter of type 'never'.
Exit status 2
```

Methodology: temporarily appended `| { type: 'identity.unknown.result'; id: string }` to IdentityNubMessage in types.ts, ran `pnpm --filter @napplet/nub type-check`, captured stderr, reverted types.ts, re-confirmed post-revert type-check exits 0.

### Gate 4: Gap-1 resolution spot-check

Probe: `/tmp/napplet-135-05-gap1-probe.ts` (also copied to fixture as `gap1.ts`):

```typescript
import type { Rumor, UnsignedEvent } from '@napplet/nub/identity';
const _r: Rumor = { id: '', kind: 0, pubkey: '', content: '', tags: [], created_at: 0 };
const _u: UnsignedEvent = { kind: 0, pubkey: '', content: '', tags: [], created_at: 0 };
console.log(_r, _u);
```

Type-checked against the fixture's built-dist-only `node_modules` with `tsc --module nodenext --moduleResolution nodenext --target es2022 --strict --verbatimModuleSyntax`:

- **Result:** `GAP1_EXIT=0` with empty stderr
- Evidence: `/tmp/napplet-135-05-gap1-result.log` (zero-byte after success)
- Confirms: `import { type Rumor } from '@napplet/nub/identity'` and `import { type UnsignedEvent } from '@napplet/nub/identity'` both resolve cleanly

## Regression-Clean Status

| Gate | Pre-Plan-05 (Plan 04 baseline) | Post-Plan-05 | Regression? |
|---|---|---|---|
| VER-01 (build exit) | 0 | 0 | No |
| VER-01 (type-check exit) | 0 | 0 | No |
| VER-05 (bundle size) | 129B | 129B | No |
| VER-05 (symbol absence) | 7/7 = 0 | 8/8 = 0 (added assertNever as 8th) | No — stronger |

## Issues Encountered

- **Fixture-setup hiccup during Gate 4 composition.** Initial `cp` command to populate fixture `node_modules/@napplet/nub/` used an incorrect target path (`cp -r dist package.json "$DIR/"` with wrong shell expansion) — the first attempt left the fixture's `@napplet/nub/` empty. Re-ran with explicit individual `cp` commands; issue resolved. Non-blocking. No impact on final verification result.
- **npm install --no-save rewrites `node_modules` more aggressively than expected.** Running `npm install --no-save typescript@5.9.3` after `npm install --no-save esbuild` blew away the previously-copied `@napplet/nub` and `@napplet/core` contents. Worked around by re-copying after each npm install. Lesson for future VER-05 fixtures: install all tools upfront in one command, then populate `@napplet/*` contents last.

## Self-Check: PASSED

- `packages/nub/src/identity/index.ts` contains `Rumor,` and `UnsignedEvent,` in the new cross-package re-export block — FOUND (2 occurrences of `from '@napplet/core'` in source)
- `packages/nub/dist/identity/index.d.ts` exports both types — FOUND (`export { Rumor, UnsignedEvent } from '@napplet/core';` at line 2)
- `packages/nub/src/identity/shim.ts` contains `function assertNever` — FOUND (grep count: 1)
- `packages/nub/src/identity/shim.ts` contains `assertNever(narrowed)` — FOUND (grep count: 1)
- `packages/nub/src/identity/shim.ts` contains 21 `case 'identity\.` entries — FOUND (grep count: 21)
- `packages/nub/src/identity/shim.ts` contains `switch (narrowed.type)` — FOUND (grep count: 1)
- `packages/nub/src/identity/shim.ts` zero `nostr-tools` imports — FOUND (grep count: 0)
- `packages/nub/src/identity/shim.ts` zero pre-edit `Handle .error message types` comment — FOUND (grep count: 0 — confirms pre-edit block gone)
- Commit `1e22fdd` (Task 1) — FOUND in `git log --oneline`
- Commit `2ca2166` (Task 2) — FOUND in `git log --oneline`
- `/tmp/napplet-135-05-exhaustiveness-proof.log` exists with TS2345 error — FOUND
- `/tmp/napplet-135-05-gap1-result.log` exists with `GAP1_EXIT=0` outcome — FOUND
- `/tmp/napplet-135-05-ver-05-symbols.log` exists with 8 zero-count lines — FOUND
- Zero home-directory pollution — only `/tmp/napplet-135-05-*` evidence files; no `~/` files created

## User Setup Required

None — pure TypeScript plumbing, no external service configuration, no sudo commands, no credentials, no new dependencies.

## Next Phase Readiness

- **Phase 135 truly complete (gaps_found → verified).** All 6 ROADMAP SC1..SC5 success criteria now verify. Phase 137 can cite `import { type Rumor } from '@napplet/nub/identity'` as the first-party reference import path without caveat.
- **Phase 137 amendment authoring unblocked.** NUB-IDENTITY amendment on napplet/nubs can reference the shipped first-party surface as the canonical shape. GATE-04 shim-side class-short-circuit remains deferred (not a Plan 05 concern) — shell enforcement authoritative.
- **Phase 138 documentation cadence unblocked.** Docs can document Rumor / UnsignedEvent as importable from `@napplet/nub/identity` consistently alongside `@napplet/sdk` and `@napplet/core`.

---

*Phase: 135-first-party-types-sdk-plumbing*
*Completed: 2026-04-23*
