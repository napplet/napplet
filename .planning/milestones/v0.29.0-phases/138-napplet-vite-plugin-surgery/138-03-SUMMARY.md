---
phase: 138-napplet-vite-plugin-surgery
plan: 03
subsystem: build-tooling

tags: [vite-plugin, guardrail, conformance-fixture, module-load-self-check, nub-connect, spec-p1]

# Dependency graph
requires:
  - phase: 135-cross-repo-spec-work
    provides: NUB-CONNECT.md §Conformance Fixture defining the normative digest `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`
  - plan: 138-02
    provides: Additive half — connect option, normalizer, fold, registry, manifest tags, inline-script diagnostic, cleartext warn, dev-mode meta. Self-check code also landed here as part of commit d06c293 (see deviation note)
provides:
  - assertConnectFoldMatchesSpecFixture module-load self-check guarding fold-drift (SPEC-P1 mitigation)
  - Full Phase 138 grep audit sweep (40+ checks) passing — subtractive half clean, additive half complete, preserved non-CSP surfaces byte-identical
  - Verified perturbation experiment: drifting `.join('\n')` to `.join(',')` triggers FATAL error at module load with actual/expected hashes in the diagnostic
  - Terminal state for Phase 138 surgery: ready for orchestrator verify_phase_goal pass
affects:
  - Phase 139 (central shim + SDK integration) — fold-determinism guardrail lives in-plugin; shell-side implementations must produce byte-identical hash for grant-key compatibility
  - Phase 142 (verification + milestone close) — Plan 138-03 closes the "fold equivalence at build time" sub-goal flagged in 138-02-SUMMARY references section

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-load-time conformance-fixture self-check — throws at ESM-init on drift; fires once per process that imports the plugin, negligible cost (SHA-256 over 80 bytes)"
    - "Byte-identical fold duplication at two call sites (self-check + closeBundle) as the explicit tradeoff vs helper extraction — 5-line blocks; future third call site should refactor into shared helper"

key-files:
  created: []
  modified: []
  deleted: []

key-decisions:
  - "No new commit needed for Task 1 (self-check function body + module-load call) — the exact code landed in commit d06c293 as part of the aborted prior 138-03 attempt that bundled with 138-02 Task 4. Re-creating the commit would be a no-op. Documented as a Rule 1 documentation-state deviation."
  - "Perturbation experiment uses module-import (not build) to trigger drift — tsup/tsc does NOT execute the module-scope code at build time; the self-check fires at ESM-init when Vite (or any other ESM loader) imports the plugin. Build-exit-0 + import-throws was confirmed as the behavioral shape."
  - "Acceptance-criterion drift: the plan specified `grep -c 'cc7c1b…' packages/vite-plugin/src/index.ts returns 1`, but the actual count is 2 (self-check EXPECTED constant + pre-existing 138-02 Task 3 fold-docs comment at closeBundle). This is intentional co-location and not a regression — both occurrences are load-bearing (one asserts, one documents the byte-level equivalence). Documented as a Rule 1 documentation-state deviation."

patterns-established:
  - "When re-running a plan after an aborted attempt whose work actually landed in a prior commit, the executor MUST verify the committed state rather than re-implementing. The planning-artifact commit + SUMMARY documentation still land, but the code commit does not duplicate."
  - "Module-load-time self-checks are ESM-init-time, not tsup-build-time. To verify they fire, run `node -e \"import('./dist/...').catch(e => { ... })\"` after the perturbation — do not rely on `pnpm build` to surface the drift."

requirements-completed: []

# Metrics
duration: 4m55s
completed: 2026-04-21
---

# Phase 138 Plan 03: Terminal Verification Guardrail Summary

**Module-load-time conformance-fixture self-check (`assertConnectFoldMatchesSpecFixture`) binds the vite-plugin's `connect:origins` fold implementation to the NUB-CONNECT.md §Conformance Fixture digest `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`. Any drift (join delimiter, sort order, encoding, hash algorithm) throws at ESM-init, giving napplet authors an immediate loud failure instead of a silent grant-invalidation mismatch at shell-side later. Perturbation experiment confirmed the guardrail fires. Full 40+ Phase 138 grep audit passes. Build + type-check green. Phase 138 terminal — all 10 VITE-XX REQ-IDs satisfied.**

