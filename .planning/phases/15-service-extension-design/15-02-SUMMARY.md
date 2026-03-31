---
phase: 15
plan: 2
status: complete
started: 2026-03-31
completed: 2026-03-31
---

# Summary: 15-02 — Document Service Discovery Protocol in SPEC.md

## What Was Built

Added a comprehensive "Service Discovery" section to SPEC.md documenting the kind 29010 protocol design, renumbered all subsequent sections, and updated cross-references.

### Key Changes

1. **New Section 11: Service Discovery [OPEN]** — Seven subsections covering:
   - 11.1 Overview — cooperative service discovery pattern
   - 11.2 Service Discovery Event (kind 29010) — REQ/EVENT/EOSE flow with s/v/d tag schema
   - 11.3 Service Message Routing — topic-prefix dispatch pattern
   - 11.4 Service Lifecycle — registration, discovery, interaction, cleanup
   - 11.5 Built-in vs Custom Services — standardized vs shell-specific
   - 11.6 ACL Considerations — deferred to future version
   - 11.7 Backwards Compatibility — entirely optional, graceful degradation

2. **Section renumbering** — Former sections 11-16 renumbered to 12-17:
   - Protocol Layers: 11 -> 12
   - ACL Capabilities: 12 -> 13
   - Security Model: 13 -> 14
   - Provisional NIP-C4: 14 -> 15
   - Minimal Viable Implementation: 15 -> 16
   - Implementation Notes: 16 -> 17

3. **Cross-reference updates** — "Sections 1-3 and 13" -> "Sections 1-3 and 14", "Section 12.2" -> "Section 13.2"

4. **Section 15.5: Service Discovery Kind** — Added kind 29010 entry to the provisional kinds table

5. **Section 17.3: Future Work** — Added three service-related items (implementation, per-service ACL, manifest dependency declaration)

6. **Section 12 (Protocol Layers)** — Added service discovery to the Layer 3 capabilities list

## Key Files

### Created
- (none)

### Modified
- `SPEC.md` — New Section 11, renumbered 12-17, cross-references updated, provisional kind entry, future work items

## Verification

- All 17 sections numbered sequentially with no gaps or duplicates
- All subsection numbers match their parent section
- Kind 29010 documented in both Section 11.2 and Section 15.5
- Cross-references updated (verified via grep)
- Service discovery REQ/EVENT/EOSE flow clearly specified
- Tag schema (s, v, d) defined with MUST/MAY requirements
- Backwards compatibility addressed (Section 11.7)
- Future Work references Section 11

## Self-Check: PASSED
