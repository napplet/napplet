# Requirements: Napplet Protocol SDK — v0.29.0 Class-Gated Decrypt Surface

**Defined:** 2026-04-23
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.29.0 Requirements

Close the NIP-17 / NIP-59 gift-wrap receive-side gap by adding `identity.decrypt(event) → Rumor` to NUB-IDENTITY, gated by shell enforcement to napplets assigned `class: 1` per NUB-CLASS-1. Also establish shell-enforced detection of NIP-07 extension `window.nostr` injection via CSP `report-to`. All enforcement is shell-side; napplets are untrusted.

### `identity.decrypt` Primitive (NUB-IDENTITY)

- [x] **DEC-01**: New wire message `identity.decrypt` on NUB-IDENTITY with payload `{ id: string, event: NostrEvent }` — one-shot request/result shape mirroring `relay.publishEncrypted` (not a subscription)
- [x] **DEC-02**: Result envelope `identity.decrypt.result` with payload `{ id, rumor: Rumor, sender: string }` where `Rumor = UnsignedEvent & { id: string }` (nostr-tools canonical type) and `sender` is shell-authenticated from seal signature (NOT derived by napplet from `rumor.pubkey`)
- [x] **DEC-03**: Error envelope `identity.decrypt.error` with payload `{ id, error: IdentityDecryptErrorCode, message?: string }` — typed discriminator, never throws
- [x] **DEC-04**: `IdentityDecryptErrorCode` vocabulary: `class-forbidden`, `signer-denied`, `signer-unavailable`, `decrypt-failed`, `malformed-wrap`, `impersonation`, `unsupported-encryption`, `policy-denied` (8 codes)
- [x] **DEC-05**: Shape auto-detection inside shell's handler — accepts NIP-04 (kind-4 content), direct NIP-44 (kind-44 or other with NIP-44 payload shape), and NIP-17 gift-wrap (kind-1059 → kind-13 seal → rumor) — single entry point; napplet does NOT select encryption mode
- [x] **DEC-06**: Outer `created_at` MUST NOT be surfaced to napplet on `identity.decrypt.result` — gift-wrap randomizes outer `created_at` ±2 days intentionally for sender-anonymity; exposing undoes the privacy floor. Rumor carries its own real `created_at`
- [x] **DEC-07**: Seal-pubkey / rumor-pubkey impersonation check is a shell MUST — shell MUST verify `seal.pubkey === rumor.pubkey` for NIP-17 flows before delivering rumor; mismatch returns `impersonation` error
- [x] **DEC-08**: Outer wrap signature validation is a shell MUST — shell MUST verify outer event signature before attempting seal decrypt; bad sig returns `malformed-wrap`

### Shell-Enforced Class Gating

- [x] **GATE-01**: `identity.decrypt` is legal only for napplets where the shell has assigned `class: 1` per NUB-CLASS-1. Shell MUST reject the envelope from any other class (`undefined`, `2`, or any future class) with error code `class-forbidden`
- [x] **GATE-02**: Enforcement is at shell message-handling time, using class state the shell already determined at iframe-ready. Shell MUST NOT re-derive class per-envelope — use the single `class.assigned` value from the napplet's lifecycle
- [x] **GATE-03**: Class-forbidden error MUST NOT leak napplet-internal details — error payload is `{ error: 'class-forbidden' }` only; optional `message?` field may name the current class integer for debugging but MUST NOT name other napplets or environmental details
- [x] **GATE-04**: Shim-side defense-in-depth: if `window.napplet.class !== 1`, the SDK's `decrypt()` helper MAY short-circuit with a local rejection WITHOUT sending the envelope. This is observability for napplet authors, NEVER the trust boundary. Shell still enforces authoritatively

### Shell-Enforced NIP-07 Extension Injection Detection

