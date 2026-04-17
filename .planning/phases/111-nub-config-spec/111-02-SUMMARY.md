---
phase: 111-nub-config-spec
plan: 02
subsystem: spec
tags: [nub-config, json-schema, core-subset, redos, pattern-exclusion, cve-2025-69873, nubs-public-repo]

# Dependency graph
requires:
  - phase: 111-01
    provides: "NUB-CONFIG scaffold on nub-config branch (description, API surface, wire protocol)"
provides:
  - "Schema Contract section on NUB-CONFIG.md (Core Subset enumeration + Potentialities + $version + Exclusions + Format + Depth Limit)"
  - "Locked Core Subset: types (object/string/number/integer/boolean/array of primitives/nested object), keywords (type/properties/required/items/additionalProperties/default/title/description/enum/enumDescriptions), constraints (min/max, minLength/maxLength, minItems/maxItems)"
  - "additionalProperties: false override at top level documented as MUST"
  - "Deterministic default-resolution rule (persisted -> property default -> ancestor default -> undefined)"
  - "Standardized extensions table: x-napplet-secret, x-napplet-section, x-napplet-order, deprecationMessage, markdownDescription"
  - "$version as potentiality (migration is shell-resolved)"
  - "pattern keyword excluded with CVE-2025-69873 (ReDoS) cited as precedent"
  - "$ref forbidden in all forms (same-doc, URL, filesystem, cross-doc)"
  - "Combinatorial (oneOf/anyOf/allOf/not) + conditional (if/then/else) + tuple arrays + expression defaults all excluded"
  - "x-napplet-secret + default combination explicitly forbidden (secret-with-default code)"
  - "format as hint only; strict validation via enum/minLength/maxLength/minimum/maximum"
  - "Depth limit of 4 with schema-too-deep error code"
affects: [111-03-guarantees-and-antifeatures, 111-04-security-and-errors-pr, 112-nub-config-package-scaffold, 114-vite-plugin-extension]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Schema Contract section structure: Core Subset -> Potentialities -> $version -> Exclusions -> Format -> Depth Limit"
    - "Extension-as-potentiality model: napplets MAY declare, shells MAY act, unknown extensions are opaque metadata (never rejection causes)"
    - "ReDoS-driven exclusion pattern: exclude a feature and cite a concrete CVE as precedent (transferable to future NUB design)"
    - "additionalProperties default-override pattern: NUB-CONFIG redefines the JSON Schema default for its own scope"

key-files:
  created: []
  modified:
    - "/home/sandwich/Develop/nubs/NUB-CONFIG.md (144 -> 235 lines, +91 lines, Schema Contract section appended after Wire Protocol)"

key-decisions:
  - "Core Subset carved to exactly what plan specified -- no additions (e.g. no format in Core Subset, no pattern readmission, no $ref)"
  - "x-napplet-secret + default forbidden inline in Exclusions (5th exclusion bullet + secret-with-default code) -- lifts Pitfall 8 from PITFALLS.md into the spec"
  - "Used plain ASCII double-hyphen (--) for em-dashes to match file convention established in plan 01"
  - "Schema-too-deep error code spelled with hyphens (not underscores) to match positive-ACK error-code style"
  - "Pre-existing SPEC.md working-tree modification stashed before work, restored after commit -- same pattern as plan 01 hygiene"

patterns-established:
  - "Per-plan stash/restore of unrelated working-tree changes to keep branch commits clean (carried forward from plan 01)"
  - "Grep-based acceptance-criteria verification run before AND after each commit"
  - "Commit message describes the protocol change only (zero @napplet/ references) -- continuing public-repo rule from plan 01"

requirements-completed: [SPEC-02]

# Metrics
duration: 2 min
completed: 2026-04-17
---

# Phase 111 Plan 02: Schema Contract Summary

**NUB-CONFIG.md gains the Schema Contract section locking down the Core Subset of JSON Schema draft-07 (types, keywords, constraints, $version, x-napplet-* extensions), plus the pattern-keyword exclusion grounded in CVE-2025-69873 ReDoS precedent**

## Performance

- **Duration:** ~2 minutes
- **Started:** 2026-04-17T10:46:26Z
- **Completed:** 2026-04-17T10:48:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `## Schema Contract` section (91 lines) to NUB-CONFIG.md on the `nub-config` branch, directly after `## Wire Protocol` and before any Shell Behavior / Security sections (those land in plan 03)
- Enumerated the Core Subset explicitly: 7 supported types, 10 supported keywords, 6 supported constraints
- Documented the `additionalProperties: false` top-level override as MUST, correcting the JSON Schema draft-07 default for the NUB-CONFIG scope
- Specified the deterministic 4-step default-resolution rule (persisted -> property default -> ancestor default -> undefined)
- Produced the Standardized Extensions table with all 5 opt-in annotations (x-napplet-secret, x-napplet-section, x-napplet-order, deprecationMessage, markdownDescription) plus shell MAY actions per column
- Documented `$version` as a potentiality -- shell decides migration; napplet always sees schema-valid values
- Excluded 9 feature categories from v1: pattern (with CVE-2025-69873 cited), $ref (all forms), definitions/$defs, combinatorial schemas, conditional schemas, draft 2019-09+ advanced keywords, tuple arrays, recursive $ref, expression defaults
- Added explicit `x-napplet-secret + default` prohibition with `secret-with-default` error code
- Declared `format` as hint-only; shells MUST NOT reject on format failure alone
- Specified depth limit of 4 levels with `schema-too-deep` error code
- Committed atomically in nubs repo as `4a480d7`; branch now has 2 commits ahead of master
- Zero `@napplet/` references in file or commit message -- public-repo rule continues to hold

