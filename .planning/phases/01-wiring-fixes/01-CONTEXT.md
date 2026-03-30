# Phase 1: Wiring Fixes - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix known security bugs, rename all hyprgate references to napplet branding, and verify that the three extracted packages (@napplet/shim, @napplet/shell, @napplet/vite-plugin) work end-to-end as a standalone SDK. This phase produces a trustworthy, correctly-named foundation that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Naming Convention
- **D-01:** Pseudo-relay URI scheme is `shell://` — AUTH relay tag becomes `['relay', 'shell://']`
- **D-02:** HTML meta tag prefix is `napplet-*` — e.g., `napplet-napp-type`, `napplet-aggregate-hash`
- **D-03:** Full sweep rename — every occurrence of `hyprgate` in every file (URIs, meta tags, types, variable names, comments, docs) gets replaced
- **D-04:** Hard cut, no backwards compatibility — old `hyprgate://` values are not accepted as fallback. Clean break pre-v1.

### Storage Serialization
- **D-05:** Storage `keys()` response uses repeated NIP tags — one `['key', name]` tag per key instead of comma-joined string. Follows Nostr convention, eliminates delimiter bugs.

### AUTH Rejection Behavior
- **D-06:** On AUTH failure, shell sends `['OK', eventId, false, 'reason']` THEN sends `['NOTICE', 'N queued messages dropped due to auth failure']`. All rejection paths must clear the pendingAuthQueue for that windowId.

### Source Validation
- **D-07:** Shim adds strict message validation: `event.source === window.parent` AND `Array.isArray(event.data)` AND `data[0]` is a valid NIP-01 verb. Applied to all message handlers (handleRelayMessage, handleStorageResponse).
- **D-08:** Origin validation not useful due to sandbox (origin is string 'null'). Source check is sufficient for Phase 1.

### Verification Approach
- **D-09:** Both a minimal HTML smoke test page AND an automated Playwright script. Smoke test lives in `tests/e2e/`. Playwright script asserts AUTH completes and a round-trip message flows.
- **D-10:** Smoke test is disposable verification — NOT a seed for the Phase 5 demo. Demo will be built fresh.

### Claude's Discretion
- Specific variable/type renames beyond hyprgate (e.g., what to rename `NappKeypair` to if needed) — Claude can decide based on consistency
- Playwright script structure and assertion patterns — Claude picks based on testing best practices

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protocol & Architecture
- `.planning/codebase/ARCHITECTURE.md` — Full architecture overview, data flows, AUTH handshake sequence
- `.planning/codebase/CONCERNS.md` — Known bugs (AUTH race condition, storage quota, source validation), security considerations
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, code style, error handling conventions

### Source Files (primary targets)
- `packages/shell/src/pseudo-relay.ts` — AUTH handling, pendingAuthQueue, message dispatch (main fix target)
- `packages/shell/src/storage-proxy.ts` — Storage keys() serialization fix (line 130)
- `packages/shim/src/index.ts` — Missing event.source validation, hyprgate meta tag references
- `packages/shim/src/relay-shim.ts` — Message handler validation
- `packages/shim/src/storage-shim.ts` — Storage response parsing (must match new tag format)
- `packages/vite-plugin/src/index.ts` — Hyprgate meta tag injection, manifest signing

### Research
- `.planning/research/PITFALLS.md` — AUTH race condition analysis (Pitfall 3), shim source validation (Pitfall 8), storage key serialization (Pitfall 6)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shell/src/pseudo-relay.ts` has existing pendingAuthQueue logic — needs audit of all rejection paths, not rewrite
- `packages/shell/src/storage-proxy.ts` sendResponse helper can be reused, just change the tag format
- Existing `pnpm build` and `pnpm type-check` scripts verify compilation

### Established Patterns
- NIP-01 wire format for all messages — storage fix should follow this pattern (repeated tags)
- Error responses use `['error', reason]` tags in events
- Console logging only in vite-plugin — runtime is silent

### Integration Points
- AUTH relay tag validation in `pseudo-relay.ts` handleAuth — must match new `shell://` URI
- Meta tag reading in `packages/shim/src/index.ts` — must match new `napplet-*` prefix
- Vite plugin meta tag injection in `packages/vite-plugin/src/index.ts` — must inject new `napplet-*` tags
- Storage shim response parsing in `packages/shim/src/storage-shim.ts` — must parse repeated `['key', name]` tags

</code_context>

<specifics>
## Specific Ideas

### Event-ID Triggered Hash Revalidation (deferred to later phase)
User described a layered validation mechanism for detecting napplet updates:
1. Shell tracks the nsite event_id for each loaded napplet
2. If event_id unchanged since last validation → skip expensive aggregate hash recomputation
3. If event_id changed (new publish) → re-validate by fetching blobs, computing aggregate hash per NIP-5A spec, comparing to napplet's claim
4. Cache validated aggregate hash keyed by event_id

This prevents spurious hash validations while ensuring the shell independently verifies the napplet's identity on updates. The napplet cannot lie about its hash because the shell recomputes it.

**Not in Phase 1 scope** — captured here as critical protocol context for spec refinement (Phase 6) and potentially test coverage (Phases 3-4).

</specifics>

<deferred>
## Deferred Ideas

- **Event-ID triggered aggregate hash revalidation** — Protocol-level identity verification mechanism. Belongs in spec refinement and potentially a dedicated security hardening phase. See Specific Ideas above for full description.
- **Salt-based deterministic keypair derivation** — Alternative to current ephemeral keypair approach where `salt = dTag + event_id + shell_constant` produces a deterministic keypair. When napplet updates, keypair changes, ACL detects the change. Needs further design work — belongs in spec refinement.

</deferred>

---

*Phase: 01-wiring-fixes*
*Context gathered: 2026-03-30*
