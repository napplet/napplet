---
phase: 116-documentation
plan: 02
subsystem: docs
tags: [readme, nub-config, json-schema, vite-plugin, sdk, shim, core, documentation]

# Dependency graph
requires:
  - phase: 115-integration
    provides: "config domain landed across core/shim/sdk runtime surface (NubDomain union, window.napplet.config, SDK wrapper, CONFIG_DOMAIN)"
  - phase: 114-vite-plugin
    provides: "configSchema option + 3-path discovery + Core Subset guards already implemented in @napplet/vite-plugin"
  - phase: 113-shim-sdk
    provides: "installConfigShim + handleConfigMessage (shim.ts) and 5 SDK wrappers (sdk.ts) in @napplet/nub-config"
  - phase: 112-package
    provides: "@napplet/nub-config package with 17 exported type symbols + FromSchema peer dep"
provides:
  - "packages/core/README.md documents 'config' as 9th NubDomain (union, runtime array, domain prefix list, description table, NUB packages list)"
  - "packages/shim/README.md documents window.napplet.config sub-namespace (Quick Start example, wire format both directions, shape object, dedicated subsection table, deps row)"
  - "packages/sdk/README.md documents config SDK namespace + FromSchema<typeof schema> type-inference opt-in pattern + ConfigNubMessage + CONFIG_DOMAIN"
  - "packages/vite-plugin/README.md documents configSchema option + 3-path discovery precedence + 3 worked examples + Build-Time Guards error-code catalogue + updated Nip5aManifestOptions interface + NUB-CONFIG protocol reference"
affects: [future-NUB-packages, nub-config-consumer-docs, napplet-tutorial-material]

# Tech tracking
tech-stack:
  added: []  # docs-only plan — no dependencies added
  patterns:
    - "4-README docs sweep on NUB integration (mirrors phase 110 identity precedent)"
    - "Surgical edits — touch only existing enumerations and add one new subsection per README; zero refactoring of unrelated prose"
    - "FromSchema opt-in install note pattern — document json-schema-to-ts as optional peerDep with explicit `--save-dev` install command"

key-files:
  created: []
  modified:
    - "packages/core/README.md"
    - "packages/shim/README.md"
    - "packages/sdk/README.md"
    - "packages/vite-plugin/README.md"

key-decisions:
  - "Removed backticks from the 'relay, ipc, storage, keys, media, notify, identity, config, and shell' enumeration in shim README How-It-Works bullet 3 to satisfy the plan's exact verification grep (grep -q 'identity, config, and shell'). Remaining shim backtick-per-token conventions preserved elsewhere."
  - "Also updated Types table row in core README ('Union of the eight NUB domain strings' -> 'Union of the nine NUB domain strings'); discovered during verification of the count-update edit and fixed inline (Rule 1-adjacent: keeping count-text consistent across the file)."

patterns-established:
  - "Mirror-precedent docs pass: the phase 110 identity sweep and phase 104 notify sweep both used the same 4-README surgical-edit pattern. Phase 116-02 follows it exactly, keeping the four READMEs visually indistinguishable from how identity/notify are documented."
  - "Optional-peer documentation: json-schema-to-ts pattern (install --save-dev, type-inference opt-in) -- reusable template for any future NUB that ships an opt-in type-inference peerDep."

requirements-completed: [DOC-03, DOC-04, DOC-05, DOC-06]

# Metrics
duration: 5m44s
completed: 2026-04-17
---

# Phase 116 Plan 02: 4-README config NUB docs sweep Summary

**Documented NUB-CONFIG as the 9th NUB across the four napplet-repo package READMEs (core / shim / sdk / vite-plugin) -- every config-related public surface now has visible docs parity with identity/notify/media.**

## Performance

- **Duration:** 5m 44s
- **Started:** 2026-04-17T14:08:52Z
- **Completed:** 2026-04-17T14:14:36Z
- **Tasks:** 4/4
- **Files modified:** 4

## Accomplishments

- `packages/core/README.md` — `config` landed in all 5 enumeration points (domain prefix prose, NubDomain type union, description table, NUB_DOMAINS runtime array, Integration Note NUB package list) + "eight"→"nine" count updates in two spots (prose lead + Types table row)
- `packages/shim/README.md` — How It Works bullet updated, Quick Start config example added with cleanup, 5 outbound + 3 inbound config wire-format lines appended, `window.napplet.config` namespace added to the shape object, dedicated `### window.napplet.config` subsection with 6-row method table inserted between `### window.napplet.notify` and `### window.napplet.shell`, and `@napplet/nub-config` added to the Shim vs SDK deps row
- `packages/sdk/README.md` — Quick Start imports + body updated with config examples, dedicated `### config` + `### FromSchema type inference (NUB-CONFIG)` subsections added with install note, Namespace Import gains a `napplet.config.subscribe` line, `ConfigNubMessage` row appended to the NUB Message Types table, `CONFIG_DOMAIN` added to the constants import + values comment, and a `supports('nub:config')` example added to the capability-check block
- `packages/vite-plugin/README.md` — What-This-Plugin-Does bullet list extended with 3 new build-time effects, full `#### configSchema (optional)` section added in Plugin Options with accepted-forms table, 3-path discovery precedence, and 3 worked examples (inline / config.schema.json / napplet.config.ts); new `#### Build-Time Guards` subsection with 4-row error-code catalogue (invalid-schema / pattern-not-allowed [CVE-2025-69873] / ref-not-allowed / secret-with-default) plus tree-walk keyword list; `Nip5aManifestOptions` interface updated with `configSchema?: JSONSchema7 | string` + JSDoc; Protocol Reference block picks up the NUB-CONFIG spec link

