---
phase: 123-documentation-sweep
plan: 03
subsystem: docs
tags: [ifc, planning, terminology, ipc-to-ifc, postmessage, transport, phase-124-handoff]

# Dependency graph
requires:
  - phase: 122-source-rename
    provides: "IFC runtime API surface (window.napplet.ifc) that these active-planning docs now reference in current-tense API descriptions"
  - phase: 123-documentation-sweep (Plan 01)
    provides: "IFC-clean published READMEs (4 READMEs are cross-referenced in Plan 03's acceptance grep)"
  - phase: 123-documentation-sweep (Plan 02)
    provides: "IFC-clean skill file (skills/build-napplet/SKILL.md participates in Plan 03's 11-file zero-grep)"
provides:
  - "Active-planning surface (.planning/codebase/*.md + 2 research/*.md) swept to IFC terminology in current-tense API descriptions"
  - "TESTING.md transport-layer terminology corrected to accurate postMessage (lines 83 + 152) — closes Phase 124's \bIPC\b grep gate for this file"
  - "FEATURES-CHANNELS.md swept to IFC (where text references the existing napplet pub/sub system) + postMessage (where text uses IPC as generic transport shorthand)"
  - "Phase 124 trade-off record (123-03-NOTES.md) enumerating preserved dated/historical files so Phase 124 can refine its repo-wide zero-grep acceptance scope without surprises"
affects: [124-verification-sign-off]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plan-specified edits + Rule 2 deviation extension when verification grep gate required broader coverage than planner's read_first scope captured"
    - "Current-tense vs dated-historical distinction applied per file: active-planning current-API descriptions get rewritten; dated research investigation + external ecosystem citations preserved byte-identical"
    - "Generic-category `IPC` → `postMessage` substitution (transport accuracy) distinguished from namespace-reference `IPC` → `IFC` substitution (naming alignment)"

key-files:
  created:
    - .planning/phases/123-documentation-sweep/123-03-NOTES.md
    - .planning/phases/123-documentation-sweep/123-03-SUMMARY.md
  modified:
    - .planning/codebase/ARCHITECTURE.md
    - .planning/codebase/STRUCTURE.md
    - .planning/codebase/INTEGRATIONS.md
    - .planning/codebase/CONCERNS.md
    - .planning/codebase/TESTING.md
    - .planning/research/ARCHITECTURE.md
    - .planning/research/FEATURES-CHANNELS.md

key-decisions:
  - "TESTING.md lines 83 + 152 rewritten from generic `IPC` to accurate `postMessage` (plan-revision decision) — closes Phase 124 `\bIPC\b` grep gate for this file without path-based exclusion and matches the concrete transport the napplet shim actually uses (window.parent.postMessage)"
  - "FEATURES-CHANNELS.md full-file sweep (deviation Rule 2): planner's read_first scope (lines 130-145) missed 7 additional current-tense `IPC` references scattered elsewhere in the file. Applied TESTING.md precedent inline — IPC → IFC when it describes the existing napplet pub/sub system (kind 29003 context), IPC → postMessage / iframe messaging when used as generic transport-category shorthand. Documented in NOTES.md deviation record and SUMMARY.md deviations section"
  - "INTEGRATIONS.md line 168 (`29003: INTER_PANE`) preserved byte-identical per plan — historical wire-kind constant name, flagged as the sole documented residual for Phase 124"
  - "Seven files preserved byte-identical per historical_preservation_map — PROJECT.md, STATE.md, ROADMAP.md, research/ONTOLOGY.md, research/SDK_NAMING_PATTERNS.md, research/SUMMARY.md, SPEC-GAPS.md. These carry dated investigation content or external ecosystem citations; Phase 124 will refine its grep scope to exclude them"

patterns-established:
  - "When a phase's verification gate references a file-scope that exceeds the planner's read_first window, Rule 2 (auto-add missing work) applies inline: the executor extends the sweep to satisfy the gate rather than halting, and documents the deviation transparently"
  - "Generic vs namespace-specific acronym substitution: an executor must read context to decide — IPC as generic 'inter-process communication' category → postMessage (accurate transport); IPC as namespace reference (e.g. kind 29003 pub/sub, `window.napplet.ipc`) → IFC (naming alignment)"

