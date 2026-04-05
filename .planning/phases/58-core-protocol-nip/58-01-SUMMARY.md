---
phase: 58-core-protocol-nip
plan: 01
subsystem: spec
tags: [nip, nostr, protocol, specification, nip-5d, postmessage, auth, iframe]

# Dependency graph
requires:
  - phase: 57-nip-resolution-pre-engagement
    provides: NIP number (5D), stakeholder scope outline, PR status
provides:
  - Complete NIP-5D specification draft (499 lines)
  - AUTH handshake definition (REGISTER/IDENTITY/AUTH)
  - Capability discovery protocol (kind 29010)
  - 6 standard capability definitions (relay, ipc, storage, signer, nostrdb, services)
  - Security considerations section
  - Event kinds table
affects: [59-channel-protocol-design, 61-spec-packaging]

# Tech tracking
tech-stack:
  added: []
  patterns: [NIP setext format, MUST/MAY layering, ASCII sequence diagrams]

key-files:
  created: [specs/NIP-5D.md]
  modified: []

key-decisions:
  - "AUTH handshake and service discovery are MUST; all other capabilities are MAY"
  - "Relay proxy defined in dedicated section AND capability summary for dual reference"
  - "Security section uses defensive framing -- acknowledges * origin as correct, not weakness"
  - "Bus kinds 29000-29999 defined as postMessage-only, never on external relays"
  - "Napplet API Surface table provides normative window.* namespace reference"

patterns-established:
  - "NIP format: setext headings, draft optional badges, no YAML frontmatter"
  - "MUST/MAY split: auth + discovery MUST, everything else MAY"
  - "Capability format: ~10-15 lines per cap with discovery name, namespace, methods, behavioral reqs"

requirements-completed: [SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06, CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-06]

# Metrics
duration: 7min
completed: 2026-04-05
---

# Phase 58 Plan 01: Write NIP-5D Core Protocol Specification Summary

**499-line NIP-5D draft covering AUTH handshake (REGISTER/IDENTITY/AUTH), relay proxy, kind 29010 capability discovery, 6 standard capabilities with MUST/MAY layering, and defensive security considerations**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-05T13:07:09Z
- **Completed:** 2026-04-05T13:14:03Z
- **Tasks:** 10
- **Files modified:** 1

## Accomplishments
- Complete NIP-5D specification at 499 lines (under 500 target)
- 38 MUST requirements and 18 MAY designations for clear conformance layering
- ASCII sequence diagram for 5-step AUTH handshake as the spec's visual centerpiece
- All 6 standard capabilities defined with discovery names, namespaces, and behavioral reqs
- Security section addresses postMessage * origin defensively with 7 mitigations and non-guarantees
- Zero banned implementation terms (no RuntimeAdapter, SessionRegistry, ring buffer, etc.)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create specs dir and NIP-5D header** - `58e42f8` (feat)
2. **Task 2: Write Transport section** - `4ba981d` (feat)
3. **Task 3: Write Wire Format with verb tables** - `a1ed42d` (feat)
4. **Task 4: Write Authentication with sequence diagram** - `86157ee` (feat)
5. **Task 5: Write Relay Proxy section** - `ff7afd4` (feat)
6. **Task 6: Write Capability Discovery section** - `9196f84` (feat)
7. **Task 7: Write Standard Capabilities (all 6)** - `31126ec` (feat)
8. **Task 8: Write Security Considerations** - `99d1e3b` (feat)
9. **Task 9: Event Kinds table and final sections + trim** - `8280e48` (feat)
10. **Task 10: Final review pass** - no commit (review only, no issues found)

## Files Created/Modified
- `specs/NIP-5D.md` - Complete NIP-5D specification (499 lines)

## Decisions Made
- AUTH handshake (MUST) + service discovery (MUST) form the core conformance floor; all other capabilities are MAY
- Relay Proxy gets both a dedicated protocol section and a Standard Capabilities summary entry for dual-purpose reference
- Security section uses defensive framing -- acknowledges `*` origin as the correct approach for sandboxed iframes rather than apologizing for it
- Bus kinds 29000-29999 defined normatively as postMessage-only, never on external relay WebSockets
- Napplet API Surface table provides a single normative reference for all window.* namespaces
- Trimmed Transport, AUTH post-behavior, and Relay Proxy intro to bring 521-line draft down to 499 lines

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Line count exceeded 500 after Task 9**
- **Found during:** Task 9 (Event Kinds table and final sections)
- **Issue:** After adding Event Kinds, API Surface, and Implementations sections, the file was 521 lines (21 over limit)
- **Fix:** Tightened Transport (merged Message Format into Sender Identification), AUTH (compressed dTag/claimedHash descriptions, merged Post-AUTH/Pre-AUTH/Manifest sections), and Relay Proxy (compressed intro paragraph)
- **Files modified:** specs/NIP-5D.md
- **Verification:** `wc -l` returns 499
- **Committed in:** 8280e48 (part of Task 9 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor trimming to meet the hard <500 line constraint. No content was removed, only tightened. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- specs/NIP-5D.md is ready for Phase 59 to add the channel/pipe capability section
- Phase 61 will finalize NIP format and package for submission
- The spec has a clear slot for additional MAY capabilities (channels will be added as another Standard Capability)

## Self-Check: PASSED

- [x] specs/NIP-5D.md exists (499 lines, under 500)
- [x] Commit 58e42f8: create NIP-5D file with header and terminology
- [x] Commit 4ba981d: write Transport section
- [x] Commit a1ed42d: write Wire Format section with verb tables
- [x] Commit 86157ee: write Authentication section with sequence diagram
- [x] Commit ff7afd4: write Relay Proxy section
- [x] Commit 9196f84: write Capability Discovery section
- [x] Commit 31126ec: write Standard Capabilities section (all 6)
- [x] Commit 99d1e3b: write Security Considerations section
- [x] Commit 8280e48: write Event Kinds table and final sections, trim to <500 lines
- [x] 0 banned implementation terms
- [x] 38 MUST keywords, 18 MAY keywords
- [x] All 9 required sections present
- [x] NIP format: setext heading, draft optional badges

---
*Phase: 58-core-protocol-nip*
*Completed: 2026-04-05*
