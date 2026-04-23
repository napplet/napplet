---
phase: 31-signer-connection-ux
plan: "01"
subsystem: ui
tags: [nip07, signer, topology, demo, typescript]

requires:
  - phase: 28-architecture-topology-view
    provides: signer service node surface in topology
  - phase: 27-demo-audit-correctness
    provides: signer mode labeling and protocol path audit
provides:
  - SignerConnectionState model with NIP-07 connect flow
  - signer-connection.ts module owning live signer state and getSigner() ref
  - Signer service node renders connected/connecting/disconnected states
  - main.ts subscribes to state changes and updates signer node display surgically
  - getDemoHostPubkey() separated from signer identity (static ephemeral shell keypair)
affects:
  - 31-02-PLAN: connectNip46() stub ready for NIP-46 client implementation
  - 31-03-PLAN: recordSignerRequest() available for tap wiring

tech-stack:
  added: []
  patterns:
    - "Module-level mutable signer ref: getSigner() reads _activeSigner, can swap at runtime without restarting the shell"
    - "onStateChange() subscriber pattern for reactive signer node updates"
    - "Surgical DOM update: updateSignerNodeDisplay() replaces only signer node children, not full topology re-render"

key-files:
  created:
    - apps/demo/src/signer-connection.ts
  modified:
    - apps/demo/src/shell-host.ts
    - apps/demo/src/topology.ts
    - apps/demo/src/main.ts
    - apps/demo/index.html

key-decisions:
  - "Static ephemeral host keypair in shell-host.ts for shell node display, separate from connected signer identity"
  - "connectNip46() stub in Plan 31-01 with placeholder error message; real implementation deferred to Plan 31-02"
  - "Dynamic import of nip46-client.ts avoided in Plan 31-01 to keep build clean; connectNip46 in signer-connection.ts returns an error state for now"

requirements-completed: [SIGN-01, SIGN-02, SIGN-05]

duration: 18min
completed: 2026-04-01
---

# Phase 31 Plan 01: Signer Connection State Model and NIP-07 Connect Flow Summary

**SignerConnectionState model with NIP-07 browser extension connect flow, signer node topology UX showing connected/disconnected state, and shell-host decoupled from mock signer as primary path**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-01T11:00:00Z
- **Completed:** 2026-04-01T11:18:00Z
- **Tasks:** 7 (Tasks 1-7 from plan)
- **Files modified:** 5

## Accomplishments

- Created `signer-connection.ts` with full `SignerConnectionState` model, NIP-07 adapter, `onStateChange()` subscribers, and `recordSignerRequest()` ring buffer (max 20 records)
- Removed mock signer (`createSignerHooks`) as the primary shell signer path — demo now boots with `getSigner()` returning `null`; signer service responds with `error: no signer configured` until connected
- Updated signer service node in topology to render three visual states: "not connected" (with Connect Signer button), "connecting...", and connected (method badge + truncated pubkey + recent activity feed + disconnect button)
- Wired `main.ts` to subscribe to state changes and surgically update the signer node without re-rendering the full topology

## Task Commits

All tasks committed in a single atomic commit (all interdependent, clean build verified):

1. **Tasks 1-7: Full Plan 31-01 implementation** — `8c8fabc` (feat(31-01))

## Files Created/Modified

- `apps/demo/src/signer-connection.ts` — New module: SignerConnectionState model, getSigner(), connectNip07(), disconnectSigner(), onStateChange(), recordSignerRequest(), connectNip46() stub, getSignerInspectorDetail()
- `apps/demo/src/shell-host.ts` — Removed createSignerHooks import; added static _hostPubkey, getDemoHostPubkey(), getDemoSignerState(); createDemoHooks() now uses getSigner from signer-connection.ts; getDemoTopologyInputs() passes signerState
- `apps/demo/src/topology.ts` — Added SignerConnectionStateView interface; DemoTopologyInput/DemoTopology carry optional signerState; renderSignerNodeContent() helper; service card rendering uses signer-specific HTML for 'signer' service
- `apps/demo/src/main.ts` — Added signer-connection.ts imports; updateSignerNodeDisplay() function; onStateChange() subscription; click delegation for connect/disconnect actions; debugger logging for signer events
- `apps/demo/index.html` — Added CSS for signer states: .signer-status-*, .signer-method-badge, .signer-pubkey, .signer-relay, .signer-connect-btn, .signer-disconnect-btn, .signer-recent-requests and activity feed rows

## Decisions Made

- **Static host keypair:** Shell node pubkey display uses an ephemeral keypair generated in `shell-host.ts` at module load, independent of any connected signer. This keeps the shell identity stable and separate from the signing identity.
- **connectNip46() stub:** Rather than using a dynamic import that Rollup would fail to resolve at build time, `connectNip46()` in Plan 31-01 returns an informative error state. Plan 31-02 extends the function with the real NIP-46 client.
- **Surgical DOM updates:** `updateSignerNodeDisplay()` replaces only the signer node's dynamic children before `.node-summary`, preserving the summary div that other UI code manages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dynamic import of nip46-client.ts fails at build time**
- **Found during:** Task 1/2 (signer-connection.ts creation)
- **Issue:** Vite/Rollup resolves dynamic `import('./nip46-client.js')` statically at build time and fails when the file doesn't exist yet
- **Fix:** Replaced dynamic import with a stub `connectNip46()` implementation that returns a "not yet available" error state. Plan 31-02 will extend signer-connection.ts with the real implementation after creating nip46-client.ts.
- **Files modified:** `apps/demo/src/signer-connection.ts`
- **Verification:** `pnpm --filter @napplet/demo build` passes cleanly
- **Committed in:** 8c8fabc

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Build compatibility fix. connectNip46() stub cleanly signals to users that NIP-46 is not yet available, matching the phase boundary intent.

## Issues Encountered

None beyond the blocking deviation noted above.

## Next Phase Readiness

- Plan 31-02 (NIP-46 Client and Connect Modal) can now import `signer-connection.ts` and extend `connectNip46()` with the real NIP-46 client implementation
- The signer service node shows "Not connected" on boot with a functional "Connect Signer" button — ready for modal wiring in Plan 31-02
- `recordSignerRequest()` is exported and ready for tap wiring in Plan 31-03

---
*Phase: 31-signer-connection-ux*
*Completed: 2026-04-01*
