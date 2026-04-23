---
phase: 135-first-party-types-sdk-plumbing
plan: 03
subsystem: sdk
tags: [typescript, nub-identity, identity.decrypt, sdk-runtime, central-sdk, bare-name-helper, 4-surgical-edit, rumor, unsigned-event]

# Dependency graph
requires:
  - phase: 135
    plan: 01
    provides: "IdentityDecryptMessage / IdentityDecryptResultMessage / IdentityDecryptErrorMessage / IdentityDecryptErrorCode types; Rumor + UnsignedEvent on @napplet/core barrel; NappletGlobal.identity.decrypt method type"
  - phase: 135
    plan: 02
    provides: "Live window.napplet.identity.decrypt runtime mount via @napplet/shim central package; decrypt() function + barrel runtime re-export in @napplet/nub/identity"
  - phase: 128-resource-shim-central-integration
    provides: "v0.28.0 Phase 129 4-surgical-edit central-SDK pattern (namespace method + core type re-exports + NUB type re-exports + bare-name helper re-export)"
provides:
  - "packages/nub/src/identity/sdk.ts `identityDecrypt(event)` bare-name SDK helper — 9→10 identity* helpers; uses existing requireIdentity() guard; throws guard error `window.napplet.identity not installed -- import @napplet/shim first` when global absent"
  - "packages/nub/src/identity/index.ts SDK re-export block expanded from 9 to 10 entries (adds identityDecrypt)"
  - "packages/sdk/src/index.ts `identity.decrypt(event)` namespace method — Promise<{ rumor: Rumor; sender: string }> — on central sdk identity namespace object"
  - "packages/sdk/src/index.ts Rumor + UnsignedEvent re-exports from @napplet/core (one-line-per-type pattern, matching NostrEvent/Subscription siblings)"
  - "packages/sdk/src/index.ts 4 new identity type re-exports appended to Identity NUB block (IdentityDecryptMessage, IdentityDecryptResultMessage, IdentityDecryptErrorMessage, IdentityDecryptErrorCode)"
  - "packages/sdk/src/index.ts `identityDecrypt` appended to bare-name identity helper re-export line (10 helpers total on that line)"
affects:
  - 135-04  # workspace verification — VER-01 / VER-05 gates are now fully satisfied up-front
  - 137     # NUB-IDENTITY public amendment cites shipped first-party SDK surface
  - 138     # SDK README + build-napplet skill cite identityDecrypt by named-import

# Tech tracking
tech-stack:
  added: []  # zero new runtime deps; zero nostr-tools imports; pure type re-exports + helper wrapping
  patterns:
    - "4-surgical-edit central-SDK pattern replicated from v0.28.0 Phase 129 (resource NUB) — namespace method → @napplet/core type re-exports → NUB-domain type re-exports → bare-name helper re-export"
    - "Named-import form preferred for decrypt return type (Promise<{ rumor: Rumor; sender: string }>) over inline Rumor expansion — Rumor added to top-of-file @napplet/core import block"
    - "Deferred workspace-wide gate now explicitly GREEN after the SDK layer lands (predicted by Plan 02 summary — Plan 04 only documents the pass)"
    - "DOMAIN const untouched (already `'identity'` since v0.24.0) — surgical-edit count collapses from 5 to 4 for identity NUB method extensions"

key-files:
  created: []
  modified:
    - "packages/nub/src/identity/sdk.ts — +22 lines (NostrEvent + Rumor pulled into @napplet/core type import; identityDecrypt function appended with full JSDoc block)"
    - "packages/nub/src/identity/index.ts — +1 line (identityDecrypt added to the runtime re-export block from './sdk.js')"
    - "packages/sdk/src/index.ts — +20 lines net (Rumor added to top-of-file type import; decrypt method on identity namespace; Rumor + UnsignedEvent @napplet/core re-exports; 4 identity types appended to NUB block; identityDecrypt appended to bare-name helper line)"

