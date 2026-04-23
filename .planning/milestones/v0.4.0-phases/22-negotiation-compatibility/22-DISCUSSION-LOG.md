# Phase 22: Negotiation & Compatibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 22-negotiation-compatibility
**Areas discussed:** Manifest reading flow, CompatibilityReport shape, Undeclared usage consent UX

---

## Manifest Reading Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Shell reads manifest | Shell reads requires from NIP-5A manifest event (signed, authoritative). Extends existing manifest cache. | ✓ |
| Napplet self-reports | Shim includes requires in AUTH tags. Simpler but napplet controls declaration. | |

**User's choice:** Shell reads manifest.
**Notes:** User chose after seeing pros/cons with rationale. Consistent with declarative-first architecture — the manifest IS the declaration. Enables pre-load check (COMPAT-03). Manifest already cached for aggregate hash.

---

## CompatibilityReport Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (available/missing/compatible) | No incompatible array since matching is name-only. | ✓ |

**User's choice:** Minimal report.

---

## Undeclared Usage Consent UX

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse ConsentRequest | Extend onConsentNeeded with type discriminator. One callback for all consent. | (Claude's pick) |
| Dedicated hook | New onUndeclaredServiceUsage callback. Cleaner separation. | |

**User's choice:** "You decide" — Claude chose to reuse ConsentRequest pattern with a type field for consistency with existing shell host integration.

---

## Claude's Discretion

- Exact lifecycle timing of compatibility check
- Whether report is also available to the napplet
- Manifest cache extension details
- ConsentRequest type discriminator design
