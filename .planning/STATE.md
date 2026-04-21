---
gsd_state_version: 1.0
milestone: v0.29.0
milestone_name: NUB-CONNECT + Shell as CSP Authority
status: verifying
stopped_at: Completed 137-03-PLAN.md
last_updated: "2026-04-21T14:04:59.232Z"
last_activity: 2026-04-21
progress:
  total_phases: 8
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 137 — NUB Subpath Scaffolds

## Current Position

Phase: 138
Plan: Not started
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

- Orchestrator verify_phase_goal pass for Phase 136 + Phase 137 (spawned by `/gsd:execute-phase`, not by this executor)
- Phase 139 (Central Shim + SDK Integration) MUST populate `window.napplet.connect = { granted: false, origins: [] }` default block at `packages/shim/src/index.ts:130` — currently produces expected TS2741 error in monorepo-wide type-check; will be resolved by SHIM-01 + SHIM-02
- Phase 138 (vite-plugin surgery) unblocked — can now `import { normalizeConnectOrigin } from '@napplet/nub/connect/types'`
- Phase 142 VER-03 (tree-shake harness extension) — types-only consumer fixtures to assert bundle-delta ≤ 155 B (connect/types.js) + 103 B (class/types.js) baseline

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04 from prior milestones)
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era)
- CARRIED: Manual cross-repo PR opening — v0.29.0 adds a NUB-CONNECT draft PR to the existing pattern; human creates branch, pushes, opens PR (Phase 135)

## Session Continuity

Last session: 2026-04-21T14:01:08.888Z
Stopped at: Completed 137-03-PLAN.md
Resume: Phase-level verify_phase_goal for Phase 136, then Phase 137 (`@napplet/nub/connect` + `@napplet/nub/class` Subpath Scaffolds)
