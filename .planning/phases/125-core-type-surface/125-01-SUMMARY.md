---
phase: 125-core-type-surface
plan: 01
subsystem: core-types
tags: [typescript, nub-domain, namespaced-capability, napplet-global, resource-nub, dom-lib]

# Dependency graph
requires:
  - phase: 124 (v0.27.0 close)
    provides: Stable IFC-named NappletGlobal interface and 9-domain NubDomain union (relay, identity, storage, ifc, theme, keys, media, notify, config) — Phase 125 widens by 1 (resource).
provides:
  - "'resource' literal added to NubDomain union (10 domains total)"
  - "'resource' string added to NUB_DOMAINS runtime constant array"
  - "NubDomain JSDoc table updated with `resource` row; prose count corrected (eight → ten)"
  - "NappletGlobal.resource namespace declaration with bytes() and bytesAsObjectURL() method signatures (locked v0.28.0 contract)"
  - "NamespacedCapability JSDoc documents perm:strict-csp as a valid permission identifier (type unchanged — perm:${string} template literal already accepts it)"
  - "DOM types (lib: ['ES2022','DOM','DOM.Iterable']) enabled in @napplet/core tsconfig — required for Blob global, aligns @napplet/core with shim/sdk/nub/vite-plugin"
affects: [126-resource-nub-scaffold, 127-nub-relay-sidecar, 128-central-shim-integration, 129-central-sdk-integration, 130-vite-plugin-strict-csp]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TypeScript namespace declaration mirrors prior NUB additions (v0.20.0 keys, v0.22.0 media, v0.23.0 notify, v0.24.0 identity, v0.25.0 config)"
    - "Per-NUB literal added simultaneously to (a) NubDomain union, (b) NUB_DOMAINS array, (c) NubDomain JSDoc table — three-touchpoint sync"
    - "NappletGlobal namespace placement convention: each namespace adjacent to most recently added; meta-`shell` namespace remains last"

key-files:
  created:
    - ".planning/phases/125-core-type-surface/deferred-items.md (DEF-125-01: expected workspace-wide type-check breakage in @napplet/shim until Phase 128 wires the resource namespace)"
  modified:
    - "packages/core/src/envelope.ts (NubDomain union +1, NUB_DOMAINS array +1, JSDoc table +1 row, prose count fix, NamespacedCapability JSDoc +1 example row + @example line)"
    - "packages/core/src/types.ts (NappletGlobal interface +resource namespace with bytes + bytesAsObjectURL signatures, JSDoc with @example block)"
    - "packages/core/tsconfig.json (lib +'DOM' +'DOM.Iterable' to bring @napplet/core in line with all sibling packages so global Blob is in scope)"

key-decisions:
  - "Added DOM lib to @napplet/core tsconfig so Blob is in scope without a runtime import; aligns with shim/sdk/nub/vite-plugin which all already use ['ES2022','DOM','DOM.Iterable']. This is the principled fix the planner expected ('Blob is a global DOM type')."
  - "Honored plan's explicit scope ('No other packages modified'): did NOT add a stub resource property to @napplet/shim despite cascade type-check failure. Phase 128 (Central Shim Integration) will resolve."
  - "NappletGlobal.resource declared as REQUIRED (not optional) per plan's verbatim copy-paste of the namespace block. Phase 128 must wire it; documented in deferred-items.md."

patterns-established:
  - "Pattern: Pure type-only NUB scaffold (no runtime dispatch wired) is a valid single-plan phase before NUB package scaffold and shim integration"
  - "Pattern: When adding a new NUB to NappletGlobal, the central shim's window.napplet object literal will fail type-check until its corresponding integration phase — this is acceptable mid-milestone breakage"

requirements-completed: [CORE-01, CORE-02, CORE-03]

# Metrics
duration: 4m
completed: 2026-04-20
---

# Phase 125 Plan 01: Core Type Surface Summary

**Added 'resource' to NubDomain (10 domains) + NappletGlobal.resource namespace with bytes() and bytesAsObjectURL() — pure type-only scaffold that unblocks the 9 downstream v0.28.0 phases**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-20T12:15:38Z
- **Completed:** 2026-04-20T12:19:39Z
- **Tasks:** 2/2
- **Files modified:** 3 (envelope.ts, types.ts, tsconfig.json)

## Accomplishments

