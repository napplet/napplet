# Roadmap: Napplet Protocol SDK

## Overview

Take three extracted-but-untested packages (@napplet/shim, @napplet/shell, @napplet/vite-plugin) from building to proven: fix known wiring bugs, build a real-browser test harness, achieve full protocol conformance coverage, demonstrate the SDK in an interactive playground, refine the NIP-5A specification, and publish to npm. Each phase delivers a verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Wiring Fixes** - Fix known security bugs and naming issues so the codebase is a trustworthy foundation
- [ ] **Phase 2: Test Infrastructure** - Build the shared test harness, mocks, and tooling that all tests depend on
- [ ] **Phase 3: Core Protocol Tests** - Prove AUTH handshake, message routing, replay protection, and lifecycle correctness
- [ ] **Phase 4: Capability Tests** - Prove ACL enforcement, storage isolation, signer delegation, and inter-pane communication
- [ ] **Phase 5: Demo Playground** - Interactive demo that visually validates the protocol for SDK evaluators
- [ ] **Phase 6: Specification and Publish** - Refine NIP-5A spec and publish v0.1.0 packages to npm

## Phase Details

### Phase 1: Wiring Fixes
**Goal**: The extracted packages work end-to-end standalone with no known security bugs, correct namespacing, and trustworthy message handling
**Depends on**: Nothing (first phase)
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05
**Success Criteria** (what must be TRUE):
  1. Shell creates pseudo-relay, napplet loads shim, AUTH completes, and a round-trip message flows without error
  2. All hyprgate references in URIs, meta tags, variable names, and localStorage keys are renamed to napplet
  3. Shim rejects postMessages whose event.source is not window.parent
  4. Storage proxy correctly handles keys containing commas without data corruption
  5. AUTH rejection on any path (bad sig, wrong challenge, expired, wrong relay, wrong kind) clears the pending message queue
**Plans**: TBD

### Phase 2: Test Infrastructure
**Goal**: A working test harness exists that can boot the real shell with mock hooks, load test napplets into sandboxed iframes, and programmatically assert on postMessage traffic
**Depends on**: Phase 1
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):
  1. Running `pnpm test` executes both Vitest Node-mode unit tests and Playwright protocol tests with a single command
  2. A shell test harness boots @napplet/shell with mock ShellHooks and loads at least one test napplet that completes AUTH
  3. The message tap captures all postMessage traffic between shell and napplet and exposes it for programmatic assertions
  4. At least two test napplets exist (auth-napplet, publish-napplet) and work in the harness
**Plans**: 6 plans in 3 waves

### Phase 3: Core Protocol Tests
**Goal**: The fundamental protocol mechanics -- authentication, message routing, replay protection, and lifecycle management -- are proven correct by automated tests
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07, MSG-08, MSG-09, RPL-01, RPL-02, RPL-03, RPL-04, RPL-05, LCY-01, LCY-02, LCY-03, LCY-04, LCY-05
**Success Criteria** (what must be TRUE):
  1. All 9 AUTH scenarios pass: valid handshake succeeds, and each of the 8 rejection paths (bad sig, expired, future, wrong challenge, wrong relay, wrong kind, missing type tag, missing aggregate hash) produces the correct outcome
  2. REQ/EVENT/CLOSE/EOSE lifecycle works end-to-end: subscriptions deliver matching events, non-matching events are filtered, CLOSE stops delivery, and EOSE fires after buffer scan
  3. Inter-pane routing rules are enforced: sender excluded from own delivery, p-tag targeting reaches only the tagged napp, pre-AUTH messages queue and replay after AUTH, blocked napp gets CLOSED with denial reason
  4. Replay detection rejects old timestamps, future timestamps, and duplicate event IDs; seen IDs are cleaned up after expiry
  5. Lifecycle edge cases handled: cleanup removes all state, non-array postMessages and null source windows are silently ignored
**Plans**: 5 plans in 2 waves

### Phase 4: Capability Tests
**Goal**: All delegated capabilities -- ACL enforcement, storage isolation, signer proxy, and inter-pane communication -- are proven correct by automated tests
**Depends on**: Phase 3
**Requirements**: ACL-01, ACL-02, ACL-03, ACL-04, ACL-05, ACL-06, ACL-07, ACL-08, ACL-09, STR-01, STR-02, STR-03, STR-04, STR-05, STR-06, STR-07, STR-08, STR-09, SGN-01, SGN-02, SGN-03, SGN-04, SGN-05, SGN-06, SGN-07, IPC-01, IPC-02, IPC-03, IPC-04, IPC-05, IPC-06
**Success Criteria** (what must be TRUE):
  1. ACL enforcement works: default permissive allows unknown napps, explicit grants and revokes take effect immediately, blocking a napp denies all operations, unblocking restores access, and ACL state survives persist/load round-trip
  2. Storage isolation is airtight: CRUD operations work correctly, napp A cannot see napp B's keys, quota enforcement rejects writes over 512KB, and values survive shell reload
  3. Signer delegation works: getPublicKey returns host key, signEvent succeeds for non-destructive kinds, consent flow gates destructive kinds (approve and deny paths), missing signer returns clear error, timeout fires after 30s, concurrent requests resolve independently
  4. Inter-pane communication works: emit/on delivers events with correct payload, topic filtering excludes unsubscribed topics, multiple subscribers all receive, unsubscribe stops delivery, malformed content produces graceful fallback, and shell-injected events reach matching subscribers
**Plans**: 5 plans in 2 waves

### Phase 5: Demo Playground
**Goal**: An interactive vanilla TypeScript playground demonstrates every protocol capability visually, proving the SDK is usable and the developer experience is sound
**Depends on**: Phase 4
**Requirements**: DEMO-01, DEMO-02, DEMO-03, DEMO-04, DEMO-05, DEMO-06, DEMO-07
**Success Criteria** (what must be TRUE):
  1. A shell host page loads two napplet iframes and both complete AUTH handshake without manual intervention
  2. A visual message debugger shows all postMessage traffic in real time with color coding by message type (REQ, EVENT, AUTH, OK, etc.)
  3. Napplet-to-napplet communication is visible: napplet 1 publishes, napplet 2 receives, and the message flow appears in the debugger
  4. ACL controls are interactive: toggling grant/revoke/block produces an immediate visible effect on napplet operations
  5. Signer delegation and storage operations are visible: signature request/response flow and set/get with scoped isolation between napplets are both demonstrated
**Plans**: 5 plans in 3 waves
**UI hint**: yes

### Phase 6: Specification and Publish
**Goal**: The NIP-5A specification is refined from implementation learnings and all three packages are published to npm at v0.1.0 with validated ESM compatibility
**Depends on**: Phase 5
**Requirements**: SPEC-01, SPEC-02, SPEC-03, SPEC-04, PUB-01, PUB-02, PUB-03, PUB-04
**Success Criteria** (what must be TRUE):
  1. NIP-5A specification documents all protocol message types with examples, the security model (ACL, consent, isolation boundaries), and the manifest format with hash computation
  2. All three packages pass publint and arethetypeswrong validation with zero errors
  3. @napplet/shim, @napplet/shell, and @napplet/vite-plugin are published to npm at v0.1.0
  4. Each package README includes usage examples, API reference, and a getting-started guide
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Wiring Fixes | 0/5 | Planned | - |
| 2. Test Infrastructure | 6/6 | Complete | - |
| 3. Core Protocol Tests | 5/5 | Executing | - |
| 4. Capability Tests | 5/5 | Executing | - |
| 5. Demo Playground | 5/5 | Executing | - |
| 6. Specification and Publish | 0/TBD | Not started | - |
