---
phase: 87-spec-gap-code-drops
verified: 2026-04-09T10:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 87: Spec Gap Code Drops Verification Report

**Phase Goal:** @napplet/core exports only artifacts backed by NIP-5D or a NUB spec — all 7 drop-verdict items from the v0.18.0 audit are deleted
**Verified:** 2026-04-09
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                             | Status     | Evidence                                                                              |
|----|-----------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------|
| 1  | `Capability` type and `ALL_CAPABILITIES` constant do not exist anywhere in core/  | VERIFIED   | Not found in types.ts, index.ts, or any core/src file; NamespacedCapability retained |
| 2  | 13 dropped TOPICS entries do not exist in topics.ts                               | VERIFIED   | No matches for AUTH_IDENTITY_CHANGED, STATE_*, SHELL_CONFIG_*, RELAY_SCOPED_*        |
| 3  | 15 deferred TOPICS entries remain in topics.ts (actual count: 16 per plan errata) | VERIFIED   | topics.ts contains 16 entries: STREAM x3, PROFILE x1, KEYBINDS x6, WM x1, CHAT x1, AUDIO x4 |
| 4  | `SHELL_BRIDGE_URI`, `REPLAY_WINDOW_SECONDS`, `PROTOCOL_VERSION` do not exist      | VERIFIED   | No matches across all core/src files                                                  |
| 5  | constants.ts file does not exist                                                  | VERIFIED   | `test ! -f packages/core/src/constants.ts` confirmed absent                          |
| 6  | index.test.ts contains no tests referencing deleted exports                       | VERIFIED   | No references to SHELL_BRIDGE_URI, PROTOCOL_VERSION, ALL_CAPABILITIES, REPLAY_WINDOW_SECONDS, STATE_GET, AUTH_IDENTITY_CHANGED, Capability type |
| 7  | `pnpm build && pnpm type-check` passes with zero errors                           | VERIFIED   | 9/9 build tasks successful, 15/15 type-check tasks successful, all cached FULL TURBO  |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact                              | Expected                                                 | Status     | Details                                                                                 |
|---------------------------------------|----------------------------------------------------------|------------|-----------------------------------------------------------------------------------------|
| `packages/core/src/types.ts`          | NostrEvent, NostrFilter, Subscription, EventTemplate, NappletGlobal only | VERIFIED | No Capability type, no ALL_CAPABILITIES; file is 202 lines of spec-backed types |
| `packages/core/src/topics.ts`         | 16 deferred TOPICS entries; auto-narrowed TopicKey/TopicValue | VERIFIED | Exactly 16 entries; STREAM_CHANNEL_SWITCH present; updated JSDoc example uses PROFILE_OPEN |
| `packages/core/src/index.ts`          | Barrel without Capability, ALL_CAPABILITIES, constants.ts imports | VERIFIED | 48 lines; no constants.js import; no Capability or ALL_CAPABILITIES in exports |
| `packages/core/src/index.test.ts`     | Tests for remaining exports only                         | VERIFIED   | 79 lines; imports only TOPICS, NamespacedCapability, ShellSupports, NostrEvent, NostrFilter, TopicKey, TopicValue |
| `packages/core/src/constants.ts`      | Does not exist (deleted)                                 | VERIFIED   | File absent from filesystem                                                             |

### Key Link Verification

| From                          | To                          | Via                                  | Status     | Details                                               |
|-------------------------------|-----------------------------|--------------------------------------|------------|-------------------------------------------------------|
| `packages/core/src/index.ts`  | `packages/core/src/types.js`| re-export (no Capability/ALL_CAPABILITIES) | VERIFIED | exports: NostrEvent, NostrFilter, Subscription, EventTemplate, NappletGlobal only |
| `packages/core/src/index.ts`  | `packages/core/src/topics.js` | re-export unchanged                | VERIFIED   | `export { TOPICS } from './topics.js'` and TopicKey/TopicValue present |
| `packages/core/src/index.ts`  | NO constants.js import      | entire constants section removed     | VERIFIED   | grep for 'constants.js' in index.ts finds zero matches |

### Data-Flow Trace (Level 4)

Not applicable — this phase performs pure deletions on type/constant definitions. No dynamic data rendering involved.