## Task Commits

Each task was committed atomically with `--no-verify` (parallel executor protocol):

1. **Task 1: Update packages/core/README.md for DOC-03** — `f6f1146` (docs)
2. **Task 2: Update packages/shim/README.md for DOC-04** — `c587e9e` (docs)
3. **Task 3: Update packages/sdk/README.md for DOC-05** — `6e7ef33` (docs)
4. **Task 4: Update packages/vite-plugin/README.md for DOC-06** — `8427b16` (docs)

Plan metadata commit follows this summary.

## Files Created/Modified

- `packages/core/README.md` — 7 insertions, 6 deletions. Added config to 5 enumerations + "nine" count adjustments (2 spots).
- `packages/shim/README.md` — 43 insertions, 2 deletions. Quick Start config block (9 lines), wire format appendages (5 outbound + 3 inbound), window.napplet shape entry, `### window.napplet.config` subsection (8 lines prose + 6-row table), deps row config addition.
- `packages/sdk/README.md` — 65 insertions, 3 deletions. Quick Start config block (8 lines), `### config` subsection (8 lines), `### FromSchema type inference` subsection (25 lines), Namespace Import line, ConfigNubMessage row, CONFIG_DOMAIN import + comment, supports('nub:config') example.
- `packages/vite-plugin/README.md` — 108 insertions, 0 deletions. 3 What-This-Plugin-Does bullets, full `#### configSchema (optional)` section (~85 lines including 3 examples), `#### Build-Time Guards` subsection (~10 lines), Nip5aManifestOptions JSDoc/field addition, Protocol Reference NUB-CONFIG link.

## Decisions Made

- **Backtick removal in shim README How-It-Works bullet 3.** Original line style used backticks per token (`` `relay`, `ipc`, ... ``). Plan verification required fixed-string `grep -q "identity, config, and shell"` to match, which cannot match backtick-separated tokens. Honored the plan's explicit action instruction (bare tokens) -- rest of shim README retains the per-token-backtick style elsewhere. Trade-off: very mild stylistic inconsistency on one bullet vs. reliable acceptance-check pass.
- **Types table count update in core README.** Plan specified 4 enumeration edits + 1 count-text ("eight" → "nine") edit in the domain description section, but the Types table summary row at the bottom of the file also said "Union of the eight NUB domain strings". Updated inline as a natural consequence of the count change so the file is internally consistent. Documented below under Deviations.
- **Verbatim mirror of nub-config README FromSchema example in SDK README.** Per plan instruction, the SDK README's FromSchema sample reuses the CONTEXT.md example (theme light/dark enum with default). Keeps nub-config README and sdk README in lock-step on type-inference copy-paste story.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Consistency] Updated Types table row "eight" → "nine" in core README**
- **Found during:** Task 1 (core README verification)
- **Issue:** Plan instructed updating the prose lead ("eight NUB capability domains" → "nine") but did not call out the Types table summary row at line 336 (`| `NubDomain` | Union of the eight NUB domain strings |`). Cross-file sanity verification requires no remaining "eight NUB" references anywhere in the file; leaving the Types row at "eight" would have left stale docs.
- **Fix:** Updated Types table row to "Union of the nine NUB domain strings" so the whole file reads consistently.
- **Files modified:** `packages/core/README.md`
- **Verification:** `grep -c "eight" packages/core/README.md` returns 0; `grep -q "Union of the nine NUB domain strings" packages/core/README.md` returns 0 (success).
- **Committed in:** `f6f1146` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1-consistency / stale-doc cleanup)
**Impact on plan:** Fix was required to satisfy the plan's own cross-file sanity check (`grep -lR "eight NUB" packages/ should return nothing`). No scope creep, no architectural change.

## Issues Encountered

None. Plan execution was linear; each task's acceptance checks passed on first attempt (Task 2's E1 check failed initially on backtick-vs-plain-text ambiguity, resolved by honoring the plan's explicit bare-token instruction per the Decisions section above).

## User Setup Required

None — no external service configuration required; pure docs-only plan.

## Next Phase Readiness

- Four target READMEs are now fully aligned on NUB-CONFIG surface.
- Phase 116 has three plans; 116-02 covers the napplet-repo READMEs (DOC-03..06). Plans 116-01 (nub-config README itself, DOC-01) and 116-03 (public NIP-5D Known NUBs row, DOC-02) remain.
- Pre-existing "eight NUB" matches remain in `packages/*/node_modules/@napplet/core/dist/` build artifacts — these are stale compiled copies from prior builds and will refresh on next `pnpm build`. Out-of-scope for this docs-only plan (scope boundary rule).

## Self-Check: PASSED

Verified:
- `packages/core/README.md` exists with all 5 enumeration edits + count updates (DOC-03 acceptance 8/8)
- `packages/shim/README.md` exists with Quick Start, wire format, shape object, subsection, and deps updates (DOC-04 acceptance 18/18)
- `packages/sdk/README.md` exists with Quick Start, config subsection, FromSchema subsection, namespace import, message types row, domain constants, supports example (DOC-05 acceptance 14/14)
- `packages/vite-plugin/README.md` exists with configSchema section, discovery paths, build-time guards, interface update, protocol reference (DOC-06 acceptance 18/18)
- Commits `f6f1146`, `c587e9e`, `6e7ef33`, `8427b16` all present in `git log --oneline --all`

---
*Phase: 116-documentation*
*Plan: 02*
*Completed: 2026-04-17*
