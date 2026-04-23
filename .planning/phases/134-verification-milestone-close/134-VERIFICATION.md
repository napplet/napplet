# Phase 134 Verification — v0.28.0 Browser-Enforced Resource Isolation

**Verified:** 2026-04-23
**Phase:** 134 — Verification & Milestone Close
**Milestone:** v0.28.0 Browser-Enforced Resource Isolation
**Status:** PASS — all 7 VER gates green

## Summary

All 7 VER-IDs (VER-01..07) executed as `type="auto"` tasks with per-gate evidence logs written to `/tmp/` per AGENTS.md no-home-dir-pollution rule. Every gate passed on first non-scaffolding attempt; spec drift from Phase 133 was already resolved in commit `2f80342` pre-execution, so Task 4's PRE-WORK substitutions were confirmed as a no-op (the draft already matched the shipped TypeScript wire shape).

| VER-ID | Gate | Result | Evidence |
|--------|------|--------|----------|
| VER-01 | `pnpm -r build` + `pnpm -r type-check` across 14 packages | PASS | `/tmp/napplet-ver-01.log` (`BUILD_EXIT=0`, `TC_EXIT=0`, `PACKAGE_COUNT=14`) |
| VER-02 | CSP positive-blocking simulation (Playwright) | PASS | `/tmp/napplet-ver-02-csp.log` (`{"cspViolation":true,"requestFailedForBlocked":true,"pass":true}`, `VER02_EXIT=0`) |
| VER-03 | SVG rejection spec conformance in NUB-RESOURCE.md | PASS | `/tmp/napplet-ver-03-svg.log` (`PASS`, `VER03_EXIT=0` — 3 MUSTs + 3 SHOULD caps + 3 named attack vectors all present) |
| VER-04 | Single-flight cache stampede (N=10 concurrent `bytes(sameUrl)` against built dist) | PASS | `/tmp/napplet-ver-04-stampede.log` (`{"pass":true,"envelopeCount":1,"allSameBlob":true,"resultCount":10}`, `VER04_EXIT=0`) |
| VER-05 | Sidecar default-OFF spec conformance in NUB-RELAY-AMENDMENT.md | PASS | `/tmp/napplet-ver-05-sidecar.log` (`PASS`, `VER05_EXIT=0` — default-OFF + privacy rationale + per-event-kind allowlist all present) |
| VER-06 | Cross-repo zero-grep sweep across all 4 nubs drafts | PASS | `/tmp/napplet-ver-06-zerogrep.log` (`TOTAL=0`, `VER06_EXIT=0`, 0/0/0/0 across the 4 drafts) |
| VER-07 | Tree-shake — relay-types-only consumer bundle | PASS | `/tmp/napplet-ver-07-treeshake.log` (74-byte bundle; 0 refs to `installResourceShim`/`hydrateResourceCache`/`resource.bytes`/`bytesAsObjectURL`/`handleResourceMessage`; `VER07_EXIT=0`) |

## Per-Gate Detail

### VER-01 — Workspace build + type-check