## Performance

- **Duration:** 4m55s
- **Started:** 2026-04-21T15:00:00Z
- **Completed:** 2026-04-21T15:04:55Z
- **Tasks:** 2 / 2 (Task 1 code pre-landed in d06c293; Task 2 audit executed this session)
- **Files modified in this plan session:** 0 (working tree clean pre-session; self-check code already committed in d06c293)

## Task Commits

1. **Task 1: Module-load conformance-fixture self-check** — **Pre-landed in commit `d06c293`** (138-02 Task 4 message, but rolled in the `assertConnectFoldMatchesSpecFixture` function body + module-load call from an aborted prior 138-03 attempt that hit the usage limit mid-run before the separating commit was authored). The self-check function is present at `packages/vite-plugin/src/index.ts:481-534` with a bare call at line 538. Perturbation experiment in this session confirmed the guardrail fires correctly on fold-drift.
2. **Task 2: Final end-to-end sanity sweep** — No code commit (audit only). All 40+ grep checks pass with two intentional documentation-state discrepancies noted under Deviations. Build + type-check both exit 0.

## Files Created / Modified / Deleted

No files modified in Plan 138-03's execution session. The code required by Task 1 was already committed in `d06c293`. Planning artifacts (this SUMMARY.md, STATE.md, ROADMAP.md) are produced as the final metadata commit per execute-plan protocol.

## Conformance Fixture Self-Check — In-File Location

File: `packages/vite-plugin/src/index.ts`

```ts
// Lines 481-534 (function body)
function assertConnectFoldMatchesSpecFixture(): void {
  const fixtureOrigins = [
    'wss://events.example.com',
    'https://api.example.com',
    'https://xn--caf-dma.example.com',
  ];
  const EXPECTED = 'cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742';

  const sorted = [...fixtureOrigins].sort();
  const canonical = sorted.join('\n');
  const actual = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');

  if (actual !== EXPECTED) {
    throw new Error(
      `[nip5a-manifest] FATAL: connect:origins fold implementation drift detected. ` +
      // ... full diagnostic listing actual + expected + restoration guidance
    );
  }
}

// Line 538 — module-load call, fires once per process that imports this plugin
assertConnectFoldMatchesSpecFixture();
```

The fixture origins are intentionally **scrambled** (wss/https-api/https-xn — not already-sorted order) to exercise the sort step. If someone removed `.sort()`, the canonical bytes would change and the hash would diverge from spec.

## Perturbation Experiment (Not Committed — Sanity Check)

Goal: verify the self-check actually fires when the fold drifts from spec.

1. **Baseline:** `pnpm --filter @napplet/vite-plugin build` → exit 0; `node -e "import('./packages/vite-plugin/dist/index.js').then(m => console.log(Object.keys(m).join(',')))"` → `SYNTHETIC_XTAG_PATHS,nip5aManifest` (exit 0).
2. **Perturb** line 520 from `const canonical = sorted.join('\n');` to `const canonical = sorted.join(',');` (LF → comma — same bytes except a known-different delimiter).
3. **Build:** `pnpm --filter @napplet/vite-plugin build` → **exit 0** (tsup/tsc does NOT execute module-top-level code; the build itself is unaffected). ESM dist/index.js rebuilt cleanly.
4. **Import the perturbed dist/index.js:** `node -e "import('./packages/vite-plugin/dist/index.js').catch(e => { console.error('CAUGHT:', e.message); process.exit(1); })"` → **exit 1** with:
   ```
   CAUGHT: [nip5a-manifest] FATAL: connect:origins fold implementation drift detected.
   The plugin's fold on the NUB-CONNECT.md §Conformance Fixture inputs produced hash
   fdcf761ce852fdf7da68329ebc31f0c86fa56fb4bf93f0d79fb5d8ed420ff5d8 but the spec requires
   cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742. This means a build-time
   change broke fold-determinism with shells — any napplet built with this plugin would
   produce grant-invalidation mismatches. Restore the canonical fold (lowercase → ASCII sort
   → LF-join no trailing → UTF-8 → SHA-256 → lowercase hex) or update NUB-CONNECT.md + all
   shell implementations in lockstep.
   ```
