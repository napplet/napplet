---
gsd_state_version: 1.0
milestone: v0.28.0
milestone_name: Browser-Enforced Resource Isolation
status: verifying
stopped_at: Completed 125-01-PLAN.md (CORE-01..03); Phase 125 ready for verification. @napplet/core type-check + build + test green. @napplet/shim cascade type-check failure expected until Phase 128 (DEF-125-01).
last_updated: "2026-04-20T12:21:42.348Z"
last_activity: 2026-04-20
progress:
  total_phases: 10
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 125 — Core Type Surface

## Current Position

Phase: 125 (Core Type Surface) — PLAN COMPLETE; awaiting phase verification
Plan: 1 of 1 (complete)
Status: Phase complete — ready for verification
Last activity: 2026-04-20 — Phase 125 plan 01 executed (CORE-01..03)

Progress: [█░░░░░░░░░░] 10% (1/10 phases plan-complete; awaiting verification)

## Phase Map

v0.28.0 phases (125–134), continuing from v0.27.0 which ended at Phase 124.

| Phase | Name | Requirements | Depends on |
|-------|------|--------------|------------|
| 125 | Core Type Surface | CORE-01..03 | — (first phase) |
| 126 | Resource NUB Scaffold + `data:` Scheme | RES-01..07, SCH-01 | 125 |
| 127 | NUB-RELAY Sidecar Amendment | SIDE-01..04 | 126 |
| 128 | Central Shim Integration | SHIM-01..03, CAP-01, CAP-02 | 126 |
| 129 | Central SDK Integration | SDK-01..03 | 126 |
| 130 | Vite-Plugin Strict CSP | CSP-01..07, CAP-03 | 125 |
| 131 | NIP-5D In-Repo Spec Amendment | SPEC-01 | 126, 130 |
| 132 | Cross-Repo Nubs PRs | SPEC-02..06, SCH-02..04, POL-01..06, SVG-01..03, SIDE-05 | 126 |
| 133 | Documentation + Demo Coordination | DOC-01..07, DEMO-01 | 126–130 |
| 134 | Verification & Milestone Close | VER-01..07 | 125–133 |

**Critical path:** 125 → 126 (blocking-sequential); 127–130 independent of each other after 126; 131 waits on 126 + 130; 132 opens drafts after 126 and is gated for final merge by 134; 133 follows in-repo phases; 134 closes milestone.

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with 34 subpath exports; deprecated packages ship as 1-line re-export shims for one release cycle
- v0.27.0: Runtime API surface uses IFC terminology (`window.napplet.ifc`, `@napplet/sdk` `ifc` export); hard break, no backward-compat alias

### Decisions (v0.28.0 — carried into phase plans)

- Convert ambient-trust iframe security ("napplets shouldn't fetch") into browser-enforced isolation ("napplets cannot fetch") via strict CSP delivered by the shell
- Single napplet-side resource primitive: `resource.bytes(url) → blob`. No per-scheme APIs. URL space is scheme-pluggable; shell registers handlers per scheme
- Content hashing is a shell-internal cache key only — napplets never see hashes unless a URL scheme makes them visible (e.g., `blossom:`)
- No protocol-level rewrite of event content into hashes; URLs flow through unchanged on the wire
- Shell may opportunistically pre-resolve resources via a sidecar field on `relay.event` envelopes; napplet API is unchanged either way
- SVG resources are rasterized server-side by the shell to PNG/WebP at requested dimensions — napplets never receive SVG bytes
- Audio/video are explicitly out of scope; reserved for a future shell-composited compositor milestone
- Backwards compatibility is not a concern — single user, active design, break freely
- Shell-as-fetch-proxy is an irreducible attack surface; mitigated with policy defaults (private-IP blocks, size caps, timeouts, per-napplet rate limits, MIME classification)
- NUB naming resolved: `resource` (matches concept, API, and type prefix)
- Sidecar ownership resolved: `ResourceSidecarEntry` defined in resource NUB; relay NUB imports type-only
- CSP capability split: `nub:resource` (API) orthogonal to `perm:strict-csp` (posture)
- Strict CSP normative level in NIP-5D: **SHOULD** (default but waivable by permissive dev shells)
- Sidecar default: **OFF** (opt-in per shell policy + per event-kind allowlist); privacy rationale required in NUB-RELAY amendment
- Vite dev CSP relaxation for HMR: dev allows `connect-src ws://localhost:* wss://localhost:*`; build enforces `connect-src 'none'`; build-time assertion prevents leakage
- Demo napplet scope: **Option B** — downstream shell repo owns v0.28.0 demos; this repo ships only wire + SDK surface (DEMO-01 is a single coordination note)
- Phase 125: Added DOM lib to `@napplet/core` tsconfig (`lib: ["ES2022", "DOM", "DOM.Iterable"]`) so `Blob` global is in scope without runtime import; aligns `@napplet/core` with `shim`/`sdk`/`nub`/`vite-plugin` which all already enable DOM
- Phase 125: `NappletGlobal.resource` declared as REQUIRED (not optional); cascade type-check failure in `@napplet/shim` is expected planned breakage until Phase 128 (Central Shim Integration) wires it (DEF-125-01)

### Pending Todos

- Phase 126 (Resource NUB Scaffold + `data:` Scheme) — ready to plan; consumes `'resource'` literal and `NappletGlobal['resource']` shape from `@napplet/core`
- Phase 130 (Vite-Plugin Strict CSP) — independent of 126; can plan in parallel; consumes `perm:strict-csp` JSDoc-documented capability identifier

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era — not related to v0.28.0's RES-* IDs).
- NEW (informational): REQUIREMENTS.md originally reported "56 total" REQ-IDs; actual enumerated REQ-ID count is 65. Traceability updated to 65/65 mapped. No coverage gap.
- Workspace-wide pnpm -r type-check fails in @napplet/shim (TS2741: missing 'resource' in window.napplet literal). Expected and planned: Phase 128 (Central Shim Integration) will repair. Use per-package validation (pnpm --filter @napplet/core ...) until then. Tracked as DEF-125-01.

## Session Continuity

Last session: 2026-04-20T12:21:34.172Z
Stopped at: Completed 125-01-PLAN.md (CORE-01..03); Phase 125 ready for verification. @napplet/core type-check + build + test green. @napplet/shim cascade type-check failure expected until Phase 128 (DEF-125-01).
Resume: Run `/gsd:plan-phase 125` to decompose Phase 125 (Core Type Surface) into plans.