key-decisions:
  - "Named-import form chosen for decrypt return type — `Promise<{ rumor: Rumor; sender: string }>` after adding Rumor to the top-of-file @napplet/core type import. Plan allowed either named-import or inline-expansion; named-import reads cleaner and matches the bare-name helper's return shape byte-for-byte"
  - "Rumor + UnsignedEvent re-exports added as two separate one-line-per-type `export type` statements, matching the existing NostrEvent/NostrFilter/Subscription/EventTemplate convention in the block at lines 781–786 (rather than adding a new combined-list line). Consistent with surrounding style"
  - "Plan's Task 2 Edit 2 anticipated `if an existing @napplet/core re-export line exists, append` — the existing block uses one-line-per-type, so the actual edit became two additional `export type { Foo } from '@napplet/core'` lines rather than an in-place extension"
  - "Workspace-wide `pnpm -r type-check` and `pnpm -r build` both exit 0 after this plan — VER-01 implicitly satisfied early, matching Plan 02 summary's prediction"

patterns-established:
  - "For future identity NUB method additions (class etc.), the 4-surgical-edit collapse-to-2 pattern established here applies: DOMAIN const unchanged, existing prefix+suffix envelope routing absorbs new types, only (namespace method) + (type re-exports) + (helper re-export) + (bare-name NUB addition) require edits"

requirements-completed: [SDK-01, SDK-02]

# Metrics
duration: 3min
completed: 2026-04-23
---

# Phase 135 Plan 03: SDK Runtime — Identity Decrypt Helpers Summary

**Shipped the named-import ergonomic layer for `identity.decrypt`: bare-name `identityDecrypt(event)` helper in `@napplet/nub/identity`, `identity.decrypt(event)` method on the central `@napplet/sdk` identity namespace, 4 new identity type re-exports + `Rumor` + `UnsignedEvent` core type re-exports on the `@napplet/sdk` public surface, and `identityDecrypt` bare-name re-export from `@napplet/sdk`. Exactly the v0.28.0 Phase 129 4-surgical-edit pattern — `DOMAIN` const untouched (already `'identity'` from v0.24.0). Workspace-wide `pnpm -r type-check` + `pnpm -r build` both exit 0 across all 14 packages.**

## Performance

- **Duration:** ~2.5 min
- **Started:** 2026-04-23T11:44:14Z
- **Completed:** 2026-04-23T11:46:42Z
- **Tasks:** 2
- **Files modified:** 3
- **Lines added:** 43 total (22 in identity/sdk.ts + 1 in identity/index.ts + 20 in sdk/index.ts)

## Accomplishments

- `packages/nub/src/identity/sdk.ts` now exports `identityDecrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` — delegates to `requireIdentity().decrypt(event)`, matching the existing 9 `identityGet*` helper pattern for error handling (throws `window.napplet.identity not installed -- import @napplet/shim first` when global absent). Full JSDoc covers NUB-CLASS-1 gating, NIP-04 / direct NIP-44 / NIP-17 shape auto-detect, rumor + seal-authenticated sender return shape, and error-rejection convention.
- `packages/nub/src/identity/index.ts` SDK re-export block expanded from 9 to 10 entries — `identityDecrypt` appended after `identityGetBadges` inside the `export { ... } from './sdk.js'` list. The shim re-export block (`decrypt` from Plan 02) and the 4 new type-only re-exports (Plan 01) are untouched — all Plan-02 and Plan-01 artifacts remain byte-identical.
- `packages/sdk/src/index.ts` received all 4 surgical edits of the v0.28.0 Phase 129 pattern:
  - **Edit 1 (namespace method):** `decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` appended as the 10th method on the `identity` namespace object (after `getBadges()`, before the closing `};`). Invokes `requireNapplet().identity.decrypt(event)`.
  - **Edit 1a (type import):** `Rumor` added to the top-of-file `import type { ... } from '@napplet/core'` block so the namespace method's return-type uses the canonical nostr-tools-shaped `Rumor` (rather than an inline-expanded object literal).
  - **Edit 2 (core type re-exports):** `Rumor` and `UnsignedEvent` added as two additional `export type { Foo } from '@napplet/core'` lines in the existing block at lines 781–786, following the same one-line-per-type convention as `NostrEvent`/`NostrFilter`/`Subscription`/`EventTemplate`.
  - **Edit 3 (Identity NUB type re-exports):** 4 new type names appended to the existing `export type { ... } from '@napplet/nub/identity'` block (after `IdentityNubMessage`, before the closing `}`): `IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage`, `IdentityDecryptErrorCode`.
  - **Edit 4 (bare-name helper re-export):** `identityDecrypt` appended to the single-line `export { ... } from '@napplet/nub/identity'` helper-re-export line (now 10 names total: `identityGetPublicKey … identityGetBadges, identityDecrypt`).
