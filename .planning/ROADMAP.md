# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22.1 (shipped 2026-03-31) — [Archive](milestones/v0.4.0-ROADMAP.md)
- ✅ **v0.5.0 Documentation & Developer Skills** — Phases 23-26 (shipped 2026-04-01) — [Archive](milestones/v0.5.0-ROADMAP.md)
- ✅ **v0.6.0 Demo Upgrade** — Phases 27-33 (shipped 2026-04-01) — [Archive](milestones/v0.6.0-ROADMAP.md)
- ✅ **v0.7.0 Ontology Audit and Adjustments** — Phases 34-40 (shipped 2026-04-02) — [Archive](milestones/v0.7.0-ROADMAP.md)
- ✅ **v0.8.0 Shim/SDK Split** — Phases 41-44 (shipped 2026-04-02) — [Archive](milestones/v0.8.0-ROADMAP.md)
- ✅ **v0.9.0 Identity & Trust** — Phases 46-48 (shipped 2026-04-03) — [Archive](milestones/v0.9.0-ROADMAP.md)
- ✅ **v0.10.0 Demo Consistency and Usability Pass** — Phases 49-53 (shipped 2026-04-04) — [Archive](milestones/v0.10.0-ROADMAP.md)
- ✅ **v0.11.0 Clean up Side Panel** — Phases 54-56 (shipped 2026-04-05) — [Archive](milestones/v0.11.0-ROADMAP.md)
- ✅ **v0.12.0 Spec Packaging** — Phase 61 (shipped 2026-04-06) — [Archive](milestones/v0.12.0-ROADMAP.md)
- ✅ **v0.13.0 Runtime Decoupling & Publish** — Phases 62-67 (shipped 2026-04-06) — [Archive](milestones/v0.13.0-ROADMAP.md)
- ✅ **v0.14.0 Repo Cleanup & Audit** — Phases 68-69 (shipped 2026-04-06) — [Archive](milestones/v0.14.0-ROADMAP.md)
- ✅ **v0.15.0 Protocol Simplification** — Phases 70-73 (shipped 2026-04-07) — [Archive](milestones/v0.15.0-ROADMAP.md)
- ✅ **v0.16.0 Wire Format & NUB Architecture** — Phases 74-79 (shipped 2026-04-07) — [Archive](milestones/v0.16.0-ROADMAP.md)
- ✅ **v0.17.0 Capability Cleanup** — Phases 80-82 (shipped 2026-04-08) — [Archive](milestones/v0.17.0-ROADMAP.md)
- ✅ **v0.18.0 Spec Conformance Audit** — Phases 83-86 (shipped 2026-04-09) — [Archive](milestones/v0.18.0-ROADMAP.md)
- ✅ **v0.19.0 Spec Gap Drops** — Phase 87 (shipped 2026-04-09) — [Archive](milestones/v0.19.0-ROADMAP.md)
- ✅ **v0.20.0 Keys NUB** — Phases 88-92 (shipped 2026-04-09) — [Archive](milestones/v0.20.0-ROADMAP.md)
- ✅ **v0.21.0 NUB Modularization** — Phases 93-95 (shipped 2026-04-09) — [Archive](milestones/v0.21.0-ROADMAP.md)
- ✅ **v0.22.0 Media NUB + Kill Services** — Phases 96-100 (shipped 2026-04-09) — [Archive](milestones/v0.22.0-ROADMAP.md)
- ✅ **v0.23.0 Notify NUB** — Phases 101-104 (shipped 2026-04-09) — [Archive](milestones/v0.23.0-ROADMAP.md)
- ✅ **v0.24.0 Identity NUB + Kill NIP-07** — Phases 105-110 (shipped 2026-04-09) — [Archive](milestones/v0.24.0-ROADMAP.md)
- ✅ **v0.25.0 Config NUB** — Phases 111-116 (shipped 2026-04-17) — [Archive](milestones/v0.25.0-ROADMAP.md)
- ✅ **v0.26.0 Better Packages** — Phases 117-121 (shipped 2026-04-19) — [Archive](milestones/v0.26.0-ROADMAP.md)
- ✅ **v0.27.0 IFC Terminology Lock-In** — Phases 122-124 (shipped 2026-04-19) — [Archive](milestones/v0.27.0-ROADMAP.md)
- ✅ **v0.28.0 Browser-Enforced Resource Isolation** — Phases 125-134 (shipped 2026-04-23) — [Archive](milestones/v0.28.0-ROADMAP.md)
- 🚧 **v0.29.0 Class-Gated Decrypt Surface** — Phases 135-138 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Note: Phase 45 (IPC terminology cleanup) was completed as a quick task during v0.8.0 and is not part of the v0.9.0 roadmap. Phases 57–60 were deprecated after v0.11.0 and archived under `milestones/v0.12.0-phases/deprecated/`.