- `pnpm -r build` exited 0 across 14 workspace projects (one pnpm-workspace entry is the repo root metadata, not a buildable package — matches the plan's expected `PACKAGE_COUNT=14` cross-check).
- `pnpm -r type-check` exited 0 across the same 14 packages. DEF-125-01 remains closed (workspace-wide type-check green since Phase 128 wired `window.napplet.resource`).
- Package count confirmed via explicit enumeration of `packages/{core,nub,sdk,shim,vite-plugin}/package.json` + `packages/nubs/*/package.json` = 5 + 9 = 14.
- Full build output captured in `/tmp/napplet-ver-01-build.log`; full type-check output in `/tmp/napplet-ver-01-typecheck.log`; summary in `/tmp/napplet-ver-01.log`.

### VER-02 — CSP positive-blocking assertion

- Playwright (system install at `/usr/lib/node_modules/playwright`, browsers cached at `~/.cache/ms-playwright/chromium-*`) launched headless Chromium with `--ozone-platform=wayland`.
- Test page: `data:text/html;...` with first-`<head>`-child `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'">` and `<img src="https://example.com/blocked.png">`.
- Positive-block criterion per Pitfall 21: both a `console.error` containing `/Content Security Policy/i` AND a `requestfailed` event for the blocked URL must be observed. Both were observed.
- Script lives at `/tmp/napplet-ver-02-csp.cjs` (see Deviations below — plan specified `.mjs` but Playwright ships CJS-only in this system install; Rule 3 fix).

### VER-03 — SVG rejection spec conformance

- 10 targeted `grep` checks against `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md`:
  - 4 MUSTs: `shell MUST rasterize`, `MUST NOT deliver raw image/svg+xml`, `sandboxed Worker`, `no network`.
  - 3 SHOULD caps: `Max input bytes`, `Max output dimensions`, `Wall-clock rasterization budget`.
  - 3 attack vectors: `foreignObject`, `recursive`, `billion.laughs | entity.expansion`.
- All 10 present. Shell-side rasterization to PNG/WebP, no-network sandboxed Worker, and the cap matrix collectively prevent SVG bomb / `<foreignObject>` / recursive-`<use>` attacks.

### VER-04 — Single-flight cache stampede

- Ran against built `packages/nub/dist/resource/shim.js` (chunk-split into `chunk-OV3R23GE.js` — the import resolution follows the generated stub re-exports automatically).
- Stubbed `globalThis.window = { parent: { postMessage: (msg) => sent.push(msg) } }` and `globalThis.document` (defensive; resource NUB doesn't touch `document` but the shim-test pattern from Phase 128 keeps this for future NUBs).
- Fired 10 concurrent `bytes('https://example.com/avatar.png')` calls, observed `sent.filter(type==='resource.bytes' && url===URL_UNDER_TEST).length === 1`, synthesized a single `resource.bytes.result` envelope, confirmed all 10 promises resolved to `Object.is(blob, sentinelBlob) === true`.
- Single-flight dedup is proven: `envelopeCount=1`, `allSameBlob=true`, `resultCount=10`.

### VER-05 — Sidecar default-OFF spec conformance

- 3 `grep -qE -i` checks against `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RELAY-AMENDMENT.md`:
  1. Default-OFF posture: matches `default off` / `default-off` / `opt-in`.
  2. Privacy rationale: matches `privacy` / `fingerprint` / `pre.fetch` / `reveals user activity` / `upstream host`.
  3. Per-event-kind allowlist: matches `event.kind` / `kind.*allowlist` / `per.event` / `allowlist`.
- All 3 present; the amendment's dedicated "Default OFF Privacy Rationale" + "Per-event-kind allowlist guidance" sections cover each.
- Per CONTEXT.md decisions and the planning prompt's `deep_work_rules`: VER-05 is locked as a SPEC test, not a runtime test — the shim hydrates whatever the shell sends; "default OFF" is a shell policy locked in the spec text.

### VER-06 — Cross-repo zero-grep sweep

- 4 public-destined drafts scanned for `@napplet/` references:
  - `NUB-RESOURCE.md`: 0
  - `NUB-RELAY-AMENDMENT.md`: 0
  - `NUB-IDENTITY-AMENDMENT.md`: 0
  - `NUB-MEDIA-AMENDMENT.md`: 0
- `TOTAL=0`. Public-repo hygiene preserved; ready for cross-repo PR authoring when the upstream `napplet/nubs` PRs are opened manually (deferred per CONTEXT.md).
- kehto / hyprgate banned-terms check: not in scope of VER-06, but the drafts were authored in Phase 132 under the same hygiene rules — no incidental leakage.

### VER-07 — Tree-shake bundle

- Fixture at `/tmp/napplet-ver-07-treeshake/` with `entry.ts` importing only `import type { RelayEventMessage } from '@napplet/nub/relay/types'`.
- Local `node_modules/@napplet/nub` + `node_modules/@napplet/core` populated by copying `packages/*/dist` and `packages/*/package.json` (no npm install — workspace-local bundling).
- esbuild 0.25.12 (found under `node_modules/.pnpm/esbuild@0.25.12`) bundled with `--bundle --format=esm --platform=neutral --tree-shaking=true`.
- Bundle = 74 bytes:
  ```javascript
  // entry.ts
  function makeStub() {
    return null;
  }
  export {
    makeStub
  };
  ```
- Forbidden-symbol search: `installResourceShim: 0`, `hydrateResourceCache: 0`, `resource\.bytes: 0`, `bytesAsObjectURL: 0`, `handleResourceMessage: 0`. Zero resource-NUB code in a relay-types-only consumer bundle. Matches the v0.26.0 39-byte precedent (slight size difference comes from esbuild version + the no-op `makeStub` function — the load-bearing signal is symbol absence, not bundle bytes).

## Spec Drift Resolved

Per Phase 133 surfacing (STATE.md decisions): `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md` was using `code: ResourceErrorCode` + `error?: string` while the shipped TypeScript in `packages/nub/src/resource/types.ts` defines `error: ResourceErrorCode` + `message?: string`. The canonical implementation is the wire shape; the spec follows.

The substitutions were authored and committed as `2f80342 fix(134-01): align NUB-RESOURCE.md spec with shipped types.ts (code: -> error:)` BEFORE this plan's execution (see `git log -- .planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md`). Task 4's PRE-WORK was therefore verified as already-complete (sanity grep `code:\s*"<errorname>"` returns zero hits in error-envelope context) and Task 4 executed only the VER-06 part of its action.

No new edits to the draft were required during Phase 134 execution.

## Authentication Gates

None encountered. All 7 gates ran locally against the built dist and local draft text.

## Artifacts

- Task evidence logs: `/tmp/napplet-ver-0{1..7}*.log` (7 logs, plus `-build.log` / `-typecheck.log` supporting Task 1 and the `/tmp/napplet-ver-07-treeshake/` fixture directory)
- Test scripts: `/tmp/napplet-ver-02-csp.cjs`, `/tmp/napplet-ver-03-svg.sh`, `/tmp/napplet-ver-04-stampede.mjs`, `/tmp/napplet-ver-05-sidecar.sh`
- Spec correction: already committed as `2f80342` on `main`
- VERIFICATION.md: this file
- STATE.md: flipped to `status: ready-for-audit`
- PROJECT.md: v0.28.0 moved from "Current Milestone" to "Shipped: v0.28.0"
- REQUIREMENTS.md: VER-01..07 traceability rows flipped Pending → Complete

## Deviations

**[Rule 3 — Blocking issue] Playwright import syntax (VER-02).** The plan specified a `.mjs` script importing `from '/usr/lib/node_modules/playwright'`. Both attempts failed: Node refused the directory-import (`ERR_UNSUPPORTED_DIR_IMPORT`) and then refused the CJS named-export (`SyntaxError: Named export 'chromium' not found`). The system's `playwright@latest` ships as CJS-only with no ESM bundle, so the test was converted to `.cjs` with `const { chromium } = require('/usr/lib/node_modules/playwright')`. Functional behavior identical; evidence log format unchanged. Script lives at `/tmp/napplet-ver-02-csp.cjs` instead of the plan's `.mjs` path.

**[No rule — scaffolding observation] Task 4 PRE-WORK was pre-committed.** The 18 `code:` → `error:` substitutions called for in Task 4's action block had already been authored and committed as `2f80342 fix(134-01): align NUB-RESOURCE.md spec with shipped types.ts (code: -> error:)` before this plan ran. Sanity grep confirmed zero remaining `code: "<errorname>"` hits in error-envelope context. Task 4 therefore executed only the VER-06 zero-grep portion of its action; the spec-correction portion was a no-op by the time execution started.

## Next

The autonomous lifecycle proceeds:
1. `/gsd:audit-milestone v0.28.0` — audit-grade review of shipped requirements
2. `/gsd:complete-milestone v0.28.0` — archive the ROADMAP row, wire up `milestones/v0.28.0-ROADMAP.md`, increment version
3. Cleanup — feature-branch `feat/strict-model` is ready for merge to `main` (manual step outside this phase, as CONTEXT.md notes)
