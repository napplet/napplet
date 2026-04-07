---
phase: 79-documentation-update
plan: "01"
subsystem: docs
tags: [readme, napplet/core, napplet/shim, json-envelope, nub-architecture, v0.16.0]

requires: []
provides:
  - "@napplet/core README documenting NappletMessage, NubDomain, NUB_DOMAINS, ShellSupports, createDispatch, registerNub, dispatch, getRegisteredDomains as primary API"
  - "@napplet/shim README documenting JSON envelope wire format and window.napplet.shell.supports()"
affects: [vite-plugin, sdk, nub-relay, nub-signer, nub-storage, nub-ifc]

tech-stack:
  added: []
  patterns:
    - "README-first doc ordering: envelope types → dispatch → protocol types → constants → legacy(deprecated)"
    - "Explicit Wire Format section listing all outbound/inbound JSON envelope messages"

key-files:
  created: []
  modified:
    - packages/core/README.md
    - packages/shim/README.md

key-decisions:
  - "Kept BusKind and legacy constants in README with explicit deprecated callout block (they still exist in code)"
  - "Added full Wire Format message reference to shim README (outbound + inbound) as ground truth for protocol consumers"
  - "PROTOCOL_VERSION updated in README to 4.0.0 to match constants.ts (NIP-5D v4 era)"

patterns-established:
  - "Deprecated section: lead with callout block explaining migration path before listing constants"

requirements-completed:
  - DOC-01

duration: 3min
completed: 2026-04-07
---

# Phase 79 Plan 01: Documentation Update Summary

**@napplet/core and @napplet/shim READMEs rewritten for JSON envelope + NUB architecture with full wire format reference and deprecation notices**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T12:53:50Z
- **Completed:** 2026-04-07T12:57:06Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- @napplet/core README now leads with NappletMessage, NubDomain, NUB_DOMAINS, and dispatch infrastructure as primary API (not BusKind/TOPICS)
- @napplet/shim README now has an explicit Wire Format section listing all outbound/inbound JSON envelope messages; NIP-01 arrays explicitly called out as NOT used
- Both READMEs document `window.napplet.shell.supports()` and BusKind/legacy constants are marked deprecated with migration guidance
- `pnpm type-check` passes clean (13/13 tasks) confirming no accidental source edits

## Task Commits

1. **Task 1: Rewrite @napplet/core README** - `aadf261` (docs)
2. **Task 2: Rewrite @napplet/shim README** - `3d41635` (docs)

## Files Created/Modified

- `packages/core/README.md` - Rewritten: envelope types + NUB dispatch as primary API; legacy section for BusKind with deprecation callout
- `packages/shim/README.md` - Rewritten: JSON envelope wire format section; window.napplet.shell documented; ipc/relay updated to reference envelope messages

## Decisions Made

- Kept BusKind and legacy constants fully documented (they still exist in code) with an explicit deprecated callout box and migration path: "use NUB-specific type strings from @napplet/nub-relay, @napplet/nub-signer, etc."
- Added complete Wire Format section to shim README listing every outbound/inbound message type — this is ground truth for protocol consumers who need to know what actually goes over postMessage
- Updated PROTOCOL_VERSION in core README to `4.0.0` to match `packages/core/src/constants.ts` (NIP-5D v4 era)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- READMEs are accurate for v0.16.0 state; 79-02 can proceed
- Any @kehto/* documentation updates are out of scope for this plan

---
*Phase: 79-documentation-update*
*Completed: 2026-04-07*