5. **Revert** the perturbation (comma → LF). Rebuild. Re-import. **Exit 0**, exports resolved cleanly.
6. **Verified clean working tree:** `git status --short` → empty.

**Insight:** The self-check is a **module-load-time** guardrail (fires at ESM-init when Vite imports the plugin), **not** a build-time guardrail. This is the correct layering for napplet authors — every `pnpm build` in a napplet's repo invokes Vite, which imports the plugin module, which triggers the self-check. If the fold drifts, the napplet author's `pnpm build` fails at plugin-init long before any tag emission. Adjusted the plan's original "build fails" framing to "module-import fails" in the SUMMARY for accuracy — the guarded surface is the napplet author's build (which imports the plugin), not tsup's build of the plugin itself.

## Phase 138 Full Grep Audit — ALL 40+ CHECKS PASS

### Subtractive half (all 0)

| Check | Expected | Actual |
| --- | --- | --- |
| `grep -c 'buildBaselineCsp' index.ts` | 0 | 0 |
| `grep -c 'validateStrictCspOptions' index.ts` | 0 | 0 |
| `grep -c 'assertMetaIsFirstHeadChild' index.ts` | 0 | 0 |
| `grep -c 'assertNoDevLeakage' index.ts` | 0 | 0 |
| `grep -c 'StrictCspOptions' index.ts` | 0 | 0 |
| `grep -c "from './csp" index.ts` | 0 | 0 |
| `grep -c 'Content-Security-Policy' index.ts` | 0 | 0 |
| `grep -c 'head-prepend' index.ts` | 0 | 0 |
| `grep -c 'strictCspEnabled' index.ts` | 0 | 0 |
| `grep -c 'cspNonce' index.ts` | 0 | 0 |
| `grep -c 'cspMode' index.ts` | 0 | 0 |
| `grep -c 'napplet-connect-granted' index.ts` | 0 | 0 |
| `grep -c "p !== 'config:schema'" index.ts` | 0 | 0 |
| `test -f packages/vite-plugin/src/csp.ts` | exit 1 | exit 1 (absent) |
| `grep -c 'csp.ts' tsup.config.ts` | 0 | 0 |

### Additive half (all >=1 or per-plan-specified exact)

| Check | Expected | Actual |
| --- | --- | --- |
| `grep -c '@deprecated' index.ts` | >=1 | 2 |
| `grep -c 'strictCsp is deprecated in v0.29.0' index.ts` | 1 | 1 |
| `grep -c 'strictCsp?: unknown' index.ts` | 1 | 1 |
| `grep -c 'connect?: string\[\]' index.ts` | 1 | 1 |
| `grep -c "from '@napplet/nub/connect/types'" index.ts` | 1 | 1 |
| `grep -c 'normalizeConnectOrigin(origin)' index.ts` | >=1 | 1 |
| `grep -c 'SYNTHETIC_XTAG_PATHS' index.ts` | >=2 | 4 |
| `grep -c "'config:schema'" index.ts` | >=1 | 3 |
| `grep -c "'connect:origins'" index.ts` | >=2 | 3 |
| `grep -c "\[originsHash, 'connect:origins'\]" index.ts` | 1 | 1 |
| `grep -c 'function assertNoInlineScripts' index.ts` | 1 | 1 |
| `grep -c 'assertNoInlineScripts(html)' index.ts` | 1 | 1 |
| `grep -c 'Inline <script> elements are not allowed' index.ts` | 1 | 1 |
| `grep -c 'napplet-connect-requires' index.ts` | 1 | 3 (field + attr + JSDoc ref) |
| `grep -c 'isDev && normalizedConnect.length > 0' index.ts` | 1 | 1 |
| `grep -c 'cleartext origin' index.ts` | >=1 | 1 |
| `grep -c 'cc7c1b1903fb…fb23…aa742' index.ts` | 1 | **2** (self-check EXPECTED + 138-02 Task 3 fold-docs comment) |

