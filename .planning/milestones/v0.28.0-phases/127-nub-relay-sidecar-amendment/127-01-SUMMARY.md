---
phase: 127-nub-relay-sidecar-amendment
plan: 01
subsystem: nub-relay
tags: [nub, relay, resource, sidecar, single-flight-cache, postMessage, json-envelope, esm, type-only-import]

# Dependency graph
requires:
  - phase: 126-resource-nub-scaffold-data-scheme
    provides: ResourceSidecarEntry interface (resource/types.ts), hydrateResourceCache(entries) function (resource/shim.ts), single-flight inflight Map cache, data: scheme decoder
provides:
  - "RelayEventMessage.resources?: ResourceSidecarEntry[] optional sidecar field (additive, backward-compatible)"
  - "Relay shim hydrates resource cache via hydrateResourceCache(msg.resources) BEFORE invoking onEvent(msg.event) inside the relay.event handler"
  - "End-to-end cache-hit path proven: synchronous bytes(sidecarUrl) inside onEvent resolves from the single-flight cache with 0 postMessage envelopes"
affects:
  - 128-central-shim-integration
  - 129-central-sdk-integration
  - 132-cross-repo-nubs-prs
  - 134-verification

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-NUB type-only sibling import via relative .js path (relay → resource): import type { ResourceSidecarEntry } from '../resource/types.js'"
    - "Cross-NUB runtime sibling import via relative .js path (relay → resource): import { hydrateResourceCache } from '../resource/shim.js'"
    - "Source-order load-bearing pattern: pre-hydrate cache before invoking user callback so synchronous lookups inside the callback resolve from cache"
    - "Null-safe hydrate-then-deliver: hydrateResourceCache(undefined) is a no-op; backward-compatible with shells that don't opt in"

key-files:
  created: []
  modified:
    - "packages/nub/src/relay/types.ts (+19 lines): added type-only sibling import + optional resources?: ResourceSidecarEntry[] field on RelayEventMessage with privacy JSDoc"
    - "packages/nub/src/relay/shim.ts (+10 lines, -1 line): added runtime sibling import of hydrateResourceCache; in handleMessage relay.event branch, hoisted RelayEventMessage cast to local eventMsg and invoked hydrateResourceCache(eventMsg.resources) before onEvent(eventMsg.event)"

key-decisions:
  - "Used hoisted local 'eventMsg' cast (vs. inline double-cast) for ergonomics — single cast, two reads"
  - "Smoke test scaffolding bug auto-fixed (Rule 3): Node 18+ exposes globalThis.crypto as a non-configurable getter, so the plan's literal 'globalThis.crypto = ...' assignment crashed; replaced with a guarded Object.defineProperty that only defines crypto if absent. Native crypto.randomUUID worked unchanged."
  - "Verification adapted: dist/relay/shim.js does not literally contain 'hydrateResourceCache' because tsup chunk-splits the implementation into a shared chunk (chunk-RHDDLJ3D.js / chunk-OV3R23GE.js) that the relay shim re-exports. The runtime call IS in the published build (proven by smoke test PASS lines and grep -c=2 on each chunk). The literal-grep step in the plan was an over-tight check; the end-to-end smoke test is the load-bearing acceptance criterion."

patterns-established:
  - "Pattern: Sidecar wire field — additive optional discriminated-union member that lets shells pre-resolve referenced resources invisibly to the napplet caller. The wire shape stays backward-compatible; the napplet shim handles both present-and-absent cases via a null-safe helper."
  - "Pattern: Cross-NUB borrow-don't-own — relay NUB references the resource NUB's ResourceSidecarEntry type via a sibling type-only import; ownership stays with the resource NUB, no runtime cross-domain dep is introduced."

requirements-completed: [SIDE-01, SIDE-02, SIDE-03, SIDE-04]

# Metrics
duration: 3min
completed: 2026-04-20
---

# Phase 127 Plan 01: NUB-RELAY Sidecar Amendment Summary