- [x] **DETECT-01**: NUB-CLASS-1 CSP gains a `report-to` directive (alongside `Report-To` response header) pointing at a shell-owned reporting endpoint. Endpoint URL is shell-chosen; NUB-CLASS-1 amendment specifies shape as a SHOULD (MUSTing it would impose deployment complexity on shells without a reporting infrastructure)
- [x] **DETECT-02**: Shell MUST process received `securitypolicyviolation` reports: correlate to napplet identity via `(dTag, aggregateHash)` via the napplet HTML URL path; log the violation; expose it to user surfaces at shell discretion
- [x] **DETECT-03**: Shell MAY (not MUST) refuse-to-serve subsequent loads of an offending napplet, reject subsequent `identity.decrypt` envelopes from it, or surface the event to the user. Policy detail is shell-side UX concern — spec defines the mechanism, not the response
- [x] **DETECT-04**: `world: 'MAIN'` extension-API bypass residual documented honestly — no page-side CSP mechanism exists to block extensions using `chrome.scripting.executeScript({world:'MAIN'})`. Structural mitigation is NUB-CLASS-1's `connect-src 'none'` trapping any plaintext inside the frame

### `@napplet/nub/identity` Types + SDK (First-Party)

- [x] **TYPES-01**: `IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage` interfaces added to `packages/nub/src/identity/types.ts` with correct discriminated-union membership
- [x] **TYPES-02**: `IdentityDecryptErrorCode` exported string-literal-union type with 8 codes from DEC-04
- [x] **TYPES-03**: `Rumor` type either added to `@napplet/core` or imported from a minimal internal helper — `UnsignedEvent & { id: string }` shape; no fake `sig` field
- [x] **TYPES-04**: `NappletIdentity.decrypt(event)` method type added to `@napplet/core` `NappletGlobal['identity']` surface with signature `(event: NostrEvent) => Promise<{ rumor: Rumor, sender: string }>`
- [x] **TYPES-05**: Discriminated-union exhaustiveness preserved: existing `IdentityMessage` / `IdentityInbound` / `IdentityOutbound` unions extended to include the 3 new message types; `never`-fallback assertion in shim handler enforces
- [x] **SHIM-01**: `packages/nub/src/identity/shim.ts` handler routes `identity.decrypt.result` and `identity.decrypt.error` to the correct pending Promise via correlation id; pending map cleanup on resolve/reject
- [x] **SHIM-02**: `packages/nub/src/identity/shim.ts` exposes a `decrypt(event)` function bound to `window.napplet.identity.decrypt` via the central shim's install function; returns a `Promise<{ rumor, sender }>` that rejects with a typed `IdentityDecryptError` on `identity.decrypt.error`
- [x] **SDK-01**: `packages/nub/src/identity/sdk.ts` exports a bare-name `identityDecrypt(event)` helper wrapping `window.napplet.identity.decrypt` with a `requireNapplet()` guard (mirrors existing identity helpers)
- [x] **SDK-02**: `@napplet/sdk` central package re-exports identity types + `identityDecrypt` helper via the 4-surgical-edit pattern (namespace, type re-exports, DOMAIN const unchanged, helper re-export)
- [x] **SHIM-03**: `@napplet/shim` central package no changes — identity shim install is already registered; new handler branch is internal to `packages/nub/src/identity/shim.ts`. Verify no central-shim edit required; document if surgical edit IS required
- [x] **TYPES-06**: Workspace-wide `pnpm -r type-check` green across all 14 packages after all type additions land (blocking gate; matches v0.28.0 VER-01 precedent)

### Spec: NUB-IDENTITY Amendment (Public `napplet/nubs`)

