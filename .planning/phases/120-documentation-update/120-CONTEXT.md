# Phase 120: Documentation Update - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Mode:** Auto-generated

<domain>
## Phase Boundary

Update every human-facing doc to reference the new `@napplet/nub/<domain>` subpath pattern and stop linking consumers to the deprecated `@napplet/nub-<domain>` package names. Scope:

- **Create** `packages/nub/README.md` — new canonical package's README (DOC-01)
- **Update** 4 existing READMEs: root `README.md`, `packages/core/README.md`, `packages/shim/README.md`, `packages/sdk/README.md` (DOC-02)
- **Update** `specs/NIP-5D.md` where it references example imports (DOC-03) — currently 0 matches, so likely a no-op / verify-only
- **Update** `skills/build-napplet/SKILL.md` (DOC-04) — currently 0 matches, likely a no-op / verify-only

Phase 120 requirements: DOC-01, DOC-02, DOC-03, DOC-04.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

- **`packages/nub/README.md`** (new): ~150–250 lines. Structure:
  1. Title + one-line description
  2. Install block (`pnpm add @napplet/nub`)
  3. Quick-start example showing both barrel and granular imports
  4. "9 domains" section listing all 9 with a 1-line description each
  5. Subpath pattern section — explain `@napplet/nub/<domain>` (barrel) vs `@napplet/nub/<domain>/types` vs `/shim` vs `/sdk`
  6. Tree-shaking contract — every subpath is an independent entry point
  7. Theme exception — only `barrel` + `/types` exist (no `/shim` or `/sdk`)
  8. Migration table — old name → new subpath(s)
  9. Licensing / repository footer

- **Root `README.md`**: 13 `@napplet/nub-` matches. The package table + dep graph diagram reference the old per-nub package names. Also has DEFUNCT `@napplet/nub-signer` references (that package was removed in v0.24.0 — clean those up as part of the refresh). Replace the per-nub table rows with a single `@napplet/nub` row pointing at `packages/nub/` and move the per-domain breakdown into the new package's README. Update the dep graph ASCII art to reflect the new shape: `@napplet/shim → @napplet/nub → @napplet/core`.

- **`packages/core/README.md`**: 1 match on line 353 — an enumeration in prose describing which packages extend `NappletMessage` and call `registerNub`. Replace `@napplet/nub-relay`, `@napplet/nub-identity`, ... with `@napplet/nub/<domain>` subpaths OR rewrite the sentence to say "the `@napplet/nub` domain modules (relay, identity, storage, ifc, keys, media, notify, config)".

- **`packages/shim/README.md`**: 1 match on line 426 — a table row listing deps of the shim as `@napplet/nub-relay, @napplet/nub-identity, ...`. Replace with a single `@napplet/nub` entry (reflecting actual phase 119 state). Consider adding a second line noting that the shim now uses granular `/shim` subpaths internally.

- **`packages/sdk/README.md`**: 9 matches on lines 178 + 296–303 — the big type-to-package mapping table and the `json-schema-to-ts` peerDep note. Replace the `@napplet/nub-<domain>` column with `@napplet/nub/<domain>` (barrel form). Line 178 updates the peerDep reference.

- **`packages/vite-plugin/README.md`**: 0 matches currently — verify no updates needed but still double-check for any indirect references to old paths. Include in the plan as a verify-only pass.

- **`specs/NIP-5D.md`**: 0 matches per preflight grep — verify no update needed. Include in plan as sanity-check-only.

- **`skills/build-napplet/SKILL.md`**: 0 matches per preflight grep — same situation as NIP-5D.md. Verify-only.

### Non-negotiables

- After this phase, `grep -rn "@napplet/nub-" README.md packages/*/README.md specs/ skills/` returns 0 matches (excluding deprecated package folders `packages/nubs/<domain>/` and planning docs).
- The DEFUNCT `@napplet/nub-signer` references in root README must be removed (cleanup).
- New `@napplet/nub` README must include concrete, resolving import examples for at least one barrel path and at least one granular path.
- Migration guidance in the new README must explicitly name both the migration path (`@napplet/nub-<domain>` → `@napplet/nub/<domain>`) and the deprecation status of the old packages.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/nubs/<domain>/README.md` (9 files) — each has the deprecation banner from Phase 118. Some have full content; some were created fresh. These can cross-link to the new `packages/nub/README.md`.
- Each of the 9 domains has concrete API surface documented in its subpath types file — info easy to extract.

### Established Patterns
- Existing READMEs use `##` heading style with a table of contents section, code fences for install / usage, and an "Install" section near the top.
- Root README uses an ASCII dep graph.

### Integration Points
- The new `packages/nub/README.md` will be referenced from the deprecation banners on each `packages/nubs/<domain>/README.md` (Phase 118 wrote "Use `@napplet/nub/<domain>` instead" — which is now the authoritative path).
- Root README's package table is the main landing page when someone lands on GitHub — migration-friendliness matters.

</code_context>

<specifics>
## Specific Ideas

- **Don't break the deprecated READMEs**: Phase 118's banners already point at `@napplet/nub/<domain>`. Leave those files alone in this phase (they'll be removed in the future REMOVE-* milestone).
- **Root README dep graph rewrite**: go from the current 10-box graph (core + 9 nubs) to a 5-box graph (core + nub + shim + sdk + vite-plugin). The shim/sdk boxes point into nub; nub points into core.
- **Link strategy**: root README → `packages/nub/README.md` for per-domain details; `packages/nub/README.md` → `specs/NIP-5D.md` for protocol details; don't link back to deprecated `packages/nubs/<domain>/` READMEs.

</specifics>

<deferred>
## Deferred Ideas

- Updating CHANGELOG.md files (those are managed by changesets on release).
- Updating specs (specs/NIP-5D.md and spec NUB files) to reference new paths — those are pure protocol docs; they don't show import examples. Preflight grep confirmed 0 matches.
- Writing a migration guide outside of the `@napplet/nub` README — single README is sufficient.

</deferred>
