---
phase: 79-documentation-update
plan: "02"
subsystem: documentation
tags: [readme, nub, json-envelope, sdk, architecture]

requires:
  - phase: 78-nub-packages
    provides: NUB packages (nub-relay, nub-signer, nub-storage, nub-ifc) with domain constants and message types

provides:
  - "packages/sdk/README.md updated for v0.16.0: NUB re-exports, domain constants, JSON envelope ipc, shell.supports()"
  - "README.md updated for v0.16.0: NUB packages table, JSON envelope wire format, updated dependency graph and architecture diagram"

affects: [consumers reading SDK docs, shell implementors referencing architecture]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - packages/sdk/README.md
    - README.md

key-decisions:
  - "No code changes needed — purely documentation updates to reflect Phase 74-78 architectural changes"

patterns-established: []

requirements-completed: [DOC-01]

duration: 3min
completed: 2026-04-07
---

# Phase 79 Plan 02: Documentation Update Summary

**Rewrote @napplet/sdk README and root README to reflect JSON envelope wire format and modular NUB architecture introduced in Phases 74-78.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-07T12:53:43Z
- **Completed:** 2026-04-07T12:56:05Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments

### Task 1: Rewrite @napplet/sdk README

Updated `packages/sdk/README.md` to reflect v0.16.0 state:

- Updated relay section to remove "NIP-01 subscription" language; now says "relay subscription through the shell's relay pool"
- Updated ipc section to describe JSON envelope transport (`{ type: 'ifc.emit', topic, payload }`); removed "kind 29003" references
- Added `shell` namespace section documenting `window.napplet.shell.supports()` with usage example
- Expanded Types section to include `NappletMessage`, `NubDomain`, `ShellSupports` from @napplet/core
- Added NUB Message Types table: `RelayNubMessage`, `SignerNubMessage`, `StorageNubMessage`, `IfcNubMessage`
- Added NUB Domain Constants section: `RELAY_DOMAIN`, `SIGNER_DOMAIN`, `STORAGE_DOMAIN`, `IFC_DOMAIN` with usage example

### Task 2: Rewrite Root README

Updated `README.md` to reflect v0.16.0 package structure and wire format:

- Updated opening paragraph: "JSON envelope format (`{ type, ...payload }`) defined by NIP-5D" — removed "NIP-01 wire format"
- Expanded packages table to include `@napplet/nub-relay`, `@napplet/nub-signer`, `@napplet/nub-storage`, `@napplet/nub-ifc`
- Updated `@napplet/core` description to mention `NappletMessage`, `NubDomain`, NUB dispatch infrastructure
- Updated `@napplet/shim` description to mention JSON envelope postMessage
- Replaced Package Dependency Graph to show NUB packages depending on core and shim/sdk depending on NUB packages
- Replaced architecture diagram to show JSON envelope message format (`relay.subscribe`, `relay.event`)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | eeb0f1a | docs(79-02): rewrite @napplet/sdk README for v0.16.0 NUB architecture |
| 2 | 3d4fe5e | docs(79-02): rewrite root README for v0.16.0 NUB architecture |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] `packages/sdk/README.md` modified and committed (eeb0f1a)
- [x] `README.md` modified and committed (3d4fe5e)
- [x] `grep "RelayNubMessage" packages/sdk/README.md` returns results
- [x] `grep "RELAY_DOMAIN" packages/sdk/README.md` returns results
- [x] `grep "JSON envelope" README.md` returns results
- [x] `grep "nub-relay" README.md` returns results
- [x] `grep "NIP-01 wire format" README.md` returns 0 results