### 🚧 v0.29.0 Class-Gated Decrypt Surface (In Progress)

**Milestone Goal:** Close the NIP-17 / NIP-59 gift-wrap receive-side gap by adding `identity.decrypt(event) → Rumor` to NUB-IDENTITY, gated shell-side to napplets assigned `class: 1` per NUB-CLASS-1. Plaintext decrypt is only safe where the posture guarantees zero direct network egress; NUB-CLASS-2 napplets (approved direct-origin access via NUB-CONNECT) MUST be refused at the shell boundary. Same milestone establishes shell-enforced detection of NIP-07 extension `window.nostr` injection via CSP `report-to`. All enforcement is shell-side; napplets are untrusted.

- [x] **Phase 135: First-Party Types + SDK Plumbing** — Ship `@napplet/nub/identity` type additions (`IdentityDecryptMessage` / `.result` / `.error` + `IdentityDecryptErrorCode` + `Rumor` + `NappletIdentity.decrypt` method type), shim handler + `decrypt()` binding, SDK `identityDecrypt()` helper + re-exports, and gate on `pnpm -r build` + `pnpm -r type-check` green across all 14 packages. Prove the tree-shake contract still holds. (verification found 2 gaps — plan 135-05 closes them) (completed 2026-04-23)
- [ ] **Phase 136: Empirical CSP Injection-Block Verification** — Serve a test napplet under NUB-CLASS-1 posture (`connect-src 'none'`; `script-src 'nonce-XXX'`) with Playwright, simulate legacy `<script>`-tag content-script injection, and observe CSP blocking + `securitypolicyviolation` event firing. Document the `world: 'MAIN'` extension-API residual honestly. Locks the empirical shape of the DETECT-01..04 surface before the amendment PR cites it.
- [ ] **Phase 137: Public `napplet/nubs` Amendments (NUB-IDENTITY + NUB-CLASS-1 bundled)** — Draft the NUB-IDENTITY amendment adding `identity.decrypt` envelope triad with full conformance table (4 MUSTs: class-gating, outer-sig-verify, impersonation-check, outer-created_at-hiding), 8-code error vocabulary, class-gating cite of `NUB-CLASS-1.md` by filename, and Security Considerations subsection. Bundle the NUB-CLASS-1 amendment (`report-to` SHOULD + violation-correlation MUST) into the same PR per CLASS1-03's "bundle if review convenience prevails" clause. Public-repo hygiene verified: zero `@napplet/*`, zero `kehto`, zero `hyprgate` in diff/commits/PR body.
- [ ] **Phase 138: In-Repo NIP-5D Amendment + Docs + Final Verification** — Sync local `specs/NIP-5D.md` against `napplet/nubs` master post-PR-15; add Security Considerations subsection documenting NIP-07 `all_frames: true` injection vector, CSP nonce-based `script-src` mitigation for legacy injection, `world: 'MAIN'` residual, NUB-CLASS-1 `connect-src 'none'` as structural mitigation; cite `NUB-IDENTITY.md` and `NUB-CLASS-1.md` by filename. Update `packages/nub/README.md`, `packages/sdk/README.md`, root `README.md`, and `skills/build-napplet/SKILL.md` for the `identity.decrypt` surface. Run VER-06 grep gate.

## Phase Details

