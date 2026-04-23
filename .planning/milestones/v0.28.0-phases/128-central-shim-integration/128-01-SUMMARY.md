---
phase: 128-central-shim-integration
plan: 01
subsystem: shim
tags: [resource, shim, nub-integration, csp, def-125-01-closure]

# Dependency graph
requires:
  - phase: 126-resource-nub-scaffold-data-scheme
    provides: "installResourceShim, handleResourceMessage, bytes, bytesAsObjectURL exports from @napplet/nub/resource/shim (10th NUB integration target)"
  - phase: 125-core-type-surface
    provides: "NappletGlobal.resource shape lock ({ bytes(url): Promise<Blob>; bytesAsObjectURL(url): { url, revoke } })"
provides:
  - "window.napplet.resource = { bytes, bytesAsObjectURL } mount via @napplet/shim"
  - "Central shim resource.* envelope routing branch (handleEnvelopeMessage → handleResourceMessage)"
  - "installResourceShim() call in init sequence following 9-NUB pattern (now 10-NUB)"
  - "DEF-125-01 closure: workspace-wide pnpm -r type-check exits 0 across all 14 packages"
affects:
  - 129-central-sdk-integration
  - 134-verification
  - 131-nip-5d-spec-amendment
closes_defect: DEF-125-01

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "10th NUB integrated via established 4-edit pattern: import block → routing branch → global mount → install call"
    - "Per-NUB import alias convention extended (resourceBytes / resourceBytesAsObjectURL) to match notify/config precedent — bare `bytes`/`bytesAsObjectURL` too generic for shim file"
    - "Smoke-test scaffolding pattern: stub document (querySelector+addEventListener) alongside window for installer-time DOM access (keys + config shims)"

key-files:
  created: []
  modified:
    - "packages/shim/src/index.ts (+19 lines: 6-line import block, 6-line routing branch, 4-line global mount property, 3-line install call. 0 deletions, 0 modifications to existing lines.)"

key-decisions:
  - "Used aliased imports (resourceBytes, resourceBytesAsObjectURL) over bare names — matches notifySend/configRegisterSchema precedent; bare `bytes`/`bytesAsObjectURL` too generic for the central shim file and risks future-NUB collisions"
  - "Placed installResourceShim() at the END of the install sequence (after installConfigShim) — lowest-risk position; alphabetical/chronological ordering is not enforced by the file's existing layout"
  - "Placed `resource: { ... }` between `config` and `shell` in the global mount literal — preserves `shell` as the meta-capability surface at the end of the literal"
  - "Routing branch uses the broad type.startsWith('resource.') prefix match (not narrower .endsWith('.result')) — matches the keys/media/notify pattern and lets handleResourceMessage discriminate internally"

patterns-established:
  - "10-NUB central shim integration pattern locked — future NUBs follow the same 4-edit shape (import block → handleEnvelopeMessage routing branch → window.napplet global mount property → installXShim() call in init sequence)"
  - "DEF-XXX-NN cascade-defect closure pattern: Phase N introduces required type slot, Phase N+M wires runtime population, workspace-wide type-check is the load-bearing acceptance criterion"

requirements-completed: [SHIM-01, SHIM-02, SHIM-03, CAP-01, CAP-02]

# Metrics
duration: 5 min
completed: 2026-04-20
---

# Phase 128 Plan 01: Central Shim Integration Summary

**Resource NUB wired into @napplet/shim's central installer (10th NUB integration) — window.napplet.resource = { bytes, bytesAsObjectURL } now reachable from any napplet, routes resource.* envelopes to handleResourceMessage, and closes DEF-125-01 with workspace-wide pnpm -r type-check green across all 14 packages.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-20T14:41:43Z
- **Completed:** 2026-04-20T14:46:24Z
- **Tasks:** 2 (1 atomic edit + 1 verification smoke test)
- **Files modified:** 1 (packages/shim/src/index.ts)

## Accomplishments

- Resource NUB integrated into @napplet/shim with 4 surgical edits — import block, central dispatcher routing branch, global mount property, init-sequence install call
- DEF-125-01 cascade closed: workspace-wide `pnpm -r type-check` exits 0 across ALL 14 packages for the first time since Phase 125 introduced the planned breakage
- End-to-end smoke test verified through built dist artifact: window.napplet.resource namespace mounted, `data:` scheme decoded inline (no postMessage), and `resource.bytes.result` envelope routed by central handleEnvelopeMessage to handleResourceMessage to settle a pending bytes() Promise (SHIM-01 routing proven end-to-end at the napplet entry point, not just at the resource NUB in isolation)
- 10-NUB integration pattern locked — pattern is now reusable for any future 11th NUB

## Task Commits

1. **Task 1: Integrate resource NUB into central shim installer (4 surgical edits)** — `70c7b85` (feat)
2. **Task 2: End-to-end smoke test** — no commit (verification-only; Task 1 is the atomic deliverable)

