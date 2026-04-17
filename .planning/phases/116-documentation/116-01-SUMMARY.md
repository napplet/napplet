---
phase: 116-documentation
plan: 01
subsystem: docs
tags: [nub-config, readme, json-schema, documentation, from-schema, json-schema-to-ts]

requires:
  - phase: 112-nub-config-scaffold
    provides: packages/nubs/config src tree and public barrel shape
  - phase: 113-nub-config-shim-sdk
    provides: public shim + SDK surface (5 methods + readonly schema accessor)
  - phase: 114-vite-plugin-extension
    provides: configSchema option + meta-tag injection path documented in README
  - phase: 115-core-shim-sdk-integration
    provides: final window.napplet.config + @napplet/sdk config namespace shape
provides:
  - packages/nubs/config/README.md (248 lines) documenting @napplet/nub-config end-to-end
affects: [116-02-package-readmes, 116-03-public-nubs-registry-row]

tech-stack:
  added: []
  patterns:
    - "Side-effect-free NUB barrel -- README calls out the Domain Registration divergence from notify/media (no registerNub on import; shim is central dispatcher)"
    - "Optional peerDependency documentation pattern -- json-schema-to-ts FromSchema inference documented as opt-in with cost/benefit callout"

key-files:
  created:
    - packages/nubs/config/README.md
  modified: []

key-decisions:
  - "Matched @napplet/nub-notify structure (5 wire-msg napplet->shell + 3 shell->napplet tables) rather than media's session-oriented structure; config's request/response/push shape maps cleanly to notify's layout"
  - "SDK Helpers subsection shows @napplet/sdk config namespace usage (not bare imports routed through sdk.*) -- this is how phase 115 actually wired the SDK, so the README documents real, not aspirational, ergonomics"
  - "Concrete theme + pollIntervalSeconds schema example reused in both Manifest-driven and Runtime sections so readers see the same shape twice in different contexts"
  - "Domain Registration section explicitly diverges from notify/media README precedent because the @napplet/nub-config barrel is side-effect-free (per phase 113-02 decision) -- silence would confuse readers who copy the notify README mentally"
  - "ReDoS/CVE-2025-69873 rationale inlined into Core Subset bullet list rather than as a footnote so the motivation for pattern exclusion is visible at first read"

patterns-established:
  - "FromSchema opt-in documentation -- example + install command + 'without this install, the subscribe callback parameter is ConfigValues' explicit fallback note; reusable for any future NUB with an optional typing peer"
  - "Dual-path Usage section (Manifest-driven recommended + Runtime escape hatch) with the same schema example in both; reusable for any future NUB that has a vite-plugin-authored path + a runtime API"

requirements-completed: [DOC-01]

duration: 1m29s
completed: 2026-04-17
---

# Phase 116 Plan 01: @napplet/nub-config README Summary

**Wrote 248-line package README for @napplet/nub-config covering install, manifest-driven vs runtime schema declaration, the window.napplet.config API surface, SDK namespace usage, and FromSchema type inference via the json-schema-to-ts optional peerDependency.**

## Performance

- **Duration:** 1m29s
- **Started:** 2026-04-17T14:08:49Z
- **Completed:** 2026-04-17T14:10:18Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments

