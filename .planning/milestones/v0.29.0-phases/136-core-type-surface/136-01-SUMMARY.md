---
phase: 136-core-type-surface
plan: 01
subsystem: core-types
tags: [typescript, napplet-core, nub-domain, connect, class, csp, strict-mode, ambient-types]

# Dependency graph
requires:
  - phase: 135-cross-repo-spec-work
    provides: "Locked NappletConnect shape (readonly granted: boolean, readonly origins: readonly string[]) and NUB-CLASS wire contract (class.assigned → number)"
  - phase: 125-core-type-surface
    provides: "Structural precedent — Phase 125 added one domain ('resource') to NubDomain/NUB_DOMAINS and one namespace to NappletGlobal; Phase 136 applies that pattern twice (connect + class) plus the optional-primitive variant"
provides:
  - "NubDomain union extended from 10 → 12 entries (added 'connect', 'class')"
  - "NUB_DOMAINS runtime array extended from 10 → 12 entries (same order)"
  - "NappletGlobal.connect namespace (required): readonly granted + readonly origins"
  - "NappletGlobal.class (optional): bare number — extensibility preserved for future NUB-CLASS-$N"
  - "NamespacedCapability JSDoc @deprecated annotation on perm:strict-csp with supersession pointer to nub:connect + nub:class (type itself unchanged)"
affects:
  - 137-nub-connect-class-subpath-scaffold
  - 138-vite-plugin-surgery
  - 139-central-shim-sdk-integration
  - 140-shell-connect-class-policy
  - 142-verification-milestone-close

# Tech tracking
tech-stack:
  added: []  # Pure type addition — no new tools, no new dependencies
  patterns:
    - "Zero-dep @napplet/core preserved: NappletConnect shape declared inline in types.ts (not imported from @napplet/nub) — matches Phase 125 precedent"
    - "Optional-primitive typing for wire-delivered state: class?: number (bare number, not literal union) — captures graceful-degradation semantics for shells that do not implement the NUB"
    - "JSDoc-only @deprecated for string-value supersession — type surface unchanged, human-readable signal to downstream consumers"

key-files:
  created: []
  modified:
    - packages/core/src/envelope.ts
    - packages/core/src/types.ts

key-decisions:
  - "NappletConnect sourcing: declared INLINE in packages/core/src/types.ts (option b from CONTEXT.md Claude's Discretion). Preserves @napplet/core zero-dep constraint. TypeScript structural typing guarantees assignment-compatibility with the forthcoming Phase 137 @napplet/nub/connect/types.NappletConnect interface."
  - "class?: number typed as bare number, NOT as literal union '1 | 2'. The class space is extensible per NUB-CLASS-$N sub-track; narrowing now would block future sub-track members."
  - "perm:strict-csp deprecation is JSDoc-only — the `perm:${string}` template literal already accepts the value; removing it would break v0.28.0 shells during the deprecation window. Hard removal deferred to CONNECT-V2-era (REMOVE-STRICTCSP-CAP, tracked in REQUIREMENTS.md 'Future Requirements')."

patterns-established:
  - "Twin-domain NUB addition: when a milestone adds more than one NUB domain in the same phase, append both to NubDomain + NUB_DOMAINS in a single edit (order matches discovery order in the milestone; here: connect then class)"
  - "Optional-ambient readonly field for wire-delivered state: use `readonly field?: T` on NappletGlobal when the field is populated by an async wire envelope and napplets must gracefully handle the pre-wire state as undefined"

requirements-completed: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05]

# Metrics
duration: 3min
completed: 2026-04-21
---

# Phase 136 Plan 01: Core Type Surface Summary

**Extended @napplet/core with `'connect'` + `'class'` NUB domains, the `window.napplet.connect` namespace (readonly granted + origins), and the optional `window.napplet.class?: number` field; soft-deprecated `perm:strict-csp` via JSDoc pointing to `nub:connect` + `nub:class`.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-21T13:18:03Z
- **Completed:** 2026-04-21T13:20:29Z
- **Tasks:** 3 (2 edits + 1 verification)
- **Files modified:** 2 (packages/core/src/envelope.ts, packages/core/src/types.ts)

## Accomplishments

- `NubDomain` union and `NUB_DOMAINS` runtime array both extended from 10 → 12 entries; `NUB_DOMAINS.length === 12` at runtime with `'connect'` + `'class'` appended in that order
- `NappletGlobal.connect` namespace declared inline with JSDoc matching the resource-block precedent; both fields are `readonly` (grant state is shell-authoritative, napplet-readonly)
- `NappletGlobal.class?: number` declared as optional bare `number` (extensibility preserved); JSDoc explicitly enumerates the three `undefined` states napplets must handle
- `NamespacedCapability` JSDoc carries a `@deprecated` tag block for `perm:strict-csp` plus an inline deprecation annotation in the capability table row; the TYPE is unchanged (template literal still accepts the value during the deprecation window)
- `@napplet/core`: `type-check` + `build` + `test:unit` all exit 0; the bundled `dist/index.d.ts` contains `'connect'`, `'class'`, `connect:`, `class?:`, and `@deprecated` as required