- `DOMAIN` const at line 1000+ untouched — already `'identity'` from v0.24.0; no edit required. `installIdentityShim` re-export at line 1012 untouched.
- Per-package gates green: `@napplet/nub` type-check + build exit 0; `@napplet/sdk` type-check + build exit 0.
- Workspace-wide gates green: `pnpm -r type-check` exits 0 across 14 packages; `pnpm -r build` exits 0 across 14 packages. VER-01 is effectively satisfied; Plan 04 now only needs to formally document the pass and confirm VER-05 tree-shake contract.
- Zero nostr-tools imports in any first-party source file — verified via grep (no additions in this plan, since `Rumor` rides on `@napplet/core`'s own re-exports).

## Task Commits

Each task was committed atomically:

1. **Task 1: identityDecrypt bare-name helper + NUB barrel re-export** — `3c52882` (feat)
2. **Task 2: central SDK 4-surgical-edit — identity.decrypt method + type + helper re-exports** — `6c2a058` (feat)

## Files Created/Modified

- `packages/nub/src/identity/sdk.ts` — +22 lines.
  - Extended the existing `@napplet/core` import line from `{ NappletGlobal }` to `{ NappletGlobal, NostrEvent, Rumor }` — enables the new helper's argument + return types without changing any other import.
  - Appended `identityDecrypt(event)` as the 10th SDK helper after `identityGetBadges`, before the end of file. 21-line JSDoc block (purpose, shape auto-detect, class-gating reference, `@param`/`@returns`/`@example`). One-line body: `return requireIdentity().decrypt(event);`. Return type matches the plan's locked wire-shape contract.
- `packages/nub/src/identity/index.ts` — +1 line.
  - Added `identityDecrypt,` to the `export { ... } from './sdk.js'` block (last entry, after `identityGetBadges,`). Block now exports 10 bare-name SDK helpers.
  - Shim re-export block (12 entries including `decrypt` from Plan 02) and type-only block (24 entries including 4 decrypt types from Plan 01) left byte-identical.
- `packages/sdk/src/index.ts` — +20 lines net.
  - Extended top `@napplet/core` type import block (lines 24–30) to pull `Rumor` alongside `NappletGlobal`, `NostrEvent`, `NostrFilter`, `Subscription`, `EventTemplate` — one added line.
  - Appended `decrypt(event)` method to the `identity` namespace object (after `getBadges()`, before the closing `};`). 13-line block including 7-line JSDoc and 2-line body.
  - Added two one-line-per-type `export type { Rumor } from '@napplet/core'` and `export type { UnsignedEvent } from '@napplet/core'` lines into the existing `@napplet/core` re-export block (lines 781–786) — now 6 type re-exports from core.
  - Appended 4 new type names to the Identity NUB type re-export block: `IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage`, `IdentityDecryptErrorCode` (4 added lines with 2-space indent matching the block's style).
  - Appended `identityDecrypt` to the single-line bare-name helper re-export from `@napplet/nub/identity` (1 token added, no line count change on that line).

## 4-Surgical-Edit Pattern — Post-Edit Line Numbers

For reference by Phase 138 README authors and Phase 137 amendment drafters:

| Edit | What | File | Post-edit line | Notes |
| ---- | ---- | ---- | -------------- | ----- |
| 1 | `identity.decrypt(event)` namespace method | `packages/sdk/src/index.ts` | ~665–677 | 10th method on identity object; `Rumor` imported at line 28 |
| 2 | `Rumor` + `UnsignedEvent` core re-exports | `packages/sdk/src/index.ts` | 785–786 | Follow one-line-per-type pattern; block now 6 lines |
| 3 | Identity NUB decrypt types | `packages/sdk/src/index.ts` | 844–847 | Appended after `IdentityNubMessage,`; block now 4 longer |
| 4 | `identityDecrypt` bare-name helper | `packages/sdk/src/index.ts` | 1026 | Last token on line; 10 helpers total |
| n/a | `DOMAIN` const | n/a | n/a | UNCHANGED (already `'identity'` from v0.24.0) |
| n/a | `installIdentityShim` re-export | `packages/sdk/src/index.ts:1013` | 1013 | UNCHANGED |

Approximate line numbers — exact positions drift if surrounding JSDoc is re-flowed.

## Decisions Made

- **Named-import form for decrypt return type.** The plan (Task 2 Edit 1 IMPORTANT note) allowed either the inline-expanded return-type form (`Promise<{ rumor: { id, pubkey, ... }; sender: string }>`) OR the named-import form (`Promise<{ rumor: Rumor; sender: string }>` after adding `Rumor` to the top-of-file `@napplet/core` import). The named-import form was chosen because (a) it reads cleaner; (b) it aligns the SDK's method-level type signature byte-for-byte with the `@napplet/core` `NappletGlobal.identity.decrypt` surface declared in Plan 01; (c) type-check passed on first try — no fallback to the inline form was needed.
- **Core re-exports use one-line-per-type pattern.** The plan's Task 2 Edit 2 allowed either extending an existing combined-list line or adding new lines. The existing block at `packages/sdk/src/index.ts:781–784` is already one-line-per-type (separate `export type { NostrEvent }`, `export type { NostrFilter }`, etc.). Consistency with surrounding style is the stronger signal here — added `Rumor` and `UnsignedEvent` as two additional single-type lines rather than creating a new combined-list line.
- **DOMAIN const unchanged.** Confirmed no edit required — `DOMAIN` for identity was fixed to `'identity'` in v0.24.0 Phase 109. The v0.28.0 Phase 129 precedent (resource NUB) DID touch `DOMAIN` because it added a NEW nub; v0.29.0 Plan 03 only extends an existing NUB's method surface, so `DOMAIN` edits don't apply. 4 actual surgical edits (namespace method + core re-exports + NUB re-exports + helper re-export).
- **SDK type-check and build both pass on first attempt.** The cross-package import pathway (`@napplet/sdk` → `@napplet/nub/identity` → `@napplet/core`) resolves cleanly because Plan 01 added `Rumor` + `UnsignedEvent` to `@napplet/core`'s public barrel (Rule 2 deviation during Plan 01, committed in `316fe42`) and Plan 02 shipped the runtime `decrypt` symbol. No re-sequence of build order needed this time — Plan 01's build of `@napplet/core/dist` already had `Rumor` when Plan 03 started.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixed bugs, no missing critical functionality gaps, no blocking issues, no architectural changes.

The only noteworthy authoring discretion was the named-import-vs-inline return-type choice (Task 2 Edit 1), which the plan explicitly permitted as "either form acceptable; prefer the named-import form for readability unless type-check fails." Named-import form succeeded on first try — no fallback needed.

## Issues Encountered

None. Clean execution across both tasks. The cross-package import path (`@napplet/sdk` → `@napplet/nub/identity` → `@napplet/core`) resolved without any build-cache invalidation surprise — Plan 01's `@napplet/core` build output and Plan 02's `@napplet/nub` build output were both current on disk when Plan 03 started.

## Per-Package Build/Type-Check Exit Codes

As required by plan `<verification>` section:

| Package         | Command                                    | Exit |
| --------------- | ------------------------------------------ | ---- |
| `@napplet/nub`  | `pnpm --filter @napplet/nub type-check`    | 0    |
| `@napplet/nub`  | `pnpm --filter @napplet/nub build`         | 0    |
| `@napplet/sdk`  | `pnpm --filter @napplet/sdk type-check`    | 0    |
| `@napplet/sdk`  | `pnpm --filter @napplet/sdk build`         | 0    |
| workspace-wide  | `pnpm -r type-check`                       | 0 (14 packages green) |
| workspace-wide  | `pnpm -r build`                            | 0 (14 packages green) |

Workspace-wide gates are stronger than the plan's minimum (which called only for per-package gates); this is a favorable early satisfaction of VER-01. Plan 04 formally documents VER-01/VER-05 pass.

## Exact Line Counts Added Per File

| File                                     | +lines |
| ---------------------------------------- | ------ |
| `packages/nub/src/identity/sdk.ts`       | 22     |
| `packages/nub/src/identity/index.ts`     | 1      |
| `packages/sdk/src/index.ts`              | 20     |
| **Total**                                | **43** |

## Confirmations for Downstream Plans

- **Named imports work end-to-end.** After `pnpm build`:
  - `import { identityDecrypt } from '@napplet/nub/identity'` resolves to the Plan 03 Task 1 helper.
  - `import { identity } from '@napplet/sdk'; identity.decrypt(event)` resolves to the namespace method that proxies `window.napplet.identity.decrypt`.
  - `import { identityDecrypt } from '@napplet/sdk'` resolves via re-export to `@napplet/nub/identity`.
  - `import type { IdentityDecryptMessage, IdentityDecryptResultMessage, IdentityDecryptErrorMessage, IdentityDecryptErrorCode, Rumor, UnsignedEvent } from '@napplet/sdk'` — all 6 types resolve cleanly.
- **`DOMAIN` const unchanged** — verified. No other NUB namespace touched (relay, storage, ifc, media, notify, keys, config, resource, theme).
- **`installIdentityShim` re-export at line 1013 unchanged** — verified. Install-shim re-export surface byte-identical to pre-plan.
- **`requireIdentity()` guard pattern preserved** — the new `identityDecrypt` helper delegates through the exact same guard that `identityGetPublicKey` and the other 8 helpers use, so its throw behavior (`window.napplet.identity not installed -- import @napplet/shim first`) is uniform across all 10 bare-name helpers.
- **GATE-04 shim-side class-short-circuit still DEFERRED.** v0.29.0 STATE.md invariant preserved: shim-side class checking is observability-only; shell enforces authoritatively. No change from Plan 02's decision.

## `identityDecrypt` JSDoc Block (for Phase 138 README reference)

As required by plan `<output>` spec. The full JSDoc block at `packages/nub/src/identity/sdk.ts:170–188`:

```typescript
/**
 * Decrypt a received Nostr event (NIP-04 / direct NIP-44 / NIP-17 gift-wrap).
 *
 * Shape auto-detected by the shell; napplets do NOT select encryption mode.
 * Only legal for napplets assigned class: 1 per NUB-CLASS-1 (shell-enforced).
 *
 * @param event  The received event (outer wrap for NIP-17, kind-4 for NIP-04, etc.)
 * @returns Promise resolving to { rumor, sender }; rejects with Error carrying
 *   an IdentityDecryptErrorCode as message on failure.
 *
 * @example
 * ```ts
 * import { identityDecrypt } from '@napplet/nub-identity';
 *
 * const { rumor, sender } = await identityDecrypt(wrappedEvent);
 * console.log(`Message from ${sender}: ${rumor.content}`);
 * ```
 */
export function identityDecrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }> {
  return requireIdentity().decrypt(event);
}
```

Central-SDK namespace method JSDoc at `packages/sdk/src/index.ts:~663–674`:

```typescript
/**
 * Decrypt a received Nostr event (NIP-04 / direct NIP-44 / NIP-17 gift-wrap).
 *
 * Shape is auto-detected by the shell; napplets do NOT select encryption mode.
 * Only legal for napplets assigned class: 1 per NUB-CLASS-1 (shell-enforced).
 *
 * @param event  The received event (outer wrap for NIP-17, kind-4 for NIP-04, etc.)
 * @returns Promise resolving to { rumor, sender }; rejects with Error on failure.
 */
decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }> {
  return requireNapplet().identity.decrypt(event);
},
```

## User Setup Required

None — pure TypeScript plumbing, no external service configuration, no sudo commands, no credentials, no new dependencies.

## Next Phase Readiness

- **Plan 135-04 (VER-01 workspace-wide gate + VER-05 tree-shake) is unblocked.** Both workspace-wide gates are already passing (VER-01 effectively green up-front). Plan 04's remaining work is: (a) formally document VER-01 pass as a milestone artifact; (b) execute VER-05 tree-shake smoke (identity-types-only bundle must not pull shim/sdk runtime symbols, matching v0.28.0 VER-07 precedent); (c) record the final first-party surface inventory for Phase 137 amendment authors to cite.
- **Phase 137 public NUB-IDENTITY amendment authors can point at** `packages/nub/src/identity/sdk.ts#L170-188` (bare-name helper), `packages/sdk/src/index.ts#L663-674` (central SDK namespace method), and `packages/nub/src/identity/shim.ts` (runtime decrypt function from Plan 02) as the shipped first-party reference implementation of the `identity.decrypt` envelope triad. The amendment's "Example Implementation" bullet can cite these as live symbols, not hypothetical code.
- **Phase 138 documentation sweep is unblocked on both ends.** SDK README (`packages/sdk/README.md`) and nub README (`packages/nub/README.md`) can cite `identityDecrypt(event)` and `identity.decrypt(event)` by symbol name, knowing both are published in the next npm release.

## Self-Check: PASSED

- `packages/nub/src/identity/sdk.ts` contains `export function identityDecrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` — FOUND
- `packages/nub/src/identity/sdk.ts` contains `requireIdentity().decrypt(event)` — FOUND
- `packages/nub/src/identity/sdk.ts` `@napplet/core` import pulls `NappletGlobal, NostrEvent, Rumor` — FOUND
- `packages/nub/src/identity/index.ts` SDK re-export block from `./sdk.js` contains `identityDecrypt,` — FOUND
- `packages/sdk/src/index.ts` identity namespace object contains `decrypt(event: NostrEvent):` method — FOUND
- `packages/sdk/src/index.ts` identity namespace method body contains `requireNapplet().identity.decrypt(event)` — FOUND
- `packages/sdk/src/index.ts` `export type { Rumor } from '@napplet/core'` — FOUND
- `packages/sdk/src/index.ts` `export type { UnsignedEvent } from '@napplet/core'` — FOUND
- `packages/sdk/src/index.ts` Identity NUB type re-export block contains `IdentityDecryptMessage,`, `IdentityDecryptResultMessage,`, `IdentityDecryptErrorMessage,`, `IdentityDecryptErrorCode,` — FOUND
- `packages/sdk/src/index.ts` bare-name helper re-export line contains `identityDecrypt }` before `from '@napplet/nub/identity'` — FOUND
- Commit `3c52882` (Task 1) — FOUND in `git log`
- Commit `6c2a058` (Task 2) — FOUND in `git log`

---
*Phase: 135-first-party-types-sdk-plumbing*
*Completed: 2026-04-23*