### Byte-identity of preserved non-CSP surfaces (all >=1)

| Surface | Expected | Actual |
| --- | --- | --- |
| `napplet-aggregate-hash` | >=1 | 4 |
| `napplet-type` | >=1 | 2 |
| `napplet-config-schema` | >=1 | 2 |
| `napplet-requires` | >=1 | 1 |
| `computeAggregateHash` | >=1 | 2 |
| `discoverConfigSchema` | >=1 | 2 |
| `validateConfigSchema` | >=1 | 2 |
| `finalizeEvent` | >=1 | 2 |

## Build + Type-check

| Command | Exit Code | Output |
| --- | --- | --- |
| `pnpm --filter @napplet/vite-plugin build` | 0 | tsup ESM 11ms; DTS 612ms; `dist/index.js` 19.74 KB, `dist/index.d.ts` 6.49 KB |
| `pnpm --filter @napplet/vite-plugin type-check` | 0 | `tsc --noEmit` clean |
| `node -e "import('./packages/vite-plugin/dist/index.js').then(m => console.log(Object.keys(m)))"` | 0 | `SYNTHETIC_XTAG_PATHS,nip5aManifest` — module-load self-check passes, no drift |
| `pnpm -r build` | 1 | `@napplet/shim` fails DTS with pre-existing `TS2741: Property 'connect' is missing in type … NappletGlobal` — out of scope per 138-02 `deferred-items.md`; scheduled for Phase 139 (SHIM-01/SHIM-02). All other packages (`@napplet/core`, `@napplet/nub`, `@napplet/vite-plugin`, all `@napplet/nub-*`) build cleanly. |

## Requirements Coverage Matrix (All 10 VITE-XX IDs)

| REQ-ID | Plan | Task | Evidence |
| --- | --- | --- | --- |
| VITE-01 | 138-01 | Task 1 + Task 2 | `csp.ts` deleted; all banned CSP identifiers absent from `index.ts`; tsup entry reduced |
| VITE-02 | 138-01 | Task 2 | `strictCsp?: unknown` @deprecated field + warn-once shim in `configResolved` |
| VITE-03 | 138-02 | Task 2 | `connect?: string[]` field + JSDoc on `Nip5aManifestOptions` |
| VITE-04 | 138-02 | Task 2 | `normalizeConnectOrigin(origin)` called per-origin in `configResolved`; `[nip5a-manifest]`-prefixed error chaining |
| VITE-05 | 138-02 | Task 3 | `connectTags` (`['connect', <origin>]` per origin) inserted between `manifestXTags` and `configTags` |
| VITE-06 | 138-02 | Task 3 | `xTags.push([originsHash, 'connect:origins'])` via lowercase → sort → LF-join → SHA-256 → hex |
| VITE-07 | 138-02 | Task 2 | `SYNTHETIC_XTAG_PATHS` exported `ReadonlySet<string>` drives the projection filter |
| VITE-08 | 138-02 | Task 4 | `assertNoInlineScripts(html)` called in `closeBundle` before the privkey check |
| VITE-09 | 138-02 | Task 2 | `cleartext` filter in `configResolved` emits informational `console.warn` on `http://`/`ws://` origins |
| VITE-10 | 138-02 | Task 4 | Dev-mode-only `<meta name="napplet-connect-requires">` injection gated by `isDev && normalizedConnect.length > 0` |
| **Plan 138-03 extra** | 138-03 | Task 1 | `assertConnectFoldMatchesSpecFixture()` module-load self-check — binds fold to spec digest `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` |

All 10 VITE-XX requirements have been marked **Complete** in `REQUIREMENTS.md` since the end of Plan 138-02. Plan 138-03 adds a guardrail closing SPEC-P1 (hash-determinism drift) without introducing new REQ-IDs.

