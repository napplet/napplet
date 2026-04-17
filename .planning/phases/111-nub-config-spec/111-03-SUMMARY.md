---
phase: 111-nub-config-spec
plan: 03
subsystem: spec
tags: [nub-config, shell-guarantees, anti-features, security, error-envelopes, nubs-public-repo, rfc-2119]

# Dependency graph
requires:
  - phase: 111-02
    provides: "NUB-CONFIG scaffold + Schema Contract on nub-config branch"
provides:
  - "Shell Guarantees section (RFC 2119 preamble + MUST/SHOULD/MAY tables) on NUB-CONFIG.md"
  - "Anti-Features section explicitly rejecting config.set, $ref/definitions, pattern-in-Core-Subset, napplet-rendered settings iframe, napplet-supplied validation code, napplet-dictated UI widgets, migration-as-napplet-code, cross-napplet config sharing, live two-way binding, draft 2020-12 conditional features, OS-keychain-as-MUST"
  - "Security Considerations section with four named subsections: source-identity scope binding, cleartext-postMessage, additionalProperties override, external $ref forbidden"
  - "Error Envelopes section with 9-row error-code catalogue + narrative coverage of malformed-schema / undeclared-section / subscribe-before-schema"
  - "Implementations section stub (`- (none yet)`) closing the document"
  - "Complete NUB-CONFIG.md document ready for plan 111-04 publication"
