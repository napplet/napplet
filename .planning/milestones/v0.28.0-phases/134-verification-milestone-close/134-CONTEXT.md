# Phase 134: Verification & Milestone Close - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (final verification phase — discuss skipped)

<domain>
## Phase Boundary

Mechanical proof that v0.28.0 is shippable:

1. **VER-01**: `pnpm -r build` and `pnpm -r type-check` exit 0 across all 14 workspace packages
2. **VER-02**: Playwright (or equivalent) test correlates `page.on('console')` CSP violations with `page.on('requestfailed')` for the same URL — positive blocking assertion (proves CSP enforces, not just that request didn't happen)
3. **VER-03**: SVG bomb / `<foreignObject>` / recursive `<use>` rejection tests against the rasterization pipeline OR its spec-conformant simulation; raw `image/svg+xml` never reaches napplet
4. **VER-04**: Single-flight cache stampede test (N concurrent `resource.bytes(sameUrl)` produces 1 fetch)
5. **VER-05**: Sidecar default-OFF test — relay event with `resources` field is ignored unless shell explicitly opts in
6. **VER-06**: Cross-repo zero-grep sweep across all 4 napplet/nubs PR drafts (zero `@napplet/*`)
7. **VER-07**: Bundle size: `@napplet/nub/resource` tree-shakes cleanly; consumer importing only `relay` types pays zero bytes for resource code (matching v0.26.0 39-byte tree-shake precedent)

ALSO: Address the TS-vs-spec drift surfaced in Phase 133:
- `.planning/phases/132/drafts/NUB-RESOURCE.md` documents `code: ResourceErrorCode` for `resource.bytes.error`
- `packages/nub/src/resource/types.ts` (Phase 126) uses `error: ResourceErrorCode` and `message?: string`
- These MUST agree. The implementation is canonical (it's been verified in Phases 126, 127, 128, 129); the spec draft is wrong. Amend NUB-RESOURCE.md to match the impl.

</domain>

<decisions>
## Implementation Decisions

### Verification Strategy (LOCKED — from REQUIREMENTS VER-01..07)

The 7 verification gates have a mix of test types:
- **VER-01** is shell-only: `pnpm -r build && pnpm -r type-check`. Already known-green from prior phases.
- **VER-02** requires Playwright. Decision: spec-conformant **simulation** acceptable per ROADMAP language ("OR its spec-conformant simulation"). A Node-based smoke that constructs a CSP meta + tries to fetch + asserts CSP violation event is acceptable evidence. Full Playwright integration is downstream-shell territory.
- **VER-03** SVG: simulate (Node-side) parsing/rejection of bomb fixtures. Real rasterization is shell-side per NUB-RESOURCE.
- **VER-04** Single-flight: Node test with stubbed postMessage; already proven implicitly in Phase 127 sidecar smoke. Re-execute as standalone test.
- **VER-05** Sidecar default-OFF: Node test with relay shim; already implicit in Phase 127.
- **VER-06** Zero-grep: simple `grep -c '@napplet/' .planning/phases/132/drafts/*.md` returns 0 for each
- **VER-07** Tree-shake: standalone consumer fixture similar to v0.26.0 precedent

### Spec/Impl Alignment (LOCKED — from Phase 133 surfacing)

NUB-RESOURCE.md draft amendment: change `code:` to `error:` in the `resource.bytes.error` envelope description. This is a single-line spec correction, additive-compatible with the implementation. Out of scope for the cross-repo PR (which hasn't been opened yet) — just keep the local draft accurate.

### Milestone Close Activities

After all 7 VER gates pass:
- Update STATE.md to status: `Milestone ready for audit`
- Update PROJECT.md to mark v0.28.0 as Shipped (move from "Current Milestone" to "Shipped: v0.28.0")
- Generate VERIFICATION.md for the phase

The actual `/gsd:audit-milestone` and `/gsd:complete-milestone` workflows run AFTER this phase, in the autonomous lifecycle step.

### Claude's Discretion

- Test fixture organization (one mega-script vs separate files; `/tmp` per AGENTS.md if generating temp scripts)
- Whether to amend NUB-RESOURCE.md as part of this phase or as a separate "fix" (recommend: include here as VER-06 prerequisite)
- Order of test execution (recommend VER-01 first as gating; if it fails the rest don't matter)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- All Phase 126/127/128 smoke tests already proved CSP-relevant subsets in their own scope
- Phase 130 vite-plugin smoke already proved 7 CSP gates pass
- Phase 132 hygiene checks already proved zero `@napplet/*` in drafts (one-shot at the time)

### Established Patterns

- `/tmp/` for fixture scripts (AGENTS.md no-pollution)
- Atomic per-task commits

### Integration Points

- After this phase: lifecycle audit / complete / cleanup runs in autonomous workflow
- Branch `feat/strict-model` will need merging back to main as a manual step (not in this phase)

</code_context>

<specifics>
## Specific Ideas

Plan should fit in 1 plan with 4-6 tasks:
- Task 1: VER-01 build + type-check across workspace
- Task 2: VER-02 + VER-03 — CSP enforcement simulation + SVG bomb rejection (combined, both rely on jsdom/Node)
- Task 3: VER-04 + VER-05 — single-flight cache stampede + sidecar default-OFF (combined, both Node tests)
- Task 4: VER-06 — cross-repo zero-grep + amend NUB-RESOURCE.md to fix code/error drift
- Task 5: VER-07 — bundle tree-shake test
- Task 6: write VERIFICATION.md, update STATE.md to "Milestone ready for audit", update PROJECT.md to mark v0.28.0 shipped

OR consolidate into 4 tasks if some are trivial.

</specifics>

<deferred>
## Deferred Ideas

- **Real Playwright tests** — downstream shell repo concern (a real shell with real CSP enforcement)
- **Real SVG rasterizer fixture testing** — downstream shell repo
- **Cross-repo PR creation** — manual step after milestone close
- **NPM publish** — blocked on human npm auth (PUB-04 carry from prior milestones)

</deferred>
