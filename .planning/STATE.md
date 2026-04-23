---
gsd_state_version: 1.0
milestone: v0.29.0
milestone_name: Class-Gated Decrypt Surface
status: Defining requirements
stopped_at: "Milestone direction pivoted 2026-04-23 from SEED-002 Option A (relay.subscribeEncrypted) to identity.decrypt gated to NUB-CLASS-1 after user direction and discovery of napplet/nubs PRs #15 (merged, window.nostr removal) + #16/#17/#18 (NUB-CLASS authority framework). Option-A research archived; proceeding to requirements against pivoted direction."
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
**Current focus:** Milestone v0.29.0 Class-Gated Decrypt Surface — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-23 — Milestone v0.29.0 pivoted to identity.decrypt direction

## Phase Map

Not yet generated — roadmap pending.

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- PRINCIPLE: Cross-repo amendment PRs on `napplet/nubs` must contain zero `@napplet/*` / private-repo references
- PRINCIPLE: **Security enforcement runs shell-side, not shim-side.** Napplets are untrusted; any policy executed inside the iframe is by-definition bypassable by a hostile napplet
- v0.16.0: Wire shape for new message types follows `{ type: "domain.action", ...payload }` JSON envelope
- v0.16.0: NUBs own protocol messages; NIP-5D is transport-only — amendments land on NUB specs, not NIP-5D core
- v0.24.0: `window.nostr` removed from napplets; no signer access in the sandboxed iframe
- v0.24.0: `relay.publishEncrypted` established the send-side shell-mediated crypto pattern
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with subpath exports
- v0.27.0: Runtime API surface uses IFC terminology (`window.napplet.ifc`)
- v0.28.0: Strict CSP capability `perm:strict-csp` raises the attacker's bar for exfiltration. Does NOT on its own block NIP-07 extension content-scripts injected via `chrome.scripting.executeScript({world:'MAIN'})`; DOES block legacy `<script>`-tag injection when `script-src` is nonce-based

### Decisions (napplet/nubs state snapshot, 2026-04-23)

- **MERGED:** napplet/nubs PR #15 `spec-shell-mediation` (2026-04-21) — NIP-5D now says "Shells MUST NOT provide `window.nostr`" + napplets produce cleartext only + shells MUST NOT sign/broadcast ciphertext from napplets + namespaced `shell.supports()` with `nub:`/`perm:` prefixes. Local `specs/NIP-5D.md` may still be stale vs master; v0.29.0 may need to sync
- **OPEN/DRAFT:** napplet/nubs PR #16 `NUB-CLASS` (class authority), #17 `NUB-CLASS-1` (strict baseline, `connect-src 'none'`, zero direct network egress), #18 `NUB-CLASS-2` (user-approved origins via NUB-CONNECT), #19 `NUB-CONNECT` (manifest-tag shape + aggregateHash fold for class-2 eligibility)
- **Filename citation convention** (NUB-CLASS §Citation): NUBs MUST cite class documents by file name (`NUB-CLASS-1.md`) — NOT the abstract phrase "Class 1" as a primary reference. v0.29.0 amendments MUST honor this
- **Deferred debt in PR #15 body:** "NUB-RELAY currently references `publishEncrypted` — its semantics should be restated in terms of shell-performed encryption rather than napplet-performed encryption." DO NOT bundle into v0.29.0 — separate milestone concern

### Decisions (v0.29.0 — locked 2026-04-23 via direct user direction)

- **DIRECTION PIVOT:** SEED-002's "Option A locked" (`relay.subscribeEncrypted`) was superseded. New direction is **Option 2: `identity.decrypt(event) → Promise<Rumor>` on NUB-IDENTITY**, gated shell-side to napplets assigned `class: 1` per NUB-CLASS-1
- Rejected alternatives (recorded so future drift can be detected):
  - **Option A (`relay.subscribeEncrypted`)** — rejected. Wire duplication of subscription machinery; can't cleanly express per-call class gating on an ambient per-event delivery; NUB-RELAY is transport-scope, decrypt is identity-scope
  - **Option 1 (pipeline ambient auto-decrypt)** — rejected. Ambient policy defeats per-class gating; CLASS-2 napplets would receive plaintext via `relay.event` and can exfiltrate to approved origins with zero shell visibility; also contradicts the "napplet is in control of crypto requests" axis