**Plan metadata:** Pending (will be added when STATE/ROADMAP/REQUIREMENTS are updated)

## Files Created/Modified

- `packages/shim/src/index.ts` (+19 insertions, 0 deletions) — 4 surgical edits adding the 10th NUB integration alongside relay, identity, storage, ifc, theme, notify, keys, media, and config

## Decisions Made

- **Aliased imports** (`resourceBytes`, `resourceBytesAsObjectURL`) over bare names — matches the established `notifySend` / `configRegisterSchema` precedent. Bare `bytes` / `bytesAsObjectURL` are too generic for a central shim file that imports from 10 NUBs and risk collisions with future NUB additions.
- **Install call placement at the bottom** of the init sequence (after `installConfigShim()`) — lowest-risk position. The file's existing layout doesn't enforce alphabetical, chronological, or domain-grouping ordering for installs; appending preserves all 9 prior call sites unchanged.
- **Global mount literal placement** — `resource: { ... }` inserted between `config` and `shell` to preserve `shell` as the last property (it's the meta-capability surface, not a NUB).
- **Routing branch uses broad prefix match** — `type.startsWith('resource.')` matches keys/media/notify pattern. Internal discrimination on `resource.bytes.result` vs `resource.bytes.error` happens inside `handleResourceMessage` (Phase 126 shim.ts lines 43-58), keeping the central dispatcher's job to "route by domain prefix only."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Smoke test scaffolding required document stub for installer-time DOM access**
- **Found during:** Task 2 (smoke test execution)
- **Issue:** The plan's smoke test scaffold stubbed only `globalThis.window` + `globalThis.crypto`. When `import '@napplet/shim'` triggered `installKeysShim()` at line 290 of the built dist, it crashed: `ReferenceError: document is not defined` (keys shim binds `document.addEventListener("keydown", ...)` at install time). After adding a no-op document stub, `installConfigShim()` then crashed at `document.querySelector(meta[name="napplet-config-schema"])` (lines 295/61 of the config chunk).
- **Fix:** Extended the smoke test scaffold (in `/tmp/128-shim-smoke.mjs` only — source code unchanged) with a `globalThis.document = { addEventListener: noop, removeEventListener: noop, querySelector: () => null }` stub before the dynamic import. This mirrors the Phase 127 deviation precedent (Node-environment stubbing for browser-globals accessed at install time) and adds `document` to the list of globals that future smoke tests in this repo should pre-stub. The shim source itself does NOT touch `document`; the install-time DOM access is in the keys and config shims (separate NUB packages, out of scope for Phase 128).
- **Files modified:** `/tmp/128-shim-smoke.mjs` (deleted after pass per AGENTS.md no-pollution rule). Source code unchanged. No commit.
- **Verification:** After the document stub was added, all 5 smoke test assertions printed PASS in order and the script exited 0.
- **Committed in:** N/A — fix was in the temp test scaffold, not in source code

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking — smoke-test environment scaffolding)
**Impact on plan:** Zero impact on Task 1 deliverable (commit 70c7b85 stands as planned). The Rule 3 fix was scoped entirely to the temp smoke-test file in `/tmp` and the file was cleaned up. Source code unchanged. No regressions; no architectural decisions; no scope creep. Adds a single learning to the project's smoke-test scaffolding pattern (document stub alongside window stub for any future Node-side test against the built shim).

## Issues Encountered