### Behavioral Spot-Checks

| Behavior                                      | Command                                              | Result                                    | Status   |
|-----------------------------------------------|------------------------------------------------------|-------------------------------------------|----------|
| Build succeeds across all 9 packages          | `pnpm build`                                         | 9 successful, 9 total; FULL TURBO         | PASS     |
| Type-check succeeds across all packages       | `pnpm type-check`                                    | 15 successful, 15 total; FULL TURBO       | PASS     |
| constants.ts absent                           | `test ! -f packages/core/src/constants.ts`           | Exit 0                                    | PASS     |
| 16 deferred TOPICS entries remain             | Node regex count against topics.ts                   | Count: 16                                 | PASS     |
| No dropped symbols in core/src               | grep for all 13 dropped names                        | Zero matches                              | PASS     |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                 | Status    | Evidence                                                            |
|-------------|-------------|-----------------------------------------------------------------------------|-----------|---------------------------------------------------------------------|
| DROP-01     | 87-01       | Delete `Capability` type and `ALL_CAPABILITIES` from types.ts and index.ts  | SATISFIED | Neither symbol found anywhere in core/src                           |
| DROP-02     | 87-01       | Delete 7 superseded TOPICS (AUTH_IDENTITY_CHANGED, STATE_*)                 | SATISFIED | Zero matches in topics.ts or anywhere in core/src                   |
| DROP-03     | 87-01       | Delete 3 config TOPICS (SHELL_CONFIG_*)                                     | SATISFIED | Zero matches in topics.ts or anywhere in core/src                   |
| DROP-04     | 87-01       | Delete 3 scoped relay TOPICS (RELAY_SCOPED_*)                               | SATISFIED | Zero matches in topics.ts or anywhere in core/src                   |
| DROP-05     | 87-01       | Delete `SHELL_BRIDGE_URI` from constants.ts and index.ts                    | SATISFIED | constants.ts deleted; symbol absent from index.ts                   |
| DROP-06     | 87-01       | Delete `REPLAY_WINDOW_SECONDS` from constants.ts and index.ts               | SATISFIED | constants.ts deleted; symbol absent from index.ts                   |
| DROP-07     | 87-01       | Delete `PROTOCOL_VERSION` from constants.ts and index.ts                    | SATISFIED | constants.ts deleted; symbol absent from index.ts                   |
| DROP-08     | 87-01       | Update index.test.ts — remove tests for deleted exports                     | SATISFIED | index.test.ts imports only remaining symbols; no deleted references  |
| DROP-09     | 87-01       | `pnpm build && pnpm type-check` passes clean after all deletions            | SATISFIED | Both commands: all tasks successful, zero errors                     |

All 9 DROP requirements satisfied. No orphaned requirements.

### Anti-Patterns Found

None. The files modified in this phase are pure deletions — no placeholder code, TODO comments, stub returns, or hardcoded empty values were introduced. The NamespacedCapability references in envelope.ts and index.test.ts are the new spec-backed replacement (not the dropped legacy Capability type) and are correct.

### Human Verification Required

None. All success criteria are mechanically verifiable and confirmed by file inspection and build output.

### Gaps Summary

No gaps. Phase 87 goal is fully achieved. @napplet/core now exports only spec-backed artifacts:

- The legacy `Capability` type union and `ALL_CAPABILITIES` constant are deleted from types.ts; the replacement `NamespacedCapability` type in envelope.ts (introduced in v0.18.0) is intact and tested.
- All 13 dropped TOPICS entries (7 superseded auth/state, 3 config, 3 scoped-relay) are absent from topics.ts. The 16 deferred entries remain. (SUMMARY notes a plan errata: the plan said 15 deferred, the actual and correct count is 16. All correct entries are present.)
- constants.ts is deleted. No import of constants.js exists anywhere in index.ts.
- index.test.ts references only retained symbols: TOPICS, NamespacedCapability, ShellSupports, NostrEvent, NostrFilter, TopicKey, TopicValue.
- Build (9/9) and type-check (15/15) pass clean with zero errors across all packages.
- All three task commits exist in git history: ff22e07, 53ed1da, b7b5d9a.

---

_Verified: 2026-04-09_
_Verifier: Claude (gsd-verifier)_
