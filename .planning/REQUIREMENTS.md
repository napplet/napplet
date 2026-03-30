# Requirements: Napplet Protocol SDK

**Defined:** 2026-03-30
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v1 Requirements

Requirements for initial release (v0.1.0). Each maps to roadmap phases.

### Bug Fixes & Wiring

- [ ] **FIX-01**: AUTH race condition fixed — pendingAuthQueue cleared on all rejection paths
- [ ] **FIX-02**: Shim-side postMessage source validation — handleRelayMessage and handleStorageResponse check event.source === window.parent
- [ ] **FIX-03**: Storage key serialization — comma-in-key bug fixed in storage proxy scoped key computation
- [ ] **FIX-04**: Hyprgate references renamed to napplet throughout codebase (URIs, meta tags, variable names)
- [ ] **FIX-05**: Packages work end-to-end standalone — shell creates pseudo-relay, napplet loads shim, AUTH completes, messages flow

### Test Infrastructure

- [ ] **TEST-01**: Vitest configured with browser mode (Playwright provider) for protocol tests
- [ ] **TEST-02**: Vitest configured with Node mode for unit tests (pure functions)
- [ ] **TEST-03**: Mock ShellHooks implementation for unit testing pseudo-relay
- [ ] **TEST-04**: Message tap — postMessage interceptor that captures all shell↔napplet messages for test assertions
- [ ] **TEST-05**: Test napplets — minimal napplet apps (one per capability area) for behavioral testing
- [ ] **TEST-06**: Shell test harness — programmatic shell setup for integration tests

### Behavioral Tests — Identity & Authentication

- [ ] **AUTH-01**: Valid AUTH handshake — correct challenge, valid signature, correct relay tag → napp registered
- [ ] **AUTH-02**: Bad signature → AUTH rejected with "invalid signature"
- [ ] **AUTH-03**: Expired timestamp (>60s ago) → AUTH rejected
- [ ] **AUTH-04**: Future timestamp (>now+60s) → AUTH rejected
- [ ] **AUTH-05**: Wrong challenge value → AUTH rejected with "challenge mismatch"
- [ ] **AUTH-06**: Wrong relay tag → AUTH rejected
- [ ] **AUTH-07**: Wrong event kind (!=22242) → AUTH rejected
- [ ] **AUTH-08**: Missing type tag → defaults to 'unknown', succeeds
- [ ] **AUTH-09**: Missing aggregateHash tag → empty string hash, succeeds

### Behavioral Tests — Permission Enforcement

- [ ] **ACL-01**: Default permissive — unknown napp publishes successfully
- [ ] **ACL-02**: Explicit grant relay:write → publish succeeds
- [ ] **ACL-03**: Revoke relay:write → publish denied
- [ ] **ACL-04**: Block entire napp → all operations denied
- [ ] **ACL-05**: Unblock previously blocked napp → operations resume
- [ ] **ACL-06**: Revoke storage:read → getItem denied
- [ ] **ACL-07**: Revoke storage:write → setItem denied
- [ ] **ACL-08**: Revoke sign:event → signEvent denied
- [ ] **ACL-09**: ACL persist/load round-trip — entries survive save and restore

### Behavioral Tests — Message Routing

- [ ] **MSG-01**: REQ creates subscription, buffer events delivered
- [ ] **MSG-02**: EVENT matching filter delivered to subscriber
- [ ] **MSG-03**: EVENT not matching filter — no delivery
- [ ] **MSG-04**: CLOSE removes subscription — no further events
- [ ] **MSG-05**: EOSE sent after buffer scan
- [ ] **MSG-06**: Sender excluded from own inter-pane delivery
- [ ] **MSG-07**: p-tag targeted delivery — only tagged napp receives
- [ ] **MSG-08**: REQ before AUTH — message queued, replayed after AUTH
- [ ] **MSG-09**: REQ from blocked napp → CLOSED "relay:read denied"

### Behavioral Tests — Replay & Integrity

- [ ] **RPL-01**: Event with old timestamp (>30s ago) rejected
- [ ] **RPL-02**: Event with future timestamp (>now+10s) rejected
- [ ] **RPL-03**: Duplicate event ID rejected
- [ ] **RPL-04**: Seen ID cleanup — ID removed from set after expiry window
- [ ] **RPL-05**: Event from unregistered window ignored

### Behavioral Tests — Storage Isolation

