---
phase: 31-signer-connection-ux
plan: "02"
subsystem: ui
tags: [nip46, signer, modal, qr-code, demo, typescript]

requires:
  - phase: 31-signer-connection-ux
    plan: "01"
    provides: SignerConnectionState model, connectNip46() stub, signer node topology surface
provides:
  - nip46-client.ts: minimal NIP-46 WebSocket requester client
  - parseBunkerUri() and buildNostrConnectUri() utilities
  - signer-modal.ts: connect modal with NIP-07/NIP-46 side-by-side and QR code
  - Real connectNip46() implementation in signer-connection.ts (replaces stub)
  - Connect modal HTML in index.html with modal CSS
  - open-signer-connect now opens modal (replaces direct connectNip07() call)
  - Unit tests: nip46-client.test.ts (17 tests), signer-connection.test.ts (10 tests)
affects:
  - 31-03-PLAN: tap wiring and activity feed use the real connection state

tech-stack:
  added:
    - "qrcode npm package: QR code canvas rendering for nostrconnect:// URI"
  patterns:
    - "Module-level ephemeral QR keypair: _qrSecretKey generated once per page load for nostrconnect:// QR display"
    - "Dynamic import of nip46-client.ts in connectNip46(): avoids static import at build-time when stub was in place"
    - "parseBunkerUri + buildNostrConnectUri: pure URI utilities, no side effects, easy to test"

key-files:
  created:
    - apps/demo/src/nip46-client.ts
    - apps/demo/src/signer-modal.ts
    - tests/unit/nip46-client.test.ts
    - tests/unit/signer-connection.test.ts
  modified:
    - apps/demo/src/signer-connection.ts
    - apps/demo/src/main.ts
    - apps/demo/index.html

key-decisions:
  - "Dynamic import of nip46-client.ts in connectNip46(): resolves the Plan 31-01 build-time issue; static import in signer-modal.ts is fine since both files exist now"
  - "signer-modal.ts re-exports parseBunkerUri/buildNostrConnectUri/createNip46Client for test access without extra test-only exports"
  - "QR ephemeral keypair is module-level (stable per page load) rather than per-open to avoid QR code flicker on repeated modal opens"

requirements-completed: [SIGN-03, SIGN-04]

duration: 25min
completed: 2026-04-01
---

# Phase 31 Plan 02: NIP-46 Client and Connect Modal Summary

**NIP-46 WebSocket requester client, connect modal with NIP-07/NIP-46 side-by-side panes, QR code generation for nostrconnect://, and real connectNip46() implementation.**

## Performance

- **Duration:** 25 min
- **Completed:** 2026-04-01
- **Tasks:** 6 (Tasks 1-6 from plan)
- **Files modified:** 5, created 4

## Accomplishments

- Created `nip46-client.ts` with `parseBunkerUri()`, `buildNostrConnectUri()`, and `createNip46Client()` — a full NIP-46 WebSocket requester that handles key generation, NIP-04 encryption, per-request correlation, and produces a `RuntimeSigner`-compatible adapter
- Replaced `connectNip46()` stub in `signer-connection.ts` with a real implementation using dynamic import of `nip46-client.ts`, completing the connect handshake and updating state with method/pubkey/relay on success
- Created `signer-modal.ts` with `initSignerModal()`, `openSignerModal()`, `closeSignerModal()`, NIP-07 connect handler, NIP-46 connect handler (with relay field precedence over URI relay per D-05/D-06), and QR code rendering via `qrcode` library
- Added connect modal HTML to `index.html` with two equal-weight columns (NIP-07 + NIP-46), aria roles, relay input, bunker URI input, QR container, status fields
- Updated `main.ts` to import `initSignerModal/openSignerModal` from `signer-modal.ts` and replace the `open-signer-connect` → direct `connectNip07()` call with `openSignerModal()`
- Added 17-test `nip46-client.test.ts` covering URI parsing, QR URI building, and client API shape; 10-test `signer-connection.test.ts` covering state model, ring buffer, NIP-07 flow, and inspector detail

## Task Commits

All tasks committed in a single atomic commit:

1. **Tasks 1-6: Full Plan 31-02 implementation** — `e71f9a6` (feat(31-02,31-03))

Note: Plan 31-03 tasks 1 (tap wiring) were included in this commit since they were straightforward and co-dependent with the final main.ts wiring.

## Files Created/Modified

- `apps/demo/src/nip46-client.ts` — New: parseBunkerUri(), buildNostrConnectUri(), createNip46Client()
- `apps/demo/src/signer-modal.ts` — New: initSignerModal(), openSignerModal(), closeSignerModal(), QR rendering
- `apps/demo/src/signer-connection.ts` — Modified: connectNip46() stub replaced with real implementation
- `apps/demo/src/main.ts` — Modified: initSignerModal() call; open-signer-connect → openSignerModal(); tap wiring for recordSignerRequest()
- `apps/demo/index.html` — Modified: modal CSS added; connect modal HTML element added
- `tests/unit/nip46-client.test.ts` — New: 17 tests for URI parsing, QR URI, client API
- `tests/unit/signer-connection.test.ts` — New: 10 tests for state model, ring buffer, NIP-07 flow

## Decisions Made

- **Dynamic import in connectNip46():** Using `await import('./nip46-client.js')` in `signer-connection.ts` maintains tree-shaking compatibility and avoids the Plan 31-01 build-time issue. Static import in `signer-modal.ts` is harmless since both files now exist.
- **Relay field precedence:** The relay input value in the modal overrides the relay from the bunker URI per D-05/D-06 intent — the modal is the sole editing surface.
- **QR ephemeral keypair at module level:** Stable per page load; avoids QR flicker on repeated modal open/close. The keypair is only for display purposes, not for actual NIP-46 handshakes.

## Deviations from Plan

None. All 6 tasks implemented as specified.

## Next Phase Readiness

- Plan 31-03 tap wiring was included in this commit (Task 1 done)
- Tasks 2-6 of Plan 31-03 are already implemented in Plan 31-01 (activity feed, disconnect, inspector detail)
- SUMMARY.md for Plan 31-03 covers verification

---
*Phase: 31-signer-connection-ux*
*Completed: 2026-04-01*
