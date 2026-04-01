# Phase 38: Session Vocabulary - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean up remaining session vocabulary — specifically the `nappKeyRegistry` variable name that
was listed in Phase 34's rename map but not executed, plus a TODO comment on the placeholder
keypair function. SESS-03 (function rename) is explicitly deferred pending a full architectural
fix captured in SEED-001.

Does NOT add new capabilities, change behavior, or touch wire protocol.

</domain>

<decisions>
## Implementation Decisions

### SESS-01 / SESS-02 — Already done in Phase 34
- **D-01:** `NappKeyEntry` → `SessionEntry` (type) was completed in Phase 34 with a deprecated
  alias `NappKeyEntry` exported for one release cycle. Phase 38 does NOT touch this.
- **D-02:** `NappKeyRegistry` → `SessionRegistry` (type) was completed in Phase 34 with a
  deprecated alias `NappKeyRegistry` exported for one release cycle. Phase 38 does NOT touch this.

### nappKeyRegistry variable — clean rename to sessionRegistry
- **D-03:** The local variable `nappKeyRegistry` in `packages/runtime/src/runtime.ts` (15+
  occurrences) and the public return property `readonly nappKeyRegistry: SessionRegistry` are
  renamed to `sessionRegistry`. Clean rename — no deprecated alias.
- **D-04:** Rationale: consistent with Phase 35's clean rename precedent (BusKind.INTER_PANE →
  IPC_PEER, no alias). This is an internal variable and an alpha-stage public property.
- **D-05:** The shell's `nappKeyRegistry` deprecated alias export (`session-registry.ts:170`,
  `index.ts:44`) is already in place from Phase 34 — leave unchanged.

### SESS-03 — Deferred; loadOrCreateKeypair rename skipped
- **D-06:** `loadOrCreateKeypair` in `packages/shim/src/napplet-keypair.ts` is NOT renamed.
  The REQUIREMENTS.md target name `createEphemeralKeypair` was rejected during discuss-phase
  because it would permanently encode the wrong behavior.
- **D-07:** The correct behavior (load-or-create keyed by nappletType + aggregateHash, using a
  shell-generated deterministic key) is captured in **SEED-001**
  (`.planning/seeds/SEED-001-deterministic-napplet-keypair.md`). That fix is a full milestone
  effort involving a new init message protocol.
- **D-08:** Phase 38 executor adds a TODO comment to `napplet-keypair.ts`:
  ```ts
  // TODO(SEED-001): This placeholder always generates a random keypair.
  // The correct design: shell derives a deterministic key from
  // SHA256(salt + aggregateHash + dTag + nappletAuthorPubkey) and sends it
  // to the napplet via an init message. See .planning/seeds/SEED-001-deterministic-napplet-keypair.md
  ```

### Complete Change Map
| File | Change |
|------|--------|
| `packages/runtime/src/runtime.ts` | Rename local var `nappKeyRegistry` → `sessionRegistry` (~15 occurrences) |
| `packages/runtime/src/runtime.ts` | Rename return property `nappKeyRegistry` → `sessionRegistry` (line 111, 956) |
| `packages/shim/src/napplet-keypair.ts` | Add SEED-001 TODO comment; no rename |

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — SESS-01, SESS-02, SESS-03
  - SESS-01/02: completed in Phase 34 — verify deprecated aliases still present, no action needed
  - SESS-03: deferred — see D-06 through D-08 above

### Seed
- `.planning/seeds/SEED-001-deterministic-napplet-keypair.md` — full design spec for the correct
  keypair derivation; executor must reference this in the TODO comment

### Key Source Files
- `packages/runtime/src/runtime.ts` — `nappKeyRegistry` local var (line 170) and return property
  (line 111, line 956: `get nappKeyRegistry()`) — rename to `sessionRegistry`
- `packages/shim/src/napplet-keypair.ts` — `loadOrCreateKeypair` function; add SEED-001 TODO only

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- Clean rename precedent: Phase 35 renamed `BusKind.INTER_PANE` → `IPC_PEER` with no deprecated
  alias — same approach applies here for the variable rename
- TODO comment format: codebase uses `// TODO:` and `/* intentional */` patterns; use
  `// TODO(SEED-001):` to make the seed reference traceable

### Integration Points
- `packages/runtime/src/runtime.ts:956` — `get nappKeyRegistry() { return nappKeyRegistry; }`
  — rename both the getter name and the local variable it references
- `packages/runtime/src/dispatch.test.ts:106` — `runtime.nappKeyRegistry.getPubkey(...)` —
  must be updated to `runtime.sessionRegistry` after runtime return property rename

</code_context>

<specifics>
## Specific Ideas

- The SEED-001 TODO comment is the most important deliverable of this phase beyond the variable
  rename. Future contributors and agents need to know the placeholder is intentional debt.
- The `nappKeyRegistry` property on the runtime return object may be used by test files —
  search `runtime.nappKeyRegistry` across test files before renaming.

</specifics>

<deferred>
## Deferred Ideas

- **SESS-03 (loadOrCreateKeypair rename)** — Deferred pending SEED-001 architectural fix.
  The function's current name (`loadOrCreateKeypair`) is aspirationally correct for the intended
  behavior. Do not rename to `createEphemeralKeypair` — that would lock in the placeholder behavior.
  Addressed in the security hardening milestone that implements SEED-001.

</deferred>

---

*Phase: 38-session-vocabulary*
*Context gathered: 2026-04-01*