### Phase 135: First-Party Types + SDK Plumbing
**Goal**: The `@napplet/nub/identity` package ships the complete wire + SDK surface for `identity.decrypt` — type additions, shim handler, SDK helper, and central re-exports — so the public amendment PR in Phase 137 can cite a shipped (not hypothetical) first-party surface. Workspace type-check stays green and the identity-types-only tree-shake contract is preserved.
**Depends on**: Nothing (first phase of milestone; v0.28.0 Phase 134 shipped)
**Requirements**: TYPES-01, TYPES-02, TYPES-03, TYPES-04, TYPES-05, TYPES-06, SHIM-01, SHIM-02, SHIM-03, SDK-01, SDK-02, VER-01, VER-05
**Success Criteria** (what must be TRUE):
  1. `import { type IdentityDecryptMessage, type IdentityDecryptResultMessage, type IdentityDecryptErrorMessage, type IdentityDecryptErrorCode, type Rumor } from '@napplet/nub/identity'` resolves; the existing `IdentityMessage` / `IdentityInbound` / `IdentityOutbound` discriminated unions include the 3 new message types, and a `never`-fallback assertion in the shim handler enforces exhaustiveness at compile time.
  2. After `import '@napplet/shim'` (assuming SHIM-03 requires no central-shim edit — verified empirically during the phase), calling `window.napplet.identity.decrypt(event)` returns a `Promise<{ rumor: Rumor, sender: string }>` that resolves on `identity.decrypt.result` envelopes and rejects with a typed `IdentityDecryptError` on `identity.decrypt.error`; pending-request correlation by `id` cleans up on both paths.
  3. `import { identityDecrypt } from '@napplet/sdk'` resolves the bare-name helper wrapping `window.napplet.identity.decrypt` with a `requireNapplet()` guard; `@napplet/sdk` re-exports the 3 new identity types via the 4-surgical-edit pattern (namespace, type re-exports, DOMAIN const unchanged, helper re-export).
  4. `pnpm -r build` and `pnpm -r type-check` exit 0 across all 14 workspace packages (VER-01 shipping gate).
  5. A consumer importing only `@napplet/nub/identity/types` produces a tree-shaken bundle that does NOT pull shim/sdk runtime symbols, and the relay-types-only tree-shake bundle remains ≤ 100 bytes (matching v0.28.0 VER-07 74-byte precedent).
**Plans:** 5/5 plans complete
- [x] 135-01-PLAN.md — Types in @napplet/core + @napplet/nub/identity (TYPES-01..05)
- [x] 135-02-PLAN.md — Shim runtime (decrypt function + handler branch) + central shim mount (SHIM-01..03)
- [x] 135-03-PLAN.md — SDK identityDecrypt helper + central SDK 4-surgical-edits (SDK-01..02)
- [x] 135-04-PLAN.md — Verification: workspace build+type-check + identity-types-only tree-shake (TYPES-06, VER-01, VER-05)
- [x] 135-05-PLAN.md — Gap closure: Rumor re-export from @napplet/nub/identity + never-fallback exhaustiveness in shim handler (TYPES-01, TYPES-03, TYPES-05)

### Phase 136: Empirical CSP Injection-Block Verification
**Goal**: Empirically prove on Chromium that a test napplet served under the NUB-CLASS-1 CSP posture (`connect-src 'none'`; `script-src 'nonce-XXX'`; `report-to` directive) blocks a simulated legacy `<script>`-tag content-script injection AND fires a `securitypolicyviolation` event the shell can receive. Lock the observed-shape of `world: 'MAIN'` extension-API residual honestly (no browser-layer block possible from page side). The empirical result backs DETECT-01..04's spec language in Phase 137's amendment — the PR cites behavior we've actually observed, not assumed.
**Depends on**: Nothing (independent of Phase 135; empirical fixture only)
**Requirements**: DETECT-01, DETECT-02, DETECT-03, DETECT-04, VER-04
**Success Criteria** (what must be TRUE):
  1. A Playwright fixture serves a napplet HTML page under the NUB-CLASS-1 CSP baseline (`default-src 'none'`, `connect-src 'none'`, `script-src 'nonce-XXX' 'self'`, `report-to <shell-owned-endpoint>`) with matching `Report-To` response header; mock-injects a legacy `<script>` tag without the valid nonce; observes Chromium blocking the injection with a CSP-violation console message AND firing a `securitypolicyviolation` event whose `violatedDirective` is `script-src`.
  2. The same fixture records the shape of the violation report that would be POSTed to the `report-to` endpoint (directive, blocked URI, document URL, source file); the observed shape is documented as the input the shell MUST process per DETECT-02, correlating to napplet identity via `(dTag, aggregateHash)` through the napplet HTML URL path.
  3. The `world: 'MAIN'` extension-API residual is documented honestly in the phase artifact: extensions using `chrome.scripting.executeScript({world:'MAIN'})` bypass page CSP entirely → no `securitypolicyviolation` fires → no report to the shell. The structural mitigation is NUB-CLASS-1's `connect-src 'none'` trapping any plaintext inside the frame regardless of how it was obtained.
  4. The phase artifact names the shell's policy latitude explicitly: shell MAY (not MUST) refuse-to-serve subsequent loads of an offending napplet, reject subsequent `identity.decrypt` envelopes from it, or surface the event to the user — spec defines the mechanism, not the response (DETECT-03).
