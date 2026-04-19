# Phase 124: Verification & Sign-Off - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Mode:** Infrastructure/verification phase — smart discuss skipped

<domain>
## Phase Boundary

The IFC rename is proven complete end-to-end — monorepo builds + type-checks green across all 14 packages, and a zero-match grep across the first-party surface (source, specs, skills, root README, active planning) confirms no IPC leakage remains.

**Maps to requirements:** VER-01, VER-02

**In scope (evidence-capture only, no code edits):**
- Run `pnpm -r build` across all 14 workspace packages (excluding repo-root which has no build script).
- Run `pnpm -r type-check` across all 14 workspace packages.
- Run repo-wide zero-grep for `\bIPC\b`, `\bipc\b`, `IPC-PEER`, `inter-pane` under:
  - `packages/` (source — Phase 122's territory, expected clean)
  - `specs/` (expected clean — was clean pre-milestone, double-check)
  - `skills/` (Phase 123's territory, expected clean)
  - root `README.md` (Phase 123's territory, expected clean)
  - Active `.planning/` docs — PROJECT.md, STATE.md, ROADMAP.md, codebase/*, research/*, SPEC-GAPS.md (Phase 123's territory, expected clean with one documented exception: `INTEGRATIONS.md` line 168 `INTER_PANE` historical constant)
- Capture command output + grep transcripts as evidence for the milestone acceptance gate.
- Write 124-VERIFICATION.md reporting pass/fail with evidence.

**Out of scope:**
- Any first-party code edits (if gaps found, they become a Phase 124.1 gap-closure plan, not inline fixes).
- Archived `.planning/milestones/` and `.planning/quick/` — excluded from grep per milestone scope.
- npm publishing (blocked on human auth — carried blocker, not this milestone's concern).
- Any new tests, fixtures, or build pipeline changes.

</domain>

<decisions>
## Implementation Decisions

### Grep scope

The exact find-command scope that Phase 124's acceptance gate uses:

```bash
# In-scope paths for the zero-grep assertion
grep -rnE '\bIPC\b|\bipc\b|IPC-PEER|inter-pane' \
  packages/ \
  specs/ \
  skills/ \
  README.md \
  .planning/PROJECT.md \
  .planning/STATE.md \
  .planning/ROADMAP.md \
  .planning/REQUIREMENTS.md \
  .planning/SPEC-GAPS.md \
  .planning/codebase/ \
  .planning/research/
```

Excluded: `.planning/phases/` (historical plan summaries describe what shipped), `.planning/milestones/` (archived history), `.planning/quick/` (archived history), `.planning/debug/` (debug sessions are history), `node_modules/`, `dist/`, `.git/`.

### Expected residuals (documented exceptions)

Per Phase 123's `123-03-NOTES.md`, one specific residual is preserved by design:
- `.planning/codebase/INTEGRATIONS.md` line 168 — `29003: INTER_PANE` is a historical protocol constant name, describing a past decision that later was renamed. Preserving the historical name is correct.

Phase 124 either:
- **Option A (accept with exception):** The zero-grep runs with an explicit `-v` or path-based exclusion for this one line, and the acceptance report documents the one preserved match. This is the recommended path per the Phase 123 NOTES.md handoff.
- **Option B (rewrite the one line):** If the remaining `INTER_PANE` reference can be rewritten without loss of historical meaning (e.g., "what the BusKind.IPC_PEER constant was called before v0.7.0"), do so.

Recommendation: Option A — preserve historical accuracy. The NOTES.md already established this trade-off.

### Grep tokens

- `\bIPC\b` (uppercase, word-boundary) — catches acronym usage
- `\bipc\b` (lowercase, word-boundary) — catches the API identifier and unqualified mentions
- `IPC-PEER` — the JSDoc phrase
- `inter-pane` — the legacy phrase Phase 122/123 replaced with "inter-frame"

NOT included: `IPC_PEER` (as a standalone uppercase constant match — it only appears in historical archives and is fully covered by the `\bIPC\b` match if it's still around; if it's in a preserved historical changelog line in a README, Phase 123 explicitly allowed that). If `\bIPC\b` fires on a historical changelog line in an active README, we catch it here and accept or rewrite case-by-case.

### Build + type-check scope

Full monorepo:
```bash
pnpm -r build        # 14 workspace packages (skips repo root — no build script)
pnpm -r type-check   # 14 workspace packages
```

Both must exit 0. Any non-zero exit code is a Phase 124 failure requiring root-cause analysis.

### Claude's Discretion
- Exact format of evidence captures (tailed log files vs inline in VERIFICATION.md).
- Whether to run a pre-flight grep once to confirm expectations before the formal gate run (reasonable — saves iteration cost if there's a surprise).
- Plan split: this phase is small enough for 1 plan with 3-4 tasks (pre-flight → build → type-check → grep + VERIFICATION write). Don't overkill with 3 plans.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 122 verified a LOCALIZED build for `@napplet/core`, `@napplet/nub`, `@napplet/shim`, `@napplet/sdk` — exit 0. Phase 124 needs the full 14-package monorepo gate.
- Phase 123 verified zero-grep across 11 in-scope files (4 READMEs + skill + 4 codebase/*.md + 2 research/*.md). Phase 124 expands to the full repo-wide sweep scoped to the paths above.
- `123-03-NOTES.md` is the handoff doc that names the expected INTEGRATIONS.md residual.

### Established Patterns
- gsd-tools `phase complete N` automates the roadmap/state/requirements bookkeeping.
- SUMMARY.md in `.planning/phases/<N>-<slug>/` captures execution details.
- VERIFICATION.md in the same directory captures phase acceptance evidence.

### Integration Points
- This is the last phase of v0.27.0. A passed VERIFICATION.md unblocks `/gsd:audit-milestone` → `/gsd:complete-milestone` → `/gsd:cleanup`.
- pnpm workspace defined in `pnpm-workspace.yaml`. turborepo config in `turbo.json`.

</code_context>

<specifics>
## Specific Ideas

- Do NOT attempt to "fix" anything inline. If the grep or build surfaces an issue, STOP and route to gap closure (Phase 124.1 or similar) — don't compound scope.
- The expected happy path is: build green, type-check green, grep zero (with the one documented INTEGRATIONS.md exception) → write VERIFICATION.md with `status: passed` → done.
- If grep finds anything unexpected, the VERIFICATION.md should list it and set `status: gaps_found` so the autonomous workflow routes to user decision.

</specifics>

<deferred>
## Deferred Ideas

- Publishing `@napplet/*` packages to npm at v0.3.0 — blocked on human auth, not this milestone.
- Adding a CI check that enforces the IFC invariant going forward — could be a future phase, not this one.
- Rewriting archived milestone artifacts — explicitly out of scope.

</deferred>
