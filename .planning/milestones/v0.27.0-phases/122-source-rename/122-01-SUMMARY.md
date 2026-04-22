---
phase: 122-source-rename
plan: 01
subsystem: api
tags: [typescript, ifc, nub, rename, sdk, shim, @napplet/core, @napplet/nub, @napplet/shim, @napplet/sdk]

# Dependency graph
requires:
  - phase: 117-121 (v0.26.0 Better Packages)
    provides: consolidated @napplet/nub package with /ifc subpath; NUB domain already named 'ifc'
provides:
  - Developer-facing runtime API renamed ipc -> ifc across first-party source
  - NappletGlobal.ifc namespace type (replaces NappletGlobal.ipc)
  - window.napplet.ifc installer key (replaces window.napplet.ipc)
  - @napplet/sdk export `const ifc` (replaces `const ipc`)
  - requireIfc() internal guard in @napplet/nub/ifc/sdk (replaces requireIpc)
  - IFC-PEER / inter-frame JSDoc phrasing across 6 in-scope source files
affects: [phase-123-documentation-sweep, phase-124-verification-sign-off, milestone-v0.27.0]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Hard-break API rename with no backward-compat alias (milestone-level decision)
    - Type contract lands first (core/types.ts) then consumers cascade against renamed NappletGlobal

key-files:
  created: []
  modified:
    - packages/core/src/types.ts
    - packages/core/src/topics.ts
    - packages/core/src/envelope.ts
    - packages/shim/src/index.ts
    - packages/sdk/src/index.ts
    - packages/nub/src/ifc/sdk.ts

key-decisions:
  - "Hard-break rename: no window.napplet.ipc alias, no `ipc` SDK export alias, no requireIpc alias — consumers migrate in one bump"
  - "Task 1 lands NappletGlobal.ifc type contract first; Tasks 2-4 are mechanical consumer updates against the renamed contract"
  - "Localized build/type-check gate (4 packages via pnpm --filter) — full-monorepo gate deferred to Phase 124"
  - "READMEs, skills/, and active planning docs intentionally untouched — owned by Phase 123"

patterns-established:
  - "Literal token-swap rename pattern: match source strings verbatim, preserve whitespace/backticks, swap only the target token"
  - "JSDoc error-string text matters: 'window.napplet.ifc not installed' is observable behavior, not just documentation"

requirements-completed: [API-01, API-02, SRC-01]

# Metrics
duration: 3min
completed: 2026-04-19
---

# Phase 122 Plan 01: Source Rename Summary

**Renamed the developer-facing runtime API from `ipc` to `ifc` across @napplet/core, @napplet/shim, @napplet/sdk, and @napplet/nub/ifc — hard break with no backward-compat alias, localized build + type-check green across all four packages.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-19T22:05:09Z
- **Completed:** 2026-04-19T22:08:19Z
- **Tasks:** 5 (4 edit tasks + 1 verification gate)
- **Files modified:** 6

## Accomplishments

- `NappletGlobal.ifc` namespace replaces `NappletGlobal.ipc` in `@napplet/core` types; all JSDoc ("Inter-napplet pubsub" / "IPC-PEER") rephrased to "Inter-frame pubsub" / "IFC-PEER".
- `window.napplet.ifc` is the runtime key the shim installer assigns; `window.napplet.ipc` is undefined at runtime (hard break).
- `@napplet/sdk` exports `const ifc` (not `ipc`); `import { ipc } from '@napplet/sdk'` now fails at compile time.
- Internal `requireIpc()` in `@napplet/nub/ifc/sdk.ts` renamed to `requireIfc()`; the thrown Error string now reads `'window.napplet.ifc not installed -- import @napplet/shim first'` so downstream tests/users read the new key.
- JSDoc section header `// ─── IPC namespace ───` rewritten to `// ─── IFC namespace ───` (dash-count preserved).
- Six in-scope source files have zero `\bipc\b`, `IPC-PEER`, `IPC_PEER`, `Inter-napplet`, or `IPC peer bus` matches.
- Localized build + type-check across `@napplet/core`, `@napplet/nub`, `@napplet/shim`, `@napplet/sdk` both exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename NappletGlobal.ipc -> .ifc in core types + sweep core JSDoc** — `e659673` (refactor)
2. **Task 2: Rename shim installer ipc: key -> ifc:** — `3629958` (refactor)
3. **Task 3: Rename SDK ipc const -> ifc + sweep SDK module-doc + JSDoc** — `1d7b3b3` (refactor)
4. **Task 4: Rename requireIpc -> requireIfc in nub/ifc SDK helpers + sweep JSDoc** — `bd2fe98` (refactor)
5. **Task 5: Localized build + type-check gate** — no source changes; verification-only (build + type-check both exited 0).

**Plan metadata commit:** forthcoming (SUMMARY + STATE + ROADMAP + REQUIREMENTS bundled after this SUMMARY lands on disk).

## Files Created/Modified

