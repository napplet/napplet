---
phase: 123-documentation-sweep
plan: 02
subsystem: docs
tags: [skill, ifc, terminology, agentskills, build-napplet]

# Dependency graph
requires:
  - phase: 122-source-rename
    provides: window.napplet.ifc runtime surface (installer shape used in Step 8 samples)
  - phase: 123-documentation-sweep (Plan 01)
    provides: IFC-clean published READMEs (shim README is cross-referenced as the canonical Quick Start shape)
provides:
  - IFC-terminology-correct build-napplet skill file
  - Step 8 samples aligned to window.napplet.ifc.emit/on (Phase 122 installer shape)
  - Zero `ipc` / `IPC-PEER` / `IPC_PEER` / `inter-pane` / `inter-napplet` / case-variant leakage in the skill
affects:
  - 123-documentation-sweep Plan 03 (active planning sweep — skill terminology set now locked)
  - 124-verification-sign-off (repo-wide grep gate — skill file contributes zero matches)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Skill file terminology matches current runtime surface (not historical API)"
    - "Scope boundary honored: only IFC-relevant lines touched; other pre-v0.16.0 staleness deferred"

key-files:
  created: []
  modified:
    - skills/build-napplet/SKILL.md

key-decisions:
  - "Scope was explicitly narrowed to IFC-terminology surface per 123-CONTEXT.md Deferred Ideas — broader skill staleness (window.nostr, nappletState, discoverServices, NIP-01 wire format, named-export emit/on) left for a future milestone's skill-rewrite phase"
  - "Step 8 code sample updated from dead `import { emit, on } from '@napplet/shim'` to current `import '@napplet/shim'` + `window.napplet.ifc.emit/on` usage — named-export pattern was killed in v0.8.0 Phase 41"
  - "Added `// or: import { ifc } from '@napplet/sdk';` as a comment in Step 8 for bundler consumers without widening scope"
  - "emit signature note updated to optional-param syntax `extraTags?: string[][], content?: string): void` to match the installer signature shipped in Phase 122"

patterns-established:
  - "Terminology-only swap preferred over structural rewrite when a phase's scope is locked to a vocabulary change"
  - "Out-of-scope stale surface preserved byte-stable (explicitly documented in plan) so future milestones can sweep it without merge conflicts"

requirements-completed: [DOC-02]

# Metrics
duration: ~2min
completed: 2026-04-19
---

# Phase 123 Plan 02: Skill Sweep Summary

**`skills/build-napplet/SKILL.md` swept to IFC terminology via 2 literal frontmatter edits + 1 scoped Step 8 block-rewrite + 1 pitfalls bullet update — zero IFC leakage in the skill file, cold-reading agents now write `window.napplet.ifc.emit/on` against the Phase 122 surface.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-19T22:43:30Z
- **Completed:** 2026-04-19T22:44:54Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Frontmatter `description` field now advertises "inter-frame events" (cold-read hook for agent skill selection)
- Overview paragraph tagline uses "inter-frame messaging"
- Step 8 heading, body prose, code samples, and signature note all aligned to the current `window.napplet.ifc.emit/on` API surface
- Dead named-export pattern (`import { emit, on } from '@napplet/shim'`, killed in v0.8.0 Phase 41) removed from the only code sample using it
- Common pitfalls final bullet rewritten with IFC-correct method-call phrasing
- Phase gate grep `grep -nE "\bipc\b|IPC-PEER|IPC_PEER|inter-pane|inter-napplet|Inter-napplet|Inter-pane|INTER_PANE|Inter-Pane"` returns zero matches on the file (exit 1)

## Task Commits

Each task was committed atomically with `--no-verify` (parallel executor convention):

1. **Task 1: Update frontmatter description + Overview tagline** — `99e07e0` (docs)
2. **Task 2: Rewrite Step 8 + Common pitfalls inter-pane bullet** — `2cc4176` (docs)

Plan metadata commit (SUMMARY + STATE + ROADMAP) lands after this SUMMARY is written.

## Files Created/Modified

- `skills/build-napplet/SKILL.md` — 2 frontmatter swaps (Task 1), Step 8 block-rewrite (Task 2), Common pitfalls bullet rewrite (Task 2)

## Edit Accounting

- **Task 1:** 2 literal swaps
  - Line 3 frontmatter `description`: `inter-pane events` → `inter-frame events`
  - Line 10 Overview: `inter-pane messaging` → `inter-frame messaging`
- **Task 2:** 1 Step 8 block-rewrite (8 in-block changes) + 1 pitfalls bullet rewrite (3 swaps on one line)
  - Step 8 heading: `Inter-pane` → `Inter-frame`
  - Step 8 intro sentence: 3 changes (prose terminology + `emit()`/`on()` prefixed with `window.napplet.ifc.`)
  - Step 8 code import: removed dead `import { emit, on } from '@napplet/shim'`, replaced with side-effect `import '@napplet/shim';` + `// or: import { ifc } from '@napplet/sdk';` comment
  - Step 8 emit call: prefixed with `window.napplet.ifc.`
  - Step 8 comment: `inter-pane` → `inter-frame`
  - Step 8 on call: prefixed with `window.napplet.ifc.`
  - Step 8 signature note: `extraTags: string[][] = [], content: string = ''` → `extraTags?: string[][], content?: string): void`
  - Common pitfalls bullet: 3 swaps (`emit()` → `window.napplet.ifc.emit()`; `inter-pane` → `inter-frame`; `on()` → `window.napplet.ifc.on()`)

