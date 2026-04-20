---
gsd_state_version: 1.0
milestone: v0.28.0
milestone_name: Browser-Enforced Resource Isolation
status: completed
stopped_at: Completed 132-01-PLAN.md (SPEC-02..06 + SCH-02..04 + POL-01..06 + SVG-01..03 + SIDE-05; 18 REQ-IDs). 4 NUB drafts authored at .planning/phases/132-cross-repo-nubs-prs/drafts/. Public-repo hygiene clean (zero @napplet/, zero kehto, zero hyprgate). Workspace pnpm -r type-check green (no source changes). Phase 132 plan-complete; awaiting verification. Manual cross-repo git ops on ~/Develop/nubs deferred per CONTEXT.md.
last_updated: "2026-04-20T20:42:10.562Z"
last_activity: 2026-04-20
progress:
  total_phases: 10
  completed_phases: 8
  total_plans: 8
  completed_plans: 8
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 132 — Cross-Repo Nubs PRs

## Current Position

Phase: 133
Plan: Not started
Status: Phase 132 plan-complete
Last activity: 2026-04-20

Progress: [████████░░] 80% (8/10 phases plan-complete; awaiting verification. DEF-125-01 closed.)

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
- Phase 128: 10-NUB central shim integration pattern locked — 4 surgical edits (import block → handleEnvelopeMessage routing branch → window.napplet global mount property → installXShim() in init sequence). Used aliased imports (`resourceBytes`/`resourceBytesAsObjectURL`) over bare names matching `notifySend`/`configRegisterSchema` precedent; bare names risk collisions with future NUB additions in the central shim file.
- Phase 128: DEF-125-01 cascade CLOSED — workspace-wide `pnpm -r type-check` exits 0 across all 14 packages for the first time since Phase 125 introduced the planned breakage. `pnpm -r build` also green. Pattern locked: introduce required type slot in Phase N, wire runtime population in Phase N+M, workspace-wide type-check is the load-bearing acceptance criterion.
- Phase 128: Smoke-test scaffolding pattern extended — Node-side tests against the built `@napplet/shim` must stub `globalThis.document` (querySelector + addEventListener) alongside `globalThis.window` because keys-shim and config-shim access `document` at install time. Source code unchanged; stub lives in `/tmp` test only and is cleaned up post-pass.
- Phase 129: 10-NUB central SDK integration pattern locked — 4 surgical edits (namespace const → type-reexport block → DOMAIN const re-export → shim installer + SDK helper re-exports), all sourced from `@napplet/nub/<domain>` barrel. Used prefixed SDK helpers (`resourceBytes`/`resourceBytesAsObjectURL`) over bare names, matching `notifySend`/`configRegisterSchema` precedent. `installResourceShim` re-exported alongside other 8 `install*Shim` functions. `hydrateResourceCache` deliberately NOT re-exported (relay-shim-internal helper for sidecar cache seeding, cross-NUB borrow-don't-own per Phase 127). Type-only consumer round-trip verified via temporary `__type-check__.ts` fixture (deleted pre-commit). Workspace-wide `pnpm -r type-check` + `pnpm -r build` stay green across all 14 packages — DEF-125-01 remains closed.
- Phase 130: Strict CSP enforcement shipped — 4 project-killer pitfalls (1/2/18/19) now fail the build with prefixed `[nip5a-manifest]` diagnostics. 10-directive baseline + nonce-based script-src + dev/prod connect-src split + meta-must-be-first-head-child assertion all enforced via hand-rolled regex (zero new runtime deps per STACK.md). `Nip5aManifestOptions.strictCsp?: boolean | StrictCspOptions` is opt-in; back-compat preserved when omitted. CAP-03 closure is JSDoc-only (capability identifier `perm:strict-csp` is shell-side advertisement, vite-plugin only documents the pairing).
- Phase 130: closeBundle CSP-extraction regex Rule 1 bug fix — original `[^"']` capture group truncated CSP values at first single quote (CSP values legitimately contain `'none'`/`'self'`), defeating CSP-05/Pitfall 18 dev-leak detection. Fix: pin to double-quote delimiters, accept any non-double-quote in capture. Caught by Task 3's 7-case smoke test. Pattern: when extracting attribute values that themselves contain single quotes, anchor the regex on double-quote delimiters specifically — `[^"']` is wrong because the capture should permit single quotes.
- Phase 130: closeBundle restructure — strict-CSP assertion moved to TOP of `closeBundle()` (before the `VITE_DEV_PRIVKEY_HEX` early-return) so strict CSP enforcement is INDEPENDENT of manifest signing. Plan placement would have been after the privkey gate, skipping the assertion when no privkey is configured. Pattern locked: load-bearing security checks must run regardless of optional features (privkey, schema discovery, etc.).
- Phase 130: tsup config — `src/csp.ts` added as a separate entry alongside `src/index.ts`. Without this, tsup chunk-splits csp.ts into a hashed shared chunk and `dist/csp.js` is not produced; with this, `dist/csp.js` becomes a small re-export shim importable standalone by Node-side validation scripts. Pattern: when a sibling module's exports need to be Node-importable from `dist/<name>.js` directly (for verification scripts, third-party consumers), add it as a tsup entry — cost is minimal (the shim re-uses the same chunk, no code duplication).

### Pending Todos

- Phase 126 (Resource NUB Scaffold + `data:` Scheme) — PLAN-COMPLETE; awaiting verification
- Phase 127 (NUB-RELAY Sidecar Amendment) — PLAN-COMPLETE; awaiting verification
- Phase 128 (Central Shim Integration) — PLAN-COMPLETE; awaiting verification. DEF-125-01 closed.
- Phase 129 (Central SDK Integration) — PLAN-COMPLETE; awaiting verification. SDK seam closed. DEF-125-01 stays closed.
- Phase 130 (Vite-Plugin Strict CSP) — PLAN-COMPLETE; awaiting verification. CSP-01..07 + CAP-03 satisfied. 4 project-killer pitfalls fail the build. Workspace-wide green; DEF-125-01 stays closed.
- Phase 131 (NIP-5D In-Repo Spec Amendment) — UNBLOCKED by Phase 130; resource wire envelopes locked at v0.28.0 contract; `perm:strict-csp` capability identifier ready to be referenced from spec text
- Phase 132 (Cross-Repo Nubs PRs) — PLAN-COMPLETE; 4 drafts at .planning/phases/132-cross-repo-nubs-prs/drafts/; awaiting verification. Cross-repo zero-grep clean. SPEC-02..06 + SCH-02..04 + POL-01..06 + SVG-01..03 + SIDE-05 satisfied. Manual git ops on ~/Develop/nubs deferred per CONTEXT.md (user creates branches, commits, pushes drafts, opens 4 PRs to napplet/nubs).

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era — not related to v0.28.0's RES-* IDs).
- NEW (informational): REQUIREMENTS.md originally reported "56 total" REQ-IDs; actual enumerated REQ-ID count is 65. Traceability updated to 65/65 mapped. No coverage gap.
- CLOSED 2026-04-20: DEF-125-01 — Workspace-wide `pnpm -r type-check` is now green across all 14 packages. Phase 128 (Central Shim Integration) wired `window.napplet.resource = { bytes, bytesAsObjectURL }` satisfying the `NappletGlobal['resource']` shape locked in Phase 125. TS2741 on `packages/shim/src/index.ts` is gone. Workspace-wide type-check is the gating signal again (instead of per-package).

## Session Continuity

Last session: 2026-04-20T20:30:00.000Z
Stopped at: Completed 132-01-PLAN.md (SPEC-02..06 + SCH-02..04 + POL-01..06 + SVG-01..03 + SIDE-05; 18 REQ-IDs). 4 NUB drafts authored at .planning/phases/132-cross-repo-nubs-prs/drafts/. Public-repo hygiene clean (zero @napplet/, zero kehto, zero hyprgate). Workspace pnpm -r type-check green (no source changes). Phase 132 plan-complete; awaiting verification. Manual cross-repo git ops on ~/Develop/nubs deferred per CONTEXT.md.
Resume: Run `/gsd:verify-phase 132` to verify Phase 132 deliverables (and 126/127/128/129/130/131 if any remain unverified), then `/gsd:plan-phase 133` (Documentation + Demo Coordination) to begin the next executable phase.
