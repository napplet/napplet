# Phase 86: Decision Gate - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Auto-generated (interactive decision phase)

<domain>
## Phase Boundary

Present the complete SPEC-GAPS.md inventory to the spec author. For each gap item, capture a decision: drop from code, amend spec, defer, or keep as shell-only. Record all decisions in a structured format.

</domain>

<decisions>
## Implementation Decisions

### Interaction Format
- **D-01:** Present each gap with its evidence from SPEC-GAPS.md, then ask for a verdict
- **D-02:** Decision options per item: `drop` (remove from code), `amend-spec` (add to NIP-5D or create NUB spec), `defer` (keep for now, revisit later), `keep-shell-only` (shell implementation concern, not SDK)
- **D-03:** Record all decisions in SPEC-GAPS.md itself by adding a "Decision" column/section to each entry

### Output
- **D-04:** Updated SPEC-GAPS.md with decisions recorded per entry
- **D-05:** Summary of decisions by category (how many dropped, how many amend, etc.)

### Claude's Discretion
- Ordering of gap presentation (can group related items)
- Level of evidence shown per item (full prose section or summary — user can ask for more detail)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Input
- `.planning/SPEC-GAPS.md` — the gap inventory produced by Phase 84 (MUST exist before this phase runs)

### Requirements
- `.planning/REQUIREMENTS.md` — DECIDE-01 requirement definition

</canonical_refs>

<code_context>
## Existing Code Insights

### Key facts
- This phase depends on Phase 84 (SPEC-GAPS.md) and Phase 85 (clean docs)
- The gap inventory contains 8 items (GAP-01 through GAP-07, GAP-09)
- GAP-02 (TOPICS) has per-topic sub-categorization that needs per-topic decisions
- Phase is interactive — requires user input for every decision

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward decision capture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 86-decision-gate*
*Context gathered: 2026-04-08*
