---
phase: 135-first-party-types-sdk-plumbing
plan: 02
subsystem: shim
tags: [typescript, nub-identity, identity.decrypt, shim-runtime, central-shim, gate-04-deferred, postmessage]

# Dependency graph
requires:
  - phase: 135
    plan: 01
    provides: "IdentityDecryptMessage + IdentityDecryptResultMessage types; Rumor import surface on @napplet/core; NappletGlobal.identity.decrypt method type"
  - phase: 108-relay-publishencrypted
    provides: "v0.24.0 one-shot request/result envelope pattern (decrypt is the receive-side mirror)"
  - phase: 107-napplet-nub-identity
    provides: "v0.24.0 identity NUB shim with pendingRequests map + sendRequest<T> helper + handleIdentityMessage dispatcher"
provides:
  - "packages/nub/src/identity/shim.ts `decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` public function — JSON-envelope postMessage to window.parent, correlation-ID tracked via pendingRequests, 30s timeout via sendRequest<T>"
  - "packages/nub/src/identity/shim.ts `identity.decrypt.result` branch in handleIdentityMessage — resolves pending promise with { rumor, sender } object"
  - "packages/nub/src/identity/index.ts barrel runtime re-export of `decrypt` from './shim.js' (12 total runtime exports)"
  - "packages/shim/src/index.ts window.napplet.identity.decrypt mount — `decrypt` added to identity-NUB named imports + identity object literal"
affects:
  - 135-03  # SDK bare-name helper + central-sdk re-exports — consumes live runtime surface
  - 135-04  # workspace-wide VER-01 gate — now only pending SDK proxy addition in Plan 03
  - 137     # public NUB-IDENTITY amendment cites shipped SDK-plus-shim pair as reference implementation

# Tech tracking
tech-stack:
  added: []  # zero new runtime deps; zero nostr-tools imports; pure TypeScript plumbing
  patterns:
    - "Receive-side one-shot request/result mirror of send-side relay.publishEncrypted — now live on shim"
    - "Cross-package type-borrow via `import type { NostrEvent, Rumor } from '@napplet/core'` in @napplet/nub runtime"
    - "Existing generic `.error` branch + prefix-and-suffix central routing absorb new wire envelopes without duplicate handling"
    - "Surgical-edit count for new identity-NUB method collapses to TWO (import + mount) — routing + install are pre-existing identity infrastructure"

key-files:
  created: []
  modified:
    - "packages/nub/src/identity/shim.ts — +40 lines (IdentityDecryptMessage+IdentityDecryptResultMessage type imports, @napplet/core Rumor+NostrEvent type import, identity.decrypt.result handler branch, decrypt() public function with full JSDoc)"
    - "packages/nub/src/identity/index.ts — +1 line (decrypt added to runtime re-export block from './shim.js')"
    - "packages/shim/src/index.ts — +2 lines (decrypt in identity-NUB named import list, decrypt in window.napplet.identity object literal)"

key-decisions:
  - "SHIM-03 surgical-edit count: TWO textual edits (import + mount), both within identity-NUB hosting lines — existing routing at shim/src/index.ts:104 and existing `installIdentityShim()` call at :224 absorb rest"
  - "Existing generic `.error` branch at identity/shim.ts:56–63 reused for identity.decrypt.error — no typed error-code branch required (rejection-with-Error already carries the 8-code vocabulary as .message)"
  - "GATE-04 shim-side class-short-circuit DEFERRED — window.napplet.class slot is not yet part of NappletGlobal in v0.29.0 milestone; shim cannot cleanly read a slot that does not exist. Shell enforcement authoritative per v0.29.0 STATE.md invariant ('shim-side class check is OBSERVABILITY-only; never the trust boundary')"
  - "Workspace-wide `pnpm -r type-check` went fully GREEN (stronger than plan's must_haves predicted) — SDK's identity namespace is a partial proxy, not a mirrored surface, so missing `decrypt` there doesn't produce a compile error. Plan 03's addition is purely additive DX surface"

requirements-completed: [SHIM-01, SHIM-02, SHIM-03]

