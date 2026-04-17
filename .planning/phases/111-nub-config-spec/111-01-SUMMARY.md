---
phase: 111-nub-config-spec
plan: 01
subsystem: spec
tags: [nub-config, json-schema, spec, nubs-public-repo, wire-protocol]

# Dependency graph
requires:
  - phase: milestone-decisions
    provides: "Locked v0.25.0 decisions (shell-sole-writer, manifest-authoritative, subscribe-live, scoped storage)"
provides:
  - "NUB-CONFIG.md scaffold on nub-config branch in public nubs repo"
  - "Header + metadata block (setext header, NUB ID, Namespace, Discovery, Parent)"
  - "Description section (2 paragraphs — what NUB-CONFIG is + shell-sole-writer invariant)"
  - "API Surface section — NappletConfig, ConfigSchema, ConfigValues, ConfigSchemaError, Subscription types"
  - "Wire Protocol table — 6 napplet->shell + 3 shell->napplet message rows"
  - "Examples subsection — 8 envelope examples covering every message type + error paths"
affects: [111-02-schema-contract, 111-03-guarantees-and-antifeatures, 111-04-security-and-errors-pr]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Spec template pattern matched from NUB-IDENTITY.md (setext header, draft label, NUB ID/Namespace/Discovery/Parent, Description->API Surface->Wire Protocol->Examples)"
    - "Correlation-ID field name is `id` (matches NUB-IDENTITY / NUB-STORAGE convention)"
    - "Positive-ACK wire pattern (registerSchema.result always returned, ok: true/false + code)"
    - "Dual-use `config.values` distinguished by presence vs absence of `id` (response vs push)"

key-files:
  created:
    - "/home/sandwich/Develop/nubs/NUB-CONFIG.md (144 lines, 7321 bytes, branch: nub-config)"
  modified: []

key-decisions:
  - "Spec uses `id` (not `requestId`) as correlation field — matches NUB-IDENTITY / NUB-STORAGE precedent"
  - "`config.values` is dual-use — presence of `id` distinguishes `config.get` response from subscription push"
  - "`config.registerSchema` uses positive-ACK pattern — every call receives `config.registerSchema.result`"
  - "Committed scaffold content in one commit (Task 1 + Task 2 content combined) to avoid half-populated commits on the branch"
  - "Pre-existing local SPEC.md modification stashed then restored on master — not carried into the nub-config branch"

patterns-established:
  - "Per-NUB branch rule: spec files live on their dedicated branch (`nub-config`), never on master"
  - "Zero `@napplet/*` references rule: verified in both file content and commit message for public nubs repo"
  - "Single scaffold commit captures description + API surface + wire protocol together — later plans extend in separate commits"

requirements-completed: [SPEC-01]

# Metrics
duration: ~4min
completed: 2026-04-17
---

# Phase 111 Plan 01: NUB-CONFIG Spec Scaffold Summary

**NUB-CONFIG.md skeleton drafted on nub-config branch of public napplet/nubs repo — setext header, API surface (NappletConfig interface + ConfigSchema/ConfigValues/ConfigSchemaError types), and full wire protocol (9 message types, 8 envelope examples)**

## Performance

- **Duration:** ~4 minutes
- **Started:** 2026-04-17T10:40:00Z (approx)
- **Completed:** 2026-04-17T10:44:01Z
- **Tasks:** 2
- **Files modified:** 1 (new file)

## Accomplishments

- Created `nub-config` branch in `/home/sandwich/Develop/nubs/` cut from master@887b1ff
- Wrote NUB-CONFIG.md (144 lines, 7321 bytes) with setext header matching NUB-IDENTITY / NUB-NOTIFY conventions
- Populated Description (2 paragraphs), API Surface (TypeScript interfaces), Wire Protocol (table + 8 envelope examples)
- Committed scaffold as single clean commit on the branch
- Zero `@napplet/*` references in file or commit message — public-repo rule honored
- Pre-existing uncommitted SPEC.md modification stashed before branch cut, restored on master afterward