## Task Commits

Each task was committed atomically:

1. **Task 1: Add `'connect'` + `'class'` to NubDomain + NUB_DOMAINS, update JSDoc table + prose, deprecate perm:strict-csp JSDoc** — `84f2455` (feat)
2. **Task 2: Add `connect` namespace (required) and `class?: number` (optional) to NappletGlobal** — `b8f214e` (feat)
3. **Task 3: Phase-level verification (type-check + build + tests + whole-monorepo sanity)** — no commit (verification-only; no source files modified)

**Plan metadata commit:** pending (will include SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md updates)

## Files Created/Modified

- `packages/core/src/envelope.ts` — Added `'connect'` + `'class'` to `NubDomain` union and `NUB_DOMAINS` runtime array; widened JSDoc table to 12 rows with scope column expanded; changed prose "ten NUB domains" → "twelve NUB domains"; added `@deprecated` annotation in `NamespacedCapability` JSDoc pointing to `nub:connect` + `nub:class` as superseders. Type definition for `NamespacedCapability` itself is unchanged (JSDoc-only edit).
- `packages/core/src/types.ts` — Inserted `connect: { readonly granted: boolean; readonly origins: readonly string[] }` namespace between the `resource` block and the `shell` capability query block in `NappletGlobal`. Appended optional `class?: number` field immediately after `connect`. Both blocks include full JSDoc with description + `@example` + graceful-degradation semantics (connect defaults to `{granted: false, origins: []}`; class is `undefined` in three enumerated states).

## Decisions Made

