# Phase 3: Core Protocol Tests - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Write 28 automated Playwright tests proving AUTH handshake, message routing, replay protection, and lifecycle correctness. All tests run in real Chromium browsers using the test infrastructure from Phase 2 (NIP-5A gateway, mock relay, message tap, test napplets).

Requirements covered: AUTH-01..09, MSG-01..09, RPL-01..05, LCY-01..05.

</domain>

<decisions>
## Implementation Decisions

### AUTH Failure Expectations
- **D-01:** AUTH error reason strings follow NIP-01 prefix convention: `'auth-required: reason'` for pre-auth issues, `'error: reason'` for validation failures. Interoperable with existing relay tooling.
- **D-02:** AUTH-08 (missing type tag) and AUTH-09 (missing aggregateHash tag) now FAIL — not succeed with defaults. Missing type/hash means the napplet didn't build correctly. Tests assert `OK false` with appropriate error reasons. **This changes current permissive behavior — implementation must be updated in the test or in the shell code.**
- **D-03:** AUTH failure always sends `['OK', eventId, false, 'reason']` followed by `['NOTICE', 'N queued messages dropped due to auth failure']` (carried from Phase 1 D-06).

### Test Organization
- **D-04:** All 28 tests run in Playwright (real Chromium). No Node-mode unit tests in this phase — the protocol must be proven in real browsers with real postMessage.
- **D-05:** File organization at Claude's discretion based on test runner conventions.
- **D-06:** REQ-IDs in test descriptions (carried from Phase 2 D-04): e.g., `describe('AUTH-01: valid handshake')`.

### Message Routing Edge Cases
- **D-07:** Sender exclusion (MSG-06) applies ONLY to kind 29003 (inter-pane topic events). Normal relay events can be delivered back to sender if they match a subscription.
- **D-08:** Pre-AUTH message queue (MSG-08) capped at 50 messages by default. Configurable both globally (shell-wide) and per-napp. Messages beyond the cap are rejected with NOTICE.
- **D-09:** Blocked napp CLOSED reason (MSG-09) uses ACL-specific prefix: `['CLOSED', subId, 'blocked: capability denied']`. Distinct from relay errors so napplets can identify ACL issues.

### Claude's Discretion
- Test file organization (one-per-category vs other grouping)
- Test napplet selection for each test (reuse from Phase 2 or create new ones)
- Whether replay detection tests (RPL-01..05) need real iframes or can use simpler assertions against the pseudo-relay directly

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### NIP Specifications
- `https://raw.githubusercontent.com/nostr-protocol/nips/refs/heads/master/5A.md` — NIP-5A nsite spec (gateway subdomain format, manifest events)
- NIP-01 relay protocol — OK/CLOSED message format, error prefix conventions

### Protocol & Architecture
- `.planning/codebase/ARCHITECTURE.md` — AUTH handshake sequence, message routing flow, subscription lifecycle, inter-pane delivery
- `.planning/codebase/CONCERNS.md` — AUTH race condition details, replay detection implementation, filter matching

### Prior Phase Context
- `.planning/phases/01-wiring-fixes/01-CONTEXT.md` — AUTH rejection sends OK false + NOTICE (D-06), strict shim validation (D-07), relay URI is `shell://` (D-01)
- `.planning/phases/02-test-infrastructure/02-CONTEXT.md` — Shell-side tap (D-06), NIP-5A gateway (D-09..D-12), REQ-IDs in tests (D-04), package name imports (D-02)

### Requirements
- `.planning/REQUIREMENTS.md` — Full behavioral test matrix with expected inputs/outputs for all 28 tests

### Research
- `.planning/research/FEATURES.md` — Complete behavioral test matrix (Section "Behavioral Test Matrix") with priority, inputs, and expected outcomes for all 69 scenarios

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 2 test infrastructure: NIP-5A gateway, mock relay, message tap, shell test harness, test napplets
- `packages/shell/src/pseudo-relay.ts` — handleAuth(), handleReq(), handleClose(), checkReplay(), matchesAnyFilter() are the functions under test
- `.planning/research/FEATURES.md` behavioral test matrix — exact inputs and expected outputs for each test

### Established Patterns
- NIP-01 OK format: `['OK', eventId, bool, 'prefix: reason']`
- NIP-01 CLOSED format: `['CLOSED', subId, 'prefix: reason']`
- NIP-01 NOTICE format: `['NOTICE', 'message']`
- AUTH event kind 22242 with tags: relay, challenge, type, version, aggregateHash

### Integration Points
- Message tap captures all traffic — tests query tap for assertions
- Mock relay serves manifests — tests can verify shell queries relay during AUTH
- Test napplets trigger specific protocol behaviors — one per capability area

</code_context>

<specifics>
## Specific Ideas

- AUTH-08 and AUTH-09 behavior change: Current code defaults missing tags to 'unknown'/'' and succeeds. User wants these to fail. This requires a code change (either in Phase 1 execution or as part of Phase 3). Tests should assert the new strict behavior.
- Pre-AUTH queue limit (50, configurable) is new behavior not currently in the codebase. Tests should cover the cap being reached.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-core-protocol-tests*
*Context gathered: 2026-03-30*
