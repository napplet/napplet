# Phase 4: Capability Tests - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Write 31 automated Playwright tests proving ACL enforcement, storage isolation, signer delegation, and inter-pane communication. All tests run in real Chromium using the infrastructure from Phase 2 and patterns established in Phase 3.

Requirements covered: ACL-01..09, STR-01..09, SGN-01..07, IPC-01..06.

</domain>

<decisions>
## Implementation Decisions

### Signer Consent in Tests
- **D-01:** Claude's discretion on how to mock consent (auto-resolve callback vs configurable per-test behavior). Tests must verify the shell correctly invokes onConsentNeeded for destructive kinds and handles both approve/deny outcomes.

### Storage Quota
- **D-02:** Quota calculated using UTF-8 byte count: `new TextEncoder().encode(key + value).length`. Consistent across platforms, replaces the current Blob approach. **This is a code change to storage-proxy.ts.**
- **D-03:** Quota exceeded error uses NIP tag format: response event with `['error', 'quota exceeded: 512KB limit']` tag. Follows existing error pattern in the codebase.

### ACL Persistence
- **D-04:** ACL persist/load tests assert on BOTH behavior (round-trip works) AND format (localStorage key name and JSON structure). The persistence format is locked as part of the protocol contract.

### Carried From Prior Phases
- **D-05:** All tests in Playwright, real Chromium (Phase 3 D-04)
- **D-06:** REQ-IDs in test descriptions (Phase 2 D-04)
- **D-07:** Shell-side message tap (Phase 2 D-06)
- **D-08:** Blocked napp CLOSED prefix: `'blocked: capability denied'` (Phase 3 D-09)
- **D-09:** NIP-01 error prefix convention (Phase 3 D-01)
- **D-10:** Storage keys use repeated NIP tags (Phase 1 D-05)

### Claude's Discretion
- Signer consent mock implementation approach
- Test file organization
- Which tests need multiple napplets (cross-napp isolation STR-06, multi-subscriber IPC-03)
- Whether to reuse Phase 3 test napplets or create capability-specific ones

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protocol & Architecture
- `.planning/codebase/ARCHITECTURE.md` — ACL store, storage proxy, signer proxy, inter-pane pubsub data flows
- `.planning/codebase/CONCERNS.md` — Lossy storage quota, permissive ACL default, no rate limiting on signer

### Prior Phase Context
- `.planning/phases/01-wiring-fixes/01-CONTEXT.md` — Storage NIP tags (D-05), relay URI `shell://` (D-01)
- `.planning/phases/02-test-infrastructure/02-CONTEXT.md` — Test harness architecture, NIP-5A gateway, mock relay
- `.planning/phases/03-core-protocol-tests/03-CONTEXT.md` — NIP-01 error prefixes (D-01), blocked prefix (D-09), all-Playwright (D-04)

### Requirements
- `.planning/REQUIREMENTS.md` — Full test scenarios for ACL-01..09, STR-01..09, SGN-01..07, IPC-01..06

### Research
- `.planning/research/FEATURES.md` — Behavioral test matrix sections 2 (Permission Enforcement), 5 (Storage Isolation), 6 (Signer Delegation), 7 (Inter-Pane Communication)

### Source Files
- `packages/shell/src/acl-store.ts` — ACL grant/revoke/block/persist/load logic
- `packages/shell/src/storage-proxy.ts` — Storage CRUD, quota calculation, scoped keys
- `packages/shell/src/pseudo-relay.ts` — Signer request handling (lines 344-399), inter-pane routing (lines 96-112)
- `packages/shim/src/storage-shim.ts` — Storage response parsing (must match NIP tag format)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 2/3 test infrastructure: NIP-5A gateway, mock relay, message tap, shell harness, test napplets
- Phase 3 test patterns: how to assert on OK/CLOSED/NOTICE messages, how to set up multi-napplet tests
- `packages/shell/src/acl-store.ts` — grant(), revoke(), block(), unblock(), check(), persist(), load() are the functions under test
- `packages/shell/src/storage-proxy.ts` — handleStorageMessage() with get/set/remove/keys/clear operations

### Established Patterns
- Storage error tags: `['error', 'reason']` in response events
- Signer request/response: kind 29001 request with correlation ID, kind 29002 response with matching id tag
- ACL capabilities: 'relay:read', 'relay:write', 'sign:event', 'sign:nip04', 'sign:nip44', 'storage:read', 'storage:write'
- Inter-pane: kind 29003 with `['t', topic]` tag for topic routing

### Integration Points
- ACL tests need to manipulate the ACL store between assertions (grant, then check, then revoke, then check again)
- Storage isolation tests need 2 napplets with different identities accessing the same key names
- Signer tests need the mock hooks to provide a signing function (or fail when none configured)
- IPC tests need 2+ napplets subscribed to topics

</code_context>

<specifics>
## Specific Ideas

- Storage quota calculation change (Blob → TextEncoder) is a code fix that should happen in this phase or be flagged as a prerequisite. Tests should assert the corrected behavior.
- ACL format assertion locks the localStorage schema as part of the protocol. If the format changes later, these tests will catch it — which is the intent.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-capability-tests*
*Context gathered: 2026-03-30*