# Metrics
duration: 3min
completed: 2026-04-23
---

# Phase 135 Plan 02: Shim Runtime — Identity Decrypt Function Summary

**Shipped `window.napplet.identity.decrypt(event)` live on the central @napplet/shim — decrypt() function in identity NUB shim (+ identity.decrypt.result handler branch reusing existing pendingRequests/sendRequest infrastructure) + barrel re-export + two surgical edits to packages/shim/src/index.ts. Workspace-wide type-check went fully green (stronger than predicted). Zero nostr-tools imports; all crypto runs shell-side.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-23T11:38:26Z
- **Completed:** 2026-04-23T11:41:05Z
- **Tasks:** 3
- **Files modified:** 3
- **Lines added:** 43 total (40 shim.ts + 1 index.ts + 2 shim/index.ts)

## Accomplishments

- `packages/nub/src/identity/shim.ts` now exports `decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` — correlation-ID tracked, 30s timeout via `sendRequest<T>`, JSON envelope `{ type: 'identity.decrypt', id, event }` posted to `window.parent`. Full JSDoc including NUB-CLASS-1 gating reference, shape auto-detect semantics, seal-authenticated sender note, and NIP-59 outer-`created_at` privacy floor explanation.
- `handleIdentityMessage()` gained a single new branch for `identity.decrypt.result` that resolves the pending promise with `{ rumor, sender }` (object — NOT just `rumor`). The existing generic `.error` branch at lines 56–63 handles `identity.decrypt.error` without modification.
- `packages/nub/src/identity/index.ts` runtime re-export block from `./shim.js` grew by one entry (`decrypt`), now 12 total runtime exports. Type-only block already carries the 4 decrypt-surface types from Plan 01.
- `packages/shim/src/index.ts` received the two planned surgical edits:
  - Add `decrypt` to the named imports from `@napplet/nub/identity/shim` (line 36)
  - Add `decrypt,` to the `identity:` object literal mounted on `window.napplet` (line 182)
- Per-package gates green: `@napplet/nub` type-check + build exit 0, `@napplet/shim` type-check + build exit 0.
- Zero nostr-tools imports in `packages/nub/src/identity/shim.ts` (verified via `grep`).

## Task Commits

Each task was committed atomically:

1. **Task 1: decrypt() function + identity.decrypt.result branch in identity NUB shim** — `9a983d9` (feat)
2. **Task 2: decrypt added to @napplet/nub/identity barrel runtime re-export** — `b310415` (feat)
3. **Task 3: central shim surgical edits — import + mount decrypt on window.napplet.identity** — `04e0cc4` (feat)

## Files Created/Modified

- `packages/nub/src/identity/shim.ts` — +40 lines. Added `IdentityDecryptMessage` + `IdentityDecryptResultMessage` to the existing `import type { … } from './types.js'` block (2 entries). Added a new `import type { NostrEvent, Rumor } from '@napplet/core'` line directly after the types import. Added a new `} else if (type === 'identity.decrypt.result') { … resolvePending(result.id, { rumor: result.rumor, sender: result.sender }); }` branch inside `handleIdentityMessage()` after the `getBadges.result` branch. Appended the new `export function decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` public function (with 21-line JSDoc) after `getBadges()` and before the `// ─── Install / cleanup ───` section divider.
- `packages/nub/src/identity/index.ts` — +1 line. Added `decrypt,` to the runtime re-export block `export { … } from './shim.js';` (placed after `getBadges,`). SDK re-export block from `./sdk.js` left byte-identical (reserved for Plan 03).
- `packages/shim/src/index.ts` — +2 lines. Added `decrypt,` to the named imports list from `@napplet/nub/identity/shim` (after `getBadges,`). Added `decrypt,` to the `identity:` object literal (after `getBadges,`). `handleEnvelopeMessage` routing left byte-identical — the existing `if (type.startsWith('identity.') && (type.endsWith('.result') || type.endsWith('.error')))` branch at line 104 already captures both `identity.decrypt.result` and `identity.decrypt.error` via prefix+suffix match (pre-verified by reading lines 103–107 before editing).