- [ ] **STR-01**: setItem + getItem round-trip returns correct value
- [ ] **STR-02**: getItem missing key returns null
- [ ] **STR-03**: removeItem removes key
- [ ] **STR-04**: keys() lists all napp keys
- [ ] **STR-05**: clear() removes all napp keys
- [ ] **STR-06**: Cross-napp isolation — napp A key not visible to napp B
- [ ] **STR-07**: Quota enforcement — write >512 KB returns error
- [ ] **STR-08**: Quota accuracy — write at limit succeeds, one byte more fails
- [ ] **STR-09**: Storage persistence — values survive shell reload

### Behavioral Tests — Signer Delegation

- [ ] **SGN-01**: getPublicKey returns host pubkey
- [ ] **SGN-02**: signEvent (non-destructive kind) returns signed event
- [ ] **SGN-03**: signEvent (destructive kind, approved) returns signed event
- [ ] **SGN-04**: signEvent (destructive kind, denied) returns error
- [ ] **SGN-05**: No signer configured → error "no signer configured"
- [ ] **SGN-06**: Request timeout → error after 30s
- [ ] **SGN-07**: Concurrent requests with different IDs resolved independently

### Behavioral Tests — Inter-Pane Communication

- [ ] **IPC-01**: emit() + on() — subscriber receives event with correct payload
- [ ] **IPC-02**: Topic filtering — unsubscribed topic does not fire callback
- [ ] **IPC-03**: Multiple subscribers — all receive event
- [ ] **IPC-04**: Unsubscribe (close) — no further events received
- [ ] **IPC-05**: Malformed content — on() callback receives graceful fallback
- [ ] **IPC-06**: Shell-injected events — injectEvent() delivered to matching subscribers

### Behavioral Tests — Lifecycle & Edge Cases

- [ ] **LCY-01**: Messages queued during AUTH — replayed after AUTH succeeds
- [ ] **LCY-02**: AUTH rejection clears queue — queued messages not processed
- [ ] **LCY-03**: cleanup() removes all subscriptions, buffers, registries
- [ ] **LCY-04**: Non-array postMessage silently ignored
- [ ] **LCY-05**: Null source window silently ignored

### Demo Application

- [ ] **DEMO-01**: Shell host page loads 2 napplet iframes
- [ ] **DEMO-02**: Both napplets complete AUTH handshake with shell
- [ ] **DEMO-03**: Visual message debugger shows all postMessage traffic with type coloring
- [ ] **DEMO-04**: Napplet 1 publishes event, napplet 2 receives via inter-pane
- [ ] **DEMO-05**: ACL controls visible — grant/revoke/block with immediate visual effect
- [ ] **DEMO-06**: Signer delegation visible — napplet requests signature, shell proxies, result shown
- [ ] **DEMO-07**: Storage operations visible — set/get with scoped isolation between napplets

### NIP Specification

- [ ] **SPEC-01**: NIP-5A specification refined based on implementation learnings
- [ ] **SPEC-02**: All protocol message types documented with examples
- [ ] **SPEC-03**: Security model documented (ACL, consent, isolation boundaries)
- [ ] **SPEC-04**: Manifest format and hash computation documented

### Package Publishing

- [ ] **PUB-01**: All packages pass publint validation (ESM, exports, types)
- [ ] **PUB-02**: All packages pass arethetypeswrong validation
- [ ] **PUB-03**: @napplet/shim, @napplet/shell, @napplet/vite-plugin published to npm at v0.1.0
- [ ] **PUB-04**: Package READMEs with usage examples, API reference, and getting started

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Tests

- **EXT-01**: Duplicate AUTH from same window (re-registration behavior)
- **EXT-02**: ACL corrupt data recovery (invalid JSON in localStorage)
- **EXT-03**: COUNT response with correct match count
- **EXT-04**: Ring buffer overflow (>100 events, oldest dropped)
- **EXT-05**: Manifest cache collision (same pubkey:dTag, different hash)
- **EXT-06**: NIP-44 encrypt/decrypt round-trip
- **EXT-07**: NIP-04 encrypt/decrypt round-trip
- **EXT-08**: Malformed storage request (missing key tag)
- **EXT-09**: Unregistered napp storage request
- **EXT-10**: Empty subscriber set (emit with no listeners)

### Security Hardening

- **SEC-01**: Restrictive ACL default mode option
- **SEC-02**: Manifest signature verification in shell
- **SEC-03**: Rate limiting on signer requests
- **SEC-04**: Session-level message authentication (HMAC per postMessage)

