# Phase 93: NUB Package Refactor - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (refactor phase)

<domain>
## Phase Boundary

Move ALL domain-specific logic from @napplet/shim into the respective NUB packages. Each NUB package will export a shim installer function and SDK helper functions alongside its existing type definitions.

</domain>

<decisions>
## Implementation Decisions

### Architecture
- **D-01:** Each NUB package gets a `shim.ts` file exporting an `install{Domain}Shim()` function that:
  - Installs `window.napplet.{domain}` namespace
  - Registers message handlers for domain-specific inbound messages
  - Returns a cleanup function (for testing)
- **D-02:** Each NUB package gets an `sdk.ts` file exporting convenience functions that wrap `window.napplet.{domain}.*`
- **D-03:** NUB packages gain `@napplet/core` as a dependency (already have it for types) — no new deps needed
- **D-04:** Shim files being moved: relay-shim.ts → nub-relay/shim.ts, state-shim.ts → nub-storage/shim.ts, keys-shim.ts → nub-keys/shim.ts, signer logic → nub-signer/shim.ts, IFC logic → nub-ifc/shim.ts

### What stays in @napplet/shim
- Central message handler (handleEnvelopeMessage) — but it delegates to NUB handlers, no domain logic
- window.napplet global assembly — imports NUB installers, calls them
- window.nostr NIP-07 proxy — signer NUB installs this
- nipdb-shim.ts — NOT a NUB, stays in shim

### What stays in @napplet/sdk
- requireNapplet() helper — generic, not domain-specific
- Type re-exports — moved to import from NUB packages

### Claude's Discretion
- Internal file organization within NUB packages (shim.ts, sdk.ts, or different names)
- Whether to keep barrel exports from index.ts or add new entry points
- How to handle the signer's window.nostr installation (stays in signer NUB or shim)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current shim files (source of domain logic to move)
- `packages/shim/src/relay-shim.ts` — 179 lines → @napplet/nub-relay
- `packages/shim/src/state-shim.ts` — 169 lines → @napplet/nub-storage
- `packages/shim/src/keys-shim.ts` — 286 lines → @napplet/nub-keys
- `packages/shim/src/index.ts` — signer logic (~100 lines) → @napplet/nub-signer, IFC logic (~90 lines) → @napplet/nub-ifc

### NUB package targets
- `packages/nubs/relay/src/` — add shim.ts + sdk.ts
- `packages/nubs/storage/src/` — add shim.ts + sdk.ts
- `packages/nubs/keys/src/` — add shim.ts + sdk.ts
- `packages/nubs/signer/src/` — add shim.ts + sdk.ts
- `packages/nubs/ifc/src/` — add shim.ts + sdk.ts

### Pattern references
- `packages/core/src/dispatch.ts` — NUB-agnostic registration pattern (registerNub/dispatch)

</canonical_refs>

<code_context>
## Existing Code Insights

### Key facts
- All 5 NUB packages already depend on @napplet/core
- NUB packages currently export only types from index.ts
- The shim's central handler routes by message type prefix (relay.*, signer.*, storage.*, ifc.*, keys.*)
- SDK wraps window.napplet.* via requireNapplet() — each domain namespace is a separate object

### Build order
NUB packages build before shim and SDK (turborepo respects package.json dependencies)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard refactor with clear source → destination mapping.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 93-nub-package-refactor*
*Context gathered: 2026-04-09*
