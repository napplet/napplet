---
phase: 135-first-party-types-sdk-plumbing
plan: 01
subsystem: types
tags: [typescript, nub-identity, identity.decrypt, rumor, unsigned-event, discriminated-union, nip-17, nip-59]

# Dependency graph
requires:
  - phase: 128-resource-shim-central-integration
    provides: "v0.28.0 Phase 128/129 4-surgical-edit central-shim/sdk pattern (Plan 02/03 will replicate this for decrypt)"
  - phase: 108-relay-publishencrypted
    provides: "v0.24.0 relay.publishEncrypted send-side one-shot request/result envelope pattern (decrypt is the receive-side mirror)"
provides:
  - "@napplet/core UnsignedEvent interface (5 fields: kind, pubkey, content, tags, created_at; NO sig field)"
  - "@napplet/core Rumor interface (UnsignedEvent & { id: string }; nostr-tools canonical rumor shape)"
  - "@napplet/core NappletGlobal.identity.decrypt(event: NostrEvent) method type — 10th identity method"
  - "@napplet/nub/identity IdentityDecryptMessage / IdentityDecryptResultMessage / IdentityDecryptErrorMessage interfaces"
  - "@napplet/nub/identity IdentityDecryptErrorCode — 8-value string-literal union"
  - "@napplet/nub/identity extended IdentityRequestMessage (9→10 members) and IdentityResultMessage (9→11 members) unions"
  - "@napplet/nub/identity barrel type-only re-exports of the 4 new surfaces"
affects:
  - 135-02  # shim handler + decrypt binding — consumes these types
  - 135-03  # SDK bare-name helper + central sdk re-exports — consumes these types
  - 135-04  # workspace verification — gates on all 3 first-party plans landing
  - 137     # public NUB-IDENTITY amendment cites shipped first-party surface
  - 138     # docs reference the exported types

# Tech tracking
tech-stack:
  added: []  # type-only additions; zero new runtime deps
  patterns:
    - "Receive-side one-shot request/result mirror of send-side relay.publishEncrypted (identity domain)"
    - "Cross-package type-borrow via `import type { NostrEvent, Rumor } from '@napplet/core'` in @napplet/nub"
    - "Rumor-is-not-NostrEvent: unsigned types intentionally carry NO `sig` field to prevent conflation bugs"
    - "Typed error-code discriminator (IdentityDecryptErrorCode) over generic Error string for wire envelopes"

key-files:
  created: []
  modified:
    - "packages/core/src/types.ts — +74 lines (UnsignedEvent + Rumor interfaces; decrypt method type)"
    - "packages/core/src/index.ts — +2 lines (UnsignedEvent + Rumor barrel re-exports)"
    - "packages/nub/src/identity/types.ts — +121 lines net (4 new type surfaces + 2 union extensions; cross-package type-only import)"
    - "packages/nub/src/identity/index.ts — +4 lines (4 new type-only barrel re-exports)"

key-decisions:
  - "Rumor = UnsignedEvent & { id: string } — no fake `sig` field (nostr-tools canonical)"
  - "IdentityDecryptErrorCode is an exported string-literal union (8 codes), NOT an enum — tree-shakes to zero bytes at runtime"
  - "`sender` on IdentityDecryptResultMessage documented in JSDoc as shell-authenticated from seal signature, NOT napplet-derived from rumor.pubkey"
  - "Outer gift-wrap `created_at` intentionally NOT surfaced on the result envelope (NIP-59 privacy floor)"
  - "Added missing `export type { UnsignedEvent, Rumor }` to @napplet/core barrel (src/index.ts) — deviation Rule 2: required for cross-package consumption"

patterns-established:
  - "One-shot request/result envelope triad (.request / .result / .error) for shell-mediated crypto operations on the receive side — mirrors relay.publishEncrypted send-side shape"
  - "Cross-NUB type-borrow: @napplet/nub/identity imports Rumor from @napplet/core without taking a runtime dependency"
  - "Plan-authored deferred workspace-wide type-check gate: plans may intentionally leave downstream shim/sdk breakage until a later plan lands runtime binding (shim type-check will fail until Plan 135-02 adds the decrypt mount property)"