## Decisions Made

- **SHIM-03 outcome: TWO surgical edits, both within identity-NUB hosting lines.** The plan documented CONTEXT.md §integration-points guidance as "one surgical edit: import decrypt ... and add to the identity mount". That decomposes in practice to two textual edits (import-list entry + object-literal property), both in tightly-adjacent identity-NUB scoped locations in `packages/shim/src/index.ts`. The 4-surgical-edit pattern from v0.28.0 Phase 128 collapses further because (b) the routing branch and (d) the `installIdentityShim()` call are pre-existing identity-NUB infrastructure. Net change on central shim: 2 lines.
- **Existing generic `.error` branch reused without duplication.** `handleIdentityMessage()` at lines 56–63 already has `if (type.endsWith('.error')) { … rejectPending(id, new Error(error)); }`. This generic branch handles `identity.decrypt.error` exactly as desired — the typed `IdentityDecryptErrorCode` from the wire envelope is carried as the `Error.message` after rejection. No new typed-error branch was added. Verified by reading lines 56–63 before editing.
- **GATE-04 shim-side class-short-circuit DEFERRED.** v0.29.0 STATE.md captures the locked decision that the shim-side class check is observability-only (NEVER the trust boundary). The plan authors noted this and explicitly anticipated the deferral: `window.napplet.class` is not yet part of the `NappletGlobal` type in this milestone, so a shim-side short-circuit has nothing to read. Shell enforcement is the authoritative gate. Documented as a deferral (not a gap) — this is correct scope behavior per CONTEXT.md.
- **Return-shape object, NOT just rumor.** `identity.decrypt.result` carries two fields (`rumor` + `sender`), both of which are consumed. The handler packages them into `{ rumor: result.rumor, sender: result.sender }` before resolving the pending promise — matches the locked return-shape contract in v0.29.0 STATE.md (`{ rumor: Rumor, sender: string }`).

## Deviations from Plan

None — plan executed exactly as written. No auto-fixed bugs, no missing critical functionality gaps, no blocking issues, no architectural changes. The plan-predicted workspace-wide type-check state ("should now ONLY fail on sdk") turned out stronger-than-predicted (fully green across 14 packages) because the SDK `identity` namespace is a partial proxy, not a method-for-method mirror of `NappletGlobal.identity` — this is not a deviation, just a slightly more favorable verification surface than the plan author anticipated.

## Issues Encountered

- **Plan-predicted workspace-wide type-check state (ONLY sdk red) turned out fully green.** The SDK at `packages/sdk/src/index.ts:559–652` hand-writes a `identity` namespace as explicit wrapper helpers that proxy through `requireNapplet().identity.getPublicKey()` etc. — there is no type-level mirroring that would force the wrapper to cover every `NappletGlobal.identity.*` method. So omitting a `decrypt()` helper in that namespace (which Plan 03 will add) does not produce a type error. This is a favorable observation, not an issue — it confirms Plan 03's scope is purely additive DX surface, not a blocking hole.

- **Workspace build cache sequencing is predictable.** No `@napplet/core` → `@napplet/nub` rebuild ordering surprise (as noted in the 135-01 SUMMARY) because this plan consumed already-published-to-dist types from Plan 01's last rebuild. `pnpm --filter @napplet/nub type-check` and `pnpm --filter @napplet/shim type-check` both exited 0 cleanly on first attempt.

## Per-Package Build/Type-Check Exit Codes

As required by plan `<output>` spec:

| Package         | Command                                      | Exit |
| --------------- | -------------------------------------------- | ---- |
| `@napplet/nub`  | `pnpm --filter @napplet/nub type-check`      | 0    |
| `@napplet/nub`  | `pnpm --filter @napplet/nub build`           | 0    |
| `@napplet/shim` | `pnpm --filter @napplet/shim type-check`     | 0    |
| `@napplet/shim` | `pnpm --filter @napplet/shim build`          | 0    |
| workspace-wide  | `pnpm -r type-check`                         | 0 (stronger than plan predicted; 14 packages green) |

