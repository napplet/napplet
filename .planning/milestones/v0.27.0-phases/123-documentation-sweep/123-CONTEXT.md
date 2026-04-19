# Phase 123: Documentation Sweep - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Mode:** Infrastructure/docs phase — smart discuss skipped

<domain>
## Phase Boundary

Every non-archival doc a developer actually reads when onboarding to napplet — 4 READMEs, the `build-napplet` skill, and active `.planning/` — uses IFC terminology in prose and code samples, so the docs match the source shipped in Phase 122.

**Maps to requirements:** DOC-01, DOC-02, PLAN-01

**In scope:**
- Root `README.md`
- `packages/core/README.md`
- `packages/shim/README.md`
- `packages/sdk/README.md`
- `skills/build-napplet/SKILL.md`
- Active planning docs: `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/codebase/*.md`, `.planning/research/*.md`, `.planning/SPEC-GAPS.md`
- Any in-repo spec under `specs/` (verified clean in pre-scan; re-confirm)

**Out of scope:**
- Source code in `packages/*/src/` (Phase 122's completed work — already IFC-clean)
- Archived `.planning/milestones/` (intentionally frozen history — ~1000 IPC refs)
- Archived `.planning/quick/` (frozen history)
- Historical "Shipped: vX.Y.Z" changelog bullets inside active READMEs that mention `IPC_PEER` as a past decision — these are history, not current docs, and MUST stay
- Full monorepo build+type-check + repo-wide zero-grep acceptance (Phase 124)

</domain>

<decisions>
## Implementation Decisions

### What to rewrite
- `window.napplet.ipc` → `window.napplet.ifc` in every code fence + prose reference
- `import { ipc } from '@napplet/sdk'` → `import { ifc } from '@napplet/sdk'`
- `ipc.emit(...)` / `ipc.on(...)` → `ifc.emit(...)` / `ifc.on(...)`
- `ipcSub` and similar variable names in samples → `ifcSub`
- `IPC-PEER` → `IFC-PEER` in prose
- "inter-pane" / "inter-napplet" → "inter-frame" in prose
- Any mention of a `.ipc` sub-object on `window.napplet` in table rows, feature lists, or API reference sections

### What NOT to rewrite
- Historical "Shipped: vX.Y.Z" changelog bullets that literally describe a past decision (e.g., "v0.7.0 Phase 35: BusKind.INTER_PANE renamed to BusKind.IPC_PEER"). If the sentence is in past tense describing what shipped then, it stays. If it describes the current API surface, it gets rewritten.
- If a README or skill lists a "Package table" with a column listing past capabilities — those get updated to the current surface.

### Shipped-changelog line heuristic
- In `PROJECT.md` "Shipped: vX.Y.Z" sections → historical, do not rewrite.
- In READMEs under a heading like "## Changelog" or "## History" → historical, do not rewrite.
- In READMEs describing the *current* API surface (`## Usage`, `## API Reference`, tables showing current exports) → rewrite.
- In `skills/build-napplet/SKILL.md` → rewrite everywhere (the skill teaches CURRENT usage, not history).

### Active planning docs
- `.planning/PROJECT.md`: `### Active` section references IFC correctly (done during milestone kickoff). Check `## Context`, `### Validated` bullets for v0.7.0/v0.16.0 that mention `BusKind.IPC_PEER` — keep those as historical milestone descriptions. The "(Phase 45 IPC terminology cleanup)" note in ROADMAP.md describes a historical event and stays.
- `.planning/STATE.md`: references IFC correctly (done during milestone kickoff).
- `.planning/ROADMAP.md`: references IFC correctly (done during milestone kickoff). The historical Phase 35 / Phase 45 mentions are history and stay.
- `.planning/codebase/*.md`: sweep for current-tense references to `window.napplet.ipc` / `ipc.emit` / "inter-napplet" and rewrite. Historical summaries noting `BusKind.IPC_PEER` renames stay.
- `.planning/research/*.md`: research scratch docs — if they describe current API surface, rewrite; if they're dated investigation notes, rewrite conservatively (terminology only, not historical context).
- `.planning/SPEC-GAPS.md`: similar rule — rewrite current-state references, leave dated entries.

### Skill file rule
- `skills/build-napplet/SKILL.md` frontmatter description line lists current capabilities — must say "inter-frame events" not "inter-pane events".
- Body prose + all code samples aligned to IFC.
- Optional: if the skill description is long enough to warrant a heads-up about the v0.27.0 rename, that's acceptable but not required. Keep the skill clean and forward-looking.

### Claude's Discretion
- Exact word choices when rephrasing prose (e.g., "inter-frame communication" vs "IFC peer bus" — pick whichever reads naturally in each sentence).
- Whether to collapse tautologies (e.g., "IFC (inter-frame communication)" could shorten to just "IFC" after the first expansion).
- Plan splits: the agent may choose 1 plan (all doc files) or 2-3 plans split by concern (READMEs | skill | active planning). Use judgment based on task-count budget.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 122 established the canonical tokens: `ifc`, `IFC`, `IFC-PEER`, "inter-frame". Every doc edit uses those exact forms.
- The 4 READMEs follow a consistent structure (intro → install → usage → API reference → changelog). Changelog sections typically start with `## Changelog` or `## Release History` and list "Shipped: vX.Y.Z" bullets.
- `skills/build-napplet/SKILL.md` is agentskills.io format with YAML frontmatter (`name`, `description`) followed by markdown body.

### Established Patterns
- Code fences in READMEs use TypeScript syntax: ```ts ... ``` or ```typescript ... ```.
- Variable names in samples follow `camelCase`: `ipcSub` pattern → `ifcSub`.
- Package READMEs cross-reference each other via relative markdown links.

### Integration Points
- Root README.md has a package table. The row for `@napplet/shim` / `@napplet/sdk` probably lists `ipc` as a capability — needs flip.
- `packages/shim/README.md` line 15 lists `ipc` in the capabilities bullet — needs flip.
- `packages/sdk/README.md` has an `ipc` section + API reference table — both flip.
- `packages/core/README.md` mentions `ipc.on()` in type doc.
- Skill file references inter-pane events in frontmatter description + body.

</code_context>

<specifics>
## Specific Ideas

- Do NOT revert or weaken the v0.27.0 active-planning updates already made during milestone kickoff (PROJECT.md `### Active`, STATE.md, ROADMAP.md). Those are already correct; the sweep should leave them alone or further tighten them.
- In the READMEs, wherever the phrase "relay, ipc, storage, keys, media, notify, identity, config, and shell" appears, it becomes "relay, ifc, storage, keys, media, notify, identity, config, and shell" (ipc becomes ifc, order preserved).
- In `packages/sdk/README.md` API reference, the heading `### ipc` becomes `### ifc`.

</specifics>

<deferred>
## Deferred Ideas

- Rewriting archived `.planning/milestones/` or `.planning/quick/` — explicitly out of scope per milestone decision.
- Repo-wide grep acceptance test — Phase 124's job.
- Monorepo build gate — Phase 124's job.

</deferred>