- **Class gating rule:** `identity.decrypt` is legal only for napplets where `class.assigned` = `1`. Shell MUST reject the envelope from any other class with error code `class-forbidden`. Enforcement is at shell message-handling time, using class state the shell already determined at iframe-ready. Shim-side checks are defense-in-depth only, NEVER the trust boundary
- **Why NUB-CLASS-1 only:** NUB-CLASS-1 ships `connect-src 'none'` — zero direct network egress. Plaintext obtained via `identity.decrypt` is trapped inside the iframe; exfiltration requires shell-mediated NUB calls, which the shell can observe and/or deny. NUB-CLASS-2 ships `connect-src <granted>` → approved origins receive plaintext with zero shell visibility → **unmitigated DM exfiltration risk**
- **Shell-enforced NIP-07 injection detection:** CSP `report-to` directive pointing at shell-owned endpoint. Shell receives `securitypolicyviolation` reports when extension-injected `<script>` is blocked by nonce-based `script-src`; shell correlates to napplet identity via `(dTag, aggregateHash)` and MAY refuse-to-serve future loads / reject `identity.decrypt` calls from offenders / surface to user
- **Residual acknowledged, not hidden:** Extensions using `chrome.scripting.executeScript({world:'MAIN'})` bypass page CSP entirely → no violation report fires. NUB-CLASS-1's `connect-src 'none'` is the structural mitigation (plaintext trapped regardless of how it was obtained). NIP-5D Security Considerations amendment documents this honestly rather than claiming a fix
- **Unwrap detection is shell-side:** `identity.decrypt(event)` takes any encrypted shape (NIP-04 kind-4, direct NIP-44 wrap, NIP-17 gift-wrap kind-1059 with kind-13 seal) and auto-detects. Shell owns all NIP-17/59 unwrap logic (outer wrap-sig verify → seal decrypt → rumor extract → seal-pubkey-vs-rumor-pubkey impersonation check). Napplet receives validated `{ rumor, sender }` — never outer created_at (privacy leak per NIP-59 intentional ±2-day randomization)
- **Wire shape mirror:** Follows `relay.publishEncrypted` shape — one-shot request/result envelope with optional error. `identity.decrypt` + `identity.decrypt.result` + `identity.decrypt.error`
- **Return shape:** `{ rumor: Rumor, sender: string }` where `Rumor = UnsignedEvent & { id: string }` (nostr-tools canonical type). `sender` is shell-authenticated (from seal-pubkey post-validation), NOT derived by napplet from `rumor.pubkey` (unsigned → attacker-controlled)
- **Demo napplet scope:** Downstream shell repo (pattern from v0.28.0 DEMO-01). This repo ships only wire + types + SDK surface
- **Option-A research superseded:** The 4 research files written 2026-04-23 by the project-researcher agents assumed Option A. They contain useful substrate (NIP-17/44 mechanics, unwrap order, rumor typing, anti-features) but their wire-surface recommendations are WRONG for the pivoted direction. Archived to `.planning/milestones/v0.29.0-option-a-research-superseded/`. Requirements author draws from the pivoted direction + surviving substrate — NOT from the Option-A wire-shape recommendations

### Pending Todos

- Archive Option-A research (4 files) to `.planning/milestones/v0.29.0-option-a-research-superseded/`
- Gather milestone requirements (REQ-IDs scoped by category) — pending `/gsd:new-milestone` workflow
- Generate roadmap starting at Phase 135 — pending requirements
- NUB-IDENTITY amendment PR on public `napplet/nubs` — zero `@napplet/*` leakage required
- NUB-CLASS-1 amendment (new `report-to` SHOULD row) — may need separate PR or bundled into NUB-IDENTITY amendment; decide at roadmap time
- Local `specs/NIP-5D.md` sync check against napplet/nubs master post-PR-15

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04)
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era — not related to v0.29.0)
- INFO: NIP-07 `all_frames: true` extension content-script injection is the originating reason for this milestone. Structural mitigation via NUB-CLASS-1 `connect-src 'none'` + strict-CSP nonce-based `script-src` + `report-to` shell-side detection. `world: 'MAIN'` extension-API bypass acknowledged as residual — no page-side blocking mechanism exists
- INFO: Local `specs/NIP-5D.md` may be stale vs napplet/nubs master post-PR-15 (`window.nostr` removal). Milestone should sync before in-repo amendment lands

## Session Continuity

Last session: 2026-04-23T00:00:00.000Z
Stopped at: Milestone v0.29.0 pivoted from subscribeEncrypted to identity.decrypt; PROJECT.md + STATE.md reflect pivoted direction; Option-A research pending archive.
Resume: Archive Option-A research, then continue to requirements definition against the pivoted direction.
