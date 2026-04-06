---
phase: 68-audit-clean
plan: 02
subsystem: docs
tags: [documentation, kehto, migration, specs, skills, nubs]

# Dependency graph
requires:
  - phase: 67-readme-update
    provides: Updated READMEs for 4-package SDK structure
provides:
  - RUNTIME-SPEC.md Section 17.1 listing only 4 current @napplet packages with @kehto migration note
  - 3 skills files referencing @kehto/shell and @kehto/services
  - 6 specs/nubs files referencing @kehto/shell and @kehto/runtime
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - RUNTIME-SPEC.md
    - skills/integrate-shell/SKILL.md
    - skills/add-service/SKILL.md
    - skills/build-napplet/SKILL.md
    - specs/nubs/NUB-STORAGE.md
    - specs/nubs/NUB-NOSTRDB.md
    - specs/nubs/NUB-PIPES.md
    - specs/nubs/NUB-IPC.md
    - specs/nubs/NUB-RELAY.md
    - specs/nubs/NUB-SIGNER.md

key-decisions:
  - "ShellHooks renamed to ShellAdapter in integrate-shell skill (follows v0.7.0 Phase 37 rename)"

patterns-established: []

requirements-completed: [DOC-01, DOC-02, DOC-03, DOC-04]

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 68 Plan 02: Docs Audit Summary

**Updated RUNTIME-SPEC.md, 3 skills, and 6 NUB specs to replace stale @napplet/shell|runtime|acl|services references with @kehto equivalents**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T21:22:46Z
- **Completed:** 2026-04-06T21:24:34Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- RUNTIME-SPEC.md Section 17.1 now lists only the 4 current @napplet packages (shim, sdk, core, vite-plugin) with a note that runtime, acl, services, and shell moved to @kehto
- All 6 specs/nubs files (STORAGE, NOSTRDB, PIPES, IPC, RELAY, SIGNER) updated with @kehto/shell or @kehto/runtime references and kehto GitHub URLs
- All 3 skills files (integrate-shell, add-service, build-napplet) updated with @kehto/shell and @kehto/services references; ShellHooks renamed to ShellAdapter

## Task Commits

Each task was committed atomically:

1. **Task 1: Update RUNTIME-SPEC.md and specs/nubs references** - `0381e24` (docs)
2. **Task 2: Update skills files to reference @kehto packages** - `b202e79` (docs)

## Files Created/Modified
- `RUNTIME-SPEC.md` - Section 17.1 updated with 4-package listing and @kehto migration note
- `skills/integrate-shell/SKILL.md` - @napplet/shell to @kehto/shell, ShellHooks to ShellAdapter, @napplet/services to @kehto/services
- `skills/add-service/SKILL.md` - @napplet/shell to @kehto/shell in imports and prerequisites
- `skills/build-napplet/SKILL.md` - Host shell reference updated to @kehto/shell
- `specs/nubs/NUB-STORAGE.md` - @napplet/shell to @kehto/shell, GitHub URL to kehto repo
- `specs/nubs/NUB-NOSTRDB.md` - @napplet/shell to @kehto/shell, GitHub URL to kehto repo
- `specs/nubs/NUB-PIPES.md` - @napplet/runtime to @kehto/runtime
- `specs/nubs/NUB-IPC.md` - @napplet/shell to @kehto/shell, GitHub URL to kehto repo
- `specs/nubs/NUB-RELAY.md` - @napplet/shell to @kehto/shell, GitHub URL to kehto repo
- `specs/nubs/NUB-SIGNER.md` - @napplet/shell to @kehto/shell, GitHub URL to kehto repo

## Decisions Made
- ShellHooks renamed to ShellAdapter in integrate-shell skill to match the v0.7.0 Phase 37 rename (deprecated alias removed in v0.9.0 Phase 47)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All documentation references to extracted packages are now accurate
- No further docs audit work needed for this milestone

## Self-Check: PASSED

All 10 modified files exist on disk. Both task commits (0381e24, b202e79) verified in git log.

---
*Phase: 68-audit-clean*
*Completed: 2026-04-06*
