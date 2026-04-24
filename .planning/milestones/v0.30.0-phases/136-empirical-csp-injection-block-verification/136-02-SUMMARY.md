---
phase: 136-empirical-csp-injection-block-verification
plan: 02
subsystem: documentation
tags: [csp, security, nip-07, nub-class-1, phase-notes, detect-02, detect-03, detect-04, phase-boundary, handoff]

# Dependency graph
requires:
  - phase: 136 Plan 01
    provides: "/tmp/napplet-136-injection-block.log + /tmp/napplet-136-report-shape.log — Plan 01 evidence cited verbatim in Sections 1 and 2"
provides:
  - "136-PHASE-NOTES.md in phase directory — 5-section consumable artifact Phase 137's NUB-IDENTITY + NUB-CLASS-1 amendment author reads verbatim"
  - "Grep-verified presence of all 7 required literal strings (world:'MAIN', chrome.scripting.executeScript, connect-src 'none', MAY refuse-to-serve, shell MAY reject, (dTag, aggregateHash), violatedDirective)"
  - "DETECT-02 / DETECT-03 / DETECT-04 documentation gates locked — Phase 137 cites the notes file when drafting spec amendment MUST/SHOULD rows"
affects:
  - "Phase 137 (NUB-IDENTITY + NUB-CLASS-1 bundled amendment) — Security Considerations subsection (c) and CLASS1-02 MUST row cite 136-PHASE-NOTES.md Sections 2+4 verbatim"
  - "Phase 138 (in-repo NIP-5D amendment) — NIP5D-02 Security Considerations prose cites the same world:'MAIN' + connect-src 'none' framing"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase-notes deliverable cadence: Plan 01 produces /tmp evidence logs; Plan 02 synthesizes into .planning/phases/<phase>/<phase>-PHASE-NOTES.md as the durable Phase (N+1) input. Pattern established on v0.28.0 Phase 134; refined here with literal-string grep-verification to make the handoff machine-checkable"
    - "Grep-sweep hygiene: Task 2 emits a per-check PASS/FAIL log to /tmp/napplet-<phase>-phase-notes-grep.log with a final GREP_EXIT=$N marker, mirroring the v0.28.0 VERnn_EXIT=0 pattern but for documentation-gate verification"

key-files:
  created:
    - .planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md (93 lines)
    - /tmp/napplet-136-phase-notes-grep.log (grep evidence — 7 PASS + GREP_EXIT=0)
  modified: []

key-decisions:
  - "136-PHASE-NOTES.md records observations + documentation gates ONLY; does NOT draft spec amendment prose (no MUST/SHOULD tables, no 'Proposed Amendment Text', no conformance rows). Phase boundary honored per CONTEXT.md deferred section"
  - "Section 1 interpretation bullets updated to cite the ACTUAL observed Chromium 144+ value violatedDirective='script-src-elem' (not the plan-template example 'script-src-*'); amendment-facing guidance notes older Chromium versions may emit bare 'script-src' and recommends directive-family match (startsWith('script-src')) rather than exact sub-directive pinning"
  - "Section 2 annotation updated to cite the ACTUAL observed blockedURI='inline' value AND the two Chromium quirks Plan 01 captured: documentURI='data' (scheme-only truncation for data: URL documents) + sourceFile=null (inline-injection has no remote origin file). Both quirks are flagged so Phase 137's report-to-endpoint MUST row tolerates them"
  - "Section 3 enumerates 3 MAY statements verbatim (refuse-to-serve, reject identity.decrypt, surface to user) without ranking or recommending — preserves shell UX discretion per REQUIREMENTS.md DETECT-03 + STATE.md 'Security enforcement runs shell-side' principle"
  - "Section 4 acknowledges world:'MAIN' residual HONESTLY — names chrome.scripting.executeScript as the bypass API call, names connect-src 'none' as the structural backstop, explicitly states 'do NOT claim a fix'. This is the paragraph Phase 137 NUB-IDENTITY-05 (c) cites verbatim"
  - "No per-task commit for Task 2 — grep sweep produces only a /tmp/ log (AGENTS.md no-home-pollution rule + precedent from Plan 01 Task 2 where /tmp/ logs are not committed). Only Task 1 (PHASE-NOTES.md) lands a commit; grep-log commit would pollute the repo with a reproducible verification artifact"

