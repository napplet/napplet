---
phase: 59-channel-protocol-design
plan: 02
subsystem: spec
tags: [nub, governance, templates, specification, extension-framework]

requires:
  - phase: 59-channel-protocol-design
    provides: NIP-5D v2 core-only spec with NUB Extension Framework section

provides:
  - NUB governance document with dual-track system (NUB-WORD + NUB-NN)
  - NUB-WORD interface proposal template
  - NUB-NN message protocol proposal template
  - Initial NUB-WORD registry (6 interfaces)

affects: [60-channel-protocol-implementation, 61-spec-packaging]

tech-stack:
  added: []
  patterns: [NUB dual-track governance (NUB-WORD canonical interfaces + NUB-NN competing protocols)]

key-files:
  created: [specs/nubs/README.md, specs/nubs/TEMPLATE-WORD.md, specs/nubs/TEMPLATE-NN.md]
  modified: []

key-decisions:
  - "63-line README targets concise governance doc (not tutorial) with setext heading for title"
  - "Interface table lists all 6 NUB-WORD specs at Draft status as starting registry"
  - "Templates use setext headings matching NIP convention and curly-brace placeholders for author guidance"

patterns-established:
  - "NUB-WORD template: setext title, namespace, discovery, API surface, shell behavior, event kinds, security, implementations"
  - "NUB-NN template: setext title, domain, requires, discovery, event semantics, negotiation, implementations"

requirements-completed: [SIMP-04]

duration: 2min
completed: 2026-04-05
---

# Phase 59 Plan 02: NUB Framework Documents Summary

**NUB governance README with dual-track system (NUB-WORD interfaces + NUB-NN protocols) and proposal templates for both tracks**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T14:20:10Z
- **Completed:** 2026-04-05T14:21:40Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- NUB governance document at specs/nubs/README.md with dual-track explanation, boundary rule, and NIP-style informal governance
- Interface registry table listing all 6 initial NUB-WORD specs (RELAY, STORAGE, SIGNER, NOSTRDB, IPC, PIPES)
- TEMPLATE-WORD.md for interface proposals with namespace, API surface, shell behavior, event kinds, security sections
- TEMPLATE-NN.md for message protocol proposals with event semantics, negotiation, and interface dependency sections

## Task Commits

Each task was committed atomically:

1. **Task 1: Create NUB governance README** - `b758a35` (feat)
2. **Task 2: Create NUB proposal templates** - `84e0372` (feat)

## Files Created/Modified
- `specs/nubs/README.md` - NUB governance document (63 lines) with dual-track overview, interface table, boundary rule, governance process, template references
- `specs/nubs/TEMPLATE-WORD.md` - Interface proposal template (45 lines) with namespace, API surface, shell behavior, event kinds sections
- `specs/nubs/TEMPLATE-NN.md` - Message protocol proposal template (41 lines) with event semantics, negotiation, interface dependency sections

## Decisions Made
- README kept to 63 lines as a governance doc, not a tutorial -- matches the "~80 lines total" guidance
- Used setext headings for top-level title in README (matching NIP-5D convention) but ATX headings for sections
- Templates use curly-brace placeholders to guide proposal authors on what to fill in
- Both templates include `shell.supports()` discovery pattern consistent with NIP-5D v2

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- NUB framework documents are ready for Phase 60 to draft actual NUB-WORD interface specs
- Templates provide the structure for NUB-RELAY, NUB-STORAGE, NUB-SIGNER, NUB-NOSTRDB, NUB-IPC, NUB-PIPES
- Governance process documented for community contribution

## Self-Check: PASSED

- specs/nubs/README.md: FOUND (63 lines)
- specs/nubs/TEMPLATE-WORD.md: FOUND (45 lines)
- specs/nubs/TEMPLATE-NN.md: FOUND (41 lines)
- 59-02-SUMMARY.md: FOUND
- Commit b758a35: FOUND
- Commit 84e0372: FOUND

---
*Phase: 59-channel-protocol-design*
*Completed: 2026-04-05*
