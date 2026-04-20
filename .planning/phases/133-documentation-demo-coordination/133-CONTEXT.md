# Phase 133: Documentation + Demo Coordination - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (documentation sweep — discuss skipped)

<domain>
## Phase Boundary

Update 5 package READMEs + skill + create shell-deployer policy checklist + delegate demos:

1. **DOC-01** — `packages/nub/README.md` updated with the new `/resource` subpath documentation (4 schemes, single primitive, scheme-pluggable URL space)
2. **DOC-02** — `packages/shim/README.md` updated for resource NUB integration (`window.napplet.resource.bytes(url)`)
3. **DOC-03** — `packages/sdk/README.md` updated for `resource` namespace + `RESOURCE_DOMAIN` const + 11 type re-exports
4. **DOC-04** — `packages/vite-plugin/README.md` updated for `strictCsp?: boolean | StrictCspOptions` option with dev/prod CSP behavior + 10-directive baseline
5. **DOC-05** — Root `README.md` updated for v0.28.0 surface (resource NUB + browser-enforced isolation framing)
6. **DOC-06** — `skills/build-napplet/SKILL.md` updated: napplets MUST use `napplet.resource.bytes(url)` instead of `<img src=externalUrl>` or `fetch()`
7. **DOC-07** — Author shell-deployer resource policy checklist (location: probably `specs/SHELL-RESOURCE-POLICY.md` or `docs/shell-resource-policy.md` — executor's choice). Covers: private-IP block ranges, sidecar opt-in semantics, SVG rasterization caps, MIME allowlist, redirect chain limits.
8. **DEMO-01** — Coordination note in PROJECT.md and NUB-RESOURCE draft delegating v0.28.0 demo napplets to downstream shell repo (per Option B scope decision)

NO source code changes. NO new specs (those are Phase 132). Pure prose sweep.

</domain>

<decisions>
## Implementation Decisions

### Scope (LOCKED)

- 8 files modified or created across this repo
- Each README is updated incrementally — preserve existing content (changelog history, prior NUB sections, code examples) byte-stable except where v0.28.0 surface needs adding
- Public-repo hygiene: root README and `skills/build-napplet/SKILL.md` are public-facing; ensure no `kehto`/`hyprgate` references slip in (already clean per repo policy)

### Shell-Deployer Policy Checklist (LOCKED content from CONTEXT.md and Phase 132 spec drafts)

A new doc covering exactly:
- Private-IP block list (RFC1918, loopback, link-local, unique-local, cloud metadata 169.254.169.254) at DNS-resolution time
- Sidecar opt-in semantics (default OFF, per-event-kind allowlist guidance)
- SVG rasterization caps (5 MiB / 4096×4096 / 2s, sandboxed Worker no network)
- MIME byte-sniffing allowlist
- Redirect chain limits with per-hop re-validation

This doc lives in this repo. It's a SHELL implementer's guide, not a spec — references NUB-RESOURCE (in napplet/nubs) for the normative wire shape.

### Demo Coordination (LOCKED — Option B per milestone scoping)

- PROJECT.md update: add a coordination note explicitly delegating v0.28.0 demo napplets (profile viewer, feed-with-images, scheme-mixed consumer) to the downstream shell repo
- NUB-RESOURCE draft (`.planning/phases/132/drafts/NUB-RESOURCE.md`) — add an "Implementation note" section with the same delegation
- This repo ships only the wire + SDK surface

### Claude's Discretion

- Exact location of shell-deployer policy doc (`specs/SHELL-RESOURCE-POLICY.md`, `docs/shell-resource-policy.md`, or other — executor picks; conventional README link added)
- Exact placement of new sections within READMEs (typically: append to existing "What's New" or top-level sections; don't restructure)
- JSDoc / code example tone
- Whether to wholesale replace any old sections referring to direct fetch vs adding new sections

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- 5 package READMEs already exist (`README.md` in each of `packages/{core,shim,sdk,vite-plugin,nub}` plus root README)
- `skills/build-napplet/SKILL.md` already exists; previous milestones (v0.27.0) updated it for IFC terminology — mirror that surgical-update style
- `.planning/phases/132/drafts/NUB-RESOURCE.md` exists; can be amended in-place

### Established Patterns

- Each README has a "What's New" or version-tagged section for recent additions
- ESM-only / `verbatimModuleSyntax` mentioned in package READMEs
- "Shipped" sections in PROJECT.md follow a fixed prose format

### Integration Points

- After this phase: documentation matches v0.28.0 reality
- Phase 134 (verification) likely touches none of these files

</code_context>

<specifics>
## Specific Ideas

Plan should fit in 1 plan with 3-5 tasks:
- Task 1: 5 package READMEs (or split into 2 tasks if each gets substantive new content)
- Task 2: skills/build-napplet/SKILL.md update
- Task 3: shell-deployer policy doc creation
- Task 4: PROJECT.md + NUB-RESOURCE draft demo coordination notes
- Task 5: hygiene check (zero @napplet/* in spec/skill/root README leakage; zero kehto/hyprgate anywhere)

Each task should write CONCRETE prose, not "add a section about X". The executor needs the exact bullet points.

</specifics>

<deferred>
## Deferred Ideas

- **Demo napplet implementations** — downstream shell repo, NOT this repo per Option B
- **Migration guide for existing napplets** — minimal v1; future docs milestone if needed
- **API reference site / generated docs** — out of scope

</deferred>