## Task Commits

Each task was committed atomically (per plan guidance combining Task 1 + Task 2 into a single scaffold commit):

1. **Task 1: Create nub-config branch and stub NUB-CONFIG.md** — no commit (per plan: "Do NOT commit yet. Leave the file staged only after task 2 adds content")
2. **Task 2: Fill Description + API Surface + Wire Protocol sections and commit the scaffold** — `29baaac` (docs)

**Commit:** `29baaac` — "docs: add NUB-CONFIG spec skeleton (description, API surface, wire protocol)"
**Branch:** `nub-config` (HEAD)
**Commits ahead of master:** 1

## Files Created/Modified

- `/home/sandwich/Develop/nubs/NUB-CONFIG.md` (NEW) — NUB-CONFIG spec scaffold: header + Description + API Surface + Wire Protocol + 8 envelope examples

## Decisions Made

- Used `id` as correlation field name (per 111-CONTEXT.md locked decision matching NUB-IDENTITY / NUB-STORAGE)
- Authored the `config.registerSchema.result` row with `ok` + `error?` + `code?` payload — positive-ACK pattern (matches 111-CONTEXT.md decision)
- `config.values` Direction row shows `id?` — explicit dual-use marker in the table
- API surface includes `readonly schema: ConfigSchema | null` accessor (supports napplet capability-dependent UI; carried forward from ARCHITECTURE.md design)
- API surface includes `onSchemaError` subscription method (addresses async schema-error delivery for `registerSchema` calls)
- `ConfigSchemaError.code` enum kept broad (`'invalid-schema' | 'version-conflict' | 'unsupported-draft' | 'ref-not-allowed' | 'pattern-not-allowed' | 'secret-with-default'`) — plans 02-04 can narrow or extend as the error catalog firms up

## Deviations from Plan

None — plan executed exactly as written.

The plan's Task 1 explicitly instructs not to commit at the end of Task 1 and combine with Task 2's commit; this was honored. The pre-existing uncommitted SPEC.md change in the nubs repo working tree was stashed on master before the branch cut and restored on master afterward, leaving repo state equivalent to what was observed at start (plus the new branch + commit).

## Issues Encountered

- Uncommitted local modification to SPEC.md on master (unrelated to this plan) required brief stash/restore around the branch cut. Resolved by `git stash push -u -- SPEC.md` before branch cut and `git stash pop` on master after the scaffold commit. No impact on plan outcome.
- `git pull --ff-only` on master failed because master has no upstream tracking (local-only branch). Not blocking — latest local master commit was used for the branch cut.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Ready for plan 111-02 (Schema Contract section — Core Subset enumeration, `pattern` exclusion rationale citing CVE-2025-69873, `$version` potentiality, `x-napplet-*` extension potentialities).

Branch `nub-config` is checked out in the nubs repo with one clean scaffold commit. No push has been made — per milestone policy, PR creation is gated behind explicit user confirmation in plan 111-04.

## Self-Check: PASSED

Verification of claims in this summary:

- NUB-CONFIG.md exists: FOUND at `/home/sandwich/Develop/nubs/NUB-CONFIG.md`
- Commit `29baaac` exists on `nub-config` branch: FOUND (`git log nub-config --oneline -1` returns `29baaac docs: add NUB-CONFIG spec skeleton ...`)
- Branch `nub-config` exists: FOUND (`git rev-parse --verify nub-config` returns `29baaac9f42d292b51f5b708e955292d0d97384b`)
- Zero `@napplet/` in file: VERIFIED (`! grep -q '@napplet/' NUB-CONFIG.md` passes)
- Zero `@napplet/` in commit message: VERIFIED (`! git log nub-config --format=%B -1 | grep -q '@napplet/'` passes)
- All 6 WIRE-XX message types present in file: VERIFIED (config.registerSchema, config.get, config.subscribe, config.unsubscribe, config.openSettings, config.values all grep-matched with ≥2 occurrences each)

---
*Phase: 111-nub-config-spec*
*Completed: 2026-04-17*