- Complete `packages/nubs/config/README.md` following the `packages/nubs/notify/README.md` template structure (Title, Installation, Overview, Message Types, Usage, Core Subset, Domain Registration, Protocol Reference, License)
- Full wire surface documented: all 5 napplet->shell messages (`registerSchema`, `get`, `subscribe`, `unsubscribe`, `openSettings`) and all 3 shell->napplet messages (`registerSchema.result`, `values` dual-use, `schemaError`) with payload + description columns
- Both declaration paths spelled out with copy-pasteable code: `vite.config.ts` with `nip5aManifest({ configSchema: {...} })` and runtime `await registerSchema(schema, 1)`
- Full API reference: 5 bare-name imports from `@napplet/nub-config` + aggregated `config` namespace from `@napplet/sdk` including the readonly `config.schema` accessor
- FromSchema type-inference example verbatim from 116-CONTEXT.md + `npm install --save-dev json-schema-to-ts` + fallback behavior callout
- Protocol Reference links to [NUB-CONFIG PR #13](https://github.com/napplet/nubs/pull/13) and relative link to `../../specs/NIP-5D.md`

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the @napplet/nub-config package README** -- `36d23d2` (docs)

## Files Created/Modified

- `packages/nubs/config/README.md` -- New 248-line package documentation covering install, overview, message-type tables, manifest/runtime usage paths, shim API, SDK Helpers, FromSchema opt-in, supporting types, Core Subset summary, Domain Registration (side-effect-free barrel note), and protocol references.

## Decisions Made

- **Used `@napplet/sdk`'s `config` namespace for SDK Helpers** (not bare-name `sdk.*` wrappers) because phase 115 wired an explicit `config` namespace, not `export * as config`. README documents the real shape, not an aspirational one.
- **Single concrete schema** (theme enum + pollIntervalSeconds integer) reused across Manifest-driven and Runtime sections so readers see the same JSON in two contexts.
- **Explicit Domain Registration divergence** from notify/media README precedent: the paragraph calls out that the `@napplet/nub-config` barrel is side-effect-free and wiring happens in `@napplet/shim`'s central dispatcher. Silence would have confused readers copying the notify mental model.
- **Inlined ReDoS/CVE-2025-69873 rationale** in the Core Subset bullet rather than footnoted so the motivation is visible at first read.

## Deviations from Plan

None -- plan executed exactly as written. Every required section, example, link, and grep-testable string landed on the first pass.

## Issues Encountered

None. Prior-phase artifacts (`shim.ts` JSDoc, `sdk.ts` wrapper signatures, `types.ts` error-code union, `package.json` peerDependency stanza) gave unambiguous source-of-truth for every API description -- no guesswork.

## Acceptance Criteria Results

All 31 plan acceptance greps passed in a single shot:

- File exists, title `# @napplet/nub-config`, Install / Overview / Message Types sections present
- `npm install @napplet/nub-config` command present
- `NIP-5D JSON envelope wire format` literal present
- All 5 napplet->shell wire types named (`config.registerSchema`, `config.get`, `config.subscribe`, `config.unsubscribe`, `config.openSettings`)
- All 3 shell->napplet wire types named (`config.registerSchema.result`, `config.values`, `config.schemaError`)
- Manifest-driven section + `configSchema` literal + `napplet-config-schema` meta tag reference
- Runtime schema section + `config.schema` readonly accessor documented
- All 5 SDK bare names (`get`, `subscribe`, `openSettings`, `registerSchema`, `onSchemaError`)
- `FromSchema` example + `json-schema-to-ts` optional peer mention
- `DOMAIN === 'config'` literal
- `ConfigSchemaErrorCode` type mentioned
- `x-napplet-secret`, `x-napplet-section`, `x-napplet-order` all mentioned
- Core Subset section + ReDoS/CVE-2025-69873 rationale
- Domain Registration section
- PR #13 URL + NIP-5D relative link
- `MIT` on its own line
- >= 180 lines (actual: 248)
- No trailing whitespace

## Next Phase Readiness

- **116-02 (core/shim/sdk/vite-plugin README updates, DOC-03..06)** can execute in parallel with this plan (already does -- this is a parallel-executor run). The four existing README touchups are independent of this file.
- **116-03 (public nubs registry row verify + push handoff, DOC-02)** is human-gated and operates in the public `napplet/nubs` repo -- unaffected by this private-repo README.
- No blockers. Phase 115 exit artifacts (window.napplet.config shape, @napplet/sdk config namespace, vite-plugin `configSchema` option) are all documented and dev-hand-tested via read-through of the source.

## Self-Check: PASSED

- `packages/nubs/config/README.md` FOUND (248 lines, passes all 31 acceptance greps)
- Commit `36d23d2` FOUND in `git log --oneline`

---
*Phase: 116-documentation*
*Completed: 2026-04-17*
