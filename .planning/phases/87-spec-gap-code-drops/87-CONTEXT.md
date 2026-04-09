# Phase 87: Spec Gap Code Drops - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via infrastructure phase)

<domain>
## Phase Boundary

Delete every "drop" verdict artifact from SPEC-GAPS.md. After this phase, @napplet/core exports only spec-backed types, constants, and infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure deletion phase. Every target is documented in SPEC-GAPS.md with exact file locations and line numbers.

Specific deletions:
- `Capability` type + `ALL_CAPABILITIES` constant from core/types.ts and core/index.ts
- 7 superseded TOPICS from core/topics.ts: AUTH_IDENTITY_CHANGED, STATE_GET, STATE_SET, STATE_REMOVE, STATE_CLEAR, STATE_KEYS, STATE_RESPONSE
- 3 config TOPICS from core/topics.ts: SHELL_CONFIG_GET, SHELL_CONFIG_UPDATE, SHELL_CONFIG_CURRENT
- 3 scoped relay TOPICS from core/topics.ts: RELAY_SCOPED_CONNECT, RELAY_SCOPED_CLOSE, RELAY_SCOPED_PUBLISH
- `SHELL_BRIDGE_URI` from core/constants.ts and core/index.ts
- `REPLAY_WINDOW_SECONDS` from core/constants.ts and core/index.ts
- `PROTOCOL_VERSION` from core/constants.ts and core/index.ts
- Tests referencing deleted exports from core/index.test.ts

If TOPICS object becomes empty or nearly empty after deletions (only deferred items remain), keep the file with remaining entries. If topics.ts would be completely empty, delete the file and remove its export from index.ts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Decision source
- `.planning/SPEC-GAPS.md` — Full evidence and reasoning for each drop verdict

### Files to edit
- `packages/core/src/types.ts` — Remove Capability type + ALL_CAPABILITIES
- `packages/core/src/topics.ts` — Remove 13 TOPICS entries
- `packages/core/src/constants.ts` — Remove SHELL_BRIDGE_URI, REPLAY_WINDOW_SECONDS, PROTOCOL_VERSION
- `packages/core/src/index.ts` — Remove exports for all deleted symbols
- `packages/core/src/index.test.ts` — Remove tests for deleted exports

### Verification
- `pnpm build && pnpm type-check` must pass with zero errors

</canonical_refs>

<code_context>
## Existing Code Insights

### Key facts
- core/topics.ts has 28 entries total; 13 are being deleted, 15 remain (5 future NUB + 6 keybinds + 1 wm + 4 audio — all deferred)
- core/constants.ts will be completely emptied — all 3 constants are being deleted. File can be deleted and export removed from index.ts.
- core/types.ts Capability section (lines 49-93) is self-contained — deletion won't affect surrounding code
- TopicKey and TopicValue types derive from TOPICS constant — they'll auto-narrow when entries are removed

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward deletions with build verification.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 87-spec-gap-code-drops*
*Context gathered: 2026-04-09*
