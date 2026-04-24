# Phase 135: Cross-Repo Spec Work - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Smart discuss — 2 grey areas resolved with user

<domain>
## Phase Boundary

This phase authors four draft spec documents in the public `napplet/nubs` repo and amends the in-repo `specs/NIP-5D.md` to return it to NUB-neutral transport-only purity. No SDK code is written in this phase; no manifest tag emission, no shim installers, no vite-plugin changes. Deliverables are spec prose only.

**In scope:**
- Four spec drafts in napplet/nubs (local drafts at `.planning/phases/135-cross-repo-spec-work/drafts/` mirroring v0.28.0 Phase 132 precedent; human opens the cross-repo PR):
  - `NUB-CONNECT.md` — user-gated direct network access via manifest `connect` tags; cites `NUB-CLASS-2` by name as the posture triggered by presence of `connect` tags; does NOT internally redefine Class 1 / Class 2
  - `NUB-CLASS.md` — establishes the NUB-CLASS track: defines the class concept in the napplet ecosystem, defines the wire message `class.assigned` (shell → napplet at iframe ready, one terminal envelope per lifecycle, payload `{ class: number }`), defines the napplet-side runtime surface `window.napplet.class` (`number | undefined`), defines the capability `nub:class`, includes an internal template + authoring guidance section for sub-track members (`NUB-CLASS-$N`)
  - `NUB-CLASS-1.md` — the strict / no-user-declared-origins posture (CSP with `connect-src 'none'`, no consent prompt)
  - `NUB-CLASS-2.md` — the user-approved explicit-origin CSP posture (`connect-src <granted-origins>`, consent prompt, grant keyed on `(dTag, aggregateHash)`)
- NIP-5D amendment in `specs/NIP-5D.md` — remove/generalize the "Browser-Enforced Resource Isolation" subsection; NIP-5D returns to transport-only; single generic paragraph about NUB-defined classes with NO NUB names and NO class names inline
- Zero-grep hygiene across all four cross-repo drafts

**Out of scope (future phases):**
- SDK code (Phases 136-139)
- Vite-plugin changes (Phase 138)
- Shell-deployer policy docs (Phase 140)
- Documentation sweep (Phase 141)
- Verification tests (Phase 142)

</domain>

<decisions>
## Implementation Decisions

### Grey Area 1/2: NIP-5D Amendment (NUB-neutral) — RESOLVED

