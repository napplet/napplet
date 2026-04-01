# Phase 25: SPEC.md Updates - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Update `SPEC.md` to accurately reflect the protocol as implemented in v0.4.0. Three requirements:
- **SPEC-01:** Section 11 (kind 29010 service discovery) fully rewritten to match implementation
- **SPEC-02:** Legacy `PseudoRelay`/`createPseudoRelay`/`PSEUDO_RELAY_URI` references replaced (note: pre-scan shows SPEC.md already uses ShellBridge — verify and clean up residuals)
- **SPEC-03:** New content in Section 2 (AUTH) and Section 15 covering `requires` tags, `CompatibilityReport`, strict/permissive mode, and undeclared service consent

No code changes. Documentation accuracy work only.

</domain>

<decisions>
## Implementation Decisions

### Section 11 — Full Rewrite (SPEC-01)

- **D-01:** Fully rewrite Section 11 from scratch to reflect the v0.4.0 implementation. Remove all "deferred" language and "SHOULD NOT implement" notes. Make the section normative.
- **D-02:** Section 11 stays marked `[OPEN]` — service ACL and custom service standards are still evolving. The core kind 29010 flow is implemented, but not locked.
- **D-03:** Fix the sentinel pubkey in Section 11.2 — the spec currently says `"pubkey": "__shell__"` but the implementation uses `'0'.repeat(64)` (64 hex zeros). Update the example JSON and prose to show the correct sentinel value. Sentinel sig is also 128 hex zeros.
- **D-04:** Add a subsection (or paragraph in 11.4 Lifecycle) documenting **live subscription behavior**: after the initial REQ/EVENT/EOSE discovery flow, napplets may stay subscribed. If the shell registers a new service dynamically, it sends an additional kind 29010 EVENT to all active discovery subscribers without a new EOSE. Document this behavior.
- **D-05:** Remove the stale status box from Section 11.1 entirely. Replace with a brief status indicator matching the `[OPEN]` header format.

### SPEC-02 — Legacy Naming Verification

- **D-06:** Pre-scan confirmed SPEC.md already uses `ShellBridge` terminology throughout — no `PseudoRelay`, `createPseudoRelay`, or `PSEUDO_RELAY_URI` found. SPEC-02 is a **verification task**: grep the full document, fix any instances found (expected: zero or trivial), and mark requirement satisfied.
- **D-07:** Also check for stale `napplet://pseudo-relay` URI (the old ShellBridge URI was renamed to `napplet://shell`) — replace any found.

### SPEC-03 — requires Tags + CompatibilityReport — Split Placement

The SPEC-03 content is split across two sections that best fit the protocol phases where each concept applies:

**Part A: `requires` tags → Section 15 (NIP-5A)**
- **D-08:** Add a new subsection in Section 15 (Provisional — NIP-C4 Kind Numbers) documenting `requires` tags in NIP-5A manifests:
  - What they are: `["requires", "service-name"]` tags added to the kind 35128 manifest event
  - How they're declared: via `requires: string[]` in `@napplet/vite-plugin` options
  - What they produce: `<meta name="napplet-requires" content="audio,notifications">` in the HTML
  - Purpose: declare service dependencies so the shell can check compatibility at AUTH time

**Part B: CompatibilityReport + strict/permissive mode + undeclared service consent → Section 2 (AUTH)**
- **D-09:** Add new subsection(s) in Section 2 (Authentication Handshake) covering the compatibility check that happens immediately after AUTH verification:
  - **CompatibilityReport structure**: what fields it contains (missing services list, present services list, strict mode result)
  - **Strict vs. permissive mode**: `strictMode: true` blocks napplet load when declared services are missing; permissive mode (default) allows load with a report
  - **`onCompatibilityIssue` callback**: how shell hosts receive and respond to compatibility reports
  - **Undeclared service consent**: when a napplet uses a service it didn't declare in `requires` tags, the shell fires a `ConsentRequest` of type `'undeclared-service'`. Same hook and UX pattern as destructive signing kinds. Per-session consent cache prevents repeated prompts.
- **D-10:** These new subsections should be placed after the existing AUTH flow subsections (2.1–2.8) as 2.9 (or similar). They are part of the AUTH completion sequence — the compat check runs after the AUTH event is verified and accepted.

### Section 17.3 Future Work Cleanup

- **D-11:** Remove the two now-implemented items from Section 17.3:
  - "Service discovery implementation (Section 11)" → remove
  - "Service dependency declaration in NIP-5A manifests (`requires` tags)" → remove
- **D-12:** Retain all still-valid future work items: NIP upstream submission, conformance test suite, protocol version negotiation, capability advertisement, per-service ACL capabilities.
- **D-13:** Also update the draft date at the bottom of SPEC.md to `2026-03-31`.

### Claude's Discretion

- Exact prose wording for the Section 11 rewrite.
- Whether to add a `CompatibilityReport` type definition table in Section 2 or just describe it in prose.
- How to format the undeclared service consent flow (sequence diagram vs. prose + example).
- Section 15 subsection numbering (15.6, 15.7, or similar) — avoid conflicts with existing 15.1–15.5.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### File being updated
- `SPEC.md` — 1,342 lines. Full document. Key sections: 2 (AUTH), 11 (Service Discovery), 15 (NIP-C4), 17 (Implementation Notes)

### Implementation source for Section 11
- `packages/runtime/src/service-discovery.ts` — `createServiceDiscoveryEvent()`, `handleDiscoveryReq()`, `isDiscoveryReq()`, `DiscoverySubscription` — authoritative implementation
- `packages/runtime/src/types.ts` — `ServiceHandler`, `ServiceRegistry`, `CompatibilityReport`, `ServiceInfo` types
- `packages/runtime/src/runtime.ts` — where compat check runs post-AUTH (grep for `onCompatibilityIssue`)

### Implementation source for SPEC-03
- `packages/runtime/src/types.ts` — `CompatibilityReport` interface definition
- `packages/runtime/src/runtime.ts` — compat check logic at AUTH time; `strictMode` flag; `onCompatibilityIssue` callback
- `packages/vite-plugin/src/index.ts` — `requires?: string[]` option; `napplet-requires` meta tag injection; `["requires", "service-name"]` manifest tag injection

### Requirements
- `.planning/REQUIREMENTS.md` §SPEC-01, SPEC-02, SPEC-03 — acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/runtime/src/service-discovery.ts` has the complete implementation — `SENTINEL_PUBKEY = '0'.repeat(64)`, `SENTINEL_SIG = '0'.repeat(128)`. Use these exact values in the spec JSON examples.
- The `CompatibilityReport` type in `packages/runtime/src/types.ts` defines the exact fields the spec should document.

### Established Patterns
- SPEC.md uses `[OPEN]` / `[LOCKED]` status markers in section headings — maintain this convention.
- Code examples in the spec use JSON arrays (NIP-01 wire format). Protocol field tables use `| Field | Value |` format.
- The spec uses `MUST`, `SHOULD`, `MAY` (RFC 2119) normative language throughout — maintain for new content.

### Integration Points
- Section 2 currently ends at 2.8 (Pre-AUTH Message Queueing). New compat subsections go after 2.8.
- Section 15 currently has subsections 15.1–15.5. New requires tag subsection would be 15.6.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 25-spec-md-updates*
*Context gathered: 2026-03-31*