### Developer Experience

- **DX-01**: Napplet boilerplate / create-napplet CLI
- **DX-02**: Interactive playground (live code editor)
- **DX-03**: VitePress documentation site
- **DX-04**: Framework bindings (@napplet/react, @napplet/svelte)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-shell federation | Enormous complexity, zero user demand |
| IndexedDB storage backend | localStorage sufficient for v1 (5-10 MB) |
| Key rotation for ephemeral keypairs | State management complexity not justified |
| Real event ID computation for injected events | Document as synthetic, add tag marker instead |
| Napplet-to-napplet direct communication | Security invariant — always route through shell |
| E2E tests against real Nostr relays | Flaky, slow — mock relay responses instead |
| Multi-browser CI matrix | Chromium sufficient for v0.1 validation |
| Performance benchmarking suite | Correctness first, benchmark when needed |
| Offline/PWA support | Online-only for v1 |
| Mobile native wrapper | Web-first protocol |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | TBD | Pending |
| FIX-02 | TBD | Pending |
| FIX-03 | TBD | Pending |
| FIX-04 | TBD | Pending |
| FIX-05 | TBD | Pending |
| TEST-01 | TBD | Pending |
| TEST-02 | TBD | Pending |
| TEST-03 | TBD | Pending |
| TEST-04 | TBD | Pending |
| TEST-05 | TBD | Pending |
| TEST-06 | TBD | Pending |
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| AUTH-06 | TBD | Pending |
| AUTH-07 | TBD | Pending |
| AUTH-08 | TBD | Pending |
| AUTH-09 | TBD | Pending |
| ACL-01 | TBD | Pending |
| ACL-02 | TBD | Pending |
| ACL-03 | TBD | Pending |
| ACL-04 | TBD | Pending |
| ACL-05 | TBD | Pending |
| ACL-06 | TBD | Pending |
| ACL-07 | TBD | Pending |
| ACL-08 | TBD | Pending |
| ACL-09 | TBD | Pending |
| MSG-01 | TBD | Pending |
| MSG-02 | TBD | Pending |
| MSG-03 | TBD | Pending |
| MSG-04 | TBD | Pending |
| MSG-05 | TBD | Pending |
| MSG-06 | TBD | Pending |
| MSG-07 | TBD | Pending |
| MSG-08 | TBD | Pending |
| MSG-09 | TBD | Pending |
| RPL-01 | TBD | Pending |
| RPL-02 | TBD | Pending |
| RPL-03 | TBD | Pending |
| RPL-04 | TBD | Pending |
| RPL-05 | TBD | Pending |
| STR-01 | TBD | Pending |
| STR-02 | TBD | Pending |
| STR-03 | TBD | Pending |
| STR-04 | TBD | Pending |
| STR-05 | TBD | Pending |
| STR-06 | TBD | Pending |
| STR-07 | TBD | Pending |
| STR-08 | TBD | Pending |
| STR-09 | TBD | Pending |
| SGN-01 | TBD | Pending |
| SGN-02 | TBD | Pending |
| SGN-03 | TBD | Pending |
| SGN-04 | TBD | Pending |
| SGN-05 | TBD | Pending |
| SGN-06 | TBD | Pending |
| SGN-07 | TBD | Pending |
| IPC-01 | TBD | Pending |
| IPC-02 | TBD | Pending |
| IPC-03 | TBD | Pending |
| IPC-04 | TBD | Pending |
| IPC-05 | TBD | Pending |
| IPC-06 | TBD | Pending |
| LCY-01 | TBD | Pending |
| LCY-02 | TBD | Pending |
| LCY-03 | TBD | Pending |
| LCY-04 | TBD | Pending |
| LCY-05 | TBD | Pending |
| DEMO-01 | TBD | Pending |
| DEMO-02 | TBD | Pending |
| DEMO-03 | TBD | Pending |
| DEMO-04 | TBD | Pending |
| DEMO-05 | TBD | Pending |
| DEMO-06 | TBD | Pending |
| DEMO-07 | TBD | Pending |
| SPEC-01 | TBD | Pending |
| SPEC-02 | TBD | Pending |
| SPEC-03 | TBD | Pending |
| SPEC-04 | TBD | Pending |
| PUB-01 | TBD | Pending |
| PUB-02 | TBD | Pending |
| PUB-03 | TBD | Pending |
| PUB-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 75 total
- Mapped to phases: 0
- Unmapped: 75

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after initial definition*