**Plans:** 1/2 plans executed
- [x] 136-01-PLAN.md — Playwright CJS fixture: empirical CSP legacy-injection block + violation-report shape capture (DETECT-01, VER-04)
- [ ] 136-02-PLAN.md — Synthesize 136-PHASE-NOTES.md from Plan 01 evidence + DETECT-02/03/04 documentation gates (DETECT-02, DETECT-03, DETECT-04)

### Phase 137: Public `napplet/nubs` Amendments (NUB-IDENTITY + NUB-CLASS-1 bundled)
**Goal**: A single draft PR on public `napplet/nubs` amends `NUB-IDENTITY.md` with the `identity.decrypt` envelope triad (request + result + error) plus Security Considerations, AND amends `NUB-CLASS-1.md` with the `report-to` SHOULD row and violation-correlation MUST. The PR is opened by the human; this milestone authors the diff. Public-repo hygiene is verified clean: zero `@napplet/*`, zero `kehto`, zero `hyprgate` in diff, commit messages, or PR body. Filename citations (`NUB-CLASS-1.md`) replace abstract phrases (`Class 1`) as primary references per NUB-CLASS §Citation.
**Depends on**: Phase 135 (shipped first-party surface to cite honestly), Phase 136 (empirical `securitypolicyviolation` shape observed on Chromium)
**Requirements**: DEC-01, DEC-02, DEC-03, DEC-04, DEC-05, DEC-06, DEC-07, DEC-08, GATE-01, GATE-02, GATE-03, GATE-04, NUB-IDENTITY-01, NUB-IDENTITY-02, NUB-IDENTITY-03, NUB-IDENTITY-04, NUB-IDENTITY-05, NUB-IDENTITY-06, NUB-IDENTITY-07, CLASS1-01, CLASS1-02, CLASS1-03, VER-02, VER-03
**Success Criteria** (what must be TRUE):
  1. The NUB-IDENTITY amendment draft at `~/Develop/nubs/` contains the `identity.decrypt` / `.result` / `.error` envelope triad with full payload shapes (DEC-01..03), the 8-code `IdentityDecryptErrorCode` vocabulary enumerated with a one-sentence failure-surface description per code (DEC-04, NUB-IDENTITY-03), the shape-auto-detection clause covering NIP-04 / direct NIP-44 / NIP-17 gift-wrap (DEC-05), and the 4 shell MUSTs — class-gating, outer-sig-verify, impersonation-check (seal.pubkey === rumor.pubkey), outer-created_at-hiding (DEC-06..08, GATE-01..03, NUB-IDENTITY-02).
  2. The amendment enforces filename citation discipline: `NUB-CLASS-1.md` appears at least once as a primary reference; prose says "napplets assigned `class: 1`" or "NUB-CLASS-1 napplets"; the abstract phrase "Class 1" does NOT appear as a primary reference (NUB-IDENTITY-04; grep-verifiable per VER-03).
  3. The amendment's Security Considerations subsection names three distinct concerns: (a) the NIP-17/59 gift-wrap flow and the spec MUSTs that prevent impersonation; (b) NIP-07 extension `all_frames: true` content-script injection + the fact that NUB-CLASS-1 strict-CSP nonce-based `script-src` blocks legacy `<script>` injection; (c) the `world: 'MAIN'` extension-API residual with NUB-CLASS-1 `connect-src 'none'` as structural mitigation (NUB-IDENTITY-05).
  4. The NUB-CLASS-1 amendment is bundled into the same PR per CLASS1-03's "bundle if review convenience prevails" clause: a Shell Responsibilities SHOULD row adds `report-to` / `Report-To` alongside the `connect-src 'none'` baseline (CLASS1-01); a MUST row requires the shell to process received violation reports by correlating to napplet identity via `(dTag, aggregateHash)` (CLASS1-02, DETECT-02 reference).
  5. Cross-repo public-hygiene grep is clean across the amendment diff, commit messages, and PR description: zero matches for `@napplet/*`, zero matches for `kehto`, zero matches for `hyprgate` (NUB-IDENTITY-06, VER-02; matches v0.28.0 VER-06 pattern).
  6. The shim-side defense-in-depth behavior is documented in the amendment as OBSERVABILITY not trust boundary: shell still enforces `class-forbidden` authoritatively per GATE-01..03 regardless of whether the shim short-circuits locally (GATE-04).
  7. The PR is branched from the existing `nub-identity` branch as `nub-identity-decrypt` (or similar); per in-repo convention, the user opens the PR — this phase's ship gate is "diff authored and hygiene-clean on branch" (NUB-IDENTITY-07, CLASS1-03).
