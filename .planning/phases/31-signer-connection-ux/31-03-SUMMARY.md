---
phase: 31-signer-connection-ux
plan: "03"
subsystem: ui
tags: [signer, activity-feed, tap-wiring, inspector, verification, demo]

requires:
  - phase: 31-signer-connection-ux
    plan: "01"
    provides: recordSignerRequest(), signer activity feed rendering, disconnect action
  - phase: 31-signer-connection-ux
    plan: "02"
    provides: modal, NIP-46 client, real connectNip46(), tap integration
provides:
  - Tap wiring for recordSignerRequest() on kind 29001 signer-request events
  - Heuristic failure marking for signer responses (OK false within 5s)
  - Extended topology render tests covering all signer node states
  - All SIGN-01 through SIGN-05 verifiable behaviors confirmed
affects: []

tech-stack:
  added: []
  patterns:
    - "Tap heuristic for failure marking: OK false within 5s of most recent request marks it failed; sufficient for Phase 31 without per-event correlation"

key-files:
  modified:
    - apps/demo/src/main.ts
    - tests/unit/demo-topology-render.test.ts

key-decisions:
  - "Tap wiring co-committed with Plan 31-02: the tap handler was straightforward and tightly coupled to main.ts modal wiring"
  - "Inspector integration (Task 3): getSignerInspectorDetail() already provided in Plan 31-01; Phase 29 inspector renders it via existing node-inspector.ts"
  - "Activity feed rendering (Task 2): already implemented in Plan 31-01 updateSignerNodeDisplay(); no additional work needed"
  - "Disconnect action (Task 4): already implemented in Plan 31-01 click delegation; no additional work needed"

requirements-completed: [SIGN-05]

duration: 10min
completed: 2026-04-01
---

# Phase 31 Plan 03: Signer Activity Feed, Inspector Integration, and Verification Summary

**Tap wiring for signer request recording, extended topology render tests, and end-to-end verification of all SIGN requirements.**

## Performance

- **Duration:** 10 min
- **Completed:** 2026-04-01
- **Tasks:** 6 (Tasks 1-6 from plan; most already complete from Plans 31-01/31-02)
- **Files modified:** 2

## Accomplishments

### Task 1: Tap Wiring (completed in Plan 31-02 commit)
- Added tap handler in `main.ts` detecting kind 29001 `napplet->shell` events with no topic tag
- Extracts method and kind from event tags; calls `recordSignerRequest()`
- Heuristic failure detection: if `OK false` arrives within 5s of last request, marks it failed

### Tasks 2-4: Already Complete from Plan 31-01
- **Activity feed** (Task 2): `updateSignerNodeDisplay()` renders the last 5 requests with method/kind/success indicators
- **Inspector detail** (Task 3): `getSignerInspectorDetail()` exported from `signer-connection.ts`; Phase 29 inspector uses it via existing `node-inspector.ts` infrastructure
- **Disconnect action** (Task 4): Click delegation for `disconnect-signer` in `main.ts` calls `disconnectSigner()` and logs to debugger

### Task 5-6: Verification
- Extended `demo-topology-render.test.ts` with 6 new tests covering all signer node states: disconnected, disconnected-with-error, NIP-07 connected, NIP-46 connected with relay, and modal HTML presence
- All 101 unit tests pass
- `pnpm build` and `pnpm type-check` green across all 14 packages/tasks

## Verification Against SIGN Requirements

**SIGN-01: Visible signer node and connect/login flow**
- Signer topology node renders on boot with "not connected" state and "Connect Signer" button
- Verified: topology render test confirms `signer-status-disconnected` and `data-action="open-signer-connect"`

**SIGN-02: NIP-07 connect when browser signer available**
- `connectNip07()` in `signer-connection.ts` detects `window.nostr`, retrieves pubkey, stores adapter
- Verified: signer-connection unit test mocks `window.nostr` and confirms state transitions

**SIGN-03: NIP-46 bunker URI or QR connect**
- `parseBunkerUri()` handles `bunker://` and `nostrconnect://` URIs
- `buildNostrConnectUri()` generates `nostrconnect://` for QR display
- `createNip46Client()` opens WebSocket, performs NIP-46 handshake, returns RuntimeSigner adapter
- Verified: 17-test nip46-client.test.ts; topology render test confirms QR container in modal HTML

**SIGN-04: Editable NIP-46 relay**
- Relay field only present inside the connect modal (`#nip46-relay-input`)
- Relay field takes precedence over URI relay in `handleNip46Connect()` in signer-modal.ts
- Not exposed on topology node surface or inspector panel
- Verified: modal HTML test confirms relay input presence; topology render confirms no relay edit in node

**SIGN-05: Signer node shows connection state, pubkey, recent activity**
- Connected state shows method badge, truncated pubkey, optional relay, last 5 request rows
- Signer node tests confirm `nip-07`/`nip-46` badge, pubkey, disconnect button
- Tap wiring in main.ts updates `recentRequests` on kind 29001 events
- Verified: topology render tests; unit tests for recordSignerRequest() ring buffer

## Task Commits

All tasks completed and committed in Plan 31-02's single commit plus Plan 31-03 test extension:

- `e71f9a6` — feat(31-02,31-03): NIP-46 client, connect modal, tap wiring, and signer unit tests

## Files Modified

- `apps/demo/src/main.ts` — Tap wiring for recordSignerRequest() (committed with Plan 31-02)
- `tests/unit/demo-topology-render.test.ts` — Extended with 6 signer node state tests

## Decisions Made

- **Early completion:** Tasks 2, 3, 4 were fully implemented in Plan 31-01; no duplication needed
- **Tap heuristic:** Simple 5s window for failure detection is sufficient for Phase 31; precise correlation deferred to future if needed

## Issues Encountered

None. All tasks resolved cleanly.

## Regression Check

- `pnpm build`: 14/14 tasks successful
- `pnpm type-check`: 14/14 tasks successful, all cached
- Unit tests: 101/101 pass (8 test files)
- E2e tests: 133 pass, 1 pre-existing failure (auth-handshake clearMessages — unrelated to Phase 31)

---
*Phase: 31-signer-connection-ux*
*Completed: 2026-04-01*