**Optional `resources?: ResourceSidecarEntry[]` field added to `RelayEventMessage`; relay shim now invokes `hydrateResourceCache(msg.resources)` before `onEvent(msg.event)` so a synchronous `bytes(sidecarUrl)` inside the napplet's onEvent callback resolves from the single-flight cache with zero postMessage round-trips.**

## Performance

- **Duration:** ~3 min (execution + smoke test); 2m 23s task-clock
- **Started:** 2026-04-20T13:09:00Z
- **Completed:** 2026-04-20T13:11:28Z
- **Tasks:** 2
- **Files modified:** 2 (one source file per task)
- **Commits:** 2 atomic feat commits

## Accomplishments

- **SIDE-01 satisfied:** `RelayEventMessage` now carries an optional `resources?: ResourceSidecarEntry[]` field. Pre-v0.28.0 envelopes that omit the field type-check identically — additive and backward-compatible.
- **SIDE-02 satisfied:** `ResourceSidecarEntry` stays owned by `@napplet/nub/resource/types`; the relay NUB imports it type-only via the established sibling relative path (`'../resource/types.js'`). No runtime cross-domain dep introduced.
- **SIDE-03 satisfied:** The relay shim's `relay.event` handler invokes `hydrateResourceCache(eventMsg.resources)` on a source line BEFORE the `onEvent(eventMsg.event)` call. Source-order is load-bearing for the cache-hit path.
- **SIDE-04 satisfied (proven end-to-end):** A Node smoke test fed a fake `relay.event` envelope (with `resources: [{ url, blob, mime }]`) through the built shim, then awaited `bytes(sidecarUrl)` inside `onEvent`. The cached Blob resolved with **exactly 0** postMessage calls during the cached fetch, and the cached bytes equaled the sidecar bytes (PNG magic `0x89 0x50 0x4e 0x47` preserved).
- **Backward compatibility preserved:** envelopes without `resources` deliver to `onEvent` unchanged — `hydrateResourceCache(undefined)` is the documented no-op.
- **Per-package gating signals green:** `pnpm --filter @napplet/nub type-check` exit 0; `pnpm --filter @napplet/nub build` exit 0.
- **DEF-125-01 carry contained:** workspace-wide `pnpm -r type-check` continues to fail ONLY in `@napplet/shim` (TS2741 missing `resource` property on the `window.napplet` literal). No NEW type errors introduced anywhere else. Phase 128 will repair.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend RelayEventMessage with optional resources sidecar field** — `24aca30` (feat)
2. **Task 2: Wire relay shim to hydrate resource cache before delivering events + smoke test** — `0a2ee58` (feat)

**Plan metadata:** _to be appended (docs commit for SUMMARY + STATE + ROADMAP + REQUIREMENTS)_

## Files Created/Modified

### Modified
- `packages/nub/src/relay/types.ts` (+19 lines)
  - New type-only sibling import: `import type { ResourceSidecarEntry } from '../resource/types.js';`
  - `RelayEventMessage` extended with optional `resources?: ResourceSidecarEntry[]` field plus 12-line JSDoc documenting privacy rationale and pointing at the NUB-RELAY spec for default-OFF policy and per-event-kind allowlist guidance.
- `packages/nub/src/relay/shim.ts` (+10 lines, -1 line)
  - New runtime sibling import: `import { hydrateResourceCache } from '../resource/shim.js';`
  - In `handleMessage` `relay.event` branch: hoisted `RelayEventMessage` cast to a local `eventMsg`, then invoked `hydrateResourceCache(eventMsg.resources)` immediately before `onEvent(eventMsg.event)`. Inline comment explains the source-order requirement and the null-safe hydrate-on-absent-sidecar contract.

### Untouched (verified via diff scope)
- `publish`, `publishEncrypted`, `query`, `installRelayShim` exports — unchanged.
- The other 10 message interfaces in `relay/types.ts` — unchanged.
- The other branches (`relay.eose`, `relay.closed`) inside `handleMessage` — unchanged.
- `package.json`, `tsup.config.ts` — unchanged (purely additive within existing source files; relay/types and relay/shim already had entry points).

