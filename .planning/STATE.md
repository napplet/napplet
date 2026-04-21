---
gsd_state_version: 1.0
milestone: v0.29.0
milestone_name: NUB-CONNECT + Shell as CSP Authority
status: verifying
stopped_at: Completed 141-01-PLAN.md + 141-02-PLAN.md
last_updated: "2026-04-21T18:04:20.958Z"
last_activity: 2026-04-21
progress:
  total_phases: 8
  completed_phases: 7
  total_plans: 16
  completed_plans: 16
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 141 — Documentation Sweep

## Current Position

Phase: 141 (Documentation Sweep) — EXECUTING
Plan: 2 of 2
Status: Phase complete — ready for verification
Last activity: 2026-04-21

## Phase Map (v0.29.0)

| Phase | Name | Requirements | Depends On |
|-------|------|--------------|------------|
| 135 | Cross-Repo Spec Work | SPEC-01..05, NIP5D-01, NIP5D-02 | — |
| 136 | Core Type Surface | CORE-01..05 | — |
| 137 | `@napplet/nub/connect` Subpath Scaffold | NUB-01..07 | 136 |
| 138 | `@napplet/vite-plugin` Surgery | VITE-01..10 | 136, 137 (shared normalizer) |
| 139 | Central Shim + SDK Integration | SHIM-01, SHIM-02, SDK-01 | 137 |
| 140 | `specs/SHELL-CONNECT-POLICY.md` | POLICY-01..10 | 135 |
| 141 | Documentation Sweep | DOC-01..07 | 138, 139 |
| 142 | Verification & Milestone Close | VER-01..10 | all prior |

