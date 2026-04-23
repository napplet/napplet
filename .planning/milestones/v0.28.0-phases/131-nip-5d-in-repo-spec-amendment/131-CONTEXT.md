# Phase 131: NIP-5D In-Repo Spec Amendment - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (single-file spec amendment — discuss skipped; locked content)

<domain>
## Phase Boundary

Add a Security Considerations subsection to `specs/NIP-5D.md` documenting the v0.28.0 strict-CSP security posture:

1. Strict-CSP posture as **SHOULD** (default but waivable by permissive dev shells)
2. `perm:strict-csp` as the shell-side capability identifier
3. Resource NUB as the canonical fetch path for napplet-bound network-sourced bytes
4. Reaffirmation: `sandbox="allow-scripts"` is the only required token; `allow-same-origin` MUST NOT be added (closes service-worker bypass vector — Pitfall 5)
5. Cross-references to NUB-RESOURCE in the public `napplet/nubs` repo (link by name, not URL since the spec doesn't exist yet)

NO @napplet/* private package mentions (this is a public-facing spec).

NO sidecar policy specifics (Phase 132 spec amendment territory).

</domain>

<decisions>
## Implementation Decisions

### Normative Levels (LOCKED — from milestone scoping)

- Strict CSP enforcement: **SHOULD**
- `perm:strict-csp` capability advertisement: **SHOULD** when shell enforces strict CSP
- `allow-same-origin` prohibition: **MUST NOT** (already implicit; reaffirm)
- Resource NUB for network-sourced bytes: **SHOULD** be the canonical path

### Spec Framing

- Add as a new subsection within an existing Security Considerations section (or create one if absent)
- Use NIP markdown conventions (setext headings if existing spec uses them; otherwise atx)
- Cross-reference NUB-RESOURCE as "the napplet/nubs registry NUB-RESOURCE specification" — no URL, no `@napplet/*` reference
- Reference NIP-5A and NUB-RELAY where appropriate (existing references in the spec)

### Claude's Discretion

- Exact heading text for the new subsection ("Browser-Enforced Resource Isolation", "Strict CSP Posture", etc.)
- Placement within Security Considerations
- Whether to add an example HTTP header / meta tag snippet (recommend: YES, one minimal example)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `specs/NIP-5D.md` — current NIP-5D spec; check existing Security Considerations section structure
- Read existing references and citation style before authoring new ones

### Established Patterns

- NIPs use plain markdown
- Heading style is consistent within a spec
- No @napplet/* references in public specs

### Integration Points

- Phase 132 will draft NUB-RESOURCE in the napplet/nubs repo; this amendment cross-references it
- Phase 133 documentation sweep references this amendment

</code_context>

<specifics>
## Specific Ideas

Plan should fit in 1 plan with 1-2 tasks:
- Task 1: amend specs/NIP-5D.md with the Security Considerations subsection
- Optionally Task 2: zero-grep verify (no @napplet/* leakage) + lint check

Acceptance criteria:
- `specs/NIP-5D.md` contains the new subsection with the strict-CSP SHOULD language
- `specs/NIP-5D.md` contains the `perm:strict-csp` capability identifier
- `specs/NIP-5D.md` reaffirms `sandbox="allow-scripts"` and forbids `allow-same-origin`
- Zero matches for `@napplet/` in `specs/NIP-5D.md` (public-repo hygiene preserved)
- Cross-reference to NUB-RESOURCE present (by name, not URL)

</specifics>

<deferred>
## Deferred Ideas

- **NUB-RESOURCE specification itself** — Phase 132 (cross-repo PR to napplet/nubs)
- **NUB-RELAY sidecar amendment in spec** — Phase 132
- **Implementation guidance / shell deployer checklist** — Phase 133 documentation sweep

</deferred>
