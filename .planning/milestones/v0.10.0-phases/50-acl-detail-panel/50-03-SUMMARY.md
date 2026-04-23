---
phase: 50-acl-detail-panel
plan: 03
subsystem: demo
tags: [inspector, rejection-history, acl-summary, node-details]

requires:
  - phase: 50-01
    provides: ACL ring buffer (acl-history.ts) with per-napplet denial queries
  - phase: 50-02
    provides: ACL policy modal (openPolicyModal)
provides:
  - Rejection history rendering in inspector for napplet nodes
  - ACL capabilities section showing all 10 capability states
  - "Open Policy Matrix" button on ACL node inspector
  - checkCapability option in NodeDetailOptions
affects: [50-04, 52]

tech-stack:
  added: []
  patterns: [expandable-raw-event-toggle, node-role-conditional-rendering]

key-files:
  created: []
  modified: [apps/demo/src/node-details.ts, apps/demo/src/node-inspector.ts, apps/demo/src/main.ts]

key-decisions:
  - "Added aclDenials field to NodeDetail interface (set to [] for non-napplet/acl roles)"
  - "checkCapability passed through NodeDetailOptions to avoid circular imports"
  - "Rejection history shown for both napplet and acl node roles"

patterns-established:
  - "NodeDetailOptions as dependency injection point for live ACL state queries"

requirements-completed: [TRANS-03, TRANS-04]

duration: 5min
completed: 2026-04-03
---

# Plan 50-03: Napplet Rejection History and ACL Summary in Inspector

**Inspector panel now shows per-capability status, denial history with expandable raw events, and a policy matrix button on the ACL node**

## Performance

- **Duration:** 5 min
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added aclDenials field and checkCapability option to NodeDetail/NodeDetailOptions
- Napplet inspector shows all 10 capabilities with granted/revoked status
- Rejection entries render with capability label, timestamp, message summary, and expandable raw JSON
- ACL node inspector shows "Open Policy Matrix" button that opens the modal

## Task Commits

1. **Tasks 1-3 (combined):** `35a3772` (feat)

## Files Created/Modified
- `apps/demo/src/node-details.ts` - aclDenials field, checkCapability, capability section
- `apps/demo/src/node-inspector.ts` - Rejection history rendering, policy button, click wiring
- `apps/demo/src/main.ts` - Pass checkCapability via relay.runtime.aclState.check

## Decisions Made
- Used checkCapability callback in NodeDetailOptions to avoid importing relay directly in node-details.ts

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## Next Phase Readiness
All ACL detail panel components integrated; ready for config wiring and verification (Plan 50-04)

---
*Phase: 50-acl-detail-panel*
*Completed: 2026-04-03*