- [x] **NUB-IDENTITY-01**: Draft amendment to `NUB-IDENTITY.md` on `napplet/nubs` adding `identity.decrypt` request / result / error envelope triad with full payload shapes
- [x] **NUB-IDENTITY-02**: Conformance table rows added for the 3 new envelopes + shell responsibilities (class gating MUST, outer-sig-verify MUST, impersonation-check MUST, outer-created_at-hiding MUST)
- [x] **NUB-IDENTITY-03**: `IdentityDecryptErrorCode` enumerated in amendment with one sentence per code naming the failure surface it represents
- [x] **NUB-IDENTITY-04**: Class-gating MUST row cites `NUB-CLASS-1.md` by filename (per NUB-CLASS §Citation discipline); amendment text says "napplets assigned `class: 1`" or "NUB-CLASS-1 napplets", never "Class 1" as primary reference
- [x] **NUB-IDENTITY-05**: Security Considerations subsection explicitly names: (a) NIP-17/59 gift-wrap flow and the spec MUSTs that prevent impersonation, (b) NIP-07 extension `all_frames: true` injection and the fact that NUB-CLASS-1 strict-CSP nonce-based `script-src` blocks legacy `<script>` injection, (c) `world: 'MAIN'` extension-API residual with NUB-CLASS-1 `connect-src 'none'` as structural mitigation
- [x] **NUB-IDENTITY-06**: Public-repo hygiene clean — zero `@napplet/*`, zero `kehto`, zero `hyprgate`, zero first-party package names in the amendment diff, commit messages, or PR description
- [x] **NUB-IDENTITY-07**: PR opened against `napplet/nubs` on a new branch `nub-identity-decrypt` (or similar), based on the existing `nub-identity` branch. Per in-repo convention, the user opens the PR; this milestone authors the diff

### Spec: NUB-CLASS-1 Amendment (Public `napplet/nubs`)

- [x] **CLASS1-01**: Draft amendment to `NUB-CLASS-1.md` on `napplet/nubs` adding a Shell Responsibilities SHOULD row: shells SHOULD emit `report-to` / `Report-To` pointing at a shell-owned reporting endpoint alongside the `connect-src 'none'` baseline
- [x] **CLASS1-02**: Shell MUST process received CSP violation reports by correlating to napplet identity via `(dTag, aggregateHash)` — enumerated MUST/SHOULD rows in the amendment
- [x] **CLASS1-03**: Amendment MAY be merged into NUB-IDENTITY amendment PR if review convenience prevails, OR opened as its own PR. Roadmap decides; both paths produce the same spec surface. Coordinate with human PR-open step

### Spec: NIP-5D In-Repo Amendment

- [x] **NIP5D-01**: Check local `specs/NIP-5D.md` against napplet/nubs master post-PR-15 (`window.nostr` removal merged 2026-04-21) — sync any missing prose before layering v0.29.0 amendment
- [x] **NIP5D-02**: Security Considerations subsection added to `specs/NIP-5D.md` documenting the NIP-07 extension `all_frames: true` content-script injection vector — names the vector, names the CSP nonce-based `script-src` mitigation for legacy injection, names the `world: 'MAIN'` residual, names NUB-CLASS-1 `connect-src 'none'` as structural mitigation, points at `identity.decrypt` on NUB-IDENTITY as the spec-legal receive-side decrypt path for NUB-CLASS-1 napplets
- [x] **NIP5D-03**: Cross-references added: NIP-5D Security Considerations cites `NUB-IDENTITY.md` and `NUB-CLASS-1.md` by filename (per NUB-CLASS §Citation)
- [x] **NIP5D-04**: Local `specs/NIP-5D.md` amendment commit is independent of the public napplet/nubs PR diff — the in-repo file is a reference copy, not the authoritative spec; changes land on master (or an own PR) per `feedback_spec_branch_hygiene`

### Documentation

- [x] **DOC-01**: `packages/nub/README.md` gains documentation for `identity.decrypt()` under the identity NUB section — API shape, class-gating expectation, error handling, NIP-17 auto-detect behavior
- [x] **DOC-02**: `packages/sdk/README.md` gains an `identityDecrypt()` entry alongside existing identity SDK helpers
- [x] **DOC-03**: Root `README.md` changelog bullet for v0.29.0 — one line; no deep content
- [x] **DOC-04**: `skills/build-napplet/SKILL.md` updated with one-paragraph guidance: NIP-17 DM / kind-1059 handling for napplets uses `window.napplet.identity.decrypt(event)`; requires NUB-CLASS-1; napplets MUST NOT attempt `window.nostr.*` decrypt; shell enforces

