---
phase: 123-documentation-sweep
plan: 01
subsystem: docs
tags: [ifc, readme, terminology, documentation, ipc-to-ifc]

# Dependency graph
requires:
  - phase: 122-source-rename
    provides: "IFC runtime API surface (window.napplet.ifc, @napplet/sdk ifc export, IFC JSDoc) that these READMEs now document"
provides:
  - Root README.md swept to IFC terminology (package table row + architecture diagram)
  - packages/core/README.md Subscription JSDoc swept (ipc.on → ifc.on)
  - packages/shim/README.md swept (Quick Start, window.napplet shape block, API Reference heading + prose, TypeScript section, Shim vs SDK table, Typical usage import — 10 scoped swaps)
  - packages/sdk/README.md swept (Quick Start import + code, API Reference `### ifc` heading + prose, SDK vs Shim Typical usage — 7 scoped swaps, 9 line-deletions)
  - Zero-leakage grep clean across the 4 published READMEs for `\bipc\b|IPC-PEER|IPC_PEER|inter-pane|inter-napplet|Inter-napplet|Inter-pane|INTER_PANE|Inter-Pane`
affects: [123-02-skill-sweep, 123-03-planning-sweep, 124-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Terminology-only README swap: preserve structure, byte-stable column alignment, preserve already-correct IFC regions"
    - "Zero-grep phase gate per file before commit (exit-1 required)"

key-files:
  created: []
  modified:
    - README.md
    - packages/core/README.md
    - packages/shim/README.md
    - packages/sdk/README.md

key-decisions:
  - "Hard-break terminology swap with no backward-compat aliases — READMEs must match the IFC source API shipped in Phase 122"
  - "Preserve already-IFC-correct regions byte-stable (e.g., sdk README lines 114-115 JSON envelope examples, IfcNubMessage type references, IFC_DOMAIN constant, shim README Wire Format outbound/inbound message code fences)"
  - "Preserve the historical / out-of-scope `services` entry in the root README package table row — Phase 123 is terminology-only per 123-CONTEXT.md Deferred Ideas; services-killed-in-v0.22.0 drift is a future accuracy pass, not this phase's concern"

patterns-established:
  - "Literal token-swap edits with before/after snippets lifted directly from the plan: zero structural rewrites, zero grammatical edits, zero re-ordering"
  - "Diff-count acceptance scoped per edit block: an 'edit' that touches N logical lines produces N single-line deletions (not 1); plan's per-edit summary numbers can drift from raw ^- counts when a block spans multiple lines"

requirements-completed: [DOC-01]

# Metrics
duration: ~7min
completed: 2026-04-19
---

# Phase 123 Plan 01: Published README IFC Sweep Summary

**Four published READMEs (root + core + shim + sdk) swept to IFC terminology via 20 literal token-swap edits — zero structural rewrites, zero source files touched, zero `.planning/` drift, zero-leakage grep clean.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-19T22:33:38Z (approximate — execution spawn)
- **Completed:** 2026-04-19T22:40:45Z
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- Root README.md: package table row and architecture diagram both now reference `ifc` / `window.napplet.ifc` (2 swaps, column alignment byte-stable since `ipc` and `ifc` are both 3 chars).
- packages/core/README.md: Subscription JSDoc prose (`Handle returned by relay.subscribe() and ifc.on()`) (1 swap).
- packages/shim/README.md: 11 line-deletions covering How It Works sub-object list, Quick Start inter-frame sample (`ifcSub = window.napplet.ifc.on`), cleanup `ifcSub.close()`, `window.napplet` shape block property name, API Reference `### \`window.napplet.ifc\`` heading + Inter-frame prose, TypeScript Support comment, Shim vs SDK table (Import style + Named exports rows), and Typical usage import.
- packages/sdk/README.md: 9 line-deletions covering How It Works bullet, Quick Start import, Inter-frame messaging code block (comment + `ifc.emit` + `ifcSub = ifc.on` + cleanup), API Reference `### \`ifc\`` heading + Inter-frame prose mirroring `window.napplet.ifc`, and SDK vs Shim Typical usage import. Already-correct `'ifc.emit'` JSON envelope example, `IfcNubMessage` references, and `IFC_DOMAIN` constant preserved byte-identical.

Final zero-leakage grep across all four READMEs for `\bipc\b|IPC-PEER|IPC_PEER|inter-pane|inter-napplet|Inter-napplet|Inter-pane|INTER_PANE|Inter-Pane` returns zero matches (exit 1).

## Task Commits

Each task was committed atomically (`git commit --no-verify` — parallel executor protocol):

1. **Task 1: Sweep root README.md + packages/core/README.md** — `22beae4` (docs)
   - 2 files changed, 3 insertions(+), 3 deletions(-) — exactly matches plan acceptance.
2. **Task 2: Sweep packages/shim/README.md** — `891db28` (docs)
   - 1 file changed, 11 insertions(+), 11 deletions(-) — 10 logical edits producing 11 line-deletions (Edit 2 covers 2 distinct lines: comment + declaration).
3. **Task 3: Sweep packages/sdk/README.md** — `e094a9a` (docs)
   - 1 file changed, 9 insertions(+), 9 deletions(-) — 7 logical edits producing 9 line-deletions (Edit 3 covers 3 distinct lines: comment + emit call + declaration).

_Plan metadata commit will be made after STATE.md + ROADMAP.md updates._

## Files Created/Modified

- `README.md` — Root monorepo README. Package table row for `@napplet/sdk` + architecture diagram routing column now reference `ifc` / `window.napplet.ifc`.
- `packages/core/README.md` — Subscription type JSDoc reference updated from `ipc.on()` to `ifc.on()`.
- `packages/shim/README.md` — 10 logical edits / 11 line-deletions across How It Works, Quick Start, shape block, API Reference heading + prose, TypeScript section, Shim vs SDK table, Typical usage.
- `packages/sdk/README.md` — 7 logical edits / 9 line-deletions across How It Works, Quick Start, API Reference heading + prose, SDK vs Shim Typical usage.

Total raw line-level deletions across the phase: **3 + 11 + 9 = 23** (plan's rough pre-flight estimate of "3 + 10 + 7 = 20" is the logical-edit count; the raw diff count is higher because some "edits" describe multi-line blocks).

## Decisions Made

- None — plan executed exactly as written, including the plan's own in-text caveats about multi-line "edits" mapping to multiple single-line deletions.

## Deviations from Plan

None — plan executed exactly as written.

The plan's acceptance criteria for Tasks 2 and 3 used "exactly N line-deletions" where N counted logical edits (10 / 7), but the plan body itself explicitly noted "Edit 2 has 2 touched lines" and "Edit 3 has 3 touched lines but each is a single-line diff". The actual raw `^-` deletion counts (11 / 9) match the plan's body description; only the acceptance-criteria summary counts drifted. Treating this as a cosmetic inconsistency in the plan rather than a deviation — no re-edits required.

## Issues Encountered

None.

## Scope Verification

Verified via `git diff --name-only HEAD~3 HEAD`:

- `packages/*/src/` — **empty** (no source files touched, as required by plan's Phase 122 boundary).
- `.planning/` — **empty** (active planning docs are Plan 03's territory, not this plan's).
- `skills/` — **empty** (build-napplet skill is Plan 02's territory, running in parallel with this plan).

## User Setup Required

None — documentation-only phase, no external service configuration.

## Next Phase Readiness

- Plan 02 (skill file sweep) runs in parallel within Wave 1 — independent file targets, no conflict.
- Plan 03 (active planning docs) runs in Wave 2 after both Wave 1 plans land.
- Phase 124 (verification & sign-off) will run its repo-wide zero-grep acceptance after all three 123 plans complete.
- DOC-01 requirement satisfied.

## Self-Check: PASSED

- FOUND: README.md (modified, staged, committed as 22beae4)
- FOUND: packages/core/README.md (modified, staged, committed as 22beae4)
- FOUND: packages/shim/README.md (modified, staged, committed as 891db28)
- FOUND: packages/sdk/README.md (modified, staged, committed as e094a9a)
- FOUND commit 22beae4: verified via `git log --oneline | grep 22beae4`
- FOUND commit 891db28: verified via `git log --oneline | grep 891db28`
- FOUND commit e094a9a: verified via `git log --oneline | grep e094a9a`
- Zero-leakage grep across 4 READMEs: exit 1 (zero matches).

---
*Phase: 123-documentation-sweep*
*Completed: 2026-04-19*