- **NappletConnect sourcing — INLINE in `packages/core/src/types.ts`** (option b from CONTEXT.md Claude's Discretion). Rationale: `@napplet/core` is zero-dep by design (explicit CLAUDE.md constraint); importing from `@napplet/nub/connect/types` (option a) would flip the dependency edge (`@napplet/nub` already depends on `@napplet/core` for `NubDomain`, creating a would-be cycle). Phase 125 precedent: `resource` namespace was also declared inline (no `import type` from `@napplet/nub/resource/types`). TypeScript structural typing guarantees `NappletGlobal['connect']` remains assignment-compatible with Phase 137's canonical `NappletConnect` interface as long as both fields match (locked by Phase 135 CONTEXT).
- **`class?: number` as bare `number`, NOT literal union `1 | 2`** — the class space is extensible via NUB-CLASS-$N sub-track documents (v0.29.0 ships `NUB-CLASS-1` and `NUB-CLASS-2`, but future milestones may add more). Narrowing now would force every future sub-track addition to edit `@napplet/core`.
- **`perm:strict-csp` deprecation is JSDoc-only** — the `NamespacedCapability` type already accepts it via `perm:${string}` template literal; hard-removal is tracked as `REMOVE-STRICTCSP-CAP` in the "Future Requirements" section of REQUIREMENTS.md and gated on the v0.28.0 deprecation window closing.

## Deviations from Plan

None that required Rule 1/2/3 auto-fix. Two minor observations (informational, not scope changes):

**Observation 1 — dist layout.** The plan's Task 3 verify block referenced separate `packages/core/dist/envelope.d.ts` and `packages/core/dist/types.d.ts` files. `packages/core/tsup.config.ts` is configured with a single entry (`src/index.ts`), so tsup emits a single bundled `dist/index.d.ts`. All referenced symbols (`'connect'`, `'class'`, `connect:`, `class?:`, `@deprecated`) are present in `dist/index.d.ts`; the semantic intent of the plan's verification (new symbols present in emitted declarations) is fully satisfied. The separate-file language was a minor misreading of the tsup config; no behavior change is implied.

**Observation 2 — downstream consumption gap (Phase 139).** `pnpm -r type-check` (optional sanity run) surfaces exactly one error:

```
packages/shim type-check: src/index.ts(130,1): error TS2741: Property 'connect' is missing in type '{…}' but required in type 'NappletGlobal'.
```

This is the expected Phase 139 consumption gap — the shim's `window.napplet` literal does not yet populate `connect: { granted: false, origins: [] }`. SHIM-01 + SHIM-02 explicitly scope this for Phase 139; fixing it here would pull SHIM-01 forward into Phase 136, which is out of scope. Phase 139 MUST add the default `connect: { granted: false, origins: [] }` block to the shim's `window.napplet` literal (SHIM-02 graceful-degradation requirement) and will also need `installConnectShim()` wiring (SHIM-01). The `class?: number` field is optional, so it does not produce a matching error.

Per Task 3's own diagnostic notes: "If `pnpm -r type-check` fails in a non-core package… this is NOT a Phase 136 regression, it is a Phase 137+ consumption gap." The plan explicitly anticipated this outcome.

---

**Total deviations:** 0 (plan executed exactly as written — two observations are informational, not scope changes)
**Impact on plan:** None. Both observations are pre-anticipated: the dist-layout note is a minor verification-language correction; the shim type-check error is explicitly called out in the plan's Task 3 action block as acceptable and deferred to Phase 139.

## Issues Encountered

None. Plan executed first-try green: both `pnpm --filter @napplet/core type-check` and `pnpm --filter @napplet/core build` exited 0 after each edit, and all 19 pre-existing unit tests in `@napplet/core` continue to pass (no test enumerates `'connect'` or `'class'` explicitly, so adding them did not require test updates).

## Verification Results

| Check                                                                 | Result                                 |
|-----------------------------------------------------------------------|----------------------------------------|
| `pnpm --filter @napplet/core type-check`                              | exit 0                                 |
| `pnpm --filter @napplet/core build`                                   | exit 0 (ESM 2.12 KB, DTS 38.14 KB)     |
| `pnpm --filter @napplet/core test:unit`                               | 19/19 passed                           |
| `grep "'connect'" packages/core/src/envelope.ts` (union + array)      | 2 occurrences (as required)            |
| `grep "'class'" packages/core/src/envelope.ts` (union + array)        | 2 occurrences (as required)            |
| `grep "^  connect: {" packages/core/src/types.ts`                     | exactly 1                              |
| `grep "^  class?: number;" packages/core/src/types.ts`                | exactly 1                              |
| `grep "readonly granted: boolean;" packages/core/src/types.ts`        | present                                |
| `grep "readonly origins: readonly string\[\];" packages/core/src/types.ts` | present                           |
| `grep "@deprecated" packages/core/src/envelope.ts`                    | present (row + tag block, 2 mentions)  |
| `grep "twelve NUB" packages/core/src/envelope.ts`                     | present (prose updated)                |
| `grep "\`connect\`" packages/core/src/envelope.ts` (JSDoc table row)  | present                                |
| `grep "\`class\`" packages/core/src/envelope.ts` (JSDoc table row)    | present                                |
| `grep "'connect'" packages/core/dist/index.d.ts`                      | present                                |
| `grep "'class'" packages/core/dist/index.d.ts`                        | present                                |
| `grep "connect:" packages/core/dist/index.d.ts`                       | present                                |
| `grep "class?:" packages/core/dist/index.d.ts`                        | present                                |
| `grep "@deprecated" packages/core/dist/index.d.ts`                    | present                                |
| `pnpm -r type-check` (optional monorepo sanity)                       | 1 expected failure in `@napplet/shim` — Phase 139 consumption gap (SHIM-01/SHIM-02). 12/14 workspaces pass. |

## User Setup Required

None — no external service configuration required. Pure type-surface change, no runtime behavior, no new dependencies, no new build tooling.

## Next Phase Readiness

**Phase 137 (@napplet/nub/connect + @napplet/nub/class Subpath Scaffold) — unblocked.** Locked contracts this plan ships:

- **For `packages/nub/src/connect/types.ts` (NUB-01):** the exported `NappletConnect` interface MUST be structurally assignment-compatible with `NappletGlobal['connect']` — specifically `readonly granted: boolean` and `readonly origins: readonly string[]`. Structural typing permits the Phase 137 interface to add members (e.g., discriminants, symbols) but MUST NOT narrow either of these two fields.
- **For `packages/nub/src/class/shim.ts` (CLASS-02):** the `class.assigned` wire handler MUST write a `number` value to `window.napplet.class`. Because the field is optional, the shim should leave it `undefined` until the wire arrives (per SHIM-04).
- **For `packages/nub/src/connect/index.ts` and `packages/nub/src/class/index.ts` (NUB-04, CLASS-04):** `registerNub(DOMAIN, handler)` now accepts `'connect'` and `'class'` as valid `NubDomain` values without widening.

**Phase 138 (@napplet/vite-plugin Surgery) — unblocked.** `NubDomain` import can reference `'connect'` without a widening assertion.

**Phase 139 (Central Shim + SDK Integration) — unblocked AND REQUIRED to resolve one downstream type error.** The shim's `window.napplet` literal at `packages/shim/src/index.ts:130` currently does not populate `connect`, producing a TS2741 error. SHIM-01 (install `installConnectShim` and add `connect: { granted, origins }` block) and SHIM-02 (default to `{granted: false, origins: []}` when meta absent) will resolve this error. The `class?: number` field is optional and does not require immediate wiring to satisfy the type-checker (SHIM-03 remains scope for Phase 139 but is not type-check-forcing).

## Self-Check: PASSED

All claimed artifacts verified:

- `packages/core/src/envelope.ts` — FOUND (modified, `'connect'` + `'class'` in union and array, `@deprecated` present, `twelve NUB` prose)
- `packages/core/src/types.ts` — FOUND (modified, `connect:` block + `class?: number` present at correct placement)
- `packages/core/dist/index.d.ts` — FOUND (all five expected symbols present: `'connect'`, `'class'`, `connect:`, `class?:`, `@deprecated`)
- Commit `84f2455` — FOUND in `git log --oneline --all`
- Commit `b8f214e` — FOUND in `git log --oneline --all`

---
*Phase: 136-core-type-surface*
*Completed: 2026-04-21*