**Plans**: TBD

### Phase 138: In-Repo NIP-5D Amendment + Docs + Final Verification
**Goal**: Sync local `specs/NIP-5D.md` against `napplet/nubs` master post-PR-15 (`window.nostr` removal merged 2026-04-21), then layer the v0.29.0 NIP-07 Security Considerations subsection referencing the Phase 137 amendment. Update package READMEs + root README + napplet-author skill for the `identity.decrypt` surface. Run the final VER-06 grep gate. Spec branch hygiene observed per `feedback_spec_branch_hygiene`: in-repo `specs/NIP-5D.md` changes land on master (or their own PR) — never bundled into a NUB-WORD branch.
**Depends on**: Phase 135 (SDK surface to document), Phase 137 (amendment drafts to cite by filename)
**Requirements**: NIP5D-01, NIP5D-02, NIP5D-03, NIP5D-04, DOC-01, DOC-02, DOC-03, DOC-04, VER-06
**Success Criteria** (what must be TRUE):
  1. Local `specs/NIP-5D.md` is synced against `napplet/nubs` master post-PR-15: any stale prose about `window.nostr` or napplet-performed encryption that drifted before the 2026-04-21 merge is reconciled before the v0.29.0 amendment layers on top (NIP5D-01).
  2. `specs/NIP-5D.md` Security Considerations gains a NIP-07 subsection naming: the `all_frames: true` content-script injection vector; CSP nonce-based `script-src` as the mitigation for legacy `<script>` injection; the `world: 'MAIN'` extension-API residual documented honestly (no page-side block); NUB-CLASS-1 `connect-src 'none'` as the structural mitigation trapping plaintext inside the frame; `identity.decrypt` on NUB-IDENTITY as the spec-legal receive-side decrypt path for NUB-CLASS-1 napplets (NIP5D-02).
  3. Cross-references cite `NUB-IDENTITY.md` and `NUB-CLASS-1.md` by filename (per NUB-CLASS §Citation); the NIP-5D amendment commit is independent of the Phase 137 cross-repo PR diff (NIP5D-03, NIP5D-04).
  4. `packages/nub/README.md` documents `identity.decrypt()` under the identity NUB section (API shape, class-gating expectation, error handling, NIP-17 auto-detect behavior); `packages/sdk/README.md` adds an `identityDecrypt()` entry alongside existing identity SDK helpers; root `README.md` gains a one-line v0.29.0 changelog bullet; `skills/build-napplet/SKILL.md` is updated with a one-paragraph guidance block: NIP-17 DM / kind-1059 handling uses `window.napplet.identity.decrypt(event)`; requires NUB-CLASS-1; napplets MUST NOT attempt `window.nostr.*` decrypt; shell enforces (DOC-01..04).
  5. VER-06 grep gate: `specs/NIP-5D.md` NIP-07 Security Considerations subsection is present, non-empty, cites both `NUB-IDENTITY.md` and `NUB-CLASS-1.md` by filename, and names the `world: 'MAIN'` residual honestly (grep-verifiable).
**Plans**: TBD

## Progress

**Execution Order:**
Phase 135 and Phase 136 are independent and MAY execute in parallel (Phase 135 ships first-party types/SDK; Phase 136 runs an empirical Playwright fixture — no shared artifact). Phase 137 blocks on BOTH (amendment cites the shipped surface from 135 and the observed CSP-block shape from 136). Phase 138 blocks on 135 (SDK surface to document) and 137 (amendment drafts to cite by filename). All v0.29.0 enforcement invariants (shell-side enforcement, filename citation discipline, public-repo hygiene) are cross-phase invariants and NOT optional per-phase add-ons.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 135. First-Party Types + SDK Plumbing | 5/5 | Complete    | 2026-04-23 |
| 136. Empirical CSP Injection-Block Verification | 1/2 | In Progress|  |
| 137. Public `napplet/nubs` Amendments (NUB-IDENTITY + NUB-CLASS-1 bundled) | 0/TBD | Not started | - |
| 138. In-Repo NIP-5D Amendment + Docs + Final Verification | 0/TBD | Not started | - |
