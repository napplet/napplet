# Phase 142: Verification & Milestone Close - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Infrastructure — terminal verification phase; mechanical gates

<domain>
## Phase Boundary

Final v0.29.0 verification phase. Runs build + type-check across all 14 workspace packages, extends the tree-shake harness to include connect + class types-only consumer cases, runs integration tests for grant states + class wire + cross-NUB invariant, verifies cross-repo zero-grep hygiene on the Phase 135 drafts, authors the v0.29.0 changeset, and confirms the downstream-shell tracking issue exists. No new code features — all verifiers gate against already-shipped work.

**In scope:**
- VER-01: `pnpm -r build` exits 0 across all 14 packages
- VER-02: `pnpm -r type-check` exits 0 across all 14 packages (already closed by Phase 139 — re-verify)
- VER-03: Extend v0.26.0/v0.28.0 tree-shake harness with types-only consumer cases for `@napplet/nub/connect/types` + `@napplet/nub/class/types`; assert zero `installConnectShim`, zero `installClassShim`, zero `registerNub` in bundled output
- VER-04: Playwright smoke test — napplet with connect tags + approved grant → `fetch(granted-url)` succeeds, `fetch(other-url)` emits securitypolicyviolation
- VER-05: Playwright smoke test — napplet with connect tags + denied grant → CSP header has `connect-src 'none'`, `window.napplet.connect.granted === false`
- VER-06: Integration test — connect origin list change flips aggregateHash via `connect:origins` fold → prior grant auto-invalidated
- VER-07: Integration test — Class-2 napplet with residual meta CSP → shell refuses to serve; Class-1 residual meta CSP is harmless
- VER-08: Cross-repo zero-grep audit on NUB-CONNECT + NUB-CLASS drafts (re-verify; already clean from Phase 135 Plan 04)
- VER-09: Author changeset calling out v0.29.0 breaking change (strictCsp deprecation, inline-script ban)
- VER-10: Confirm downstream-shell tracking issue exists for v0.29.0 demo napplets (Option B carried forward from v0.28.0)
- VER-11: Playwright smoke test — shell sends class.assigned with class: 2 → `window.napplet.class === 2`; with class: 1 → `=== 1`
- VER-12: Playwright smoke test — shell without nub:class support, never sends class.assigned → `window.napplet.class === undefined`
- VER-13: Integration test — cross-NUB invariant: `class === 2 iff connect.granted === true` in shell implementing both

**Out of scope:**
- The milestone lifecycle (audit-milestone → complete-milestone → cleanup) — handled by the autonomous orchestrator's lifecycle step AFTER this phase completes

</domain>

<decisions>
## Implementation Decisions

### Test infrastructure realism

The Playwright tests (VER-04, VER-05, VER-11, VER-12) and integration tests (VER-06, VER-07, VER-13) require a working shell implementation to drive. Since v0.29.0 delegates demos to the downstream shell repo (Option B from v0.28.0), full end-to-end Playwright tests against a real shell cannot run in THIS repo's CI — there is no shell.

**Pragmatic approach:** Implement each VER-NN item as one of:
- (a) **In-repo unit/integration test** using mocked window.napplet + jsdom + the built @napplet/shim to simulate shell behavior — covers VER-03, VER-06, VER-11, VER-12, VER-13 (shim-side surface tests)
- (b) **Documented test-vector in a test file** that the downstream-shell repo can run against its real shell — covers VER-04, VER-05, VER-07 (shell-side-behavior tests that require a real shell; document the expected behavior + input fixture; mark the test as skip-or-implemented-in-downstream)
- (c) **Grep-based audit** — covers VER-08 (already clean), VER-01, VER-02 (build gates)

Planner picks test-file structure + framework (vitest for in-repo; Playwright fixtures exportable to downstream). Baseline: use existing test infrastructure where it exists (packages/core/src/*.test.ts + packages/nub/src/*.test.ts patterns).

### Changeset format

Standard @changesets/changelog-git format. v0.29.0 is a MINOR version bump (new features: NUB-CLASS, NUB-CONNECT) with deprecations (strictCsp). Per napplet convention, v0.29.0 is a minor bump on the shared packages; individual package bumps follow changesets' semver rules. Authoring the changeset generates a .changeset/*.md file under the repo root.

### Downstream-shell tracking

VER-10 confirms: a tracking issue for v0.29.0 demo napplets exists in the downstream shell repo (same Option B approach as v0.28.0). This is a human action — the planner captures a note that the human needs to file/confirm the issue; automated verification is a doc-check that PROJECT.md mentions the Option B carry-forward.

### Claude's Discretion

All test file paths, exact test harness choices (vitest vs Playwright; jsdom vs happy-dom), and changeset prose wording at Claude's discretion during planning/execution. The VER-NN-to-mechanism mapping above is locked.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/core/src/*.test.ts` + `packages/nub/src/*.test.ts` — existing test patterns (vitest)
- `vitest.config.ts` at repo root — existing vitest setup
- Prior tree-shake harness from v0.26.0/v0.28.0 — extend, don't rewrite
- `@changesets/cli` is already in the repo — existing `.changeset/*.md` files as template
- `.planning/milestones/v0.28.0-phases/134-verification-milestone-close/` — STRUCTURAL PRECEDENT for the verification phase

### Established Patterns

- Integration tests that require a real shell live as documented fixtures + documented expected behavior in this repo; downstream shell repo runs them
- Build gates via `pnpm -r build` and `pnpm -r type-check`
- Playwright is used by the downstream repo, not this one (this repo is SDK-only)

### Integration Points

- Test files in `packages/nub/src/{connect,class}/*.test.ts` (in-repo shim-side tests)
- Test fixture files under `packages/nub/src/{connect,class}/__fixtures__/` or `test-fixtures/` (exportable to downstream)
- `.changeset/v0.29.0-nub-connect-class.md` (new file; standard changesets format)
- Tree-shake harness at `packages/nub/test-tree-shake.*` or wherever v0.26.0/v0.28.0 established it

</code_context>

<specifics>
## Specific Ideas

- In-repo test fixtures should be valid-but-minimal: e.g., a fake manifest with one `connect` origin + one without, to drive the aggregateHash-fold invalidation test (VER-06).
- For VER-13 cross-NUB invariant, the test can be a table-driven vitest case iterating over the 7 scenarios from SHELL-CLASS-POLICY.md's scenario table.
- Changeset should loudly flag the v0.28.0 → v0.29.0 migration: strictCsp becomes no-op (warn), inline scripts break the build, new `connect` option available, new `class` runtime state available.
- VER-10 doc-check: verify `.planning/PROJECT.md` contains "Option B" and "downstream shell repo" near the v0.29.0 current-milestone section.

</specifics>

<deferred>
## Deferred Ideas

- Downstream-shell repo actually running the exported Playwright fixtures — outside this milestone
- Full end-to-end CI wiring in the downstream-shell repo — outside this milestone
- Tag + publish to npm — blocked on PUB-04 (human npm auth)

</deferred>