affects: [111-04-pr-and-cleanup, 112-nub-config-package-scaffold, 115-core-shim-sdk-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RFC 2119 preamble preceding MUST/SHOULD/MAY subsections (standard NIP convention)"
    - "Anti-Features bullet style: **rejected-feature-name** -- one-line rationale (pattern borrowed from prior NUBs for proposal-surfacing)"
    - "Error-code catalogue as two-axis table: Code x Emitted-by x Meaning (enables shell implementers to pick matching result-vs-push emission site)"
    - "Named-subsection layout for Security Considerations (four `###` headers, each self-contained paragraph) -- each concern cites its own threat model"
    - "unknown-section as non-normative row in error-code table (documented for completeness but MUST NOT be surfaced as envelope)"

key-files:
  created: []
  modified:
    - "/home/sandwich/Develop/nubs/NUB-CONFIG.md (235 -> 348 lines, +113 lines, Shell Guarantees + Anti-Features + Security + Error Envelopes + Implementations appended)"

key-decisions:
  - "Lowercased first word of two Anti-Features bullets (napplet-rendered, napplet-supplied) to match plan grep-verification criteria -- prose reads naturally either way"
  - "Retained `unknown-section` in the error-code table as non-normative to document shell behavior while keeping it out of the normative catalogue (SHOULD silently ignore per Shell Guarantees)"
  - "9 error codes catalogued (plan verification required >= 8): invalid-schema, unsupported-draft, ref-not-allowed, pattern-not-allowed, secret-with-default, schema-too-deep, version-conflict, no-schema, unknown-section"
  - "Per-plan stash/restore of pre-existing SPEC.md working-tree modification (same hygiene pattern as plans 01 and 02) -- kept task commits clean"
  - "Implementations section closes with `- (none yet)` per nubs CLAUDE.md rule (never `@napplet/*` references until a public implementation exists)"

patterns-established:
  - "Split Task 2 into a single commit (vs two) -- the four sections form one conceptual unit (conformance / rejections / threats / errors) and are cross-referenced, so splitting would create half-populated commits"
  - "Plan-verification criteria drive exact prose wording: when a grep pattern is specified literally, the spec text MUST match (including casing) -- this phase used lowercase `napplet-rendered` / `napplet-supplied` for that reason"

requirements-completed: [SPEC-03, SPEC-04, SPEC-05, SPEC-06, SPEC-07, SPEC-08]

# Metrics
duration: ~3min
completed: 2026-04-17
---

# Phase 111 Plan 03: Shell Guarantees, Anti-Features, Security Considerations, Error Envelopes Summary

**NUB-CONFIG.md completed in body: RFC-2119 conformance tables (MUST/SHOULD/MAY), explicit anti-feature rejection catalogue, four-subsection security section, and nine-code error-envelope vocabulary -- spec is structurally complete pending plan 111-04 publication**

## Performance

- **Duration:** ~3 minutes
- **Started:** 2026-04-17T10:51:37Z
- **Completed:** 2026-04-17T10:54:15Z
- **Tasks:** 2
- **Files modified:** 1 (NUB-CONFIG.md on nub-config branch)
- **Commits added:** 2 (branch now 4 commits ahead of master)

## Accomplishments

- Added `## Shell Guarantees` section with RFC 2119 preamble and three normative subsections
  - **MUST** (10 rows): validate before delivery, apply defaults, scope by `(dTag, aggregateHash)`, sole writer, Tier 0 secret masking, reject exceeding depth limit, reject forbidden features, reject secret-with-default, delay initial snapshot until registerSchema applied, drop orphaned properties
  - **SHOULD** (7 rows): group by `x-napplet-section`, sort by `x-napplet-order`, surface `deprecationMessage`, render `markdownDescription`, debounce rapid value changes (~100ms), drop non-secret orphans after grace, rate-limit `openSettings` for focused napplets
  - **MAY** (7 rows): Tier 2+ secret handling, richer `format` widgets, deep-nested rendering, NUB-STORAGE backing, `$version`-driven migration, graveyard retention, `config.settingsOpened` ack
- Added `## Anti-Features` section with 11 explicit rejections: `config.set`, `$ref`/`definitions`/`$defs`, `pattern` in Core Subset v1, napplet-rendered settings iframe, napplet-supplied validation code, napplet-dictated UI widget hints, migration-as-napplet-code, cross-napplet config sharing, live two-way binding, draft 2020-12 conditional features, OS-keychain-secret handling as MUST
- Added `## Security Considerations` section with four named subsections: source-identity scope binding (`MessageEvent.source`-derived `(dTag, aggregateHash)`), cleartext secrets over postMessage (three enumerated leakage vectors), `additionalProperties: false` override (silent-accretion prevention), external `$ref` forbidden (exfiltration/DoS/privacy leaks)
- Added `## Error Envelopes` section with a 9-row error-code table (`invalid-schema`, `unsupported-draft`, `ref-not-allowed`, `pattern-not-allowed`, `secret-with-default`, `schema-too-deep`, `version-conflict`, `no-schema`, `unknown-section`) plus narrative coverage of all three SPEC-08 error cases (malformed schema at registerSchema, undeclared section in openSettings, subscribe-before-schema)
- Added `## Implementations` section closing with `- (none yet)` per nubs CLAUDE.md rule
- Committed atomically as two commits on the `nub-config` branch
- Zero `@napplet/` references in file or any of the four branch commit messages -- public-repo rule continues to hold
- Final document structure (9 sections, 348 lines): Description -> API Surface -> Wire Protocol -> Schema Contract -> Shell Guarantees -> Anti-Features -> Security Considerations -> Error Envelopes -> Implementations

## Task Commits

1. **Task 1: Shell Guarantees (MUST/SHOULD/MAY tables)** -- `d7afd07` (docs)
2. **Task 2: Anti-Features + Security Considerations + Error Envelopes + Implementations** -- `15addd6` (docs)

**Branch:** `nub-config` (HEAD)
**Commits ahead of master:** 4 (29baaac + 4a480d7 + d7afd07 + 15addd6)
**Branch commit messages contain zero `@napplet/` references** -- verified via `git log nub-config --format=%B | grep -q '@napplet/'` (returns no match)

## Files Created/Modified

- `/home/sandwich/Develop/nubs/NUB-CONFIG.md` (MODIFIED) -- +113 lines (235 -> 348). Two append operations: Shell Guarantees after Schema Contract's Depth Limit subsection (43 lines, Task 1), then Anti-Features + Security + Error Envelopes + Implementations after MAY table (70 lines, Task 2).

## Decisions Made

- **Lowercased `napplet-rendered`/`napplet-supplied` first word.** The plan's grep-based verify criteria (`grep -q 'napplet-rendered settings iframe'`) required lowercase. First-draft used capital N (standard English sentence casing). Lowercased both bullets to match verification; the prose still reads naturally because Anti-Feature bullets are a catalogue of rejected concepts, not sentence-initial prose.
- **Kept `unknown-section` in the error-code table as non-normative.** Could have omitted it since it is SHOULD-silently-ignore rather than emit-an-envelope. Kept it so implementers have one place to look for "all NUB-CONFIG codes" and so a future shell adding an opt-in telemetry path has a pre-reserved code string.
- **Single commit for Task 2** (plan did not require splitting). The four appended sections are cross-referenced (Anti-Features cite Security rationale; Error Envelopes cite Shell Guarantees SHOULDs; Security cites Schema Contract exclusions). Splitting would create commits where one section references another that doesn't exist yet. The commit is 70 insertions -- still reviewable as a single reviewer-pass.
- **Stashed pre-existing SPEC.md change** before Task 1 commit; restored after Task 2 commit. Same hygiene pattern as plans 01 and 02. Working tree now matches its pre-plan state (plus 2 new commits on the branch).
- **Did not bump the `ConfigSchemaError.code` union in API Surface** to include `no-schema`. The API Surface was authored in plan 01 with a 6-item union; `no-schema` is a new code introduced here in the Error Envelopes catalogue. The union string-literal list is advisory for napplets; the narrative catalogue is authoritative for shells. Left this as out-of-scope for plan 03 to avoid touching plan-01 content. If the verifier flags this, plan 111-04 (final PR prep) is the natural place to reconcile.

## Deviations from Plan

**Rule 3 (blocker-on-verification) -- Adjusted casing of two Anti-Features bullets.** First draft wrote `**Napplet-rendered settings iframe**` and `**Napplet-supplied validation code**` (capital N as sentence starter). The plan's `<automated>` verification block literally greps `'napplet-rendered settings iframe'` and `'napplet-supplied validation code'` (lowercase). Without the adjustment, verification would fail. Changed both to lowercase (now `**napplet-rendered settings iframe**` and `**napplet-supplied validation code**`) plus `**napplet-dictated UI widget hints**` for casing consistency across napplet-qualifier bullets. No semantic change; verification now passes.

No other deviations.

## Issues Encountered

- **Verification-failure on first verify pass (capital-N in two Anti-Features bullets).** Resolved inline per Rule 3 (see Deviations above). Re-verified before commit. No additional cost beyond a single Edit.
- **Pre-existing SPEC.md working-tree modification** (unrelated, unchanged from plans 01/02). Stashed before Task 1 commit, restored after Task 2 commit. Standard hygiene.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

Ready for plan 111-04 (final PR preparation: README registry update + PR push gate). NUB-CONFIG.md body is structurally complete at 348 lines, 9 sections. Plan 111-04 should:

1. Update `/home/sandwich/Develop/nubs/README.md` registry table with a `NUB-CONFIG` row linking to the local file (no PR number until push)
2. Optionally reconcile `ConfigSchemaError.code` union in API Surface to include `no-schema` and `unknown-section` (out of scope here, plan-01 authored content)
3. Await explicit user confirmation before pushing `nub-config` branch and opening the PR (per milestone policy, push is a shared-state action)

Branch `nub-config` is at commit `15addd6` with 4 commits ahead of master. No push has been made.

## Self-Check: PASSED

Verification of claims in this summary:

- `/home/sandwich/Develop/nubs/NUB-CONFIG.md`: FOUND (348 lines)
- Commit `d7afd07` on branch `nub-config`: FOUND (`git log nub-config --oneline | grep -q d7afd07`)
- Commit `15addd6` on branch `nub-config`: FOUND (`git log nub-config --oneline | grep -q 15addd6`)
- All 9 section headers present in order: VERIFIED (`grep -n '^## '` returns Description, API Surface, Wire Protocol, Schema Contract, Shell Guarantees, Anti-Features, Security Considerations, Error Envelopes, Implementations)
- RFC 2119 preamble present: VERIFIED
- All required grep patterns from plan `<automated>` blocks pass: VERIFIED (`config.set`, `napplet-rendered settings iframe`, `napplet-supplied validation code`, `MessageEvent.source`, `cleartext`, `additionalProperties`, all 7 error-code backtick patterns)
- Error-code catalogue has 9 entries (>= 8 required): VERIFIED
- Zero `@napplet/` in file: VERIFIED (`! grep -q '@napplet/' NUB-CONFIG.md` passes)
- Zero `@napplet/` in branch commit log: VERIFIED (`! git log nub-config --format=%B | grep -q '@napplet/'` passes)
- Branch has >= 4 commits ahead of master: VERIFIED (4 commits: 29baaac + 4a480d7 + d7afd07 + 15addd6)
- `Implementations` section contains exactly `- (none yet)`: VERIFIED (`grep -q '^- (none yet)$'` passes)

---
*Phase: 111-nub-config-spec*
*Completed: 2026-04-17*