- **Current "Browser-Enforced Resource Isolation" subsection disposition:** Remove entirely. v0.28.0 prose names NUB-RESOURCE, strict-CSP specifics, `perm:strict-csp` — all NUB-flavored. NIP-5D returns to transport-only.
- **Replacement paragraph in NIP-5D:** Add one paragraph to Security Considerations noting abstractly that "NUBs MAY define napplet classes with different security postures delivered through shell-controlled HTTP response headers; class taxonomy and delivery mechanics are out of scope for this NIP." No NUB names, no class names, no CSP directives inline.
- **`perm:strict-csp` capability language in NIP-5D:** Remove the capability-advertisement example that names `perm:strict-csp` (it's NUB-flavored). Keep only the generic `shell.supports(...)` table (nub:/perm:/svc: prefixes as an example pattern).

### Grey Area 2/2: napplet/nubs Class-Track Artifacts — RESOLVED (via architectural pivot)

- **Architecture chosen:** NUB-CLASS as a first-class NUB that establishes its own sub-track.
- **Class naming:** `NUB-CLASS-$N` (e.g., `NUB-CLASS-1.md`, `NUB-CLASS-2.md`). Everything stays under the `NUB-` namespace.
- **Initial track members:** `NUB-CLASS-1.md` (strict baseline — no user-declared network origins, CSP `connect-src 'none'`) and `NUB-CLASS-2.md` (user-approved explicit-origin CSP — `connect-src <granted-origins>`).
- **Template / guidance:** Single internal section within `NUB-CLASS.md` (not a separate template document). Covers what a class spec contains (CSP posture, manifest prerequisites, shell responsibilities, security considerations, test vectors), naming rules, and how NUBs cite classes.
- **Class document shape:** Mirror `NUB-*.md` conventions (setext heading, status banner, description, core properties, security considerations, references).
- **NUB-CLASS has a wire:** `class.assigned` envelope (shell → napplet at iframe ready, one terminal envelope per lifecycle, payload `{ class: number }`). This is the principled mechanism for the shell — as class authority — to deterministically communicate the napplet's assigned class. Napplets read `window.napplet.class` which is populated from the wire.
- **NUB-CLASS and NUB-CONNECT are independent (voluntary NUBs):**
  - `window.napplet.connect.granted` and `.origins` remain on NUB-CONNECT — self-sufficient, works in shells without NUB-CLASS.
  - `window.napplet.class` lives on NUB-CLASS — undefined when shell doesn't implement the NUB or before wire arrives.
  - Cross-NUB invariant documented as shell responsibility (not shim-side collapse): in shells implementing both, `class === 2` iff `connect.granted === true`.
- **NUB-CONNECT's relationship to the classes:** NUB-CONNECT cites `NUB-CLASS-2` by name ("a napplet declaring any `connect` tag takes on the `NUB-CLASS-2` posture defined in `NUB-CLASS-2.md`"). CLASS-1 is the default posture for napplets with no network declarations. NUB-CONNECT does not redefine Class 1 / Class 2.
- **Local drafts location:** `.planning/phases/135-cross-repo-spec-work/drafts/` mirrors v0.28.0 Phase 132 precedent. Contents: `NIP-5D-AMENDMENT.md` (or in-repo patch), `NUB-CONNECT.md`, `NUB-CLASS.md`, `NUB-CLASS-1.md`, `NUB-CLASS-2.md`.

### Claude's Discretion

All specific spec prose, example envelope formats beyond the single wire message shape, test vector content, and normative RFC-2119 language placement are at Claude's discretion during planning/execution. The four-document structure, naming convention, wire shape, and NUB-CLASS's ownership of the template/guidance are locked.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `docs/superpowers/specs/2026-04-21-napplet-network-permission-design.md` — full design document for NUB-CONNECT; most of the NUB-CONNECT draft can be derived from this. Note that the design doc predates the NUB-CLASS pivot and uses Class 1 / Class 2 language inline — needs adaptation to cite NUB-CLASS-2 instead.
- `.planning/milestones/v0.28.0-phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md` — template for what a full NUB spec looks like (structural precedent: setext heading, description, API surface, wire protocol, security considerations, error codes, references)
- `specs/SHELL-RESOURCE-POLICY.md` — structural template for Phase 140's shell-deployer policy docs (out of Phase 135 scope, but the NUB-CLASS and NUB-CONNECT drafts should be written knowing a deployer checklist companion will exist)
- `specs/NIP-5D.md` — current version with "Browser-Enforced Resource Isolation" subsection at lines 115-130 that needs removal/generalization

### Established Patterns

- **Cross-repo drafts in `.planning/phases/<N>-<slug>/drafts/`**: v0.28.0 Phase 132 precedent — authored locally, human opens PR to napplet/nubs repo manually
- **Zero-grep hygiene**: v0.28.0 established `grep -r -E '@napplet/|kehto|hyprgate|packages/(nub\|shim\|sdk\|vite-plugin)' <drafts>` returns zero — enforced via automated check
- **Setext headings + status banner + description**: canonical NUB-*.md shape from NUB-RESOURCE, NUB-CONFIG, NUB-IDENTITY, etc.
- **Wire message naming**: `<domain>.<action>` per NIP-5D; `class.assigned` follows this pattern

### Integration Points

- Four drafts at `.planning/phases/135-cross-repo-spec-work/drafts/` (local)
- `specs/NIP-5D.md` amendment (in-repo)
- Cross-repo `napplet/nubs` PR opening deferred to human (blocker carried in STATE.md)

</code_context>

<specifics>
## Specific Ideas

- The design doc (`docs/superpowers/specs/2026-04-21-napplet-network-permission-design.md`) should NOT be consulted verbatim for NUB-CONNECT prose — it was written before the NUB-CLASS pivot and uses Class-1/Class-2 terminology as first-class concepts. NUB-CONNECT.md in napplet/nubs must instead cite NUB-CLASS-2 by name and let NUB-CLASS-1/2 own the posture definitions.
- `canonical aggregateHash fold procedure` (SPEC-02) must be normative pseudocode with at least one copy-pasteable conformance fixture — a shell implementer writing their own normalizer MUST be able to produce byte-identical hashes using only the procedure in the spec.
- `IDN direction of authority` (SPEC-03): build converts UTF-8 → Punycode; shell rejects non-Punycode. Test vectors should include at least one multi-byte-UTF-8 original + its expected Punycode form.
- Template / authoring guidance for `NUB-CLASS-$N` (part of SPEC-04) should include naming rules (integers ascend, no reuse, no skipping without spec-level justification), content structure (CSP posture, manifest prerequisites, shell responsibilities, security considerations, test vectors), and citation conventions (NUBs reference `NUB-CLASS-$N` by the file name, not by "Class N" as an abstract reference).

</specifics>

<deferred>
## Deferred Ideas

- `@napplet/nub/class` subpath code (Phase 137 scope)
- Shell-deployer policy docs (Phase 140 scope — `SHELL-CONNECT-POLICY.md`, `SHELL-CLASS-POLICY.md`)
- Documentation sweep for README + SKILL.md (Phase 141 scope)
- Verification tests for class wire (Phase 142 scope — VER-11, VER-12, VER-13)
- Dynamic mid-session class re-assignment (out of v0.29.0 scope entirely — at-most-one-terminal-envelope-per-lifecycle is an explicit constraint)
- Additional NUB-CLASS-$N postures beyond Class 1 and Class 2 (future NUBs that trigger new classes will author their own sub-track members)

</deferred>