requirements-completed: [TYPES-01, TYPES-02, TYPES-03, TYPES-04, TYPES-05]

# Metrics
duration: 4min
completed: 2026-04-23
---

# Phase 135 Plan 01: First-Party Types — Identity Decrypt Surface Summary

**Added 3 new wire-level message types (`identity.decrypt` / `.result` / `.error`) + `IdentityDecryptErrorCode` 8-code union + `UnsignedEvent` + `Rumor` (nostr-tools-canonical, no-sig) interfaces + `NappletGlobal.identity.decrypt(event)` method type — zero runtime code shipped; pure type contract for downstream shim (Plan 02) and SDK (Plan 03) to author against.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-23T11:31:01Z
- **Completed:** 2026-04-23T11:34:52Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `@napplet/core` now exports `UnsignedEvent` (the 5-field unsigned event shape) and `Rumor` (UnsignedEvent & { id: string } — the nostr-tools canonical rumor type) — both intentionally carry NO `sig` field to prevent conflation with signed `NostrEvent`
- `NappletGlobal.identity.decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` method signature locked in `@napplet/core` — 10th identity method; JSDoc documents NUB-CLASS-1 gating, shell-driven shape auto-detection, and seal-authenticated `sender` semantics
- `@napplet/nub/identity` ships 3 new envelope interfaces (`IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage`) and the 8-code `IdentityDecryptErrorCode` string-literal union — mirroring `relay.publishEncrypted`'s one-shot request/result shape on the receive side
- Discriminated-union exhaustiveness preserved: `IdentityRequestMessage` went 9→10 members, `IdentityResultMessage` went 9→11 members; `IdentityNubMessage` automatically picks up the 3 new types via its two composing unions
- `@napplet/nub/identity/index.ts` barrel exports the 4 new type surfaces via type-only re-export; runtime shim/sdk re-export blocks intentionally UNCHANGED (reserved for Plans 02/03)
- All 14 dist .d.ts files emit correctly; symbol-level grep confirms the 3 new interfaces, the 8-code union, and the 3 union extensions land in `packages/nub/dist/identity/{index.d.ts,types.d.ts}`

## Task Commits

Each task was committed atomically:

1. **Task 1: UnsignedEvent + Rumor + decrypt signature in @napplet/core** — `9b668c7` (feat)
2. **Task 2: IdentityDecrypt* interfaces + IdentityDecryptErrorCode + union extensions + core barrel re-exports** — `316fe42` (feat)
3. **Task 3: Type-only barrel re-exports in @napplet/nub/identity/index.ts** — `f789049` (feat)

## Files Created/Modified

- `packages/core/src/types.ts` — +74 lines. Added `UnsignedEvent` and `Rumor` interfaces (inserted after `EventTemplate`, before `NappletGlobal` block). Added `decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` as the 10th method on the `NappletGlobal.identity` object type.
- `packages/core/src/index.ts` — +2 lines. Added `UnsignedEvent` and `Rumor` to the `export type { ... } from './types.js'` barrel block so `@napplet/nub` can import them without reaching into private paths. **Deviation (Rule 2)** — see below.
- `packages/nub/src/identity/types.ts` — +121 lines net. Extended top import to pull `NostrEvent` and `Rumor` from `@napplet/core`. Added `// ─── Decrypt Surface ───` section with `IdentityDecryptErrorCode` (8-value union), `IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage`. Appended `| IdentityDecryptMessage` to `IdentityRequestMessage` union; appended `| IdentityDecryptResultMessage | IdentityDecryptErrorMessage` to `IdentityResultMessage` union. `IdentityNubMessage` left unchanged (picks up new members through its composing unions).
- `packages/nub/src/identity/index.ts` — +4 lines. Added `IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage`, `IdentityDecryptErrorCode` to the existing `export type { ... } from './types.js'` block. Runtime `./shim.js` and `./sdk.js` re-export blocks left byte-identical (reserved for Plans 02/03).