- Widened `NubDomain` union from 9 to 10 domains by adding `'resource'` literal; `NUB_DOMAINS` runtime array kept in sync; JSDoc table extended with the `resource` row and prose count corrected from "eight" to "ten" (fixing pre-existing v0.25.0 copy-paste drift).
- Declared `NappletGlobal.resource` namespace with the locked v0.28.0 method signatures: `bytes(url: string): Promise<Blob>` and `bytesAsObjectURL(url: string): { url: string; revoke: () => void }`. Full JSDoc + `@example` block follows the established 9-NUB pattern.
- Documented `perm:strict-csp` as a valid `perm:`-prefixed identifier in `NamespacedCapability` JSDoc (table row + `@example` line). Type itself unchanged — the existing `` `perm:${string}` `` template literal already accepts it.
- All three `@napplet/core` gates green: `type-check` exits 0, `build` exits 0 (33.91 KB d.ts emitted), `test:unit` 19/19 pass with no regression.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 'resource' to NubDomain + NUB_DOMAINS + clarify NamespacedCapability JSDoc** — `a2cb8c1` (feat)
2. **Task 2: Add `resource` namespace to NappletGlobal interface (+ DOM lib deviation)** — `9fee8c3` (feat)

**Plan metadata:** _to be appended after this SUMMARY commit_

## Files Created/Modified

- `packages/core/src/envelope.ts` — NubDomain union (+resource), NUB_DOMAINS array (+resource), JSDoc table row, NamespacedCapability JSDoc (+perm:strict-csp doc only)
- `packages/core/src/types.ts` — NappletGlobal interface (+resource namespace with bytes/bytesAsObjectURL)
- `packages/core/tsconfig.json` — lib `["ES2022"]` → `["ES2022","DOM","DOM.Iterable"]` (deviation, see below)
- `.planning/phases/125-core-type-surface/deferred-items.md` — DEF-125-01 documents expected workspace-wide type-check breakage until Phase 128

## Final Shape of Modified Surface

### `NubDomain` (10 domains, post-Phase 125)

```typescript
export type NubDomain =
  | 'relay' | 'identity' | 'storage' | 'ifc' | 'theme'
  | 'keys'  | 'media'    | 'notify'  | 'config' | 'resource';
```

### `NUB_DOMAINS` (10 entries, sync-mirror of union)

```typescript
export const NUB_DOMAINS: readonly NubDomain[] = [
  'relay', 'identity', 'storage', 'ifc', 'theme',
  'keys',  'media',    'notify',  'config', 'resource',
] as const;
```

### `NamespacedCapability` (UNCHANGED — JSDoc-only edit)

```typescript
export type NamespacedCapability =
  | NubDomain
  | `nub:${NubDomain}`
  | `perm:${string}`;
```

The `` `perm:${string}` `` template literal already accepts `perm:strict-csp` — Phase 125 only documents this in JSDoc.

### `NappletGlobal.resource` (new, locked v0.28.0 contract)

```typescript
resource: {
  bytes(url: string): Promise<Blob>;
  bytesAsObjectURL(url: string): { url: string; revoke: () => void };
};
```

Placement: between `config` (most recently added) and `shell` (meta-namespace, conventionally last).

## Decisions Made

- **Added DOM lib to `@napplet/core` tsconfig.** The plan asserted "Blob is a global DOM type" and explicitly forbade a runtime import. But `packages/core/tsconfig.json` had `lib: ["ES2022"]` only — no DOM. Without DOM, `Blob` resolved to TS2304. Every sibling package (`shim`, `sdk`, `nub`, `vite-plugin`) already uses `["ES2022","DOM","DOM.Iterable"]`, so adding DOM here is a consistency fix, not an architectural shift. This was the only path to honor the plan's "no runtime import" constraint while still letting the file type-check.
- **Honored plan scope: did NOT touch `@napplet/shim`.** Widening `NappletGlobal` with a required `resource` property breaks the shim's `window.napplet` object literal (TS2741). The plan's success criterion #7 says "No runtime behavior added; no other packages modified," and Phase 128 is named "Central Shim Integration" precisely to wire this up. Cross-package breakage logged in `deferred-items.md` (DEF-125-01).
- **Kept `resource` REQUIRED, not optional, in `NappletGlobal`.** The plan's verbatim namespace block specifies `resource: {` (required). Making it optional would have prevented the cascade breakage but would have weakened the type contract Phase 126 NUB-RESOURCE shim/SDK builds against.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `"DOM"` and `"DOM.Iterable"` to `packages/core/tsconfig.json` `lib`**