- `packages/core/src/types.ts` — NappletGlobal namespace renamed `.ipc` -> `.ifc`; Subscription / namespace / emit / on JSDoc swept IPC-PEER -> IFC-PEER (5 edits).
- `packages/core/src/topics.ts` — Module header + TOPICS JSDoc + @example comment swept IPC-PEER -> IFC-PEER (4 edits).
- `packages/core/src/envelope.ts` — NubDomain JSDoc table row for `ifc` now reads "(IFC peer bus)" in place of "(IPC peer bus)"; column alignment byte-preserved.
- `packages/shim/src/index.ts` — Installer object-literal key `ipc: { emit, on }` -> `ifc: { emit, on }`; imports and `installIfcShim()` / `handleIfcEvent` wiring unchanged (already IFC-correct).
- `packages/sdk/src/index.ts` — Module-doc header, @example imports, section header, JSDoc prose, `export const ipc` -> `export const ifc`, and `requireNapplet().ipc.*` delegations all rewritten to IFC-named equivalents (12 edits).
- `packages/nub/src/ifc/sdk.ts` — Module header JSDoc, internal `requireIpc()` -> `requireIfc()` (declaration, guard, return, two call-sites in ifcEmit/ifcOn), thrown Error string, and ifcEmit/ifcOn JSDoc all swept to IFC phrasing.

## Decisions Made

- **Hard break confirmed:** No `window.napplet.ipc = window.napplet.ifc` alias in the shim; no `export const ipc = ifc` alias in the SDK; no `requireIpc = requireIfc` alias in the NUB. Consumers migrate in one bump, as agreed at v0.27.0 kickoff.
- **Public NUB helper names (`ifcEmit` / `ifcOn`) left untouched.** They already carry the IFC name; only the internal `requireIpc` guard, its JSDoc, and its error string still leaked IPC terminology.
- **NUB domain constant `'ifc'` untouched** (already correct in `@napplet/core` envelope.ts + `@napplet/nub/ifc/types.ts`).
- **Scope hygiene:** READMEs, skills/, and active planning docs deliberately left for Phase 123. Only the six in-scope source files from the plan's `files_modified` frontmatter were touched (verified via `git diff --name-only HEAD~4 HEAD`).

## Deviations from Plan

None - plan executed exactly as written.

Every token swap matched the plan's literal source-text directives. The SDK module-doc line 3 correctly preserved backticks around identifiers (plan explicitly flagged this). No auto-fixes needed; no architectural decisions triggered.

## Issues Encountered

None.

## Build + Type-Check Evidence (Task 5)

```
$ pnpm --filter @napplet/core --filter @napplet/nub --filter @napplet/shim --filter @napplet/sdk build
packages/core build: ESM ⚡️ Build success in 12ms
packages/core build: DTS ⚡️ Build success in 1.8s
packages/nub build:  ESM ⚡️ Build success in 25ms
packages/nub build:  DTS ⚡️ Build success in 2229ms
packages/shim build: ESM dist/index.js 7.88 KB  ⚡️ Build success in 9ms
packages/shim build: DTS ⚡️ Build success in 501ms
packages/sdk build:  ESM dist/index.js 15.86 KB ⚡️ Build success in 9ms
packages/sdk build:  DTS ⚡️ Build success in 535ms
exit: 0

$ pnpm --filter @napplet/core --filter @napplet/nub --filter @napplet/shim --filter @napplet/sdk type-check
Scope: 4 of 15 workspace projects
packages/core type-check$ tsc --noEmit  → Done
packages/nub  type-check$ tsc --noEmit  → Done
packages/shim type-check$ tsc --noEmit  → Done
packages/sdk  type-check$ tsc --noEmit  → Done
exit: 0
```

## Final Zero-Leakage Grep (6 in-scope source files)

```
$ grep -nE "\bipc\b|IPC-PEER|IPC_PEER|Inter-napplet|IPC peer bus" \
    packages/core/src/types.ts \
    packages/core/src/topics.ts \
    packages/core/src/envelope.ts \
    packages/shim/src/index.ts \
    packages/sdk/src/index.ts \
    packages/nub/src/ifc/sdk.ts
(no output — exit 1, zero matches as required)
```

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 123 (Documentation Sweep).** Source is IFC-named end-to-end; READMEs, skills/, and active planning docs still reference the old `ipc` / `IPC-PEER` / "inter-napplet" terminology and are Phase 123's responsibility. Phase 124 will run the full-monorepo `pnpm -r build && pnpm -r type-check` + repo-wide zero-grep acceptance gate.

---
*Phase: 122-source-rename*
*Completed: 2026-04-19*

## Self-Check: PASSED

- FOUND: packages/core/src/types.ts (modified, NappletGlobal.ifc present)
- FOUND: packages/core/src/topics.ts (modified, IFC-PEER present)
- FOUND: packages/core/src/envelope.ts (modified, "IFC peer bus" present)
- FOUND: packages/shim/src/index.ts (modified, `ifc: { emit, on }` present)
- FOUND: packages/sdk/src/index.ts (modified, `export const ifc = {` present)
- FOUND: packages/nub/src/ifc/sdk.ts (modified, `function requireIfc` present)
- FOUND: commit e659673 (Task 1)
- FOUND: commit 3629958 (Task 2)
- FOUND: commit 1d7b3b3 (Task 3)
- FOUND: commit bd2fe98 (Task 4)
- VERIFIED: localized build exit 0
- VERIFIED: localized type-check exit 0
- VERIFIED: zero IPC leakage across 6 in-scope source files
