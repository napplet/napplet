---
phase: 61-spec-packaging
plan: 01
subsystem: docs
tags: [spec, nip, naming, cross-references]

# Dependency graph
requires:
  - phase: 59-channel-protocol-design
    provides: NIP-5D v2 content
provides:
  - RUNTIME-SPEC.md with internal-reference header (renamed from SPEC.md)
  - NIP-5D v2 with References section and verified Implementations
  - All cross-references updated (8 READMEs, 4 source files)
affects: [nip-submission, documentation]

# Tech tracking
tech-stack:
  added: []
  patterns: [internal-reference header on runtime spec, relative NIP links in References]

key-files:
  created:
    - specs/NIP-5D.md
  modified:
    - RUNTIME-SPEC.md
    - packages/acl/README.md
    - packages/core/README.md
    - packages/core/src/constants.ts
    - packages/runtime/README.md
    - packages/runtime/src/service-discovery.ts
    - packages/sdk/README.md
    - packages/services/README.md
    - packages/shell/README.md
    - packages/shim/README.md
    - packages/shim/src/discovery-shim.ts
    - packages/shim/src/napplet-keypair.ts
    - packages/vite-plugin/README.md

key-decisions:
  - "Historical SPEC.md references in PROJECT.md left as-is (history, not active cross-references)"

patterns-established:
  - "Internal reference header: blockquote noting document is NOT the NIP, linking to NIP-5D"
  - "Package READMEs link RUNTIME-SPEC.md as 'Napplet Runtime Reference'"

requirements-completed: [PKG-01, PKG-02, PKG-03]

# Metrics
duration: 4min
completed: 2026-04-05
---

# Phase 61 Plan 01: Spec Packaging Summary

**SPEC.md renamed to RUNTIME-SPEC.md with internal-reference header; NIP-5D v2 finalized with References section listing 5 cited NIPs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T20:34:28Z
- **Completed:** 2026-04-05T20:38:44Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Renamed SPEC.md to RUNTIME-SPEC.md via git mv, preserving history, with a blockquote header distinguishing it from the NIP standard
- Updated all 8 package READMEs and 4 source file comments to reference RUNTIME-SPEC.md
- Added References section to NIP-5D v2 listing NIP-01, NIP-07, NIP-42, NIP-45, NIP-5A with relative links per nips convention
- Verified Implementations section lists @napplet/shim, @napplet/shell, and hyprgate with correct links
- NIP-5D at 199 lines (under 210 target), all nips format conventions met
- Type-check passes (16/16 tasks)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename SPEC.md to RUNTIME-SPEC.md and update all references** - `7898495` (chore)
2. **Task 2: Finalize NIP-5D v2 format -- add References section** - `6f6976a` (feat)

## Files Created/Modified
- `RUNTIME-SPEC.md` - Renamed from SPEC.md, added internal-reference header linking to NIP-5D
- `specs/NIP-5D.md` - Added References section with 5 cited NIPs
- `packages/*/README.md` (8 files) - Updated protocol reference links from SPEC.md to RUNTIME-SPEC.md
- `packages/core/src/constants.ts` - Updated SPEC.md comment reference
- `packages/runtime/src/service-discovery.ts` - Updated 2 SPEC.md comment references
- `packages/shim/src/discovery-shim.ts` - Updated SPEC.md comment reference
- `packages/shim/src/napplet-keypair.ts` - Updated SPEC.md comment reference

## Decisions Made
- Historical references to SPEC.md in PROJECT.md (milestone descriptions, requirements list) left unchanged -- these are historical records, not active cross-references

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- NIP-5D is formatted and ready for submission workflow (PR to nostr-protocol/nips)
- RUNTIME-SPEC.md clearly marked as internal reference
- All package cross-references consistent

## Self-Check: PASSED

All artifacts verified:
- RUNTIME-SPEC.md exists, SPEC.md removed
- specs/NIP-5D.md exists with References and Implementations sections
- 61-01-SUMMARY.md created
- Task 1 commit 7898495 found
- Task 2 commit 6f6976a found

---
*Phase: 61-spec-packaging*
*Completed: 2026-04-05*