requirements-completed:
  - DETECT-02
  - DETECT-03
  - DETECT-04

# Metrics
duration: 2min 8s
completed: 2026-04-23
---

# Phase 136 Plan 02: PHASE-NOTES.md Synthesis + Documentation-Gate Grep-Verification Summary

**Synthesized Plan 01's empirical CSP-block evidence into a single 93-line `136-PHASE-NOTES.md` Phase 137's amendment author reads verbatim — with grep-verified presence of all 7 required literal strings locking DETECT-02/03/04 documentation gates.**

## Performance

- **Duration:** ~2 min 8 sec
- **Completed:** 2026-04-23
- **Tasks:** 2 (both `type="auto"`)
- **Files modified:** 1 repo file (136-PHASE-NOTES.md created); 1 evidence log (`/tmp/napplet-136-phase-notes-grep.log`)

## Accomplishments

- `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md` created (93 lines, ≥80 minimum) with all 5 required section headings: Summary / 1. Observed Behavior / 2. Violation Report Shape / 3. Shell Policy Latitude / 4. `world: 'MAIN'` Extension-API Residual / 5. Phase 137 Handoff
- Plan 01 evidence JSON substituted verbatim into Sections 1 and 2 — no `{RUN-TIME-INSERT}` placeholders remain
- All 7 required literal strings grep-verified present (see Task 2 output below): `world: 'MAIN'`, `chrome.scripting.executeScript`, `connect-src 'none'`, `MAY refuse-to-serve`, `shell MAY reject`, `(dTag, aggregateHash)`, `violatedDirective`
- DETECT-02, DETECT-03, DETECT-04 REQ-IDs satisfied — documentation gates locked for Phase 137 amendment citation
- Phase boundary honored: file records observations + documentation gates ONLY; zero spec-amendment prose drafted (no MUST/SHOULD tables, no "Proposed Amendment Text", no conformance rows)
- Zero source changes under `packages/`, `specs/`, `skills/`, or `src/` (phase-level constraint preserved)
- Zero `/home/sandwich/` pollution — grep log lives exclusively under `/tmp/napplet-136-*` per AGENTS.md

## Task Commits

1. **Task 1: Author 136-PHASE-NOTES.md synthesizing Plan 01 evidence + DETECT-02/03/04 documentation** — `707a412` — `docs(136-02): author 136-PHASE-NOTES.md synthesizing Plan 01 CSP-block evidence` — adds `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md` (93 insertions)
2. **Task 2: Grep-verify the 7 required literal strings + stamp GREP_EXIT=0** — no commit (AGENTS.md no-home-pollution rule: evidence log lives at `/tmp/napplet-136-phase-notes-grep.log`, not in repo; precedent matches Plan 01 Task 2 where `/tmp/` logs are not committed)

**Plan metadata commit:** pending (this SUMMARY + STATE + ROADMAP + REQUIREMENTS via `gsd-tools.cjs commit`).

## PHASE-NOTES.md Confirmation

**Path:** `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md`
**Line count:** 93 lines (≥80 minimum — satisfied)
**Section headings (all 5 required, verbatim):**

1. `## Summary`
2. `## 1. Observed Behavior — CSP Legacy-Injection Block (DETECT-01 mechanism-observation, VER-04)`
3. `## 2. Violation Report Shape (DETECT-02 — what the shell's `report-to` endpoint would receive)`
4. `## 3. Shell Policy Latitude (DETECT-03 — mechanism defined, response is shell UX concern)`
5. `## 4. `world: 'MAIN'` Extension-API Residual (DETECT-04 — honestly acknowledged, structurally mitigated by `connect-src 'none'`)`
6. `## 5. Phase 137 Handoff`

**Phase boundary check:** File contains NO `MUST` rows drafted as spec text, NO "Proposed Amendment Text" section, NO conformance tables. The declarative framing ("shell MAY refuse-to-serve", "Chromium blocked the injection", "plaintext is trapped inside the frame") records observations + gates without authoring the Phase 137 amendment prose.

## Verbatim Plan 01 JSON Substituted Into PHASE-NOTES.md

### Section 1 (from `/tmp/napplet-136-injection-block.log`)