### Verification

- [x] **VER-01**: Workspace `pnpm -r build` + `pnpm -r type-check` exit 0 across all 14 packages after all type additions land (primary shipping gate, matches v0.28.0 VER-01 precedent)
- [x] **VER-02**: Cross-repo public-hygiene grep: zero matches for `@napplet/*`, `kehto`, `hyprgate` across NUB-IDENTITY amendment + NUB-CLASS-1 amendment drafts at `~/Develop/nubs/` (matches v0.28.0 VER-06 pattern)
- [x] **VER-03**: Spec conformance grep: NUB-IDENTITY amendment draft contains all 8 `IdentityDecryptErrorCode` codes, all 4 MUSTs (class-gating, outer-sig-verify, impersonation-check, outer-created_at-hiding), filename citation (`NUB-CLASS-1.md` appears at least once; abstract phrase "Class 1" does NOT appear as primary reference)
- [x] **VER-04**: Empirical strict-CSP-nonce injection blocking: a test napplet served with NUB-CLASS-1 posture (`connect-src 'none'`; `script-src 'nonce-XXX'`) running Playwright with a mock legacy-injection script (simulates `<script>`-tag-via-content-script injection) observes CSP blocking the injection AND firing a `securitypolicyviolation` event — validates the DETECT-01 mechanism on Chromium
- [x] **VER-05**: Tree-shake contract preserved — relay-types-only consumer bundle remains ≤ 100 bytes (matches v0.28.0 VER-07 74-byte precedent); identity-types-only consumer does not pull shim/sdk runtime symbols
- [x] **VER-06**: `specs/NIP-5D.md` NIP-07 Security Considerations subsection is present, non-empty, cites both `NUB-IDENTITY.md` and `NUB-CLASS-1.md` by filename, and names the `world: 'MAIN'` residual honestly (grep-verifiable)

## Future Requirements (deferred)

