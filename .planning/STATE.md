---
gsd_state_version: 1.0
milestone: v0.27.0
milestone_name: IFC Terminology Lock-In
status: verifying
stopped_at: Completed 123-03-PLAN.md (Phase 123 Active Planning Sweep — all 3 plans complete)
last_updated: "2026-04-19T23:01:36.843Z"
last_activity: 2026-04-19
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 123 complete; Phase 124 (Verification & Sign-Off) next

## Current Position

Phase: 124
Plan: Not started
Status: Phase complete — ready for Phase 124 verification
Last activity: 2026-04-19

Progress: [██████████] 100%

## Phase Map

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 122 | Source Rename | API-01, API-02, SRC-01 | Complete (ready for verification) |
| 123 | Documentation Sweep | DOC-01, DOC-02, PLAN-01 | Complete (all 3 plans shipped; DOC-01, DOC-02, PLAN-01 satisfied) |
| 124 | Verification & Sign-Off | VER-01, VER-02 | Not started |

## Performance Metrics

**Velocity:**

- Total plans completed (v0.27.0): 4
- Previous milestone (v0.26.0): 5 phases, 9 plans, ~2-3 min/plan average

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 122   | 01   | 3min     | 5     | 6     |
| 123   | 01   | 7min     | 3     | 4     |
| 123   | 02   | 2min     | 2     | 1     |
| 123   | 03   | 6min     | 3     | 7     |

*Updated after each plan completion.*

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with 34 subpath exports; deprecated packages ship as 1-line re-export shims for one release cycle
- v0.27.0: The NUB domain is already named `ifc` (`@napplet/nub/ifc`, `shell.supports('nub:ifc')`, NUB-IFC spec). This milestone renames the remaining developer-facing surface — `window.napplet.ipc`, `@napplet/sdk` `ipc` export, JSDoc, READMEs, skill file, and active planning docs.
- v0.27.0: Hard break — no backward-compat alias on `window.napplet.ipc` (confirmed at milestone kickoff).
- v0.27.0: Archived `.planning/milestones/` and `.planning/quick/` directories are left unchanged; they are historical record, not current docs.
- v0.27.0: Historical "Shipped: vX.Y.Z" changelog lines in READMEs that mention `IPC_PEER` as a past decision are history, not current docs — they stay.
- v0.27.0 Phase 122 Plan 01: Runtime API surface renamed ipc -> ifc across @napplet/core (NappletGlobal.ifc), @napplet/shim (installer key), @napplet/sdk (const ifc export), and @napplet/nub/ifc (requireIfc guard + Error string). Hard break, no alias. Localized build + type-check green across the 4 affected packages; zero IPC leakage across 6 in-scope source files.
- v0.27.0 Phase 123 Plan 01: Published READMEs (root + core + shim + sdk) swept to IFC terminology via 20 literal token-swap edits (23 raw line-deletions). Zero structural rewrites; preserved already-IFC-correct regions byte-stable (shim Wire Format code fences, sdk ifc.emit/ifc.event JSON envelope examples, IfcNubMessage type references, IFC_DOMAIN constant). No source, .planning/, or skills/ files touched. Zero-leakage grep across 4 READMEs passes (exit 1). DOC-01 satisfied.
- v0.27.0 Phase 123 Plan 02: Skill file (skills/build-napplet/SKILL.md) swept to IFC terminology via 2 frontmatter edits + Step 8 block-rewrite (heading + code samples to window.napplet.ifc.emit/on + optional-param signature note) + Common pitfalls bullet rewrite. Scope explicitly narrowed to IFC-terminology surface; other pre-v0.16.0 staleness (window.nostr, nappletState, discoverServices, named-export pattern, NIP-01 wire format) deferred to a future skill-rewrite milestone. Zero-leakage grep passes (exit 1). DOC-02 satisfied.
- v0.27.0 Phase 123 Plan 03: Active .planning/ docs swept via 28 edits across 7 files — 18 codebase prose swaps (inter-pane → inter-frame), 2 TESTING.md transport-accuracy swaps (IPC → postMessage on lines 83/152), 1 research/ARCHITECTURE.md NappletGlobal code-fence swap (ipc: → ifc:), and 9 research/FEATURES-CHANNELS.md swaps (2 plan-specified + 7 Rule 2 deviation extension; IFC where describing existing napplet pub/sub, postMessage/iframe messaging where generic transport shorthand). Seven dated-historical files preserved byte-identical (PROJECT.md, STATE.md, ROADMAP.md, research/ONTOLOGY.md, research/SDK_NAMING_PATTERNS.md, research/SUMMARY.md, SPEC-GAPS.md) + INTEGRATIONS.md line 168 historical INTER_PANE constant. Phase 123 in-scope zero-grep across 11 files passes (exit 1). Phase 124 trade-off record written to 123-03-NOTES.md with Option (a) path-exclusion recommendation. PLAN-01 satisfied.

### Pending Todos

None yet.

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) — unresolved.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260419-i6c | Republish napplet packages as 0.2.1 with resolved workspace:* deps | 2026-04-19 | ec677fb | [260419-i6c-republish-napplet-packages-as-0-2-1-with](./quick/260419-i6c-republish-napplet-packages-as-0-2-1-with/) |

## Session Continuity

Last session: 2026-04-19T22:55:27.268Z
Stopped at: Completed 123-03-PLAN.md (Phase 123 Active Planning Sweep — all 3 plans complete)
Resume: Phase 123 complete (all 3 plans shipped; DOC-01, DOC-02, PLAN-01 satisfied). Phase 124 (verification & sign-off, VER-01 + VER-02) is the next phase — will run pnpm -r build + type-check across 14 packages and repo-wide zero-grep acceptance. Phase 124 must consult 123-03-NOTES.md for the documented 7-file preservation list + INTEGRATIONS.md line 168 exclusion when refining its acceptance grep scope.