- **Found during:** Task 2 (NappletGlobal.resource namespace declaration)
- **Issue:** `tsc --noEmit` failed with `TS2304: Cannot find name 'Blob'` because `@napplet/core` had `lib: ["ES2022"]` — DOM globals were not in scope. The plan explicitly forbade a runtime import ("Blob is a global DOM type") and assumed DOM was available, but `packages/core` is the only workspace package that does not enable DOM.
- **Fix:** Updated `packages/core/tsconfig.json` `lib` from `["ES2022"]` to `["ES2022", "DOM", "DOM.Iterable"]`. Matches `packages/shim/tsconfig.json`, `packages/sdk/tsconfig.json`, `packages/nub/tsconfig.json`, and `packages/vite-plugin/tsconfig.json`.
- **Files modified:** `packages/core/tsconfig.json`
- **Verification:** `pnpm --filter @napplet/core type-check` → exit 0; `pnpm --filter @napplet/core build` → exit 0; `pnpm --filter @napplet/core test:unit` → 19/19 pass.
- **Committed in:** `9fee8c3` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation aligns `@napplet/core` with every other workspace package and was the only path to honor the plan's "no runtime import" constraint while letting `Blob` type-check. No scope creep — `@napplet/core`'s public type surface in `dist/index.d.ts` is unchanged in shape; only the build-time available globals expand. No runtime behavior added.

## Issues Encountered

- **Workspace-wide type-check now fails in `@napplet/shim` (TS2741: missing `resource` property).** This is expected, planned, and out of scope for Phase 125 per plan success criterion #7. Logged as DEF-125-01 in `deferred-items.md`. Phase 128 (Central Shim Integration) will repair. While broken, use `pnpm --filter @napplet/core` for per-package validation; avoid `pnpm -r type-check` as a milestone-arc gating signal until Phase 128 lands.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 126 (Resource NUB Scaffold + `data:` Scheme) can begin:** It will create `packages/nub/src/resource/` consuming the `'resource'` literal from `NubDomain` and the `NappletGlobal['resource']` shape from `@napplet/core`.
- **Phase 130 (Vite-Plugin Strict CSP) can begin in parallel:** The `perm:strict-csp` capability identifier is now JSDoc-documented as a valid `NamespacedCapability` value; the vite-plugin can reference it without type widening.
- **Locked v0.28.0 contract:** Phase 126 builds the runtime against the `bytes(url): Promise<Blob>` and `bytesAsObjectURL(url): { url; revoke }` signatures shipped here. Per plan: do not evolve these signatures in Phase 126 except via explicit milestone-level decision.
- **Known carry-over blocker:** `@napplet/shim` workspace type-check breakage (DEF-125-01) persists until Phase 128 wires the resource shim. Per-package validation still works.

## Self-Check: PASSED

**Files verified to exist:**
- `packages/core/src/envelope.ts` — FOUND (modified)
- `packages/core/src/types.ts` — FOUND (modified)
- `packages/core/tsconfig.json` — FOUND (modified)
- `.planning/phases/125-core-type-surface/deferred-items.md` — FOUND (created)
- `.planning/phases/125-core-type-surface/125-01-SUMMARY.md` — FOUND (this file)

**Commits verified to exist:**
- `a2cb8c1` (Task 1) — FOUND
- `9fee8c3` (Task 2) — FOUND

**Plan acceptance criteria verified:**
- `grep "'resource'" packages/core/src/envelope.ts` → 2 matches (union + array) — PASS
- `grep "perm:strict-csp" packages/core/src/envelope.ts` → 2 matches (JSDoc table + @example) — PASS
- `grep "| \`resource\`" packages/core/src/envelope.ts` → 1 match (JSDoc table row) — PASS
- `grep "^  resource: {" packages/core/src/types.ts` → 1 match (single declaration, no duplicate) — PASS
- `grep "bytes(url: string): Promise<Blob>" packages/core/src/types.ts` → 1 match — PASS
- `grep "bytesAsObjectURL(url: string): { url: string; revoke: () => void }" packages/core/src/types.ts` → 1 match — PASS
- `pnpm --filter @napplet/core type-check` → exit 0 — PASS
- `pnpm --filter @napplet/core build` → exit 0; `dist/index.d.ts` 33.91 KB; contains `'resource'` and `perm:strict-csp` — PASS
- `pnpm --filter @napplet/core test:unit` → 19/19 pass, exit 0 (no regression) — PASS
- `NamespacedCapability` type union shape unchanged (`| NubDomain | \`nub:${NubDomain}\` | \`perm:${string}\``) — PASS

---
*Phase: 125-core-type-surface*
*Completed: 2026-04-20*
