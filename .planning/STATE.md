---
gsd_state_version: 1.0
milestone: v0.29.0
milestone_name: Receive-Side Decrypt Surface
status: Defining requirements
stopped_at: "Milestone v0.29.0 started from SEED-002. PROJECT.md updated with Current Milestone section; STATE.md reset. Awaiting research decision + requirements definition."
last_updated: "2026-04-23T00:00:00.000Z"
last_activity: 2026-04-23
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-23)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Milestone v0.29.0 Receive-Side Decrypt Surface — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-23 — Milestone v0.29.0 started from SEED-002

## Phase Map

Not yet generated — roadmap pending.

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- PRINCIPLE: Cross-repo amendment PRs on `napplet/nubs` must contain zero `@napplet/*` / private-repo references
- v0.16.0: Wire shape for new message types follows `{ type: "domain.action", ...payload }` JSON envelope
- v0.16.0: NUBs own protocol messages; NIP-5D is transport-only — amendments land on NUB specs, not NIP-5D core
- v0.24.0: `window.nostr` removed from napplets; no signer access in the sandboxed iframe
- v0.24.0: `relay.publishEncrypted` established the send-side shell-mediated crypto pattern — direct precedent for v0.29.0's receive-side mirror
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with subpath exports
- v0.27.0: Runtime API surface uses IFC terminology (`window.napplet.ifc`)
- v0.28.0: Strict CSP capability `perm:strict-csp` raises the attacker's bar for exfiltration, but does NOT block NIP-07 extension content-scripts (`all_frames: true`) — that is the gap v0.29.0 addresses

### Decisions (v0.29.0 — carried from SEED-002)

- Direction locked: Option A (`relay.subscribeEncrypted` on NUB-RELAY), NOT Option B (`identity.decrypt` per-event). Centralizes NIP-17 / NIP-59 gift-wrap unwrap logic shell-side; one subscription vs. N postMessage decrypts; mirrors existing `relay.subscribe` shape
- Mirrors `relay.publishEncrypted` (v0.24.0) shape and negotiation pattern on the send side
- Shell invokes the user's signer (NIP-07 / NIP-46) for each incoming event; napplet receives unwrapped rumor — never ciphertext, never the signer surface
- Shell MUST validate rumor provenance against outer wrap signature (security consideration for spec amendment)
- Demo napplet scope: downstream shell repo owns demos (pattern established by v0.28.0 Option B for DEMO-01); this repo ships only wire + SDK surface

### Pending Todos

- Gather milestone requirements (REQ-IDs scoped by category) — pending `/gsd:new-milestone` workflow
- Generate roadmap starting at Phase 135 — pending requirements
- Amendment PR on public `napplet/nubs` — zero `@napplet/*` leakage required

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04)
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era — not related to v0.29.0)
- INFO: NIP-07 `all_frames: true` content-script leak is orthogonal to strict CSP; the v0.29.0 amendment documents this as a known non-mitigation and provides the spec-legal receive-side path

## Session Continuity

Last session: 2026-04-23T00:00:00.000Z
Stopped at: Milestone v0.29.0 started from SEED-002. PROJECT.md updated; STATE.md reset for new milestone.
Resume: Continue `/gsd:new-milestone seed-002` workflow — research decision → requirements → roadmap.