```json
{"cspViolation":true,"windowNostrDefined":false,"violationCount":1,"violatedDirective":"script-src-elem","effectiveDirective":"script-src-elem","pass":true}
```

### Section 2 (from `/tmp/napplet-136-report-shape.log`)

```json
{"reportShape":{"violatedDirective":"script-src-elem","blockedURI":"inline","documentURI":"data","sourceFile":null}}
```

## Grep-Verification Output

Verbatim `/tmp/napplet-136-phase-notes-grep.log`:

```
=== Phase 136 Plan 02 — PHASE-NOTES.md literal-string sweep ===
File: .planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md

PASS [DETECT-04 world] -- 'world: 'MAIN''
PASS [DETECT-04 extension API] -- 'chrome.scripting.executeScript'
PASS [DETECT-04 mitigation] -- 'connect-src 'none''
PASS [DETECT-03 latitude A] -- 'MAY refuse-to-serve'
PASS [DETECT-03 latitude B] -- 'shell MAY reject'
PASS [DETECT-02 correlation] -- '(dTag, aggregateHash)'
PASS [DETECT-02 report field] -- 'violatedDirective'

ALL 7 LITERAL STRINGS PRESENT
GREP_EXIT=0
```

- 7 PASS lines + 0 FAIL lines
- `ALL 7 LITERAL STRINGS PRESENT` summary marker
- `GREP_EXIT=0` stamp — all documentation gates locked

## Template Deviations from Plan

Two adjustments were made to Section 1 + Section 2 annotation bullets to honor the plan's instruction "cite the actual observed value, not the template example" when Plan 01's observed Chromium values differed from the plan template's hypotheticals:

1. **Section 1 `violatedDirective` annotation** — plan template bullet said `"script-src*"` as the family. Plan 01 observed exactly `"script-src-elem"` (element-level sub-directive). Section 1's interpretation bullet now cites `"script-src-elem"` verbatim and explicitly notes older Chromium versions may emit bare `"script-src"`; recommends `startsWith('script-src')` for the Phase 137 amendment's directive-family match prose. (Plan 01 Task 1, steps 3–4 of the Task 1 action block.)

2. **Section 2 `documentURI` + `sourceFile` annotations** — plan template said `documentURI` is "the napplet's data: or https:// URL" and `sourceFile` is "same as documentURI for our test". Plan 01 observed `documentURI: "data"` (Chromium scheme-only truncation quirk) and `sourceFile: null` (Chromium inline-injection quirk). Section 2 now flags BOTH quirks and instructs the Phase 137 amendment that the shell's `report-to` endpoint MUST tolerate `sourceFile === null` and scheme-only `documentURI` for this injection shape. (Plan 01 Task 1, step 4 of the Task 1 action block.)

Both substitutions strengthen the PHASE-NOTES' fidelity to empirical behavior; they are deliberate template-to-actual adjustments, not rule-based auto-fixes. No deviation rules (1-4) were triggered.

## Deviations from Plan

### Auto-fixed Issues

**None.** Plan executed exactly as written. No Rule 1 bugs, no Rule 2 missing-critical-functionality, no Rule 3 blocking issues, no Rule 4 architectural escalations.

---

**Total deviations:** 0. Plan executed exactly as specified by the planner.

## Issues Encountered

None. Task 1 verify green on first attempt (TASK1_VERIFY_GREEN: file exists, 93 lines ≥80, no placeholders, all 5 section headings present). Task 2 verify green on first attempt (TASK2_VERIFY_GREEN: 7 PASS + 0 FAIL + GREP_EXIT=0 stamped + ALL 7 LITERAL STRINGS PRESENT summary). Plan-level one-shot verification gate green (`PHASE 136 PLAN 02 GREEN — PHASE 136 COMPLETE`).

## User Setup Required

None — documentation synthesis plan; no external services, no installation steps, no credentials needed. All inputs read from `/tmp/napplet-136-*` (Plan 01 outputs) and `.planning/`; all outputs written to `.planning/phases/136-.../` + `/tmp/napplet-136-phase-notes-grep.log`.

## Next Phase Readiness

**Phase 136 complete — ready for Phase 137 `/gsd:plan-phase 137`.**

Phase 137 (NUB-IDENTITY + NUB-CLASS-1 bundled amendment, depends on both Phase 135 (already complete) and Phase 136 (this phase)) can now proceed. Citation map for Phase 137:

