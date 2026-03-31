---
phase: 13
plan: 4
status: complete
started: 2026-03-31
completed: 2026-03-31
---

# Summary: Plan 13-04 — Implement createRuntime Factory with Full Message Dispatch

## What was built

- `state-handler.ts`: State request handler using RuntimeStatePersistence hooks. Includes pure-JS `byteLength()` function to avoid TextEncoder DOM dependency.
- `runtime.ts`: Core protocol engine factory with:
  - All 5 NIP-01 verb handlers (EVENT, REQ, CLOSE, COUNT, AUTH)
  - AUTH handshake with challenge-response and napp update detection
  - Signer proxying with consent handling
  - Shell command routing (ACL, relay config, window management, DM)
  - Subscription lifecycle management
  - Pending auth queue for pre-AUTH messages

## Key decisions

- **Timer type declarations**: `setTimeout`/`clearTimeout` are available in all JS runtimes but not in ES2022 lib. Added local `declare` statements instead of adding DOM lib.
- **Signer null narrowing**: Used `const signer = maybeSigner` after null check to satisfy TypeScript's strict null analysis in nested closures.
- **Audio events as inter-pane**: Audio commands are forwarded as inter-pane events rather than handled by the runtime — audio management stays in the shell adapter.
- **byteLength pure function**: Replaced TextEncoder dependency with manual UTF-8 byte counting for state quota calculation.

## Key files

### Created
- `packages/runtime/src/state-handler.ts`
- `packages/runtime/src/runtime.ts`

## Self-Check: PASSED
- No postMessage, Window, MessageEvent, localStorage, or document references
- hooks.sendToNapplet used for all outbound messages
- hooks.crypto.randomUUID replaces crypto.randomUUID
- Package builds and type-checks cleanly