requirements-completed: [PLAN-01]

# Metrics
duration: ~6min
completed: 2026-04-19
---

# Phase 123 Plan 03: Active Planning Sweep Summary

**Active `.planning/` surface swept to IFC + accurate-transport terminology via 28 literal edits across 7 files — 18 codebase prose swaps + 2 TESTING.md transport-description swaps + 1 research code-fence swap + 9 FEATURES-CHANNELS.md swaps (2 plan-specified + 7 Rule 2 deviation extension). Seven documented-exception files preserved byte-identical. Phase 124 inherits a transparent trade-off record in 123-03-NOTES.md.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-19T22:48:00Z (PLAN_START_TIME)
- **Completed:** 2026-04-19T22:53:35Z
- **Tasks:** 3/3
- **Files modified:** 7 (codebase/*.md ×5 + research/*.md ×2)
- **Files created:** 2 (123-03-NOTES.md + this SUMMARY.md)

## Accomplishments

- **.planning/codebase/ARCHITECTURE.md (5 edits):** `inter-pane` → `inter-frame` across SDK-layer description, topic-routing comment, router-decision bullet, Pubsub section heading, and storage-access response note.
- **.planning/codebase/STRUCTURE.md (2 edits):** `inter-pane pubsub` → `inter-frame pubsub` in packages/shim directory purpose + `Inter-pane pubsub` → `Inter-frame pubsub` in function-naming convention bullet.
- **.planning/codebase/INTEGRATIONS.md (3 edits):** `inter-pane` → `inter-frame` in Nostr protocol routing bullet + `Inter-Pane Events` heading → `Inter-Frame Events` + storage-routing bullet. **Line 168 `29003: INTER_PANE` historical constant name preserved byte-identical.**
- **.planning/codebase/CONCERNS.md (6 edits):** `inter-pane` → `inter-frame` across event-ID impact bullet, fragile-area heading, missing-test bullet, scaling-limit capacity + limit bullets, and missing-feature subscription-restriction problem.
- **.planning/codebase/TESTING.md (2 edits):** Generic `IPC` → accurate `postMessage` on lines 83 (`window.parent.postMessage()` mechanism bullet) + 152 (integration-test scope bullet). This resolves the Phase 124 `\bIPC\b` grep gate for this file without path-based exclusion.
- **.planning/research/ARCHITECTURE.md (1 edit):** NappletGlobal TypeScript code-fence snippet's `ipc:` key swapped to `ifc:` — byte-identical column alignment preserved (both keys are 3 chars, 3-space gap intact).
- **.planning/research/FEATURES-CHANNELS.md (9 edits):**
  - **Plan-specified (2):** Pub/Sub comparison-table header (line 132) `existing IPC, kind 29003` → `existing IFC, kind 29003`; Status row (line 140) `window.napplet.ipc.emit/on` → `window.napplet.ifc.emit/on`.
  - **Rule 2 deviation extension (7):** Line 3 frontmatter Domain (generic category → postMessage); lines 17, 20, 30, 50 (generic IPC/transport-category shorthand → postMessage / iframe messaging); lines 18, 34, 177, 185 (references to existing napplet pub/sub system → IFC).

**Final Phase 123 zero-grep evidence** (executed at 2026-04-19T22:52Z):

```bash
$ grep -lE "\bipc\b|\bIPC\b|IPC-PEER|IPC_PEER|inter-pane|inter-napplet|Inter-napplet|Inter-pane|INTER_PANE|Inter-Pane" \
    README.md \
    packages/core/README.md \
    packages/shim/README.md \
    packages/sdk/README.md \
    skills/build-napplet/SKILL.md \
    .planning/codebase/ARCHITECTURE.md \
    .planning/codebase/STRUCTURE.md \
    .planning/codebase/CONCERNS.md \
    .planning/codebase/TESTING.md \
    .planning/research/ARCHITECTURE.md \
    .planning/research/FEATURES-CHANNELS.md
(no output)
$ echo $?
1
```

Single documented residual (INTEGRATIONS.md line 168):

```bash
$ grep -nE "\bipc\b|\bIPC\b|IPC-PEER|IPC_PEER|inter-pane|inter-napplet|Inter-napplet|Inter-pane|INTER_PANE|Inter-Pane" .planning/codebase/INTEGRATIONS.md
168:- 29003: INTER_PANE (napplet-to-napplet events)
```

Preserved files byte-identical (all `git diff --exit-code` returned 0):
- .planning/PROJECT.md
- .planning/STATE.md
- .planning/ROADMAP.md
- .planning/research/ONTOLOGY.md
- .planning/research/SDK_NAMING_PATTERNS.md
- .planning/research/SUMMARY.md
- .planning/SPEC-GAPS.md

## Task Commits

Each task was committed atomically. Standard hook flow (no `--no-verify`); hooks passed cleanly.

1. **Task 1: Sweep .planning/codebase/*.md (18 edits, 5 files)** — `13ba291` (docs)
   - ARCHITECTURE.md (5+5), STRUCTURE.md (2+2), INTEGRATIONS.md (3+3), CONCERNS.md (6+6), TESTING.md (2+2). Total: 18 insertions / 18 deletions. Matches plan exactly.
2. **Task 2 (plan-specified): Research current-surface swap (3 edits, 2 files)** — `a78394d` (docs)
   - research/ARCHITECTURE.md (1+1) + research/FEATURES-CHANNELS.md (2+2 — lines 132 + 140). Total: 3 insertions / 3 deletions.
3. **Task 2 (Rule 2 deviation extension): FEATURES-CHANNELS.md broader sweep (7 additional edits, 1 file)** — `ef91495` (docs)
   - research/FEATURES-CHANNELS.md: 9 total insertions / 9 deletions (2 from prior commit + 7 new). Deviation triggered by the plan's Task 3 verification grep listing FEATURES-CHANNELS.md in the zero-grep acceptance set while the planner's `read_first` (lines 130-145) only captured 2 of the 9 current-tense `IPC` references in the file.
4. **Task 3: Phase 124 inheritance record (NOTES.md)** — `20ca18d` (docs)
   - .planning/phases/123-documentation-sweep/123-03-NOTES.md created. 127 insertions, 1 new file. Documents edit table, preservation map, deviation record, Phase 124 trade-off with Option (a)/(b) recommendation, and final grep evidence.

Plan metadata commit (this SUMMARY + STATE + ROADMAP updates): pending final step.

## Files Created/Modified

**Created:**
- `.planning/phases/123-documentation-sweep/123-03-NOTES.md` — Phase 124 inheritance record (edit table, preservation map, deviation record, trade-off options, grep evidence)
- `.planning/phases/123-documentation-sweep/123-03-SUMMARY.md` — this file

**Modified (7 active-planning docs, 28 total edits):**
- `.planning/codebase/ARCHITECTURE.md` — 5 edits (inter-pane → inter-frame)
- `.planning/codebase/STRUCTURE.md` — 2 edits (inter-pane → inter-frame)
- `.planning/codebase/INTEGRATIONS.md` — 3 edits (inter-pane → inter-frame; line 168 INTER_PANE preserved)
- `.planning/codebase/CONCERNS.md` — 6 edits (inter-pane → inter-frame)
- `.planning/codebase/TESTING.md` — 2 edits (IPC → postMessage on lines 83, 152)
- `.planning/research/ARCHITECTURE.md` — 1 edit (NappletGlobal code-fence ipc: → ifc:)
- `.planning/research/FEATURES-CHANNELS.md` — 9 edits (2 plan-specified + 7 Rule 2 extension; IFC where existing napplet pub/sub, postMessage/iframe messaging where generic transport shorthand)

## Decisions Made

- **TESTING.md lines 83 + 152 rewritten to `postMessage`** (plan-revision decision honored): closes the Phase 124 `\bIPC\b` grep gate for this file without path-based exclusion, and the new term describes the actual transport the napplet shim uses (`window.parent.postMessage()`). Semantically more precise than the generic "IPC" catchall.
- **FEATURES-CHANNELS.md deviation extension** applied TESTING.md precedent inline: generic-category `IPC` → `postMessage` / iframe messaging (5 refs); existing-system-namespace `IPC` → `IFC` (3 refs, in kind 29003 context). Plan specified only 2 of these 9 edits; the remaining 7 were Rule 2 auto-add necessary to satisfy the plan's own zero-grep verification gate.
- **INTEGRATIONS.md line 168 preserved as-is** per plan: the `29003: INTER_PANE` constant-name message is a historical artifact pre-dating the Phase 35 rename to `IPC_PEER` (and subsequent Phase 122 source-level sweep). Documented as the sole residual for Phase 124.
- **Seven dated-historical files preserved byte-identical** per `historical_preservation_map`: PROJECT.md, STATE.md, ROADMAP.md, research/ONTOLOGY.md, research/SDK_NAMING_PATTERNS.md, research/SUMMARY.md, SPEC-GAPS.md. All verified with `git diff --exit-code` returning 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical work] Extended FEATURES-CHANNELS.md sweep beyond planner's originally-specified 2 edits**

- **Found during:** Task 3 verification grep run (first time the full-file zero-grep was executed against FEATURES-CHANNELS.md)
- **Issue:** The plan specified exactly 2 edits to FEATURES-CHANNELS.md (lines 132 + 140) based on the planner's narrow `read_first` scope (lines 130-145). However, the plan's Task 3 verification grep explicitly listed FEATURES-CHANNELS.md in the zero-grep acceptance set — meaning the planner intended full-file cleanliness. Running the grep after the plan-specified 2 edits revealed 7 additional current-tense `IPC` references (lines 3, 17, 18, 20, 30, 34, 50, 177, 185) that would leak into Phase 124's repo-wide grep.
- **Fix:** Extended the sweep to cover all 7 additional references using TESTING.md precedent: `IPC` → `IFC` when the term references the existing napplet pub/sub system (kind 29003 context — lines 18, 34, 177, 185 heading); `IPC` → `postMessage` / "iframe messaging" when used as a generic transport-category shorthand (lines 3, 17, 20, 30, 50). Historical preservation still honored — none of the 4 dated-research files on the preservation list (ONTOLOGY.md, SDK_NAMING_PATTERNS.md, SUMMARY.md, SPEC-GAPS.md) were touched.
- **Files modified:** `.planning/research/FEATURES-CHANNELS.md` (7 additional edits beyond the plan's 2)
- **Commit:** `ef91495`
- **Rationale for Rule 2 classification:** This is "missing critical functionality" in the planner's sense — the plan's own acceptance gate (Task 3's zero-grep across 11 files) required this work. Without it, the plan fails its own verification. Classic Rule 2: plan intent vs. plan specification mismatch, fix inline to honor intent.

### Plan-Sanctioned Discretion Applied

None — the plan was very specific about every edit. The only judgment call was on the deviation above, handled per Rule 2.

## Issues Encountered

None — all edits landed via exact-string `Edit` tool matches with no line-number drift or missing anchors. Verification greps ran clean on first execution after each task.

## Scope Verification

Verified via `git diff --name-only 226657c HEAD` (where 226657c is the pre-Phase-123 milestone-kickoff commit, prior to Plan 01's first task commit):

Scope of this Plan 03 (commits `13ba291 a78394d ef91495 20ca18d`):
- `.planning/codebase/*.md` — 5 files modified (4 `inter-pane` → `inter-frame` + 1 TESTING.md `IPC` → `postMessage`)
- `.planning/research/*.md` — 2 files modified (ARCHITECTURE code-fence + FEATURES-CHANNELS full sweep)
- `.planning/phases/123-documentation-sweep/123-03-NOTES.md` — 1 file created

Files deliberately NOT touched by this plan (verified byte-identical or out-of-scope):
- `packages/*/src/` — untouched (Phase 122's shipped territory)
- Root `README.md`, `packages/*/README.md` (Plan 01's territory, already shipped)
- `skills/build-napplet/SKILL.md` (Plan 02's territory, already shipped)
- `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md` (clean at milestone kickoff, preservation list)
- `.planning/research/ONTOLOGY.md`, `.planning/research/SDK_NAMING_PATTERNS.md`, `.planning/research/SUMMARY.md` (dated investigation, preservation list)
- `.planning/SPEC-GAPS.md` (dated Phase 84 investigation, preservation list)
- `.planning/codebase/INTEGRATIONS.md` line 168 (historical constant name, line-specific preservation)
- `.planning/milestones/`, `.planning/quick/` (frozen history, out-of-scope per 123-CONTEXT.md)

Wave dependencies respected: Plan 01 (READMEs) and Plan 02 (skill) landed in Wave 1 (commits 22beae4, 891db28, e094a9a, 99e07e0, 2cc4176) before Plan 03 started — verified via `git log --oneline | grep 123-0[12]`.

## User Setup Required

None — pure documentation-only plan, zero external service configuration.

## Next Phase Readiness

- **PLAN-01 requirement satisfied** — active-planning docs (codebase/*.md + 2 research/*.md) swept to IFC terminology; dated historical artifacts preserved per `historical_preservation_map`.
- **Phase 124 (Verification & Sign-Off)** is now ready to execute. It will run:
  - `pnpm -r build` + `pnpm -r type-check` across all 14 packages (VER-01)
  - Repo-wide grep for `\bIPC\b` / `\bipc\b` / `IPC-PEER` / `inter-pane` (VER-02)
- **Phase 124 MUST consult `.planning/phases/123-documentation-sweep/123-03-NOTES.md`** for the 7-file preservation list + INTEGRATIONS.md line-168 exclusion. Recommended Phase 124 action: path-based grep exclusions for documented dated-historical files (Option (a) in NOTES.md), preserving historical fidelity of the IFC rename's own provenance.
- **Cross-wave dependency verified:** Plans 01 (22beae4/891db28/e094a9a), 02 (99e07e0/2cc4176), and 03 (13ba291/a78394d/ef91495/20ca18d) all land on main in the correct order before Phase 124 starts.

## Self-Check: PASSED

- FOUND: .planning/codebase/ARCHITECTURE.md (modified, committed as 13ba291)
- FOUND: .planning/codebase/STRUCTURE.md (modified, committed as 13ba291)
- FOUND: .planning/codebase/INTEGRATIONS.md (modified, committed as 13ba291)
- FOUND: .planning/codebase/CONCERNS.md (modified, committed as 13ba291)
- FOUND: .planning/codebase/TESTING.md (modified, committed as 13ba291)
- FOUND: .planning/research/ARCHITECTURE.md (modified, committed as a78394d)
- FOUND: .planning/research/FEATURES-CHANNELS.md (modified, committed as a78394d + ef91495)
- FOUND: .planning/phases/123-documentation-sweep/123-03-NOTES.md (created, committed as 20ca18d)
- FOUND commit 13ba291 — Task 1 (codebase sweep)
- FOUND commit a78394d — Task 2 plan-specified (research sweep)
- FOUND commit ef91495 — Task 2 deviation extension (FEATURES-CHANNELS.md full-file sweep)
- FOUND commit 20ca18d — Task 3 (Phase 124 NOTES.md)
- Phase 123 in-scope zero-grep across 11 files: exit 1 (no matches, PASSED)
- INTEGRATIONS.md residual: exactly 1 match on line 168 (expected, PASSED)
- Preservation `git diff --exit-code` across 7 files: all exit 0 (PASSED)

---
*Phase: 123-documentation-sweep*
*Plan: 03*
*Completed: 2026-04-19*