## Final Zero-Leakage Grep Evidence

```bash
$ grep -nE "\bipc\b|IPC-PEER|IPC_PEER|inter-pane|inter-napplet|Inter-napplet|Inter-pane|INTER_PANE|Inter-Pane" skills/build-napplet/SKILL.md
(no output)
$ echo "Exit: $?"
Exit: 1
```

Positive IFC-correctness assertions (cold-read simulation):

```
inter-frame events:                 2 matches  (frontmatter + Step 8 intro)
## Step 8 — Inter-frame events:      1 match   (heading)
window.napplet.ifc.(emit|on):        4 matches (2 code + 1 intro + 1 pitfall)
```

Out-of-scope preservation (confirms no accidental sweep):

```
window.nostr:        12 matches  (Step 7 + pitfall — unchanged)
nappletState:        12 matches  (Step 6 + pitfall — unchanged)
discoverServices:     4 matches  (Step 9 — unchanged)
```

## Decisions Made

- **Scope explicitly narrowed to IFC-terminology surface.** The skill file has broader pre-v0.16.0 staleness (`window.nostr` removed in v0.24.0, `nappletState` superseded by `window.napplet.storage` in v0.8.0+, `discoverServices` removed in v0.22.0, NIP-01 wire format replaced by JSON envelope in v0.16.0, `subscribe/publish/query/emit/on` named exports killed in v0.8.0 Phase 41). Per v0.27.0 scope boundary and 123-CONTEXT.md Deferred Ideas, only IFC-terminology was touched. A full skill rewrite is a future milestone's job.
- **Named-export `{ emit, on }` import removed only from the Step 8 sample** (not from Steps 3-5 `subscribe/publish/query` samples) because Step 8 is the only IFC-terminology surface in the phase scope. Steps 3-5 remain on the dead pattern pending a broader skill rewrite.
- **Added `// or: import { ifc } from '@napplet/sdk';` comment** in Step 8 to signal the bundler-friendly path without rewriting the sample to use the SDK as the primary form. The shim side-effect import remains the Quick Start shape.

## Deviations from Plan

None — plan executed exactly as written. All edits landed as the plan's exact before→after snippets specified. Zero scope expansion.

## Issues Encountered

None. The plan's before→after snippets matched the file byte-for-byte; no ambiguity in target strings; no line-number drift between tasks (Task 2 operated on the post-Task-1 file, but Task 2's target lines were outside Task 1's edit zones).

## User Setup Required

None — doc-only change, no external service configuration required.

## Explicit Deferred-Staleness Acknowledgment

The skill file has broader pre-v0.16.0 staleness (`window.nostr`, `nappletState`, NIP-01 wire-format references, `subscribe/publish/query/emit/on` named exports, `discoverServices`/`hasService`/`hasServiceVersion`). Per v0.27.0 scope boundary and 123-CONTEXT.md Deferred Ideas, only IFC-terminology was touched in this plan. A full skill rewrite to the current Phase 122+ surface is a future milestone's job and is **not** a v0.27.0 deliverable.

An agent invoking the `build-napplet` skill for the **inter-frame-events recipe** (Step 8) now writes IFC-correct code against the current surface. An agent invoking the skill for other recipes (Steps 3-7, 9) still writes code against the pre-v0.16.0 surface — that's a documented deferred issue, not this plan's problem.

## Confirmation

Only `skills/build-napplet/SKILL.md` was modified in this plan. No source files (`packages/*/src/`), no READMEs (Plan 01's scope), and no `.planning/` docs (Plan 03's scope) were touched. `git status` after both task commits showed a clean tree with respect to those out-of-scope regions.

## Next Phase Readiness

- DOC-02 requirement satisfied.
- Plan 03 (active planning sweep) unblocked — runs in Wave 2 after this plan lands.
- Phase 124 verification will run repo-wide grep over `packages/`, `specs/`, `skills/`, root `README.md`, and active `.planning/` — this plan's contribution (the skill file) passes the gate.

---
*Phase: 123-documentation-sweep*
*Plan: 02*
*Completed: 2026-04-19*

## Self-Check: PASSED

- `skills/build-napplet/SKILL.md` exists: FOUND
- Commit `99e07e0` (Task 1): FOUND
- Commit `2cc4176` (Task 2): FOUND
- Phase-gate grep returns zero matches: PASSED
- All Task 2 automated verify checks: PASSED (heading, emit code, on code, dead import removed, pitfall bullet, signature)
- Out-of-scope preservation: PASSED (window.nostr/nappletState/discoverServices counts all above minimums)
