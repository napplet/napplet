# Phase 39: Documentation Pass - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Two surgical documentation additions:
1. **DOC-01** — Add topic prefix direction semantics to the `TOPICS` const JSDoc in `@napplet/core/topics.ts`
2. **DOC-02** — Already complete (done in Phase 34); executor verifies and closes

Does NOT change any runtime behavior, rename identifiers, or add new topics.

</domain>

<decisions>
## Implementation Decisions

### DOC-02 — Already done; verify only
- **D-01:** `nappStorage` and `nappState` in `packages/shim/src/state-shim.ts` already have
  `@deprecated Use nappletState. Will be removed in v0.9.0.` JSDoc (lines 169-172, 175-178).
  Phase 39 executor verifies these annotations are present and closes DOC-02. No edits needed.

### DOC-01 — Direction semantics on the TOPICS const JSDoc
- **D-02:** The direction semantics explanation is added to the existing `TOPICS` const JSDoc
  block (not the module-level file header). This is where IDE autocomplete surfaces the docs and
  where consumers look when using the constant.
- **D-03:** The explanation is structured as a `## Topic Prefix Conventions` section within the
  JSDoc, placed after the existing `@example` block.
- **D-04:** Three-tier convention to document:
  - `shell:*` — napplet-to-shell commands (napplet sends, shell handles)
  - `napplet:*` — shell-to-napplet responses/notifications (shell sends, napplet handles)
  - `{service}:*` — bidirectional service messages; direction is per-topic within the prefix
- **D-05:** The `auth:*`, `stream:*`, `profile:*`, `wm:*`, `keybinds:*`, `chat:*` prefixes are
  documented as `{service}:*` — they follow the same bidirectional-per-topic pattern as service
  prefixes like `audio:*`. The JSDoc notes that within each prefix, direction is per-topic.
- **D-06:** Suggested format for the documentation section:
  ```
  * ## Topic Prefix Conventions
  *
  * Topic strings follow a prefix convention that signals message direction:
  *
  * | Prefix | Direction | Meaning |
  * |--------|-----------|---------|
  * | `shell:*` | napplet → shell | Commands sent by a napplet to the shell |
  * | `napplet:*` | shell → napplet | Responses/notifications sent by shell to napplet |
  * | `{service}:*` | bidirectional | Service-scoped messages; direction is per-topic |
  *
  * Examples: `shell:state-get` (napplet requests state),
  * `napplet:state-response` (shell replies), `audio:register` (service command).
  ```

### Complete Change Map
| File | Change |
|------|--------|
| `packages/core/src/topics.ts` | Add `## Topic Prefix Conventions` section to TOPICS const JSDoc |
| `packages/shim/src/state-shim.ts` | Verify @deprecated annotations — no edits expected |

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DOC-01 and DOC-02 define acceptance criteria

### Key Source Files
- `packages/core/src/topics.ts` — the TOPICS const; JSDoc block starts with `* Built-in topic
  constants for the napplet shell IPC-PEER protocol.`; add prefix conventions section here
- `packages/shim/src/state-shim.ts:169-178` — nappState and nappStorage deprecated aliases;
  verify `@deprecated` annotations are present

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The existing TOPICS JSDoc block already has an `@example` section — the new `## Topic Prefix
  Conventions` section goes after it
- The `@deprecated` pattern already in use in state-shim.ts is the correct format; DOC-02 just
  needs verification

### Established Patterns
- JSDoc section headers use `## Name` within the block
- Markdown tables in JSDoc are rendered by TypeDoc and most IDEs

### Integration Points
- `topics.ts` is imported widely across all packages — JSDoc changes are safe (TypeScript doesn't
  validate JSDoc prose, only type annotations)

</code_context>

<specifics>
## Specific Ideas

- The three-tier convention table should be concise — one row per prefix family, not per topic.
- The `{service}:*` row should mention "audio, stream, keybinds, etc." as examples so the
  documentation is concrete, not abstract.
- DOC-02 verification: if annotations are missing (unlikely), add them; if present, just confirm.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 39-documentation-pass*
*Context gathered: 2026-04-01*
