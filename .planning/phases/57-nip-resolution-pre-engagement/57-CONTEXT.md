# Phase 57: NIP Resolution & Pre-Engagement - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve the NIP number for the "Nostr Web Applets" specification and pre-engage key nostr ecosystem stakeholders before any spec writing begins. This is a community engagement and administrative phase, not code work.

</domain>

<decisions>
## Implementation Decisions

### NIP Number
- **D-01:** Use NIP-5D (not 5C). NIP-5C is claimed by fiatjaf's Scrolls PR#2281. Using 5D avoids political conflict entirely.

### Stakeholder Engagement
- **D-02:** User handles stakeholder outreach directly (nostr DMs, GitHub, etc.). Phase deliverable is documenting that pre-engagement occurred and capturing any feedback, not performing the outreach.
- **D-03:** Target stakeholders: hzrd149, arthurfranca, fiatjaf. At least two should receive an outline distinguishing NIP-5D scope from NIP-5A/5B.

### Scope Positioning
- **D-04:** NIP-5D is the "communication protocol layer" in a three-layer model: NIP-5A = hosting (nsites), NIP-5B = discovery (app listings), NIP-5D = runtime communication (sandboxed app ↔ shell protocol). This is the narrative for stakeholder framing and the NIP introduction section.

### PR#2287 Dependency
- **D-05:** Reference aggregate hashes as a dependency on NIP-5A (PR#2287). Do not inline the algorithm. Assume PR#2287 will be merged — it's already being adopted. The NIP says "aggregate hash as defined in NIP-5A" and moves on.

### Claude's Discretion
- Format of the scope outline document for stakeholder review
- How to document stakeholder feedback (simple notes in the phase directory)
- How to check and document current PR statuses (#2281, #2282, #2287)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Nostr Protocol
- `SPEC.md` — Current internal protocol specification (41KB+). The source material being distilled into NIP-5D.
- `.planning/research/STACK.md` — NIP format conventions, kind allocations, PR process, number conflict analysis
- `.planning/research/PITFALLS.md` — NIP rejection patterns, stakeholder dynamics, security review friction points
- `.planning/research/ARCHITECTURE.md` — NIP structure recommendations, capability negotiation model
- `.planning/research/FEATURES.md` — Table stakes vs differentiators for NIP content
- `.planning/research/FEATURES-CHANNELS.md` — Channel protocol feature landscape
- `.planning/research/SUMMARY.md` — Synthesized research findings

### External (check live status)
- `nostr-protocol/nips` PR#2281 — Scrolls (claims NIP-5C filename)
- `nostr-protocol/nips` PR#2282 — NIP-5B (app listings)
- `nostr-protocol/nips` PR#2287 — Aggregate hash extension to NIP-5A

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No code work in this phase — community engagement only

### Established Patterns
- N/A for this phase

### Integration Points
- Decisions here feed directly into Phase 58 (Core Protocol NIP) — the NIP number, positioning narrative, and PR dependency strategy all inform spec writing

</code_context>

<specifics>
## Specific Ideas

- Three-layer positioning (5A/5B/5D) should be usable as the opening paragraph of the NIP
- The scope outline for stakeholders should be concise enough to fit in a nostr DM or short GitHub comment
- Check PR#2281 status — if Scrolls has gone stale or been closed, 5C might be available (but 5D is the default plan)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 57-nip-resolution-pre-engagement*
*Context gathered: 2026-04-05*
