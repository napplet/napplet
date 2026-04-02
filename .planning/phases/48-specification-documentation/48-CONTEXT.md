# Phase 48: Specification & Documentation - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Update SPEC.md to document the Phase 46 protocol changes: new REGISTER → IDENTITY → AUTH handshake (§2), pubkey-free storage scoping (§5), and delegated key security model (§14). Surgical edits only — no new sections unless the existing structure can't accommodate the changes.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Surgical SPEC.md updates to 3 existing sections. Same approach as Phase 44 (v0.8.0 docs).
- **D-02:** Content is determined by what Phase 46 implements. All 8 decisions from Phase 46 CONTEXT.md (D-01 through D-08) are the source of truth for what to document.
- **D-03:** No migration guide — same rationale as Phase 44 (no external consumers yet).

### Claude's Discretion

- Exact placement within each section
- Whether to add subsections or extend existing ones
- Message format examples for REGISTER and IDENTITY

</decisions>

<canonical_refs>
## Canonical References

- `.planning/REQUIREMENTS.md` — DOC-01, DOC-02, DOC-03
- `.planning/phases/46-*/46-CONTEXT.md` — Source of truth for all protocol decisions
- `SPEC.md` §2 — Authentication Handshake (add REGISTER/IDENTITY before NIP-42)
- `SPEC.md` §5 — Storage Proxy (update scoping model)
- `SPEC.md` §14 — Security Model (add delegated key threat analysis)

</canonical_refs>

<code_context>
## Existing Code Insights

- SPEC.md is ~1400 lines with 17 sections
- §2 currently documents ephemeral keypair AUTH — needs REGISTER/IDENTITY prepended
- §5 currently scopes storage by `pubkey:dTag:aggregateHash` — pubkey removal
- §14 lists threat model — add delegated key exfiltration analysis

</code_context>

<specifics>
## Specific Ideas

No specific requirements — content flows from Phase 46 implementation.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 48-specification-documentation*
*Context gathered: 2026-04-02*
