# Phase 141: Documentation Sweep - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Infrastructure — smart discuss skipped (all API shapes locked upstream; mechanical prose sweep)

<domain>
## Phase Boundary

Update user-facing documentation to reflect v0.29.0's two new NUBs (NUB-CLASS + NUB-CONNECT), the class-track concept, and the "default to NUB-RESOURCE; reach for NUB-CONNECT only when resource NUB can't express what you need" architectural guidance. Preserve all historical changelog bullets byte-identical (v0.27.0 precedent).

**In scope:**
- `README.md` (root) — DOC-01: document two-class posture, cite `window.napplet.connect`, add NUB-RESOURCE-first guidance
- `packages/nub/README.md` — DOC-02: add `connect` and `class` rows to NUB domain table
- `packages/vite-plugin/README.md` — DOC-03: remove strict-CSP documentation; add `connect` option documentation; add inline-script-diagnostic documentation
- `packages/shim/README.md` — DOC-04: document `window.napplet.connect` + `window.napplet.class` surface with graceful-degradation defaults
- `packages/sdk/README.md` — DOC-05: document `connect` + `class` namespaces, `CONNECT_DOMAIN` + `CLASS_DOMAIN` constants, `installConnectShim` + `installClassShim` exports, helper getters
- `skills/build-napplet/SKILL.md` — DOC-06: add two-class posture + connect API + cleartext/mixed-content warning
- (Cross-cutting) DOC-07: preserve historical changelog bullets byte-identical (v0.27.0 precedent)

**Out of scope:**
- Verification tests (Phase 142)
- Changeset authoring (Phase 142)
- Downstream shell repo demo coordination (Option B carry-forward)

</domain>

<decisions>
## Implementation Decisions

### Locked via upstream API surfaces (Phases 135-140)

- `window.napplet.connect` = `{ granted: boolean; origins: readonly string[] }` — from `@napplet/nub/connect/types.NappletConnect`
- `window.napplet.class` = `number | undefined` — from `@napplet/nub/class/shim.installClassShim` defineProperty getter
- Vite-plugin option: `connect?: string[]` on `Nip5aManifestOptions`
- Vite-plugin diagnostic: hard-error on inline `<script>` without src
- Vite-plugin deprecation: `strictCsp` accepts but warns once per build; effect removed
- NUB-CONNECT spec (in napplet/nubs): cites `NUB-CLASS-2.md` by file name
- NUB-CLASS sub-track: NUB-CLASS-1 (strict) + NUB-CLASS-2 (user-approved explicit-origin)
- `perm:strict-csp` is `@deprecated` in JSDoc; supersession pointer to `nub:connect` + `nub:class`

### Architectural guidance (canonical phrasing — use verbatim where possible)

"Default to NUB-RESOURCE for avatars, static assets, one-shot byte fetches, and bech32 resolution. Reach for NUB-CONNECT only when you need: POST/PUT/PATCH methods, WebSocket/SSE, custom headers, long-lived connections, streaming responses, or third-party libraries that call `fetch()` directly and aren't reasonable to refactor."

"Declaring a `connect` origin is a tax (user-facing prompt, full trust vote) — earn it by needing what NUB-RESOURCE can't give you."

### Historical preservation

Per v0.27.0 Phase 123 precedent: any `## Shipped:` / changelog bullets in READMEs or PROJECT.md referring to prior milestones stay byte-identical. Only current-API sections get rewritten.

### Claude's Discretion

All prose-level wording, example code blocks, ordering within sections, whether to add new sections vs edit existing ones — at Claude's discretion. The locked items above are invariants.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- Current READMEs in each package dir — read before editing to understand existing structure and preserve historical bullets
- `skills/build-napplet/SKILL.md` — existing skill file; v0.27.0 + v0.28.0 updated it for `ipc→ifc` + resource NUB; this phase continues the pattern
- `specs/NIP-5D.md` (Phase 135 amended) — can be linked from READMEs as the transport spec
- `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` + `NUB-CLASS*.md` — normative specs, linked from READMEs

### Established Patterns

- Root README shows top-level architecture (packages, installation, usage); adds new NUBs via the NUB table and a short intro section
- Package READMEs document their own surface (imports, types, functions); NUB table in `@napplet/nub` README lists all subpaths
- SKILL.md is for agent consumers; updated with the napplet-authoring workflow, including how to opt into network access

### Integration Points

- 6 doc files to edit (root + 4 package + skill)
- No code changes; pure prose sweep

</code_context>

<specifics>
## Specific Ideas

- Root README: add a "Two NUB classes" or "Network Access" short section near the architecture overview, linking to NUB-CONNECT for full spec
- `packages/nub/README.md` NUB table: insert `connect` and `class` rows alphabetically or by canonical order (connect fits with other content NUBs; class is a meta-NUB — flag it distinctly with a sub-row or footnote)
- `packages/vite-plugin/README.md`: the whole strict-CSP section goes; add a new "Network origins" section documenting `connect?: string[]`; move inline-script diagnostic to a "Build-time diagnostics" section
- `packages/shim/README.md`: document the `connect` and `class` namespaces in the `window.napplet.*` reference; note defaults explicitly
- `packages/sdk/README.md`: SDK re-exports follow the same pattern as `resource` — document each export in the alphabetical imports list
- `skills/build-napplet/SKILL.md`: add a "Network access" section to the authoring workflow, with the cleartext/mixed-content warning front-and-center

</specifics>

<deferred>
## Deferred Ideas

- Changeset authoring (Phase 142)
- Root README architecture diagram update (if any) — keep minimal, text-only updates
- Migration guide for v0.28.0 → v0.29.0 napplets (strictCsp deprecation, inline-script removal) — could go in CHANGELOG via changeset in Phase 142

</deferred>
