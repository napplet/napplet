# Phase 2: Test Infrastructure - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the shared test harness, mock services, and tooling that all behavioral test phases (3, 4) depend on. This includes a mock NIP-5A gateway, a mock relay, a shell-side message tap, test napplets with real manifests, and the Vitest + Playwright runner configuration.

</domain>

<decisions>
## Implementation Decisions

### Test Package Structure
- **D-01:** Test utilities start in `tests/` directory. Extract to `@napplet/test-utils` package later once patterns stabilize.
- **D-02:** Tests import from package names (`@napplet/shell`, `@napplet/shim`) not relative paths — tests exercise the published API surface.
- **D-03:** Console output only for test reporting. No HTML reports for v1.
- **D-04:** Test descriptions include requirement IDs for traceability: e.g., `describe('AUTH-01: valid handshake')`.

### Test Directory Layout
- **D-05:** Claude's discretion on whether to separate by `tests/unit/` + `tests/e2e/` or co-locate by feature domain. Pick based on Vitest + Playwright conventions.

### Message Tap
- **D-06:** Shell-side only tap. No tapping inside napplet iframes — sandbox restrictions prevent script injection, and the security model treats napplets as untrusted. The shell is the single point of truth for all protocol traffic.
- **D-07:** Claude's discretion on tap implementation method (pseudo-relay hook vs monkey-patch) and data format (raw wire vs structured records). Pick based on what makes test assertions clearest and most reliable.
- **D-08:** Claude's discretion on whether tap data is accessed via Playwright `page.evaluate` or browser-side assertions. Pick based on test runner architecture.

### Test Napplet Build & Gateway
- **D-09:** Test server must emulate a NIP-5A gateway — serve napplets from correctly formatted subdomains per the NIP-5A spec: `<pubkeyB36><dTag>.localhost:port` where pubkeyB36 is 50-char base36-encoded pubkey and dTag is 1-13 chars matching `^[a-z0-9-]{1,13}$`.
- **D-10:** Full NIP-5A resolution — gateway parses subdomain, resolves paths via manifest path tags and sha256 hashes, serves content accordingly.
- **D-11:** A mock relay serves kind 35128/15128 manifest events so the shell can query for aggregate hash, event ID, and path mappings. Shell's relay pool hooks in the test harness point at the mock relay.
- **D-12:** Test napplets are built with the vite plugin so they have real manifests with real hashes. The full resolution flow is exercised: shell queries mock relay for manifest → extracts aggregate hash → uses in ACL composite key.
- **D-13:** Claude's discretion on mock relay scope (minimal manifest stub vs full NIP-01 mock). Pick whatever is best for reuse across test phases 3 and 4.

### Claude's Discretion
- Test directory layout (separate vs co-located)
- Message tap implementation method, data format, and access pattern
- Mock relay scope and implementation approach
- Test napplet count and capability coverage for Phase 2 (minimum 2 per ROADMAP success criteria)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### NIP-5A Specification
- `https://raw.githubusercontent.com/nostr-protocol/nips/refs/heads/master/5A.md` — NIP-5A nsite spec. Defines subdomain format (pubkeyB36+dTag), manifest event kinds (15128 root, 35128 named), path tag format, gateway resolution flow. **Test gateway must conform to this.**

### Protocol & Architecture
- `.planning/codebase/ARCHITECTURE.md` — Full architecture overview, data flows, AUTH handshake, ShellHooks interface
- `.planning/codebase/CONCERNS.md` — Known bugs and security considerations
- `.planning/codebase/STACK.md` — Current tech stack (TypeScript, Vite, tsup, turborepo, pnpm)

### Prior Phase Context
- `.planning/phases/01-wiring-fixes/01-CONTEXT.md` — Phase 1 decisions: relay URI is `shell://`, meta tags are `napplet-*`, storage keys use repeated NIP tags, strict shim validation

### Research
- `.planning/research/STACK.md` — Vitest 4 + Playwright recommendation, jsdom/happy-dom limitations confirmed
- `.planning/research/ARCHITECTURE.md` — Test harness architecture: message tap, mock hooks, test napplet patterns
- `.planning/research/PITFALLS.md` — Pitfall 10: jsdom cannot test this protocol; Pitfall 11: Vitest browser mode iframe conflicts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shell/src/types.ts` — `ShellHooks` interface defines all hook points. Mock implementation can stub each hook.
- `packages/shell/src/pseudo-relay.ts` — `createPseudoRelay(hooks)` is the main entry point. Test harness calls this with mock hooks.
- `packages/vite-plugin/src/index.ts` — `nip5aManifest()` plugin generates real manifests for test napplets.
- Phase 1 smoke test in `tests/e2e/` — Playwright setup and basic shell+napplet page can be extended.

### Established Patterns
- ShellHooks dependency injection — all external dependencies (relay pool, auth, window manager) injected via hooks object
- NIP-01 wire format for all messages — test assertions should match on raw message arrays
- Event-based error responses with correlation IDs — storage and signer use id tags for request/response matching

### Integration Points
- `createPseudoRelay(hooks)` — test harness creates a real pseudo-relay with mock hooks
- `window.addEventListener('message', relay.handleMessage)` — where the message tap intercepts
- Mock relay WebSocket endpoint — shell's relay pool hooks connect here
- NIP-5A gateway HTTP server — serves test napplets on correct subdomains to iframe src URLs

</code_context>

<specifics>
## Specific Ideas

- The test gateway + mock relay combination means the shell exercises the full NIP-5A flow in tests: subdomain → relay query → manifest → aggregate hash → ACL key. This is closer to production than a simplified test setup.
- Test napplets built with the real vite plugin means manifest hashes are genuine — no faking.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-test-infrastructure*
*Context gathered: 2026-03-30*
