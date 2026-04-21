---
phase: 141-documentation-sweep
plan: 01
subsystem: docs
tags: [readme, nub-connect, nub-class, v0.29.0, skill, documentation-sweep]

requires:
  - phase: 135-cross-repo-spec-work
    provides: NUB-CONNECT + NUB-CLASS drafts, NIP-5D amendment
  - phase: 136-core-type-surface
    provides: NappletConnect + class? on NappletGlobal
  - phase: 137-nub-subpaths-connect-class
    provides: '@napplet/nub/connect + @napplet/nub/class subpath surfaces'
  - phase: 139-shim-sdk-integration
    provides: installConnectShim + installClassShim + SDK barrel re-exports
  - phase: 140-shell-policy-documents
    provides: SHELL-CONNECT-POLICY.md + SHELL-CLASS-POLICY.md
provides:
  - Root README documenting v0.29.0 two-class posture + NUB-RESOURCE-first architectural guidance
  - packages/nub/README with 12-domain table (connect + class rows) and 46-entry-point contract
  - packages/shim/README with window.napplet.connect + window.napplet.class per-surface subsections
  - packages/sdk/README with connect + class namespace exports + helper tables + capability examples
  - skills/build-napplet/SKILL.md with Step 11 (NUB-CLASS + NUB-CONNECT) + three new pitfalls
affects:
  - 141-02 (vite-plugin README is the remaining doc file)
  - 142 (verification phase — DOC requirements now ready for REQ-ID closure)

tech-stack:
  added: []
  patterns:
    - Doc-sweep pattern — surgical insertions preserving historical changelog bullets byte-identical (v0.27.0 / v0.28.0 precedent for DOC-07)
    - NUB table row additions for connect + class following v0.28.0 resource precedent
    - Per-surface shim README subsection pattern for new window.napplet.* surfaces

key-files:
  created: []
  modified:
    - README.md
    - packages/nub/README.md
    - packages/shim/README.md
    - packages/sdk/README.md
    - skills/build-napplet/SKILL.md

key-decisions:
  - Canonical 'Default to NUB-RESOURCE; reach for NUB-CONNECT only when...' guidance used verbatim in root README + SKILL
  - Connect + class rows added after existing resource row (preserves table append pattern; matches v0.28.0 shape)
  - Tree-Shaking Contract updated to 46/12/12/11/11 to reflect v0.29.0 subpath additions
  - class.assigned listed in shim README Inbound block; Outbound block carries explicit 'NUB-CONNECT has no wire' note
  - SKILL Step 11 includes explicit four-state graceful-degradation priority order (granted / denied / no nub:connect / neither)

patterns-established:
  - Historical v0.28.0 sections (resource NUB, browser-enforced isolation) MUST be byte-identical on every v0.29.0 doc edit (DOC-07)
  - Per-NUB domain README subsections append at bottom of domains table + new section after prior NUB section, never restructure

requirements-completed:
  - DOC-01
  - DOC-02
  - DOC-04
  - DOC-05
  - DOC-06
  - DOC-07

duration: 18min
completed: 2026-04-21
---

# Phase 141 Plan 01: Documentation Sweep (non-vite-plugin) Summary

**Five user-facing doc files swept to the v0.29.0 two-class posture with byte-identical preservation of all v0.28.0 resource NUB content; new window.napplet.connect + window.napplet.class runtime surfaces documented end-to-end and the canonical NUB-RESOURCE-first guidance shipped verbatim in root README + SKILL.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-21
- **Completed:** 2026-04-21
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Root README ships the v0.29.0 section with NUB-CLASS-1 / NUB-CLASS-2 / NUB-CONNECT exposition and the canonical "Default to NUB-RESOURCE; reach for NUB-CONNECT only when necessary" paragraph verbatim from CONTEXT.md
- packages/nub/README's domain table gains connect + class rows, entry-point count updated to 46, a new "Connect + Class NUBs (v0.29.0)" section with runnable code examples, and a second parallel migration note for subpath-only domains
- packages/shim/README documents window.napplet.connect with its {granted, origins} shape + {granted: false, origins: []} graceful-degradation default, documents window.napplet.class as number | undefined, and lists the class.assigned wire envelope in the Inbound block
- packages/sdk/README documents the connect + class namespace exports (CONNECT_DOMAIN / CLASS_DOMAIN, installConnectShim / installClassShim, connectGranted / connectOrigins / normalizeConnectOrigin / getClass, NappletConnect / ClassAssignedMessage / NappletClass / ClassNubMessage) in full tables + capability examples
- skills/build-napplet/SKILL.md gains Step 11 covering two-class posture, build-time connect origin declaration, runtime surface reads, cleartext/mixed-content warning, and the four-state graceful-degradation priority order; three new Common pitfalls bullets covering inline-script forbidden, class-undefined-at-top-level, and cleartext-silent-fail from HTTPS shells
- All historical content (v0.28.0 resource NUB sections, v0.27.0 IFC sections, Migration table trailing notes, existing Step 1-10 bullets, existing pitfalls) preserved byte-identical per DOC-07