## Verification Evidence

### Source-level grep enforcement (literal output)

```
$ grep -nE "^import type \{ ResourceSidecarEntry \} from '\.\./resource/types\.js';$" packages/nub/src/relay/types.ts
13:import type { ResourceSidecarEntry } from '../resource/types.js';

$ grep -nE "resources\?: ResourceSidecarEntry\[\];" packages/nub/src/relay/types.ts
204:  resources?: ResourceSidecarEntry[];

$ grep -nE "^import \{ hydrateResourceCache \} from '\.\./resource/shim\.js';$" packages/nub/src/relay/shim.ts
18:import { hydrateResourceCache } from '../resource/shim.js';

$ grep -nE "hydrateResourceCache\(" packages/nub/src/relay/shim.ts
71:      hydrateResourceCache(eventMsg.resources);
```

### Source-order enforcement (load-bearing for SIDE-04)

```
$ node -e "const fs = require('fs'); const s = fs.readFileSync('packages/nub/src/relay/shim.ts', 'utf8'); const h = s.indexOf('hydrateResourceCache(eventMsg.resources)'); const o = s.indexOf('onEvent(eventMsg.event)'); ..."
PASS: hydrateResourceCache precedes onEvent (h=2811, o=2859)
```

### Per-package build + type-check

```
$ pnpm --filter @napplet/nub type-check
> @napplet/nub@0.2.1 type-check
> tsc --noEmit
(exit 0, no errors)

$ pnpm --filter @napplet/nub build
... DTS dist/relay/types.d.ts    8.24 KB
... DTS dist/relay/shim.d.ts     3.64 KB
... (full build green)
```

### Dist surface enforcement

```
$ grep -E "resources\?: ResourceSidecarEntry\[\];" packages/nub/dist/relay/types.d.ts
    resources?: ResourceSidecarEntry[];
```

The `dist/relay/shim.js` file is a re-export from a tsup-generated shared chunk (`chunk-RHDDLJ3D.js`) — `grep -c hydrateResourceCache packages/nub/dist/chunk-RHDDLJ3D.js` returns `2` (also `2` in `chunk-OV3R23GE.js`). The runtime call IS in the published build; the smoke test below proves it end-to-end.

### End-to-end SIDE-04 cache-hit smoke test

`/tmp/127-sidecar-smoke.mjs` — built shim driven with a fake `relay.event` envelope containing a non-empty `resources` array; `bytes(sidecarUrl)` awaited synchronously inside `onEvent`; postMessage call counter snapshotted before/after.

```
$ node /tmp/127-sidecar-smoke.mjs
PASS: relay shim hydrated cache; bytes(sidecarUrl) resolved from cache with 0 postMessages
PASS: cached Blob bytes match sidecar Blob bytes (PNG magic preserved)
```

Temp file deleted after pass (`rm -f /tmp/127-sidecar-smoke.mjs`); no home-directory pollution.

### DEF-125-01 carry containment

```
$ pnpm -r type-check 2>&1 | grep ELIFECYCLE
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @napplet/shim@0.2.1 type-check: `tsc --noEmit`
```

Only `@napplet/shim` fails workspace-wide, with the expected pre-existing TS2741 (missing `resource` on `NappletGlobal`). No NEW type errors introduced.

## Decisions Made

- **Hoisted local `eventMsg` cast** instead of inline double-cast (`(msg as RelayEventMessage).resources` then `(msg as RelayEventMessage).event`) — readability win, single cast, two reads. The plan permitted either; chose the cleaner shape.
- **JSDoc on the new `resources?` field** documents the privacy rationale (pre-fetching reveals user activity to upstream hosts before render) and explicitly points at the NUB-RELAY spec for the per-event-kind allowlist and default-OFF policy. Keeps the type self-describing for downstream consumers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Smoke test crashed on `globalThis.crypto = ...` assignment**