None. Plan executed as specified. The Rule 3 deviation above was discovered during smoke test execution and was a known class of issue (the Phase 127 SUMMARY's smoke-test scaffolding deviation was the same shape — Node-environment stubbing for browser globals).

## User Setup Required

None - no external service configuration required.

## Verification Evidence

### Source-level grep enforcement (4 anchors from plan)

```
$ grep -nE "from '@napplet/nub/resource/shim'" packages/shim/src/index.ts
53:} from '@napplet/nub/resource/shim';

$ grep -nE "installResourceShim" packages/shim/src/index.ts
49:  installResourceShim,
230:installResourceShim();

$ grep -nE "handleResourceMessage" packages/shim/src/index.ts
50:  handleResourceMessage,
99:    handleResourceMessage(msg as { type: string; [key: string]: unknown });

$ grep -nE "type\.startsWith\('resource\.'\)" packages/shim/src/index.ts
98:  if (type.startsWith('resource.')) {

$ grep multiline 'resource:\s*\{[^}]*bytes[^}]*bytesAsObjectURL' packages/shim/src/index.ts
191:  resource: {
192:    bytes: resourceBytes,
193:    bytesAsObjectURL: resourceBytesAsObjectURL,

$ grep -nE "^\s*installResourceShim\(\);\s*$" packages/shim/src/index.ts
230:installResourceShim();
```

All 6 anchors satisfied: 1 import line, ≥2 installResourceShim occurrences (1 in import block + 1 standalone install), ≥2 handleResourceMessage occurrences (1 in import block + 1 in routing branch), 1 routing branch, 1 global mount block, 1 standalone install call.

### Per-package gating signal

```
$ pnpm --filter @napplet/shim type-check
> tsc --noEmit
(exit 0, no errors)

$ pnpm --filter @napplet/shim build
ESM dist/index.js     8.24 KB
ESM dist/index.js.map 19.19 KB
ESM ⚡️ Build success in 8ms
DTS dist/index.d.ts 128.00 B
(exit 0)
```

### DEF-125-01 closure (load-bearing milestone signal)

```
$ pnpm -r type-check
(14 packages: core, vite-plugin, nub, nubs/{config,identity,ifc,keys,media,notify,relay,storage,theme}, sdk, shim)
... all 14 type-check: Done
(exit 0 — no ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL, no per-package failures, no TS2741 in @napplet/shim)
```

```
$ pnpm -r build
... 14 successful build: Done
(exit 0 — workspace-wide build green)
```

DEF-125-01 cascade is now CLOSED. First time since Phase 125 (which intentionally introduced TS2741 on `packages/shim/src/index.ts:118`) that workspace-wide type-check exits 0.

### Dist surface enforcement

```
$ grep -E "installResourceShim|handleResourceMessage|resourceBytes" packages/shim/dist/index.js
  installResourceShim,
  handleResourceMessage,
  bytes as resourceBytes,
  bytesAsObjectURL as resourceBytesAsObjectURL
    handleResourceMessage(msg);
```

5 matches in `dist/index.js` (no chunk-splitting for shim; the integration is fully baked into the single dist entry).

### End-to-end smoke test (built shim entry point)

```
$ node /tmp/128-shim-smoke.mjs
PASS [Tests 1-3]: window.napplet.resource = { bytes, bytesAsObjectURL } both callable (SHIM-02, SHIM-03)
PASS [Test 4]: bytes("data:text/plain;base64,aGVsbG8=") → Blob containing "hello" (data: path works through centrally-installed shim)
PASS [Test 5]: resource.bytes.result envelope routed by central handleEnvelopeMessage to handleResourceMessage; pending Promise settled with correct Blob (SHIM-01 routing branch verified end-to-end)

ALL PASS — Phase 128 shim integration verified at the napplet entry point
  SHIM-01: resource.* envelope routing branch wired in handleEnvelopeMessage
  SHIM-02: window.napplet.resource = { bytes, bytesAsObjectURL } mounted
  SHIM-03: installResourceShim() called exactly once from central installer
$ rm -f /tmp/128-shim-smoke.mjs   # AGENTS.md no-pollution rule
```

All 5 assertions pass. Smoke test artifact deleted post-pass.

## Next Phase Readiness

- **Phase 129 (Central SDK Integration):** READY — independent of this phase; mirror this integration in `packages/sdk/src/index.ts` (add `resource` namespace + `RESOURCE_DOMAIN` const re-export + resource type re-exports). Use this PLAN as the structural reference.
- **Phase 130 (Vite-Plugin Strict CSP):** READY — independent of this phase; the shim integration here is a prerequisite for napplets to actually USE the resource NUB under strict CSP, but no code dependency exists between Phase 128 and Phase 130.
- **Phase 131 (NIP-5D In-Repo Spec Amendment):** UNBLOCKED on the wire-shape side — `window.napplet.resource` is the canonical fetch path that the spec amendment will reference (gated by Phase 130 also).
- **Phase 134 (VER-01):** Workspace-wide `pnpm -r build` and `pnpm -r type-check` are now both expected to be green; VER-01 should be a trivial pass after this phase. (Phase 134 still needs to assert it as a positive verification gate, not just a side-effect.)

## CAP-01 / CAP-02 Coverage Note

Per the plan's design:
- The central shim does NOT implement or hardcode `nub:resource` or `resource:scheme:<name>` capability answers
- `shell.supports()` at lines 198-203 of `packages/shim/src/index.ts` is unchanged (still a stub awaiting shell-side population at iframe creation per existing TODO comment)
- CAP-01 and CAP-02 are satisfied at the SHIM level the moment the resource NUB is integrated into the central installer, because `shell.supports()` is domain-agnostic — it routes any capability string through the same mechanism
- No shim-side hardcoding was added (which would inappropriately couple shim to specific shells)

Shell-side population of the capability table is out of scope for this repo (this repo ships only the napplet-side wire + SDK surface; shells live downstream).

## Self-Check: PASSED

- packages/shim/src/index.ts: FOUND (modified, +19 lines)
- packages/shim/dist/index.js: FOUND (built, contains resource integration)
- .planning/phases/128-central-shim-integration/128-01-SUMMARY.md: FOUND
- Task 1 commit 70c7b85: FOUND in git log
- /tmp/128-shim-smoke.mjs: cleaned up post-pass (AGENTS.md no-pollution rule)

---
*Phase: 128-central-shim-integration*
*Completed: 2026-04-20*