## Exact Line Counts Added Per File

| File                                     | +lines |
| ---------------------------------------- | ------ |
| `packages/nub/src/identity/shim.ts`      | 40     |
| `packages/nub/src/identity/index.ts`     | 1      |
| `packages/shim/src/index.ts`             | 2      |
| **Total**                                | **43** |

## Confirmations for Downstream Plans

- **`window.napplet.identity.decrypt` is live.** After `import '@napplet/shim'`, `typeof window.napplet.identity.decrypt === 'function'` is true. Plan 03 (SDK) can author `identity.decrypt(event): Promise<{ rumor, sender }>` in the central sdk namespace and a bare-name `identityDecrypt(event)` helper against this live runtime surface.
- **Zero nostr-tools runtime imports preserved.** `packages/nub/src/identity/shim.ts` grep for `from ['"]nostr-tools` returns nothing. CLAUDE.md / AGENTS.md invariant maintained.
- **GATE-04 deferral is intentional, not a gap.** The phase boundary in CONTEXT.md documents shim-side class-short-circuit as `MAY short-circuit if class !== 1` — not MUST. Shell enforcement is authoritative.
- **Central-shim routing is unchanged.** No new `identity.decrypt.*` branch was added to `handleEnvelopeMessage` at `packages/shim/src/index.ts`. The existing prefix-and-suffix routing at line 104 covers the new envelope types. This preserves the v0.24.0 identity-NUB central-shim contract shape.

## User Setup Required

None — pure TypeScript plumbing, no external service configuration, no sudo commands, no credentials, no new dependencies.

## Next Phase Readiness

- **Plan 135-03 (SDK bare-name helper + central sdk re-exports) is fully unblocked.** The central `@napplet/sdk` at `packages/sdk/src/index.ts:559–652` `identity` namespace object can now add `decrypt(event): Promise<{ rumor, sender }> { return requireNapplet().identity.decrypt(event); }` against a live surface. The bare-name `identityDecrypt(event)` helper in `packages/nub/src/identity/sdk.ts` similarly can wrap `window.napplet.identity.decrypt` without any speculative type work.
- **Plan 135-04 (VER-01 workspace-wide gate) is unblocked — and nearly passing already.** Once Plan 03's SDK additions land, the workspace-wide `pnpm -r build` + `pnpm -r type-check` gate should pass cleanly. The VER-05 tree-shake contract (identity-types-only consumer does not pull shim/sdk runtime symbols) remains testable in Plan 04.
- **Phase 137 public NUB-IDENTITY amendment author can point at `packages/nub/src/identity/shim.ts#L260-L278` (decrypt function) as the first-party reference implementation** when drafting the spec's "Example Implementation" bullet. Amendment remains free to cite `NUB-CLASS-1.md` by filename for the class-gating MUST.

## Self-Check: PASSED

- `packages/nub/src/identity/shim.ts` exists and contains `export function decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` — FOUND
- `packages/nub/src/identity/shim.ts` contains `identity.decrypt.result` branch with `resolvePending(result.id, { rumor: result.rumor, sender: result.sender })` — FOUND
- `packages/nub/src/identity/shim.ts` zero nostr-tools imports (grep verified) — FOUND
- `packages/nub/src/identity/index.ts` runtime re-export block from `./shim.js` contains `decrypt,` — FOUND
- `packages/shim/src/index.ts` import block from `@napplet/nub/identity/shim` contains `decrypt,` — FOUND
- `packages/shim/src/index.ts` `identity:` object literal contains `decrypt,` — FOUND
- `packages/shim/src/index.ts` existing `if (type.startsWith('identity.')…` routing branch STILL PRESENT (byte-identical) — FOUND
- Commit `9a983d9` (Task 1) — FOUND in `git log`
- Commit `b310415` (Task 2) — FOUND in `git log`
- Commit `04e0cc4` (Task 3) — FOUND in `git log`

---
*Phase: 135-first-party-types-sdk-plumbing*
*Completed: 2026-04-23*