**Critical path:** 136 → 137 → 139 → 141 → 142.
**Parallel lanes:** 135 (spec) + 140 (policy doc) + 136/137/138 (code) can overlap.

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with 34 subpath exports; deprecated packages ship as 1-line re-export shims for one release cycle
- v0.27.0: Runtime API surface uses IFC terminology (`window.napplet.ifc`, `@napplet/sdk` `ifc` export); hard break, no backward-compat alias
- v0.28.0: Browser-enforced isolation via strict CSP; single `resource.bytes(url)` primitive with scheme-pluggable URL space; `data:` decoded inline; sidecar pre-resolution opt-in default OFF for privacy; shell-side SVG rasterization MUST; `perm:strict-csp` capability orthogonal to `nub:resource`; demos delegated to downstream shell repo (Option B)
- v0.29.0: Shell is sole runtime CSP authority (every napplet). Two new NUBs: NUB-CLASS (abstract posture authority via wire `class.assigned`, `window.napplet.class`, owns `NUB-CLASS-$N` sub-track) and NUB-CONNECT (user-gated direct network access via manifest `connect` tags, self-sufficient `window.napplet.connect.{granted,origins}` surface). Napplet-class distinction removed entirely from NIP-5D into NUB-CLASS's sub-track. Class-1 = strict baseline; Class-2 = user-approved explicit-origin CSP; each defined as its own doc (`NUB-CLASS-1.md`, `NUB-CLASS-2.md`). Inline scripts forbidden for all napplets under the unified CSP model. Grants keyed on `(dTag, aggregateHash)` with `connect` origins folded into aggregateHash via synthetic `connect:origins` entry. NUBs expose independent runtime surfaces (no cross-NUB state collapse); cross-NUB invariants documented as shell responsibilities.
- v0.29.0 / Phase 135-03: NUB-CONNECT draft cites `NUB-CLASS-2.md` by file name (10 times) and does NOT inline-redefine Class 1/2 postures (delegated in full). Canonical `connect:origins` aggregateHash fold is: lowercase → ASCII-ascending sort → LF-join with no trailing newline → UTF-8 encode → SHA-256 → lowercase hex. Normative conformance fixture: 3 origins (`https://api.example.com`, `https://xn--caf-dma.example.com`, `wss://events.example.com`), 80-byte joined UTF-8 input, SHA-256 digest `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` (independently verified). `NappletConnect` runtime API MUST NEVER be `undefined` — default `{granted: false, origins: []}` on unsupported shells, denied prompts, or pre-injection.
- v0.29.0 / Phase 136-01: `NappletConnect` shape declared INLINE in `packages/core/src/types.ts` (not imported from `@napplet/nub`) — preserves `@napplet/core` zero-dep constraint. Phase 137's `@napplet/nub/connect/types.NappletConnect` MUST remain structurally assignment-compatible with `NappletGlobal['connect']` (the two locked fields `readonly granted: boolean` + `readonly origins: readonly string[]` must match). `window.napplet.class` typed as bare `number` (not literal union `1 | 2`) — class space is extensible via NUB-CLASS-$N sub-track. `perm:strict-csp` is JSDoc-`@deprecated` only (type unchanged — `perm:${string}` template literal still accepts it during the deprecation window; hard-removal tracked as REMOVE-STRICTCSP-CAP in future requirements).
- v0.29.0 / Phase 137-01: `NappletConnect` inlined as zero-import interface in `packages/nub/src/connect/types.ts`; bidirectional structural assignability with `NappletGlobal['connect']` verified. `normalizeConnectOrigin()` is the single shared source-of-truth validator for both Phase 138 vite-plugin (build-side) and shell implementations (runtime-side); returns byte-identical input on success, throws with `[@napplet/nub/connect]`-prefixed messages on any of 21 rule violations. IPv4 accepted (including `127.0.0.1` + RFC-1918 private ranges); IPv6 rejected for v1 (bracket notation AND colon-in-host-after-port-strip both throw). `ClassAssignedMessage` wire shape locked as `{ type: 'class.assigned'; id: string; class: number }` with bare `number` (extensible class space via NUB-CLASS-$N). 28/28 normalizer smoke tests pass (7 accept + 21 reject).
- v0.29.0 / Phase 137-02: Wire-handler NUB barrel pattern established — `registerNub(DOMAIN, handleXxxMessage as unknown as NubHandler)` is the canonical registration site for any NUB that both exports a handler AND wants module-import to automatically register it. Zero-wire NUB barrel uses `registerNub(DOMAIN, (_msg) => { /* noop */ })` with inline rationale comment. `handleClassMessage` parameter contravariance bridge (`as unknown as NubHandler`) is the first case of a richer dispatcher signature at the barrel registration level; sound at runtime since envelopes are always parsed objects. Future core widening of `NubHandler` to `{ type: string; [key: string]: unknown }` simply removes the cast. `window.napplet.class` defineProperty uses `configurable:true` (so cleanup can delete) while `window.napplet.connect` uses `configurable:false` (stable mount object).
- v0.29.0 / Phase 137-03: 46-exports-and-entries invariant locked as baseline for `@napplet/nub` (38 pre-existing + 8 new: connect × 4 + class × 4). Tsup entry map mirrors package.json exports 1:1 count. Tree-shake prerequisite verified at dist-artifact level: `dist/connect/types.js` (155 B) and `dist/class/types.js` (103 B) emit zero installer / `registerNub(` references — only DOMAIN const + (for connect) the pure `normalizeConnectOrigin` validator. Phase 142 VER-03 will extend the harness with types-only consumer fixtures asserting bundle-delta ≤ these baselines. Phase 137 TERMINAL-COMPLETE: all 13 REQs (NUB-01..07 + CLASS-01..06) satisfied.
- v0.29.0 / Phase 138-03: Phase 138 TERMINAL-COMPLETE. Module-load self-check (`assertConnectFoldMatchesSpecFixture`) binds vite-plugin `connect:origins` fold to NUB-CONNECT.md §Conformance Fixture digest `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`; fires at ESM-init on fold-drift. Perturbation experiment confirmed behavior: `.join('\n')` → `.join(',')` triggers FATAL at plugin-import time (`node -e "import(...)"` exits 1), revert exits 0. Build-layer insight: tsup/tsc does NOT execute module-top-level code at build time, so the guardrail fires when Vite imports the plugin (napplet authors' `pnpm build`), not when tsup builds it. Self-check code was pre-landed in commit `d06c293` from an aborted prior 138-03 attempt that bundled with 138-02 Task 4's commit message; no new code commit needed in this session — only the SUMMARY + STATE/ROADMAP updates land. All 10 VITE-XX REQs satisfied; 40+ Phase 138 grep audit passes (two documented drifts: `cc7c1b1…` count = 2 by co-location with 138-02 Task 3 fold-docs comment, and Task 1 no-op commit). `pnpm --filter @napplet/vite-plugin build` + `type-check` both exit 0. Guardrail closes SPEC-P1 (hash-determinism drift between build-time plugin and shell-side implementations) one phase earlier than the Phase 142 VER deferred item. Phase 138 ready for orchestrator verify_phase_goal pass.
- v0.29.0 / Phase 138-02: Additive half of vite-plugin surgery landed. 254 LOC added to `packages/vite-plugin/src/index.ts` (560 → 814) across 4 task commits (`fdb92d9`/`49aba91`/`264edfb`/`d06c293`). `connect?: string[]` option validated via shared `normalizeConnectOrigin` from `@napplet/nub/connect/types` (Phase 137); `SYNTHETIC_XTAG_PATHS: ReadonlySet<string>` registry (module-scope, exported) covers `config:schema` + `connect:origins` — single extension point for future NUB folds; `aggregateHash` fold produces byte-identical NUB-CONNECT canonical digest; one `['connect', origin]` manifest tag per origin in author-declared order between `manifestXTags` and `configTags`; `assertNoInlineScripts` zero-dep regex helper hard-errors on `<script>` without non-empty `src` (allow-list for application/json, application/ld+json, importmap, speculationrules, HTML comments stripped); informational cleartext warn on `http:`/`ws:` origins; dev-mode-only `napplet-connect-requires` meta distinct from shell-authoritative `...-granted` name (plugin MUST NEVER emit the granted variant). Two orderings: author-declared for manifest tags (readability per NUB-CONNECT §Manifest Tag Shape), ASCII-sorted for fold (determinism). Pre-existing `@napplet/shim` DTS failure (Phase 136-01 added `connect` to `NappletGlobal` without updating shim literal) logged to `deferred-items.md`, scheduled for Phase 139 SHIM-01/02. VITE-03..10 complete.
- v0.29.0 / Phase 138-01: Subtractive half of vite-plugin surgery landed. `packages/vite-plugin/src/csp.ts` deleted in full (−276 LOC, no dev-only retention per locked Q2). `packages/vite-plugin/src/index.ts` stripped of all CSP production machinery (660 → 560 LOC, −100 net): import block from `./csp.js`, 34-line `strictCsp` JSDoc+field, 4-line CSP runtime state, 11-line `configResolved` CSP branch, 11-line `transformIndexHtml` CSP meta injection (including `order: 'pre'` + `isDev`/`ctx.server` dead code), 18-line `closeBundle` CSP assert block. `strictCsp?: unknown` retained as `@deprecated` accept-but-warn shim emitting one `console.warn` per build from `configResolved` (run-once by Vite contract, no external guard needed). Old v0.28.0 consumers' `vite.config.ts` continues to type-check and build on upgrade — they see one warn per build. Hard-remove tracked as `REMOVE-STRICTCSP` for v0.30.0. `tsup.config.ts` entry reduced to `['src/index.ts']`. Banned-identifier audit: 0 hits each for buildBaselineCsp / validateStrictCspOptions / assertMetaIsFirstHeadChild / assertNoDevLeakage / StrictCspOptions / './csp' import / Content-Security-Policy / head-prepend / strictCspEnabled / cspNonce / cspMode / strictCspOptions. Preserved byte-identically: aggregate-hash injection, napplet-type/requires/config-schema meta, schema discovery + structural validation, synthetic `config:schema` xTag fold, manifest signing via nostr-tools. `pnpm --filter @napplet/vite-plugin build` + `type-check` both exit 0 (8ms ESM build, 639ms DTS, dist/index.js 11.25 KB). Additive half (Plan 138-02: connect option, inline-script diagnostic, `SYNTHETIC_XTAG_PATHS` extraction, `connect:origins` fold, manifest tags) unblocked.
- v0.29.0 / Phase 139-01: State-only NUB SDK pattern locked — connect + class both skip the namespace const object that method-bearing NUBs use (`export const resource = {...}`, `export const keys = {...}`, etc.); types + DOMAIN-aliased-constant + installer + helper getters are sufficient. `class` is also a reserved identifier so `export const class` would be invalid JS anyway. Shim literal's `connect: { granted: false, origins: [] }` default is PRESERVED even though `installConnectShim` replaces the field at runtime: this satisfies TS2741 at type-check AND provides an authoritative graceful-degradation default for SDK-only consumers who never call the installer (dual-layer guarantee). `class:` field intentionally OMITTED from the literal — the installer's `Object.defineProperty` mounts it; the optional `class?: number` on NappletGlobal allows the omission. Task 1 commit `69814ae` (shim), Task 2 commit `6214702` (sdk); Task 3 verification-only no commit. Phase 136-to-138 carried TS2741 gap CLOSED — `pnpm -r type-check` now exits 0 across all 14 packages, first time since Phase 136 introduced the planned carry. Smoke-test harness drift discovered (document.addEventListener needed by installKeysShim's keydown listener) fixed in /tmp stub only — production shim code untouched.

### Open Decisions for Plan Phases

Surfaced by research (informational — each belongs to a specific phase plan):

1. Inline-script detection: parse5/htmlparser2 dev-dep vs zero-dep regex — Phase 138
2. `packages/vite-plugin/src/csp.ts`: delete vs retain dev-only helper vs split-by-concern — Phase 138
3. `strictCsp` option: hard-remove vs `@deprecated` accept-but-warn for one cycle — Phase 138
4. Inline-script diagnostic: warn vs hard-error (design leans hard-error) — Phase 138
5. `sdk.ts` for connect: omit (types-only like theme) vs readonly getters — Phase 137
6. Meta tag name: `napplet-connect-granted` (verbose, recommended) vs terse — Phase 137
7. NIP-5D amendment: one-line pointer vs richer section (design leans one-line) — Phase 135
8. IPv6 literal / bare IPv4 acceptance in origin format — Phase 137/138

### Pending Todos

- Orchestrator verify_phase_goal pass for Phase 136, Phase 137, Phase 138, Phase 139 (spawned by `/gsd:execute-phase`, not by this executor)
- Phase 138 (vite-plugin surgery) TERMINAL-COMPLETE — all 10 VITE-XX REQs satisfied; module-load conformance guardrail in place
- Phase 139 (Central Shim + SDK Integration) TERMINAL-COMPLETE — all 6 REQs satisfied (SHIM-01..04 + SDK-01..02); TS2741 carry CLOSED (`pnpm -r type-check` green across all 14 packages)
- Phase 142 VER-03 (tree-shake harness extension) — types-only consumer fixtures to assert bundle-delta ≤ 155 B (connect/types.js) + 103 B (class/types.js) baseline

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04 from prior milestones)
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era)
- CARRIED: Manual cross-repo PR opening — v0.29.0 adds a NUB-CONNECT draft PR to the existing pattern; human creates branch, pushes, opens PR (Phase 135)

## Session Continuity

Last session: 2026-04-21T18:04:20.954Z
Stopped at: Completed 141-01-PLAN.md + 141-02-PLAN.md
Resume: Phase 139 TERMINAL-COMPLETE — `window.napplet.connect` + `window.napplet.class` mounted; @napplet/sdk re-exports parallel surfaces; workspace-wide `pnpm -r type-check` + `pnpm -r build` both green across all 14 packages. Ready for orchestrator verify_phase_goal pass. Next planned phase: 140 (Shell-Deployer Policy Docs — author `specs/SHELL-CONNECT-POLICY.md` + `specs/SHELL-CLASS-POLICY.md` as shell-deployer checklists, can now reference the live SDK surface).
