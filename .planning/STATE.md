---
gsd_state_version: 1.0
milestone: v0.28.0
milestone_name: Browser-Enforced Resource Isolation
status: verifying
stopped_at: Completed 127-01-PLAN.md (SIDE-01..04); Phase 127 ready for verification. @napplet/nub type-check + build + smoke test green. @napplet/shim cascade type-check failure expected until Phase 128 (DEF-125-01 carry).
last_updated: "2026-04-20T13:18:49.826Z"
last_activity: 2026-04-20
progress:
  total_phases: 10
  completed_phases: 3
  total_plans: 3
  completed_plans: 3
  percent: 30
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 127 — NUB-RELAY Sidecar Amendment

## Current Position

Phase: 128
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-04-20

Progress: [███░░░░░░░] 30% (3/10 phases plan-complete; awaiting verification)

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
- Phase 126: `bytesAsObjectURL` returns synchronous `{ url, revoke }` handle with non-enumerable `ready` Promise extension (Option C from CONTEXT discretion); preserves locked `NappletGlobal['resource']` return shape while exposing await path. `revoke()` is idempotent; bails ready handler via `revoked` flag if called pre-settle.
- Phase 126: `data:` scheme decoded inline via `fetch(url).then(r => r.blob())` with zero postMessage round-trip (SCH-01). Establishes the in-shim scheme decoder precedent; future schemes plug in at NUB-RESOURCE spec level (Phase 132).
- Phase 126: Single-flight cache via `Map<canonicalURL, Promise<Blob>>` with `finally`-delete; N concurrent same-URL calls share 1 work-unit; aborted entries removed for retryability. v0.28.0 uses raw URL string as cache key (canonicalization deferred to NUB-RESOURCE spec).
- Phase 126: AbortSignal contract — synchronous pre-dispatch reject + post-dispatch `resource.cancel` envelope; both gates use `new DOMException('Aborted', 'AbortError')`. Establishes the cancellation pattern for any future NUB needing AbortController support.
- Phase 127: Hoisted local `eventMsg` cast in relay shim's `handleMessage` `relay.event` branch (vs. inline double-cast) — single cast, two reads. Source-order pattern: `hydrateResourceCache(eventMsg.resources)` placed BEFORE `onEvent(eventMsg.event)` is load-bearing for SIDE-04 (synchronous `bytes(url)` inside `onEvent` resolves from cache).
- Phase 127: Established cross-NUB borrow-don't-own pattern — relay NUB type-only-imports `ResourceSidecarEntry` from `../resource/types.js` (sibling relative); ownership stays with resource NUB; no runtime cross-domain dep.
- Phase 127: Smoke test scaffolding deviation (Rule 3) — Node 18+ `globalThis.crypto` is non-configurable getter; plan's literal assignment crashed; replaced with guarded `Object.defineProperty` in `/tmp` test only. Source code unchanged. Future smoke tests should use the guarded form.
- Phase 127: tsup chunk-splitting splits the relay shim runtime into shared chunks (`chunk-RHDDLJ3D.js` / `chunk-OV3R23GE.js`); literal grep on `dist/relay/shim.js` for `hydrateResourceCache` returns 0 (the call is in the chunk). End-to-end smoke test (PASS, 0 postMessages) is the load-bearing acceptance criterion. Future verification scripts should target shared chunks too, or rely on smoke tests over literal dist greps.

### Pending Todos

- Phase 126 (Resource NUB Scaffold + `data:` Scheme) — PLAN-COMPLETE; awaiting verification
- Phase 127 (NUB-RELAY Sidecar Amendment) — PLAN-COMPLETE; awaiting verification
- Phase 128 (Central Shim Integration) — ready to plan; consumes `installResourceShim`/`handleResourceMessage`/`bytes`/`bytesAsObjectURL`/`hydrateResourceCache` from `@napplet/nub/resource/shim`; will resolve DEF-125-01 by wiring `window.napplet.resource`
- Phase 129 (Central SDK Integration) — ready to plan; consumes `resourceBytes`/`resourceBytesAsObjectURL` from `@napplet/nub/resource`
- Phase 130 (Vite-Plugin Strict CSP) — independent of 126; can plan in parallel; consumes `perm:strict-csp` JSDoc-documented capability identifier
- Phase 131 (NIP-5D In-Repo Spec Amendment) — gated by 126 + 130; resource wire envelopes locked at v0.28.0 contract

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era — not related to v0.28.0's RES-* IDs).
- NEW (informational): REQUIREMENTS.md originally reported "56 total" REQ-IDs; actual enumerated REQ-ID count is 65. Traceability updated to 65/65 mapped. No coverage gap.
- Workspace-wide pnpm -r type-check fails in @napplet/shim (TS2741: missing 'resource' in window.napplet literal). Expected and planned: Phase 128 (Central Shim Integration) will repair. Use per-package validation (pnpm --filter @napplet/core ...) until then. Tracked as DEF-125-01.

## Session Continuity

Last session: 2026-04-20T13:13:41.481Z
Stopped at: Completed 127-01-PLAN.md (SIDE-01..04); Phase 127 ready for verification. @napplet/nub type-check + build + smoke test green. @napplet/shim cascade type-check failure expected until Phase 128 (DEF-125-01 carry).
Resume: Run `/gsd:verify-phase 127` (or 126) to verify the latest phase deliverables, then `/gsd:plan-phase 128` (or 129/130) to begin the next executable phase.
