---
gsd_state_version: 1.0
milestone: v0.28.0
milestone_name: Browser-Enforced Resource Isolation
status: Defining requirements
stopped_at: "Milestone v0.28.0 started — PROJECT.md updated, awaiting research decision and requirements scoping"
last_updated: "2026-04-20T00:00:00.000Z"
last_activity: 2026-04-20
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** v0.28.0 Browser-Enforced Resource Isolation — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-20 — Milestone v0.28.0 started

Progress: [░░░░░░░░░░] 0%

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with 34 subpath exports; deprecated packages ship as 1-line re-export shims for one release cycle
- v0.27.0: Runtime API surface uses IFC terminology (`window.napplet.ifc`, `@napplet/sdk` `ifc` export); hard break, no backward-compat alias

### Decisions (v0.28.0 — to be carried into phase plans)

- Convert ambient-trust iframe security ("napplets shouldn't fetch") into browser-enforced isolation ("napplets cannot fetch") via strict CSP delivered by the shell
- Single napplet-side resource primitive: `resource.bytes(url) → blob`. No per-scheme APIs. URL space is scheme-pluggable; shell registers handlers per scheme
- Content hashing is a shell-internal cache key only — napplets never see hashes unless a URL scheme makes them visible (e.g., `blossom:`)
- No protocol-level rewrite of event content into hashes; URLs flow through unchanged on the wire
- Shell may opportunistically pre-resolve resources via a sidecar field on `relay.event` envelopes; napplet API is unchanged either way
- SVG resources are rasterized server-side by the shell to PNG/WebP at requested dimensions — napplets never receive SVG bytes
- Audio/video are explicitly out of scope; reserved for a future shell-composited compositor milestone
- Backwards compatibility is not a concern — single user, active design, break freely
- Shell-as-fetch-proxy is an irreducible attack surface; mitigated with policy defaults (private-IP blocks, size caps, timeouts, per-napplet rate limits, MIME classification)
- 7 open design questions deferred to phase planning (CSP delivery mechanism, worker-src policy, sidecar shape, failure mode taxonomy, transform hints, NUB naming, REQUIRE-vs-RECOMMEND for CSP)

### Pending Todos

None yet.

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) — unresolved.

## Session Continuity

Last session: 2026-04-20T00:00:00.000Z
Stopped at: Milestone v0.28.0 started — PROJECT.md updated, awaiting research decision and requirements scoping
Resume: Continue `/gsd:new-milestone` workflow — research decision → requirements scoping → roadmap.
