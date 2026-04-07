---
phase: 71-shim-simplification
plan: 01
subsystem: shim
tags: [shim, crypto-removal, nostr-tools, postMessage, event-template, protocol-simplification]

# Dependency graph
requires:
  - phase: 70-core-protocol-types
    provides: EventTemplate type and cleaned constants in @napplet/core
provides:
  - Zero-crypto @napplet/shim sending unsigned event templates
  - nostr-tools dependency fully removed from shim package
  - Simplified initialization (no REGISTER/IDENTITY/AUTH handshake)
affects: [runtime-adaptation, shell-message-source-identity, demo-update]

# Tech tracking
tech-stack:
  added: []
  patterns: [unsigned-event-template-over-postMessage, correlation-id-tracking-without-event-id]

key-files:
  created: []
  modified:
    - packages/shim/src/index.ts
    - packages/shim/src/types.ts
    - packages/shim/src/keyboard-shim.ts
    - packages/shim/src/nipdb-shim.ts
    - packages/shim/src/discovery-shim.ts
    - packages/shim/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Signer requests now tracked by correlation UUID directly (no pendingSignerRequestEvents map needed)"
  - "Signer/NIPDB REQ subscriptions sent immediately at init rather than gated behind AUTH"
  - "getNappletType() retained for future protocol use even though not used in current handshake"

patterns-established:
  - "Unsigned event template pattern: { kind, created_at, tags, content } without id/pubkey/sig"
  - "Immediate REQ subscription at shim init (no handshake gate)"

requirements-completed: [SHIM-01, SHIM-02, SHIM-03, SHIM-04]

# Metrics
duration: 4min
completed: 2026-04-07
---

# Phase 71 Plan 01: Shim Simplification Summary

**Strip all signing code, keypair handling, AUTH flow, and nostr-tools dependency from @napplet/shim -- zero-crypto shim sends unsigned event templates via postMessage**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-07T08:53:49Z
- **Completed:** 2026-04-07T08:58:07Z
- **Tasks:** 2
- **Files modified:** 8 (6 source + package.json + lockfile)

## Accomplishments
- Deleted napplet-keypair.ts and all ephemeral keypair generation code
- Removed all nostr-tools imports (finalizeEvent, generateSecretKey, getPublicKey, hexToBytes) from every shim source file
- Removed AUTH handler, IDENTITY handler, REGISTER send, handleAuthChallenge, getAggregateHash from index.ts
- Rewrote sendEvent() and sendSignerRequest() to send unsigned event templates
- Rewrote keyboard-shim.ts and nipdb-shim.ts to send unsigned event templates
- Removed nostr-tools from both peerDependencies and devDependencies
- All relay API signatures (subscribe, publish, query) preserved unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove crypto from leaf modules** - `14b4d9e` (feat)
2. **Task 2: Rewrite index.ts hub, remove nostr-tools, verify build** - `b0def7d` (feat)
3. **Auto-fix: Remove stale AUTH JSDoc** - `e84791e` (fix)

## Files Created/Modified
- `packages/shim/src/napplet-keypair.ts` - Deleted (contained createEphemeralKeypair, NappletKeypair)
- `packages/shim/src/types.ts` - Stripped deprecated AUTH_KIND, VERB_REGISTER, VERB_IDENTITY constants
- `packages/shim/src/keyboard-shim.ts` - Removed signing, sends unsigned event templates directly
- `packages/shim/src/nipdb-shim.ts` - Removed keypair parameter and signing branch, always unsigned
- `packages/shim/src/index.ts` - Removed all crypto imports, keypair state, AUTH/IDENTITY/REGISTER handlers; unsigned sendEvent/sendSignerRequest
- `packages/shim/src/discovery-shim.ts` - Removed stale AUTH references from JSDoc
- `packages/shim/package.json` - Removed nostr-tools from peerDependencies and devDependencies
- `pnpm-lock.yaml` - Updated after dependency removal

## Decisions Made
- Signer requests tracked by correlation UUID directly instead of mapping event.id to correlation id (simpler since unsigned events have no stable id)
- Signer/NIPDB REQ subscriptions sent immediately at init rather than waiting for AUTH completion
- Retained getNappletType() helper even though it's no longer used in a handshake -- useful metadata for future protocol versions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stale AUTH references from discovery-shim.ts JSDoc**
- **Found during:** Post-verification
- **Issue:** discovery-shim.ts JSDoc still referenced "pre-AUTH message queue" which no longer exists
- **Fix:** Removed the stale paragraph from the discoverServices() JSDoc
- **Files modified:** packages/shim/src/discovery-shim.ts
- **Verification:** grep -rE "AUTH" packages/shim/src/ returns no matches
- **Committed in:** e84791e

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor comment cleanup to ensure no stale AUTH references remain. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- @napplet/shim is fully crypto-free and builds clean
- Shell/runtime side needs updating to handle unsigned event templates (identify sender via message.source instead of event pubkey)
- Demo napplets may need updating if they depend on AUTH completion before sending messages

## Self-Check: PASSED

All created/modified files verified present. All 3 commit hashes confirmed in git log. Deleted file confirmed absent.

---
*Phase: 71-shim-simplification*
*Completed: 2026-04-07*