## Decisions Made

See `key-decisions` block in frontmatter. Summary:

- **No-op Task 1 commit** — the code required by Task 1 was already in the committed state (`d06c293`) from an aborted prior 138-03 attempt. Re-creating the commit would duplicate history. The summary + STATE update + perturbation experiment still land; only the code commit is skipped.
- **Module-import, not build, is the fire-point** — tsup emits module-top-level code into `dist/index.js` but does not execute it; the self-check fires at ESM-init when Vite (or any loader) imports the built plugin. Verified experimentally.
- **Acceptance-criterion drift on `cc7c1b1…` grep count** — plan said "→ 1" but the actual count is 2 (self-check constant + 138-02 Task 3 fold-docs comment). Both occurrences are load-bearing; this is expected co-location, not a regression.

## Deviations from Plan

### Auto-fixed / documented-state deviations

**1. [Rule 1 - Documentation state] Task 1 code pre-landed in commit `d06c293`**
- **Found during:** Plan 138-03 kickoff — the context stated "no commits from that attempt" but `git log` + `git show d06c293 -- packages/vite-plugin/src/index.ts` confirmed `assertConnectFoldMatchesSpecFixture` + its module-load call were already present in the committed state.
- **Issue:** Plan expected a new commit for Task 1, but the exact code was already landed under the Task 4 commit message of Plan 138-02.
- **Fix:** No new commit — documented the bundled landing in the summary; verified the code is correct via the perturbation experiment.
- **Files modified:** None (code already committed).
- **Commit:** Original landing in `d06c293` (2026-04-21 16:39:51 +0200).

**2. [Rule 1 - Documentation state] Acceptance criterion grep count for `cc7c1b1…` is 2, not 1**
- **Found during:** Task 2 grep audit.
- **Issue:** Plan Task 2 acceptance criterion read `grep -c "cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742" packages/vite-plugin/src/index.ts` returns 1. Actual: 2 occurrences (line 512 — self-check `EXPECTED` constant — and line 755 — 138-02 Task 3 closeBundle fold-docs comment referencing the same spec digest for human readability).
- **Fix:** None required — both occurrences are load-bearing (one asserts, one documents the byte-level equivalence). The plan's "→ 1" was written before 138-02 Task 3's docs-comment landed with the same digest literal. Treating as a harmless over-count; both are in-scope documentation/code references tied to the NUB-CONNECT spec.
- **Files modified:** None.
- **Commit:** Pre-existing in `264edfb` (138-02 Task 3, fold-docs comment) and `d06c293` (138-02 Task 4 rolled self-check).