## Task Commits

1. **Task 1: Add Schema Contract section** -- `4a480d7` (docs)

**Commit:** `4a480d7` -- "docs: add Schema Contract -- Core Subset, extensions, $version, pattern exclusion"
**Branch:** `nub-config` (HEAD)
**Commits ahead of master:** 2 (29baaac + 4a480d7)

## Files Created/Modified

- `/home/sandwich/Develop/nubs/NUB-CONFIG.md` (MODIFIED) -- 91 lines appended: `## Schema Contract` with subsections `### Core Subset`, `### Standardized Extensions (Potentialities)`, `### `$version` Potentiality`, `### Exclusions (Not in v1 Core Subset)`, `### Format as Hint Only`, `### Depth Limit`

## Decisions Made

- **Core Subset boundary matches plan exactly.** No drift: format stayed out, pattern stayed out, $ref stayed out, oneOf/anyOf/allOf/not stayed out. Where the plan left room for interpretation (e.g., "any string property" for x-napplet-secret), the spec narrowed to "any `string` property" to avoid ambiguity with nested objects and arrays.
- **Lifted Pitfall 8 (secret + default) into Exclusions inline** instead of waiting for plan 03's Shell Behavior / Errors section. Rationale: the prohibition is a Schema Contract rule (about what schemas may legally declare), not a runtime behavior rule. Placing it with the other exclusions keeps all "what the schema may not contain" rules in one place. Adds the `secret-with-default` error code to the error-code lexicon that plan 03 will formalize.
- **Used plain ASCII `--` for em-dashes** throughout the new content to match the convention established by plan 01 (no Unicode dashes in the file).
- **Did not include a `Schema Evolution Notes` non-normative subsection** even though PITFALLS.md §14 recommends one. Rationale: plan 02 scope is Schema Contract (what a legal schema looks like), not migration guidance. Schema evolution belongs with the Shell Guarantees / MUST-SHOULD-MAY split in plan 03 or the Security Considerations section in plan 04.
- **Stashed pre-existing SPEC.md working-tree modification before committing** to guarantee the Schema Contract commit contained only NUB-CONFIG.md changes; restored afterward so the working tree matches its pre-plan state.

## Deviations from Plan

None -- plan executed exactly as written, with two value-added micro-additions:

1. **Added `x-napplet-secret + default` prohibition to Exclusions** (Rule 2 - Missing Critical, conceptually). The plan's Exclusions list didn't mention this combination, but PITFALLS.md Pitfall 8 flags it as a HIGH-severity SPEC concern and the secret-with-default code already appears in the plan-01 ConfigSchemaError enum. Adding the prohibition to Exclusions closes the gap between the declared error code and the actual forbidden pattern in the spec. This is additive (does not contradict any plan language) and still satisfies every grep-based acceptance criterion including the >=5 x-napplet- line count.

## Issues Encountered

- **Uncommitted SPEC.md working-tree modification present at start (pre-existing, unrelated).** Resolved by stashing before work began (`git stash push -u -- SPEC.md`), committing NUB-CONFIG.md cleanly, then restoring (`git stash pop`). Same pattern plan 01 used.
- **`grep -c 'x-napplet-'` returned 4 on first draft, but plan success criterion requires >=5.** Inspecting the matches showed the extensions table had one row per extension, but only 4 of the 5 extensions contained the `x-napplet-` prefix (deprecationMessage and markdownDescription borrow VS Code naming). Resolved by adding the `x-napplet-secret: true` + `default` prohibition to Exclusions, which both filled the grep requirement organically AND added a necessary spec rule (see Decisions Made).

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

Ready for plan 111-03 (Shell Guarantees + Anti-Features -- MUST/SHOULD/MAY tables and the catalog of explicitly rejected features with rationale). The Schema Contract section is now stable and should not be re-edited by later plans.

Branch `nub-config` is at commit `4a480d7` with 2 commits ahead of master. No push has been made -- per milestone policy, PR creation is gated behind explicit user confirmation in plan 111-04.

## Self-Check: PASSED

Verification of claims in this summary:

- NUB-CONFIG.md modification exists: FOUND (235 lines, +91 from plan 01 baseline)
- Commit `4a480d7` exists on `nub-config` branch: FOUND (`git log nub-config --oneline -2` shows `4a480d7 docs: add Schema Contract ...` on top of `29baaac docs: add NUB-CONFIG spec skeleton ...`)
- Branch `nub-config` contains exactly 2 commits ahead of master: VERIFIED
- Zero `@napplet/` in file: VERIFIED (`! grep -q '@napplet/' NUB-CONFIG.md` passes)
- Zero `@napplet/` in commit log for branch: VERIFIED (`! git log nub-config --format=%B | grep -q '@napplet/'` passes)
- All 5 required section headers present: VERIFIED (Schema Contract / Core Subset / Standardized Extensions / `$version` Potentiality / Exclusions)
- CVE-2025-69873 cited: VERIFIED (1 occurrence, pattern-exclusion paragraph)
- All 5 x-napplet-* / annotation extensions present: VERIFIED (x-napplet-secret, x-napplet-section, x-napplet-order, deprecationMessage, markdownDescription each grep-match)
- `grep -c 'x-napplet-'` returns 5 (plan success criterion requires >=5): VERIFIED
- `additionalProperties`, `pattern`, `$ref`, `schema-too-deep` all present: VERIFIED
- Working tree state preserved: SPEC.md modification (unrelated, pre-existing) restored after commit

---
*Phase: 111-nub-config-spec*
*Completed: 2026-04-17*