- **Found during:** Task 2 verification (smoke test execution)
- **Issue:** The plan's smoke test scaffolding contained `globalThis.crypto = globalThis.crypto ?? { randomUUID: ... };`. On Node 18+, `globalThis.crypto` is a non-configurable accessor property (getter only), so direct assignment throws `TypeError: Cannot set property crypto of #<Object> which has only a getter`. The smoke test exited 1 before reaching the actual assertions.
- **Fix:** Replaced the assignment with a guarded `Object.defineProperty(globalThis, 'crypto', { value: ..., configurable: true })` that only fires if `globalThis.crypto` is actually undefined, plus a `randomUUID` shim only if missing. Node's native `crypto.randomUUID` worked through the relay shim unchanged.
- **Files modified:** `/tmp/127-sidecar-smoke.mjs` (temp file, not under version control; deleted after smoke test passed)
- **Verification:** Smoke test reran; both PASS lines printed; exit 0.
- **Committed in:** N/A (temp file, not committed; the relay shim source had no bug — the deviation was confined to the smoke test scaffolding)

---

**Total deviations:** 1 auto-fixed (1 blocking — smoke test scaffolding bug, no source-code impact).
**Impact on plan:** Zero scope creep; the relay shim itself worked first-try. The deviation was a Node-platform quirk in the plan-supplied smoke test only.

## Issues Encountered

- **Tsup chunk-splitting hides the literal grep target.** The phase-level verification step (`grep -E "hydrateResourceCache" packages/nub/dist/relay/shim.js`) returned 0 matches because tsup splits shared code (the relay shim's runtime path) into a separate chunk file that `dist/relay/shim.js` re-exports from. The runtime call is present (`grep -c hydrateResourceCache packages/nub/dist/chunk-RHDDLJ3D.js` = 2) and the smoke test proves end-to-end behavior. Documented in Decisions Made above and in Verification Evidence; no source change needed.

## User Setup Required

None — no external service configuration required. This phase is wire/code only.

## Downstream Readiness

- **Phase 128 (Central Shim Integration):** No relay-side change required. The central shim already routes `relay.*` envelopes to the relay shim listener installed by `installRelayShim()`. The new optional `resources?` field flows transparently through the existing wire — central shim doesn't need to know about it.
- **Phase 129 (Central SDK Integration):** No relay-side change required. SDK re-exports relay types via the `@napplet/sdk` `relay` namespace; the additive optional field shows up automatically.
- **Phase 132 (NUB-RELAY spec amendment, cross-repo PR):** This code change ships the wire-side delivery of SIDE-01..04. The spec PR is responsible for SIDE-05 (default-OFF privacy rationale + per-event-kind allowlist guidance). Reference this SUMMARY in the spec PR body.
- **Phase 134 (VER-05):** The verification phase will write a test asserting that an opt-out shell omitting `resources` triggers no cache hydration. This code change does NOT enforce opt-out — the shell decides what to populate; the napplet shim consumes whatever arrives. Opt-out enforcement lives at the spec layer.

## Next Phase Readiness

- Wire amendment complete; `@napplet/nub` per-package type-check + build + smoke test all green.
- Phase 127 ready for verification (`/gsd:verify-phase 127`).
- DEF-125-01 carry continues — workspace-wide failure remains contained to `@napplet/shim` and is the explicit responsibility of Phase 128.
- Phases 127, 128, 129, 130 are now mutually independent (all unblocked by 126); any of 128/129/130 may proceed next.

## Self-Check: PASSED

- FOUND: `.planning/phases/127-nub-relay-sidecar-amendment/127-01-SUMMARY.md`
- FOUND: `packages/nub/src/relay/types.ts`
- FOUND: `packages/nub/src/relay/shim.ts`
- FOUND: commit `24aca30` (Task 1)
- FOUND: commit `0a2ee58` (Task 2)
- CONFIRMED: `/tmp/127-sidecar-smoke.mjs` cleaned up after smoke test pass

---
*Phase: 127-nub-relay-sidecar-amendment*
*Completed: 2026-04-20*
