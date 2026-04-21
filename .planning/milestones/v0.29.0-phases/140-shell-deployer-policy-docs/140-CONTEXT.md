# Phase 140: Shell-Deployer Policy Docs - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Infrastructure-like — smart discuss skipped (no architectural decisions open; authoring prose against already-locked spec surfaces)

<domain>
## Phase Boundary

Author two non-normative shell-deployer checklist documents in `specs/`. Both mirror the structural pattern of `specs/SHELL-RESOURCE-POLICY.md` (status banner → why-this-exists → per-policy sections → audit checklist → references). Non-normative companions to the Phase 135 drafts (NUB-CONNECT, NUB-CLASS); each doc cites its corresponding NUB spec as the normative source.

**In scope:**
- `specs/SHELL-CONNECT-POLICY.md` — shell-deployer checklist for NUB-CONNECT
- `specs/SHELL-CLASS-POLICY.md` — shell-deployer checklist for NUB-CLASS

**SHELL-CONNECT-POLICY.md sections (from REQUIREMENTS.md POLICY-01..10):**
- Status / Why-this-exists (cites `NUB-CONNECT` as normative spec; marks itself non-normative)
- HTTP-responder precondition with per-delivery-mode pitfalls (direct / HTTP proxy / `blob:` URL with HTML rewrite / `srcdoc`)
- Residual meta-CSP scan requirement (parser-based example, 5-fixture conformance bundle — attribute-order variations, CDATA/comments, quoted variants)
- Mixed-content reality check (`http:` from HTTPS shell silently blocks except localhost/127.0.0.1 secure-context exceptions)
- Cleartext policy + `connect:scheme:http` / `connect:scheme:ws` advertisement; consent UI MUST visibly warn when granting cleartext
- Grant-persistence composite key `(dTag, aggregateHash)`; napplet rebuild → new aggregateHash → auto-invalidate grant
- Revocation UI requirement (DENIED-not-deleted semantics)
- Consent-prompt language (send AND receive + shell-blind posture; "this napplet can talk with foo.com however it wants")
- Explicit N/A items (private-IP block, MIME sniffing, SVG raster caps, redirect limits — all NUB-RESOURCE concerns)
- Audit checklist with deployer-sign-off checkboxes for every MUST item
- Zero-grep hygiene: no `@napplet/*` references

**SHELL-CLASS-POLICY.md sections (from REQUIREMENTS.md POLICY-11..16):**
- Status / Why-this-exists (cites `NUB-CLASS` as normative spec; marks itself non-normative)
- Class-determination authority — shell is sole authority on what class a napplet is assigned; class derived from class-contributing NUBs in manifest + user-consent outcomes; MUST send `class.assigned` wire at iframe ready with at-most-one terminal envelope per napplet lifecycle
- Wire timing — `class.assigned` MUST be sent AFTER iframe signals readiness (shim bootstrap complete) and BEFORE napplet branches on class; recommend coupling to shim ready signal
- Cross-NUB invariant (shell responsibility) — in shells implementing BOTH `nub:connect` and `nub:class`: `class === 2` iff `connect.granted === true` at the time `class.assigned` is sent; shells MUST NOT emit disagreeing state
- Revocation UX for Class-2 napplets — revoking a connect grant MUST trigger napplet reload with `class.assigned: { class: 1 }` OR shell-side refusal-to-serve until user re-approves; mid-session dynamic re-classification is out of v0.29.0 scope
- Audit checklist with deployer-sign-off checkboxes for every MUST item
- Zero-grep hygiene: no `@napplet/*` references

**Out of scope:**
- Documentation sweep (Phase 141 — READMEs + SKILL.md)
- Verification tests (Phase 142)

</domain>

<decisions>
## Implementation Decisions

### Locked via structural precedent and spec drafts

- **Structural template:** `specs/SHELL-RESOURCE-POLICY.md` — status banner at top, markdown H2 sections, audit checklist at end, references section. Both new policy docs mirror this shape exactly.
- **Non-normative framing:** both docs self-label as non-normative deployer checklists; cite `NUB-CONNECT` / `NUB-CLASS` as their normative source. Not NIPs.
- **Citation style:** reference specs by file name (`NUB-CONNECT`, `NUB-CLASS`), not by "Class 1" or "CONNECT" as abstract names. Matches Phase 135 convention.
- **Checklist format:** every MUST item in the prose gets a matching `- [ ]` checkbox in the audit section; deployers can tick as they verify.
- **Zero-grep hygiene:** both docs live in the private SDK repo but MUST remain citation-safe for the NUBs track (no `@napplet/*` references, no `kehto`/`hyprgate`, no private package paths).

### Claude's Discretion

All prose-level decisions (exact wording, example code blocks for the residual meta-CSP parser, number of conformance fixtures beyond the required 5) are at Claude's discretion. The section titles and content categories are locked above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `specs/SHELL-RESOURCE-POLICY.md` — canonical structural template. Read it first; mirror the shape.
- `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` — normative spec for the SHELL-CONNECT-POLICY companion
- `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CLASS.md` — normative spec for the SHELL-CLASS-POLICY companion
- `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CLASS-1.md` + `NUB-CLASS-2.md` — define the Class-1 / Class-2 postures that SHELL-CLASS-POLICY references

### Established Patterns

- SHELL-*-POLICY.md docs are shell-deployer-facing; they translate normative spec MUSTs into operator-actionable checklists
- Doc length: SHELL-RESOURCE-POLICY.md is ~200 lines; both new docs likely similar size
- `grep -rE '@napplet/|kehto|hyprgate' specs/` returns 0 after this phase

</code_context>

<specifics>
## Specific Ideas

- SHELL-CONNECT-POLICY's residual-meta-CSP scan section should include an example using an HTML parser (not regex) — the v0.28.0 `assertMetaIsFirstHeadChild` regex approach is acceptable for vite-plugin's build-time scan, but shell-side runtime scanning of arbitrary napplet HTML warrants the parser-based approach for correctness.
- SHELL-CLASS-POLICY's cross-NUB invariant section should include a concrete scenario table: "User approves connect → `{ class: 2, granted: true }`" / "User denies → `{ class: 1, granted: false }`" / "No connect tags in manifest → `{ class: 1, granted: false }`" / "Shell doesn't implement nub:connect → class-2 napplets refuse to load".
- Both docs are plain Markdown (not setext, not the NIP-5D style) — SHELL-RESOURCE-POLICY.md uses ATX headings.

</specifics>

<deferred>
## Deferred Ideas

- Integration tests for the policies (Phase 142 VER scope)
- Downstream shell repo's actual implementation against these policies (out of this milestone entirely — Option B carries forward)

</deferred>
