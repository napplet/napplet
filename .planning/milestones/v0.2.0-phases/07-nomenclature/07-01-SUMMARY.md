---
phase: 07-nomenclature
plan: "01"
subsystem: naming
tags: [rename, shell-bridge, pseudo-relay, nomenclature]

requires:
  - phase: 06
    provides: v0.1.0 complete codebase with pseudo-relay naming
provides:
  - createShellBridge as sole factory function name
  - ShellBridge as sole type name
  - shell-bridge.ts as sole source file name
  - SHELL_BRIDGE_URI as sole constant name
  - All docs, tests, and demo updated to new names
affects: [phase-08, phase-09, phase-10, phase-11]

tech-stack:
  added: []
  patterns: [ShellBridge naming convention for shell message router]

key-files:
  created: []
  modified:
    - packages/shell/src/shell-bridge.ts
    - packages/shell/src/types.ts
    - packages/shell/src/index.ts
    - packages/shell/src/napp-key-registry.ts
    - packages/shell/src/origin-registry.ts
    - packages/shim/src/types.ts
    - packages/shim/src/index.ts
    - packages/shim/src/relay-shim.ts
    - packages/shim/src/nipdb-shim.ts
    - apps/demo/src/shell-host.ts
    - tests/e2e/harness/harness.ts
    - tests/helpers/message-tap.ts
    - tests/e2e/inter-pane.spec.ts
    - tests/e2e/replay.spec.ts
    - SPEC.md
    - packages/shell/README.md
    - CLAUDE.md

key-decisions:
  - "Hard cut with no deprecated aliases — pre-v1 with no external consumers"

patterns-established:
  - "ShellBridge naming: the shell's message router is ShellBridge, not pseudo-relay"

requirements-completed: [REN-01, REN-02, REN-03, REN-04, REN-05, REN-06, REN-07, REN-08]

duration: 6min
completed: 2026-03-30
---

# Phase 7 Plan 01: Rename pseudo-relay to ShellBridge Summary

**Renamed all PseudoRelay/createPseudoRelay/PSEUDO_RELAY_URI references to ShellBridge/createShellBridge/SHELL_BRIDGE_URI across shell, shim, demo, tests, spec, and docs — hard cut, zero aliases**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-30T22:13:57Z
- **Completed:** 2026-03-30T22:20:00Z
- **Tasks:** 11
- **Files modified:** 17

## Accomplishments
- Renamed pseudo-relay.ts to shell-bridge.ts with all symbols updated
- Updated PSEUDO_RELAY_URI constant to SHELL_BRIDGE_URI (value unchanged: 'napplet://shell')
- Updated barrel exports, shim package, demo app, test harness, and all test comments
- Updated SPEC.md, shell README.md, and CLAUDE.md with canonical names
- Build (pnpm build) and type-check (pnpm type-check) both pass clean

## Task Commits

1. **Task 1: Rename pseudo-relay.ts to shell-bridge.ts and update all symbols** - `93c0ad5`
2. **Task 2: Update shell package types.ts constant name** - `42d833f`
3. **Task 3: Update shell package barrel export (index.ts)** - `c2dad6b`
4. **Task 4: Update shell package comment-only references** - `f9cfcc3`
5. **Task 5: Update shim package types and imports** - `487d134`
6. **Task 6: Update demo app imports and types** - `9516d0b`
7. **Task 7: Update test harness and test comments** - `cec91a6`
8. **Task 8: Update SPEC.md** - `213bb0a`
9. **Task 9: Update shell package README.md** - `1791c99`
10. **Task 10: Update project CLAUDE.md** - `0a1f4f3`
11. **Task 11: Build and verify** - (verification only, no code changes)

## Files Created/Modified
- `packages/shell/src/shell-bridge.ts` - Renamed from pseudo-relay.ts, all symbols updated
- `packages/shell/src/types.ts` - PSEUDO_RELAY_URI -> SHELL_BRIDGE_URI
- `packages/shell/src/index.ts` - Barrel exports updated
- `packages/shell/src/napp-key-registry.ts` - Comment updated
- `packages/shell/src/origin-registry.ts` - Comment updated
- `packages/shim/src/types.ts` - Constant and comment updated
- `packages/shim/src/index.ts` - Import and comment updated
- `packages/shim/src/relay-shim.ts` - Comment updated
- `packages/shim/src/nipdb-shim.ts` - Comment updated
- `apps/demo/src/shell-host.ts` - Imports and types updated
- `tests/e2e/harness/harness.ts` - Imports and types updated
- `tests/helpers/message-tap.ts` - Comments updated
- `tests/e2e/inter-pane.spec.ts` - Comment updated
- `tests/e2e/replay.spec.ts` - Comment updated
- `SPEC.md` - Terminology and references updated
- `packages/shell/README.md` - All API names and examples updated
- `CLAUDE.md` - All references updated

## Decisions Made
None - followed plan as specified

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated SPEC.md terminology table entry**
- **Found during:** Task 8 (SPEC.md update)
- **Issue:** The plan's line references didn't cover the terminology table row "Pseudo-relay" at line 32
- **Fix:** Also updated "| Pseudo-relay | ..." to "| ShellBridge | ..." in the terminology table
- **Verification:** `grep -c "pseudo-relay" SPEC.md` returns 0
- **Committed in:** 213bb0a (Task 8 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for acceptance criteria (zero pseudo-relay references in SPEC.md). No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All code uses ShellBridge naming throughout
- Ready for Phase 8 (ACL Pure Module) which will build on ShellBridge naming

---
*Phase: 07-nomenclature*
*Completed: 2026-03-30*
