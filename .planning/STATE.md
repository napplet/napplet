---
gsd_state_version: 1.0
milestone: v0.13.0
milestone_name: Runtime Decoupling & Publish
status: verifying
stopped_at: Completed 67-01-PLAN.md (cross-repo wiring docs)
last_updated: "2026-04-06T18:04:30.999Z"
last_activity: 2026-04-06
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 11
  completed_plans: 11
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-06)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 67 — cross-repo-wiring-docs

## Current Position

Phase: 67
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-04-06

Progress: [----------] 0%

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- [Phase 62]: Added .npmrc to kehto repo with relaxed peer dep settings for unpublished @napplet/core
- [Phase 62]: Kehto CLAUDE.md omits GSD auto-generated sections — /gsd:new-project will generate them after source migration
- [Phase 63]: Used devDependency link for @napplet/core in runtime package.json (satisfies peer dep during dev)
- [Phase 63]: Added vitest to runtime devDependencies for test file type-checking
- [Phase 63]: Added DOM and DOM.Iterable libs to kehto shell tsconfig.json for browser type availability
- [Phase 63]: Added vitest to services devDependencies for test file type-checking
- [Phase 64]: Removed stale Vite path aliases in chat/bot configs -- cross-repo links resolve via node_modules
- [Phase 64]: Used absolute path to napplet core source for @napplet/core vitest alias in kehto
- [Phase 64]: Pre-built fixture dist/ from napplet repo works in kehto (bundled shim code, not runtime imports)
- [Phase 64]: 12 e2e test failures are all pre-existing (identical to napplet repo), not caused by migration
- [Phase 65]: Removed @playwright/test and @vitest/coverage-v8 from root devDeps (no e2e tests remain)
- [Phase 65]: Simplified test script to just turbo run test:unit (no playwright chain)
- [Phase 66]: type-check before build in CI for fail-fast on type errors
- [Phase 66]: Publish workflow uses concurrency group with cancel-in-progress: false to prevent parallel publish stomping
- [Phase 66]: No replacement changeset created -- first publish triggered by fresh changeset after human npm auth
- [Phase 67]: @kehto/acl does not import @napplet/core -- no peerDependency needed (zero-dep by design)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260401-w49 | Fix KINDS.INTER_PANE regression and @napplet/runtime module resolution in demo | 2026-04-01 | ff91cb9 | [260401-w49-fix-kinds-inter-pane-regression-and-napp](.planning/quick/260401-w49-fix-kinds-inter-pane-regression-and-napp/) |
| 260402-krp | Replace inter-pane with ipc in demo UI labels, logs, comments, and path names | 2026-04-02 | 320ef58 | [260402-krp-replace-inter-pane-with-ipc-in-demo-ui-l](.planning/quick/260402-krp-replace-inter-pane-with-ipc-in-demo-ui-l/) |
| 260403-lck | Fix Phase 51 split-border node implementation -- padding-frame approach | 2026-04-03 | 8347912 | [260403-lck-fix-phase-51-split-border-node-implement](.planning/quick/260403-lck-fix-phase-51-split-border-node-implement/) |
| 260403-mc5 | Post-phase color refinements: remove old borders, wire overlays to color state, simplify to red/green, add flash mode, fix decay/trace/persistence | 2026-04-03 | df21008 | [260403-mc5-update-planning-artifacts-for-out-of-wor](.planning/quick/260403-mc5-update-planning-artifacts-for-out-of-wor/) |

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth. Target for Phase 66 (PUB-04).
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved, carry forward.
- Phase 63-64 use workspace-linked @napplet/core; switch to npm happens in Phase 67 after publish.

## Session Continuity

Last session: 2026-04-06T18:02:12.622Z
Stopped at: Completed 67-01-PLAN.md (cross-repo wiring docs)
Resume: `/gsd:plan-phase 62`
