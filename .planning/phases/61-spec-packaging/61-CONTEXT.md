# Phase 61: Spec Packaging - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename existing SPEC.md to RUNTIME-SPEC.md, finalize NIP-5D in nostr-protocol/nips markdown format, and list reference implementations. Mechanical packaging — all content comes from Phases 58 and 59.

</domain>

<decisions>
## Implementation Decisions

### SPEC.md Rename
- **D-01:** Rename `SPEC.md` → `RUNTIME-SPEC.md`. Add a header noting it is the internal/runtime reference document, not the NIP standard. Update any internal references (CLAUDE.md, READMEs) that point to SPEC.md.

### NIP Format
- **D-02:** NIP-5D file uses nostr-protocol/nips conventions: setext headings, `draft` `optional` badges, correct event kind table format, References section. Target under 500 lines.

### Implementations Section
- **D-03:** List two implementations: @napplet/shim + @napplet/shell (this SDK) and hyprgate (reference shell at github.com/sandwichfarm/hyprgate). Include links.

### Claude's Discretion
- Everything else — this is mechanical packaging work. Format, structure, cross-references, header text for RUNTIME-SPEC.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### NIP Content (from prior phases)
- `.planning/phases/58-core-protocol-nip/58-CONTEXT.md` — Spec style decisions
- `.planning/phases/59-channel-protocol-design/59-CONTEXT.md` — Pipe wire format decisions

### Format Reference
- `.planning/research/STACK.md` — NIP format conventions, kind table format, PR process

### Files to Modify
- `SPEC.md` — rename to RUNTIME-SPEC.md, add internal reference header
- `CLAUDE.md` — update SPEC.md references
- Package READMEs — update any SPEC.md references

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- N/A — this is document packaging

### Established Patterns
- N/A

### Integration Points
- CLAUDE.md references SPEC.md in project overview
- Package READMEs may reference SPEC.md
- skills/ directory files may reference SPEC.md sections

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward packaging.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 61-spec-packaging*
*Context gathered: 2026-04-05*
