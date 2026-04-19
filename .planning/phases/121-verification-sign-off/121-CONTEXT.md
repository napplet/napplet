# Phase 121: Verification & Sign-Off - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure / verification phase)

<domain>
## Phase Boundary

Final acceptance gate for the v0.26.0 Better Packages milestone. No new artifacts are created by this phase. It proves the three non-negotiable invariants that the prior 4 phases committed to:

1. **VER-01** — The whole monorepo builds clean and type-checks clean with the new `@napplet/nub` package, the deprecated `@napplet/nub-<domain>` re-export shims, and the migrated `@napplet/shim` + `@napplet/sdk` consumers all co-existing.
2. **VER-02** — Subpath tree-shaking contract holds in a real bundler: a minimal consumer importing only `@napplet/nub/relay/types` produces a bundle containing bytes from only that subpath — none from the other 8 domains, no `registerNub` side effect from other barrels.
3. **VER-03** — The 9 deprecated `@napplet/nub-<domain>` packages still import and type-check end-to-end under their re-export shim — pinned consumers of old names are not broken.

This is a pure proof phase. If any of these fail, the milestone is incomplete.

Requirements covered: VER-01, VER-02, VER-03.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

- **VER-01 acceptance test**: `pnpm -r build` + `pnpm -r type-check` across the entire monorepo. Both exit 0. All 14 packages (core, nub, shim, sdk, vite-plugin, 9 deprecated nubs) produce dist outputs. No regression from phases 117–120.

- **VER-02 tree-shaking test**: Set up a minimal consumer project at `/tmp/napplet-treeshake-verify/` (gitignored location — do not commit this test harness). It imports only `@napplet/nub/relay/types` and uses one type. Use a well-behaved bundler (esbuild or tsup) to bundle it, then:
  - Grep the output bundle for `registerNub` calls — must be 0 (types-only subpath should emit no runtime code).
  - Grep the output bundle for any of the 8 non-relay domains' names (`config`, `identity`, `ifc`, `keys`, `media`, `notify`, `storage`, `theme`) — must be 0 matches in runtime strings.
  - Grep for `relay` — must be 0 too, because types compile away (the final .js output should be nearly empty — the type import vanishes at build time).
  - Bundle size sanity: the output bundle should be < 1KB (just a small consumer of a type that compiles away).

- **VER-03 pinned-consumer smoke test**: For each of the 9 deprecated packages, create a micro-consumer at `/tmp/napplet-pinned-<domain>/` that:
  - Depends on `file:../../packages/nubs/<domain>` (workspace-style link to the monorepo's deprecated package),
  - Imports the same named exports it would've imported in v0.25.0 (e.g., `RelaySubscribeMessage` from `@napplet/nub-relay`),
  - `tsc --noEmit` passes — types resolve transparently through the re-export shim.
  - No runtime execution needed for this test — type-check is the contract being proven.

- **No changes to any repo file** other than the VERIFICATION.md / SUMMARY.md artifacts. This is a proof phase.

- **Tree-shake harness location**: `/tmp/` is the right place per project convention (AGENTS.md §"CRITICAL: File and Directory Management") — do NOT pollute the repo with test harnesses. Clean up `/tmp/napplet-treeshake-verify/` and `/tmp/napplet-pinned-*/` after the test passes.

### Non-negotiables

- Zero changes to `packages/nub/`, `packages/nubs/*/`, `packages/shim/`, `packages/sdk/`, `packages/core/`, `packages/vite-plugin/`, or any config files.
- If VER-01 fails, STOP — do not attempt to fix in this phase. Fix should route to a gap-closure plan on the failing prior phase.
- If VER-02 fails, root-cause: this means the new package's subpath exports don't tree-shake the way Phase 117's plan assumed. That's a Phase 117 regression requiring a fix phase.
- If VER-03 fails, that means Phase 118's re-export shims don't round-trip correctly. That's a Phase 118 regression.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/nub/dist/` — 34 .js + 34 .d.ts emitted by Phase 117 (may need rebuild in verification run).
- `packages/nubs/<domain>/dist/` — 9 dist directories with re-export shims from Phase 118.
- `packages/shim/dist/` + `packages/sdk/dist/` — Phase 119 outputs, imports the new `@napplet/nub` paths.

### Established Patterns
- Phase 117's plan 117-03 and Phase 119's plan 119-02 already used `/tmp/` harness directories for runtime resolution probes (EXP-04 + parity). Those are templates for this phase's harnesses.
- `pnpm -r build` + `pnpm -r type-check` is the repo's established CI-equivalent gate.

### Integration Points
- No integration needed — everything is already wired. This phase is the proof.

</code_context>

<specifics>
## Specific Ideas

- For VER-02, **esbuild is the clearest bundler** to use — a one-shot `esbuild --bundle --minify --format=esm entry.ts` produces a single output file that's easy to grep.
- For VER-03, use `tsc --noEmit` directly (don't run tsup or any bundler for it) — type resolution is the contract being proven.
- Each of the 9 pinned-consumer type-check smoke tests can be generated by a shell loop — same template, 9 domain names.
- Keep the phase short — 1 plan with 3 tasks should suffice (one task per requirement).

</specifics>

<deferred>
## Deferred Ideas

- None — this is the milestone's final phase. Everything not verified here becomes known debt for the next milestone.

</deferred>