- **REMOVE-01..03** (carried from v0.26.0): delete the 9 deprecated `@napplet/nub-<domain>` packages; remove from publish workflow; remove deprecation banners. Deferred again; scope call at next milestone
- **RELAY-REPHRASE-01** (deferred from PR #15 body): restate `relay.publishEncrypted` in shell-performed-encryption terms on NUB-RELAY. Separate milestone concern — do NOT bundle into v0.29.0
- **MAIN-WORLD-01** (speculative): if a NIP-07 extension migrates to `chrome.scripting.executeScript({world:'MAIN'})`, shell mitigation beyond `connect-src 'none'` structural trapping becomes interesting. No current ecosystem signal; defer until real-world trigger

## Out of Scope

- **`relay.subscribeEncrypted`** — SEED-002's original Option A direction. Rejected: wire-level subscription cannot cleanly express per-class gating; decrypt is identity-scope not transport-scope
- **Pipeline ambient auto-decrypt** — Option 1 considered during pivot. Rejected: ambient decrypt on `relay.event` delivery would hand plaintext to NUB-CLASS-2 napplets with direct network egress; per-class gating impossible at wire-level delivery
- **Shim-side class gating as primary enforcement** — Napplets are untrusted; shim code is part of the untrusted surface. Any policy the shim alone enforces is bypassable. Shell enforcement is load-bearing; shim is defense-in-depth only
- **`window.nostr` blocking via pre-seeding** — considered and rejected. `document_start` extension content scripts beat page scripts to the write; cannot win the race. CSP nonce-based `script-src` is the actual page-level mitigation for legacy injection
- **Shell implementation of `identity.decrypt` handler** — downstream shell repo concern (pattern from v0.28.0 DEMO-01)
- **Demo napplets exercising NIP-17 DMs** — downstream shell repo concern
- **NIP-07 extension hardening itself** — browser/extension ecosystem concern. Spec documents the residual, doesn't fix it
- **`world: 'MAIN'` extension-API mitigation** — architecturally unblockable from page-side. Spec acknowledges residual; structural mitigation (NUB-CLASS-1 `connect-src 'none'`) traps plaintext regardless of how it was obtained
- **New `shell.supports('identity:decrypt')` capability string** — `nub:identity` already indicates identity NUB presence; class-gating is the finer access control. Additional capability string not required

## Traceability

All 51 REQ-IDs mapped to exactly one phase. 100% coverage verified 2026-04-23.

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DEC-01 | Phase 137 | Complete |
| DEC-02 | Phase 137 | Complete |
| DEC-03 | Phase 137 | Complete |
| DEC-04 | Phase 137 | Complete |
| DEC-05 | Phase 137 | Complete |
| DEC-06 | Phase 137 | Complete |
| DEC-07 | Phase 137 | Complete |
| DEC-08 | Phase 137 | Complete |
| GATE-01 | Phase 137 | Complete |
| GATE-02 | Phase 137 | Complete |
| GATE-03 | Phase 137 | Complete |
| GATE-04 | Phase 137 | Complete |
| DETECT-01 | Phase 136 | Complete |
| DETECT-02 | Phase 136 | Complete |
| DETECT-03 | Phase 136 | Complete |
| DETECT-04 | Phase 136 | Complete |
| TYPES-01 | Phase 135 | Complete |
| TYPES-02 | Phase 135 | Complete |
| TYPES-03 | Phase 135 | Complete |
| TYPES-04 | Phase 135 | Complete |
| TYPES-05 | Phase 135 | Complete |
| TYPES-06 | Phase 135 | Complete |
| SHIM-01 | Phase 135 | Complete |
| SHIM-02 | Phase 135 | Complete |
| SHIM-03 | Phase 135 | Complete |
| SDK-01 | Phase 135 | Complete |
| SDK-02 | Phase 135 | Complete |
| NUB-IDENTITY-01 | Phase 137 | Complete |
| NUB-IDENTITY-02 | Phase 137 | Complete |
| NUB-IDENTITY-03 | Phase 137 | Complete |
| NUB-IDENTITY-04 | Phase 137 | Complete |
| NUB-IDENTITY-05 | Phase 137 | Complete |
| NUB-IDENTITY-06 | Phase 137 | Complete |
| NUB-IDENTITY-07 | Phase 137 | Complete |
| CLASS1-01 | Phase 137 | Complete |
| CLASS1-02 | Phase 137 | Complete |
| CLASS1-03 | Phase 137 | Complete |
| NIP5D-01 | Phase 138 | Complete |
| NIP5D-02 | Phase 138 | Complete |
| NIP5D-03 | Phase 138 | Complete |
| NIP5D-04 | Phase 138 | Complete |
| DOC-01 | Phase 138 | Complete |
| DOC-02 | Phase 138 | Complete |
| DOC-03 | Phase 138 | Complete |
| DOC-04 | Phase 138 | Complete |
| VER-01 | Phase 135 | Complete |
| VER-02 | Phase 137 | Complete |
| VER-03 | Phase 137 | Complete |
| VER-04 | Phase 136 | Complete |
| VER-05 | Phase 135 | Complete |
| VER-06 | Phase 138 | Complete |

### Coverage Summary

| Phase | REQ Count | REQ-IDs |
|-------|-----------|---------|
| 135 | 13 | TYPES-01..06, SHIM-01..03, SDK-01..02, VER-01, VER-05 |
| 136 | 5 | DETECT-01..04, VER-04 |
| 137 | 24 | DEC-01..08, GATE-01..04, NUB-IDENTITY-01..07, CLASS1-01..03, VER-02, VER-03 |
| 138 | 9 | NIP5D-01..04, DOC-01..04, VER-06 |
| **Total** | **51** | **All 51 mapped; no orphans, no duplicates** |

---
*Defined 2026-04-23. 51 REQ-IDs across 11 categories (DEC, GATE, DETECT, TYPES, SHIM, SDK, NUB-IDENTITY, CLASS1, NIP5D, DOC, VER). Phase numbering continues from v0.28.0 (phases 135–138). Roadmap authored 2026-04-23; traceability populated at 100% coverage.*
