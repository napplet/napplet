# Phase 84: Spec Gap Inventory - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Discussed

<domain>
## Phase Boundary

Create an exhaustive inventory of every function, type, constant, and behavior in the codebase that is not covered by NIP-5D or any NUB spec. Each entry must include location, purpose, evidence of no spec backing, and a recommendation category. The document must be decision-ready for Phase 86.

</domain>

<decisions>
## Implementation Decisions

### Document Format
- **D-01:** Output file is `.planning/SPEC-GAPS.md` — top-level planning artifact, survives phase archival
- **D-02:** Format is summary table at top, then a full prose section per gap entry with evidence, code snippets, and reasoning
- **D-03:** Summary table columns: ID, What, Where (file:line), Category, One-line description

### Recommendation Categories
- **D-04:** Four categories: `future-nub`, `unknown`, `superseded`, `shell-only`
  - `future-nub` — Functionality that will become NUB messages (PR coming or planned)
  - `unknown` — Functionality with no clear home yet (may become NUB, may be dropped, needs decision)
  - `superseded` — Functionality replaced by existing NUB messages or removed protocol features
  - `shell-only` — Functionality that is a shell implementation concern, not an SDK/spec concern

### TOPICS Breakdown
- **D-05:** TOPICS constant (GAP-02) gets per-topic categorization, not one blanket category:
  - `future-nub`: `chat:open-dm`, `profile:open`, `stream:channel-switch`, `stream:current-context-get`, `stream:current-context`
  - `unknown`: `keybinds:*` (6 topics), `audio:*` (4 topics), `wm:focused-window-changed`, `shell:config-*` (3 topics), `relay:scoped-*` (3 topics)
  - `superseded`: `STATE_*` (6 topics — replaced by storage.* NUB), `AUTH_IDENTITY_CHANGED` (AUTH removed)

### Gap Items
- **D-06:** The 8 gap items from REQUIREMENTS.md are the starting point. If the audit uncovers additional gaps during documentation, add them to the inventory with new GAP-IDs.

### Claude's Discretion
- Prose depth per entry — enough evidence that the spec author can make an informed decision
- Code snippet selection — include the most relevant lines, not entire files
- Cross-referencing between gaps where they share context (e.g., keyboard.forward and hotkey:forward capability)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec files
- `specs/NIP-5D.md` — The protocol spec that defines what is spec-backed
- `packages/nubs/*/src/types.ts` — NUB message type definitions (spec-backed reference)

### Gap targets (files to audit)
- `packages/core/src/types.ts` — Capability type, ALL_CAPABILITIES (GAP-01)
- `packages/core/src/topics.ts` — TOPICS constant, 28 entries (GAP-02)
- `packages/core/src/constants.ts` — SHELL_BRIDGE_URI, REPLAY_WINDOW_SECONDS, PROTOCOL_VERSION (GAP-03, GAP-04, GAP-05)
- `packages/shim/src/nipdb-shim.ts` — window.nostrdb proxy (GAP-06)
- `packages/shim/src/keyboard-shim.ts` — keyboard.forward protocol (GAP-07)
- `packages/nubs/ifc/src/types.ts` — IFC channel types, lines 106-207 (GAP-09)

### Requirements
- `.planning/REQUIREMENTS.md` — GAP-01 through GAP-09 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Key facts
- NIP-5D.md is 116 lines — short spec, easy to cross-reference
- NUB specs exist as draft PRs in napplet/nubs repo — theme NUB is spec-backed despite not being in NIP-5D
- The 5 NUB domains (relay, signer, storage, ifc, theme) are the spec-backed protocol messages
- Everything using the old NIP-01 array wire format or kind 29003 topics is pre-v4 era
- ACL/Capability system was extracted to separate repo in v0.13.0 but types remain in core

### Integration Points
- SPEC-GAPS.md will be consumed by Phase 86 (Decision Gate) to present choices to the user
- The document must be self-contained — reader shouldn't need to open source files to understand each gap

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the format decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 84-spec-gap-inventory*
*Context gathered: 2026-04-08*