## Task Commits

Each task was committed atomically:

1. **Task 1: Update root README.md + packages/nub/README.md** - `70ae02a` (docs)
2. **Task 2: Update packages/shim/README.md + packages/sdk/README.md** - `4bb8612` (docs)
3. **Task 3: Update skills/build-napplet/SKILL.md** - `76a9270` (docs)

## Files Created/Modified
- `README.md` - Packages table rows updated for connect/class NUB + strictCsp deprecation; architecture diagram gains connect + class runtime lines; new v0.29.0 section with NUB-CLASS-1/2 + NUB-CONNECT exposition
- `packages/nub/README.md` - H1 blockquote + "12 Domains" heading updated; connect + class rows in NUB domain table; entry-point count 38 → 46; new "Connect + Class NUBs (v0.29.0)" section; second migration note for subpath-only domains
- `packages/shim/README.md` - "How It Works" sub-objects list extended; Quick Start gains class + connect read examples; Outbound wire block gains NUB-CONNECT-has-no-wire comment; Inbound adds class.assigned; `window.napplet` Shape block adds connect + optional class; new per-surface subsections for `window.napplet.connect` + `window.napplet.class`; TypeScript Support comment updated
- `packages/sdk/README.md` - Quick Start import extended with NappletConnect type; Quick Start usage adds getClass + connectGranted + connectOrigins flow; new `connect` + `class` subsections with export tables; NUB Domain Constants extended to CONNECT_DOMAIN + CLASS_DOMAIN; capability examples for nub:connect / nub:class / connect:scheme:*; NUB Message Types table adds ConnectNubMessage (with footnote explaining no-wire) + ClassNubMessage
- `skills/build-napplet/SKILL.md` - Frontmatter description extended for v0.29.0 NUB-CLASS + NUB-CONNECT; new Step 11 (~90 lines) covering posture, origin declaration, runtime surface, cleartext warning, graceful degradation; three new Common pitfalls bullets

## Decisions Made
- None - plan executed exactly as written. All literal-string greps pass; DOC-07 baseline diff shows deletions only inside intentionally-updated locations (Packages table rows for the two updated entries; H1 blockquote / H2 heading / entry-point header in nub README; frontmatter description in SKILL).

## Deviations from Plan

None - plan executed exactly as written.

One minor self-correction during Task 3: my initial Step 11 draft described the two class members only by their integer + posture name ("class: 1 = strict baseline") without the literal "NUB-CLASS-1" token, which the automated grep requires. I added explicit NUB-CLASS-1 + NUB-CLASS-2 literals into the bullet on first verification-fail, before committing. Not counted as a deviation since it was a truth-criterion alignment, not a scope change.

## Issues Encountered

None. The three auto-greps per task all passed on first post-edit check (except the NUB-CLASS-1 literal noted above, fixed immediately). Type-check exits 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 141-02 is wave-1 sibling to this plan and touches a disjoint file set (packages/vite-plugin/README.md only). No ordering dependency between 141-01 and 141-02 — they can ship in either order or in parallel.
- After 141-02 completes, all 7 DOC REQ-IDs (DOC-01..07) are closed and v0.29.0 is ready for verification Phase 142.

## Self-Check: PASSED

All 5 modified files exist; all 3 task commits present (70ae02a, 4bb8612, 76a9270).

---
*Phase: 141-documentation-sweep*
*Completed: 2026-04-21*