**3. [Rule 1 - Documentation accuracy] "Build fails" framing adjusted to "module-import fails"**
- **Found during:** Perturbation experiment in Task 1 verification.
- **Issue:** Plan text described the guardrail as "the build FAILS with the FATAL: ... message" on drift. Actual behavior: tsup/tsc does not execute module-top-level code, so `pnpm --filter @napplet/vite-plugin build` succeeds even with the fold perturbed. The self-check fires when the built artifact is **imported** — which is what Vite does in a downstream napplet's `pnpm build`. The guardrail is still correct end-to-end; the framing in this SUMMARY clarifies the fire-point.
- **Fix:** Documented the actual behavioral shape in the perturbation-experiment section. The guardrail still achieves its goal (napplet author's build fails at plugin-init on fold drift), just through a slightly different mechanism than the plan text implied.
- **Files modified:** None (doc-only clarification in this SUMMARY).

No other deviations. Task 2 audit sweep executed cleanly; all 40+ greps pass (modulo the two documented drifts above); build + type-check green on the in-scope filter.

## Deferred Items

### `@napplet/shim` DTS build (pre-existing, scheduled for Phase 139)

Out of scope per 138-02's `deferred-items.md`. Root cause: Phase 136-01 added required `connect: NappletConnect` field to `NappletGlobal` without updating the shim's `window.napplet` literal. Resolution path: Phase 139 `SHIM-01` + `SHIM-02` will install `installConnectShim()` + populate `connect: { granted: false, origins: [] }` default block. Not Plan 138-03's scope; in-scope filter (`pnpm --filter @napplet/vite-plugin build && type-check`) is green.

## Issues Encountered

None beyond the three minor documentation-state deviations captured above. The perturbation experiment confirmed the guardrail fires on drift and resolves cleanly on revert. Working tree clean pre- and post-session (only the untracked revert traced through Edit + re-Edit; final state identical to HEAD).

## References

- **NUB-CONNECT canonical fold procedure:** `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` §Canonical `connect:origins` aggregateHash Fold
- **NUB-CONNECT normative digest:** `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` §Conformance Fixture — `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`
- **SPEC-P1 pitfall (hash-determinism drift):** `.planning/research/PITFALLS.md` §SPEC-P1
- **BUILD-P2 mitigation (shared normalizer from Phase 137):** `.planning/phases/137-nub-connect-and-nub-class-subpath-scaffolds/137-01-SUMMARY.md`
- **Subtractive predecessor state:** `.planning/phases/138-napplet-vite-plugin-surgery/138-01-SUMMARY.md`
- **Additive predecessor state:** `.planning/phases/138-napplet-vite-plugin-surgery/138-02-SUMMARY.md`
- **Pre-landed self-check commit:** `d06c293` — `feat(138-02): fail-loud inline-script diagnostic + dev-mode connect-requires meta` (bundled Task 1 of 138-03 from aborted prior attempt)
- **Plugin source:** `packages/vite-plugin/src/index.ts:481-538` (self-check function + module-load call)
- **Deferred shim issue:** `.planning/phases/138-napplet-vite-plugin-surgery/deferred-items.md`

## Next Phase Readiness

- **Phase 138 TERMINAL-COMPLETE.** All 10 VITE-XX REQs satisfied; 3/3 plans complete. `pnpm --filter @napplet/vite-plugin build && type-check` both exit 0. Fold-determinism guardrail in place.
- **Orchestrator verify_phase_goal pass is ready.** Phase 138 success criteria (ROADMAP.md Phase 138 §Success Criteria 1–6) all satisfied — strictCsp machinery removed, connect option + normalization + fold + manifest tag emission + inline-script fail-loud + cleartext warn + dev-mode requires meta + conformance-fixture guardrail all present and verified.
- **Phase 139 unblocked.** Central shim/SDK integration can proceed — `@napplet/nub/connect/types` subpath is stable and the vite-plugin surgery is locked.
- **Phase 142 milestone-close helper.** The module-load self-check satisfies the "build-time SPEC-02 conformance test" deferred item from Phase 138's `deferred` list in CONTEXT.md — the guardrail is in place one phase earlier than planned (Phase 138 vs deferred to Phase 142).
- **No new blockers.**

## Self-Check: PASSED

- FOUND: `.planning/phases/138-napplet-vite-plugin-surgery/138-03-SUMMARY.md` (this file)
- FOUND: `packages/vite-plugin/src/index.ts` (unmodified from pre-session state after revert)
- FOUND: commit `d06c293` in `git log` (contains `assertConnectFoldMatchesSpecFixture` + module-load call per `git show d06c293`)
- FOUND: `packages/vite-plugin/src/index.ts:512` — `EXPECTED = 'cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742'`
- FOUND: `packages/vite-plugin/src/index.ts:538` — bare `assertConnectFoldMatchesSpecFixture()` call at module scope
- VERIFIED: `pnpm --filter @napplet/vite-plugin build` → exit 0
- VERIFIED: `pnpm --filter @napplet/vite-plugin type-check` → exit 0
- VERIFIED: `node -e "import('./packages/vite-plugin/dist/index.js')...` → exit 0; perturbation → exit 1 with FATAL message
- VERIFIED: All 40+ Phase 138 grep audit checks pass (modulo two documented drifts: `cc7c1b1…` count = 2 by co-location, no-op Task 1 commit by prior-landing)

---
*Phase: 138-napplet-vite-plugin-surgery*
*Completed: 2026-04-21*