- **DETECT-01 / DETECT-02 amendment (CLASS1-02 MUST row + NUB-IDENTITY-02 conformance table):** cite `136-PHASE-NOTES.md` Section 1 (observed block — `violatedDirective: "script-src-elem"`, `windowNostrDefined: false`, `cspViolation: true`) + Section 2 (4-field report shape — `violatedDirective`, `blockedURI: "inline"`, `documentURI: "data"` scheme-only quirk, `sourceFile: null` inline-injection quirk). Amendment MUST use directive-family match (`startsWith('script-src')`), not exact sub-directive pinning
- **Shell MAY rows / NUB-IDENTITY-05 Security Considerations subsection (b) + (c):** cite Section 3 (3 MAY statements: refuse-to-serve, reject identity.decrypt, surface to user) and Section 4 (world:'MAIN' residual verbatim — `chrome.scripting.executeScript` bypass API, `connect-src 'none'` structural mitigation, "do NOT claim a fix" framing)
- **Public-repo hygiene (NUB-IDENTITY-06 / VER-02 cross-repo grep):** PHASE-NOTES file lives in private `.planning/` tree; never gets into public `napplet/nubs` diffs. The amendment author paraphrases/quotes prose from PHASE-NOTES into the public amendment without importing `@napplet/*` or internal-repo references

**Blockers/concerns:** None. Phase 137 planning may begin immediately.

## Phase 136 Milestone Status

Phase 136 (`empirical-csp-injection-block-verification`) is COMPLETE with both plans executed:

- **Plan 01** (wave 1, DETECT-01 + VER-04): empirical Playwright fixture + 2 evidence logs + 4-field report shape observation — `/tmp/napplet-136-injection-block.log` + `/tmp/napplet-136-report-shape.log` stamped `VER04_EXIT=0`
- **Plan 02** (wave 2, DETECT-02 + DETECT-03 + DETECT-04): `136-PHASE-NOTES.md` synthesis + grep-verification — 7 PASS `GREP_EXIT=0`

All 5 REQ-IDs scoped to Phase 136 (`DETECT-01`, `DETECT-02`, `DETECT-03`, `DETECT-04`, `VER-04`) are complete. v0.29.0 progression: Phases 135 + 136 done (parallel-eligible wave 1); Phase 137 can begin.

## Confirmation: Zero Repo Source Changes

`git diff --stat packages/ specs/ skills/` returns empty — no changes to `packages/`, `specs/`, or `skills/` trees. Only `.planning/` files are touched by this plan:

- `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md` (new, committed in `707a412`)
- `.planning/phases/136-empirical-csp-injection-block-verification/136-02-SUMMARY.md` (this file, committed with final metadata)
- `.planning/STATE.md` (updated via `gsd-tools state *` commands in final metadata commit)
- `.planning/ROADMAP.md` (updated via `gsd-tools roadmap update-plan-progress` in final metadata commit)
- `.planning/REQUIREMENTS.md` (updated via `gsd-tools requirements mark-complete DETECT-02 DETECT-03 DETECT-04` in final metadata commit)

## Self-Check: PASSED

- FOUND: `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md` (93 lines)
- FOUND: `/tmp/napplet-136-phase-notes-grep.log` (GREP_EXIT=0, 7 PASS, 0 FAIL)
- FOUND: commit `707a412` in git log — `docs(136-02): author 136-PHASE-NOTES.md synthesizing Plan 01 CSP-block evidence`
- GATE OK: `GREP_EXIT=0` + `ALL 7 LITERAL STRINGS PRESENT` in grep log
- GATE OK: No `RUN-TIME-INSERT` placeholder strings in PHASE-NOTES.md
- GATE OK: All 5 required section headings present verbatim
- GATE OK: PHASE-NOTES.md ≥80 lines (actual: 93)
- REPO HYGIENE OK: `git diff --stat packages/ specs/ skills/` empty; only `.planning/` files touched
- PHASE BOUNDARY OK: No spec-amendment prose drafted (no MUST/SHOULD tables, no "Proposed Amendment Text" section)

---

*Phase: 136-empirical-csp-injection-block-verification*
*Plan: 02*
*Completed: 2026-04-23*