## Decisions Made

- **Rumor shape = `UnsignedEvent & { id: string }`** (exactly nostr-tools canonical). Intentionally NO `sig` field. JSDoc explicitly warns: "Treating a rumor as a signed event is a bug."
- **`sender` is shell-authenticated, not napplet-derived.** JSDoc on both the `decrypt` method (in `@napplet/core`) and `IdentityDecryptResultMessage.sender` (in `@napplet/nub/identity`) documents that `sender` comes from the validated seal signature. Deriving `sender` from `rumor.pubkey` would re-open attacker-controlled impersonation, since the rumor is unsigned.
- **Outer `created_at` NOT surfaced.** `IdentityDecryptResultMessage` has `rumor` + `sender` only — the gift-wrap outer `created_at` is NIP-59-randomized ±2 days for sender anonymity; exposing it undoes the privacy floor.
- **`IdentityDecryptErrorCode` is a string-literal union (not an enum).** Keeps the symbol type-only, tree-shakes to zero bytes at runtime, and aligns with the existing pattern for domain codes in the codebase.
- **Typed-discriminator errors over generic `Error`.** `IdentityDecryptErrorMessage.error` is typed as `IdentityDecryptErrorCode`, not `string`, preserving exhaustiveness for consumers.

### 8-Value IdentityDecryptErrorCode (locked wire vocabulary)

For downstream plan (and Phase 137 spec amendment) reference:

```ts
export type IdentityDecryptErrorCode =
  | 'class-forbidden'
  | 'signer-denied'
  | 'signer-unavailable'
  | 'decrypt-failed'
  | 'malformed-wrap'
  | 'impersonation'
  | 'unsupported-encryption'
  | 'policy-denied';
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `UnsignedEvent` and `Rumor` to the `@napplet/core` public barrel**
- **Found during:** Task 2 (first attempt at `pnpm --filter @napplet/nub type-check`)
- **Issue:** Plan Task 1 added `UnsignedEvent` and `Rumor` interfaces to `packages/core/src/types.ts` but did NOT ask for them to be re-exported from `packages/core/src/index.ts`. Without the barrel re-export, the plan's must-have "`import type { Rumor, UnsignedEvent } from '@napplet/core'` resolves cleanly" was unsatisfiable — the type-check failed with `TS2305: Module '"@napplet/core"' has no exported member 'Rumor'` as soon as Task 2's cross-package import was added. The `must_haves.truths` clause for this import is a hard success criterion, so barrel re-export is not optional.
- **Fix:** Added `UnsignedEvent` and `Rumor` to the existing `export type { ... } from './types.js'` block in `packages/core/src/index.ts`. No logic changes — pure type re-export.
- **Files modified:** `packages/core/src/index.ts` (+2 lines)
- **Verification:** After rebuild, `grep -c "UnsignedEvent\|Rumor" packages/core/dist/index.d.ts` returned `7` (matching surfaces across interface declarations, inheritance, and namespaced export list). `pnpm --filter @napplet/nub type-check` exits 0.
- **Committed in:** `316fe42` (bundled with Task 2)

---

**Total deviations:** 1 auto-fixed (1 missing critical export)
**Impact on plan:** Strictly necessary for the plan's own `must_haves.truths` to hold. No scope creep — change is type-only, logic-equivalent, and keeps the `@napplet/core` barrel complete against the new types it now houses.

## Issues Encountered

- **Build-order: `@napplet/nub` consumes `@napplet/core` via `dist/`, not `src/`.** The initial `pnpm --filter @napplet/nub type-check` run after Task 2's edit failed because `@napplet/core`'s `dist/` still reflected the pre-Task-1 state. Resolution: ran `pnpm --filter @napplet/core build` to emit the new types into `dist/index.d.ts`, then re-ran `@napplet/nub type-check` — exit 0. Standard workspace-cache invalidation behavior; noted here so Plan 02 anticipates the same sequencing (edit core → build core → edit nub → type-check nub).

- **Workspace-wide `pnpm -r type-check` intentionally RED after this plan.** As the plan's `<verification>` section explicitly documents: "Downstream shim/sdk type-check failures from missing runtime binding are EXPECTED until Plans 02/03 land; that's why those plans run before Plan 04." Confirmed as expected: `packages/shim/src/index.ts(172,3): error TS2741: Property 'decrypt' is missing in type ... but required in type ... decrypt(event: NostrEvent): Promise<...>`. Plan 02 closes this by adding the `decrypt` property to the central shim's `window.napplet.identity` mount. The workspace-wide gate is the explicit responsibility of Plan 135-04 (REQ `VER-01`), not this plan.

## Per-Package Build/Type-Check Exit Codes

As required by plan `<output>` spec:

| Package        | Command                                      | Exit |
| -------------- | -------------------------------------------- | ---- |
| `@napplet/core` | `pnpm --filter @napplet/core type-check`   | 0    |
| `@napplet/core` | `pnpm --filter @napplet/core build`        | 0    |
| `@napplet/nub`  | `pnpm --filter @napplet/nub type-check`    | 0    |
| `@napplet/nub`  | `pnpm --filter @napplet/nub build`         | 0    |
| workspace-wide  | `pnpm -r type-check`                       | **2 (expected — shim mount missing `decrypt` property; Plan 02 closes)** |

## Confirmations for Downstream Plans

- **Runtime barrel re-exports are intentionally UNCHANGED** in `packages/nub/src/identity/index.ts`:
  - `export { ... } from './shim.js'` block (lines 51–63) — no `decrypt` entry; Plan 02 lands it alongside the shim handler
  - `export { ... } from './sdk.js'` block (lines 67–77) — no `identityDecrypt` entry; Plan 03 lands it alongside the SDK bare-name helper
- **Zero nostr-tools runtime imports** in `packages/nub/src/` confirmed via grep (CLAUDE.md / AGENTS.md invariant maintained)
- **Types-only tree-shake contract preserved:** `@napplet/nub/identity/types` consumers see only type declarations; no runtime symbols in the barrel

## User Setup Required

None — pure type additions, no external service configuration, no sudo commands, no credentials.

## Next Phase Readiness

- Plan 135-02 (shim handler + decrypt binding) is unblocked: can import `IdentityDecryptMessage` / `IdentityDecryptResultMessage` / `IdentityDecryptErrorMessage` / `IdentityDecryptErrorCode` / `Rumor` from their packages and author the runtime routing without any speculative type work.
- Plan 135-03 (SDK bare-name helper + central re-exports) is unblocked for the same reason.
- Plan 135-04 (workspace-wide VER-01 gate) remains appropriately RED until both 135-02 and 135-03 land — this is the plan-author's explicit sequencing.
- Phase 137 public NUB-IDENTITY amendment can cite the 8-code vocabulary, 3 new envelopes, and Rumor shape as **shipped**, not hypothetical.

## Self-Check: PASSED

- `packages/core/src/types.ts` exists and contains `export interface UnsignedEvent`, `export interface Rumor extends UnsignedEvent`, and `decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` — FOUND
- `packages/core/src/index.ts` exports `UnsignedEvent` and `Rumor` from the types barrel — FOUND
- `packages/nub/src/identity/types.ts` contains `export interface IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage`, and `export type IdentityDecryptErrorCode =` with 8 members — FOUND
- `packages/nub/src/identity/index.ts` re-exports the 4 new type surfaces from `./types.js` — FOUND
- Commit `9b668c7` (Task 1) — FOUND in `git log`
- Commit `316fe42` (Task 2) — FOUND in `git log`
- Commit `f789049` (Task 3) — FOUND in `git log`

---
*Phase: 135-first-party-types-sdk-plumbing*
*Completed: 2026-04-23*
