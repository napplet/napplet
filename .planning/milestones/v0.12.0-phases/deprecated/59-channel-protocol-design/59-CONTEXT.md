# Phase 59: NIP Simplification & NUB Framework Design - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Note:** This phase was pivoted from "Channel Protocol Design" to "NIP Simplification & NUB Framework Design." Old context/plans are superseded.

<domain>
## Phase Boundary

Reduce NIP-5D from 499 lines (v1, all capabilities inline) to ~180 lines (v2, core-only). Design the NUB (Napplet Unified Blueprint) dual-track proposal framework for interface and message protocol extensions. NIP-5D v1 remains at specs/NIP-5D.md as reference until v2 replaces it.

</domain>

<decisions>
## Implementation Decisions

### NIP-5D v2 Content
- **D-01:** v2 keeps: Transport (postMessage, sandbox policy, sender ID), Wire format tables (verb tables for REQ/EVENT/CLOSE/REGISTER/IDENTITY/AUTH), Authentication (REGISTER → IDENTITY → AUTH sequence diagram + prose), Discovery (`shell.supports(nubId)` as MUST), Security considerations, NUB reference section. Target ~180 lines.
- **D-02:** v2 removes: Relay Proxy details, all 6 Standard Capabilities sections (relay, IPC, storage, signer, nostrdb, services), Event Kinds table (kinds defined in NUB tracks, surfaced to NIP on approval). These move to NUB interface specs.
- **D-03:** v2 adds: NUB reference section explaining the dual-track proposal system and where to find interface/protocol specs.
- **D-04:** NIP-5D v1 (499 lines) stays at specs/NIP-5D.md until v2 is written, then v1 is archived or deleted.

### NUB Framework
- **D-05:** NUB = "Napplet Unified Blueprint." Two tracks in one system:
  - **NUB-WORD** (interfaces): NUB-RELAY, NUB-STORAGE, NUB-SIGNER, NUB-NOSTRDB, NUB-IPC, NUB-PIPES. One canonical spec per name. Defines `window.napplet.*` API contracts — what shells provide to napplets.
  - **NUB-NN** (message protocols): NUB-01, NUB-02, etc. Multiple competing specs allowed per domain. Defines event semantics — what napplets agree on with each other. Napplets negotiate via discovery.
- **D-06:** NUB-WORD vs NUB-NN boundary: interfaces are shell-provided AND define API surface; protocols are napplet-agreed AND define event semantics. Both criteria apply, edge cases judged pragmatically.

### NUB Governance
- **D-07:** NIP-style informal governance. Fork repo, add markdown, open PR. Community comments. Maintainer (dskvr) merges when it makes sense. No formal stages or review committee.

### Discovery Protocol
- **D-08:** NIP defines `shell.supports(nubId)` as MUST. Returns boolean. For checking both interface and protocol: `shell.supports("NUB-RELAY", "NUB-02")`.
- **D-09:** No wire protocol prescribed in the NIP for discovery. Kind 29010 remains in the runtime implementation but is not NIP-specified. How the shell resolves supports() is implementation detail.

### Kind Numbers
- **D-10:** Kind 22242 (AUTH) stays in the NIP. All other kinds (29001-29010) move to NUB interface specs. NIP has a placeholder table that grows as NUB proposals are approved.

### Claude's Discretion
- Exact section ordering in NIP-5D v2
- How to structure the NUB reference section in the NIP (brief paragraph + link, or more detailed)
- NUB governance document format and structure
- Whether to create NUB specs in specs/nubs/ directory or a separate location

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Material
- `specs/NIP-5D.md` — NIP-5D v1 (499 lines). Source for v2 distillation. Keep: transport, wire format, AUTH, security. Remove: relay proxy, capabilities, event kinds.
- `.planning/phases/58-core-protocol-nip/58-CONTEXT.md` — Phase 58 style decisions (one example per verb, sequence diagram for AUTH, defensive security section). These carry forward to v2.

### NUB Design Input
- `.planning/research/ARCHITECTURE.md` — NIP structure, MUST/MAY model, capability negotiation patterns
- `.planning/research/FEATURES-CHANNELS.md` — Pipe protocol design (becomes NUB-PIPES)
- `.planning/phases/59-channel-protocol-design/59-CONTEXT.md` (old) — Pipe naming, lifecycle verbs, broadcast decisions. These carry into NUB-PIPES spec.

### Prior Decisions
- `.planning/phases/57-nip-resolution-pre-engagement/57-CONTEXT.md` — NIP-5D number, three-layer positioning

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `specs/NIP-5D.md` — v1 is the starting point for v2 distillation. Cut sections, don't rewrite from scratch.
- `packages/core/src/index.ts` — BusKind enum, kind constants. These become the source for NUB interface spec kind numbers.

### Established Patterns
- NIP-5D v1 already uses setext headings, draft badge, NIP-01 references correctly. v2 inherits this formatting.
- Kind 29010 discovery implementation exists in runtime. NUB-RELAY etc. specs can reference the existing implementation.

### Integration Points
- `shell.supports()` needs to replace or wrap the existing `window.napplet.services.has()` API
- NUB specs reference the same window.napplet.* namespaces already implemented in @napplet/shim

</code_context>

<specifics>
## Specific Ideas

- NIP-5D v2 should be achievable by surgically removing sections from v1 and adding a NUB reference section — not a full rewrite
- NUB specs should be self-contained markdown files that could eventually live in a github.com/napplets/nubs repo
- The pipe protocol decisions from the old Phase 59 context (PIPE_OPEN/PIPE_ACK/PIPE/PIPE_CLOSE/PIPE_BROADCAST, targeting by dTag) carry directly into NUB-PIPES

</specifics>

<deferred>
## Deferred Ideas

- NUB repo creation on github.com/napplets — design the framework first
- NUB message protocol specs (NUB-01 feed, NUB-02 chat, etc.) — interface specs first
- Pipe implementation in packages — NUB-PIPES spec first, implement in future milestone
- NUB community onboarding documentation

</deferred>

---

*Phase: 59-nip-simplification-nub-framework (pivoted from 59-channel-protocol-design)*
*Context gathered: 2026-04-05*
