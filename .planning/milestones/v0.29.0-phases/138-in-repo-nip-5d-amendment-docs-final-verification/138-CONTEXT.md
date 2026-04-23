# Phase 138: In-Repo NIP-5D Amendment + Docs + Final Verification - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Mode:** Auto-generated (mixed spec-authoring + docs sweep + final VER gate — locked decisions in STATE.md + Phase 137 PHASE-NOTES + empirical Phase 136 findings)

<domain>
## Phase Boundary

Sync `specs/NIP-5D.md` against napplet/nubs master post-PR-15 (already done — local is AHEAD of master with full post-PR-15 content + v0.28.0 Browser-Enforced Resource Isolation subsection; NIP5D-01 simplifies to verification-only).

Layer the v0.29.0 NIP-07 Security Considerations subsection onto `specs/NIP-5D.md` documenting: the `all_frames: true` content-script injection vector, CSP nonce-based `script-src` blocking legacy `<script>` injection (empirical Phase 136 evidence), `world: 'MAIN'` extension-API residual, NUB-CLASS-1 `connect-src 'none'` as structural mitigation, `identity.decrypt` on NUB-IDENTITY as the spec-legal receive-side decrypt path for NUB-CLASS-1 napplets.

Update 4 documentation surfaces for the `identity.decrypt` API:
- `packages/nub/README.md` — identity NUB section gains `identity.decrypt()` entry
- `packages/sdk/README.md` — `identityDecrypt()` helper alongside existing identity SDK helpers
- Root `README.md` — one-line v0.29.0 changelog bullet
- `skills/build-napplet/SKILL.md` — one-paragraph guidance on NIP-17 DM handling via `window.napplet.identity.decrypt(event)` + NUB-CLASS-1 gating + `window.nostr.*` prohibition

Run VER-06 grep gate: `specs/NIP-5D.md` NIP-07 Security Considerations subsection present, non-empty, cites both `NUB-IDENTITY.md` and `NUB-CLASS-1.md` by filename, names `world: 'MAIN'` residual honestly.

Phase boundary EXCLUDES:
- Any edits to `~/Develop/nubs` (that was Phase 137; nubs branch already authored and hygiene-clean)
- Any @napplet/ source code changes (all shipped in Phase 135)
- Any new Playwright fixtures (empirical work done in Phase 136)
- Pushing the nubs branch or opening the cross-repo PR (human-gated — separate from Phase 138)

Phase 138 is the milestone's closing phase — after it completes, the milestone is ready for `/gsd:audit-milestone v0.29.0` and `/gsd:complete-milestone`.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — mixed spec-authoring + docs sweep + verification phase with all content decisions locked from STATE.md and prior phases. Guide decisions using:

1. **NIP5D-01 sync** is effectively verification-only — local is AHEAD of napplet/nubs master. Read current `specs/NIP-5D.md` + diff vs `~/Develop/nubs/master:SPEC.md` (the nubs canonical) to confirm local is a strict superset of master's post-PR-15 content. If local is NOT a superset (unlikely given the v0.28.0 amendment shipped already), do the delta backport first before layering v0.29.0 amendment.

2. **NIP5D-02 amendment subsection structure** — layer the new subsection onto the existing `## Security Considerations` section. Follow the v0.28.0 "Browser-Enforced Resource Isolation" subsection pattern already in `specs/NIP-5D.md` (lines 115-130 in the current file). Suggested structure (planner's discretion on exact heading):
   - `### NIP-07 Extension Injection` or similar
   - Paragraph 1: vector — content-scripts with `all_frames: true` inject into every frame; extensions (e.g., NIP-07 signer extensions) inject `window.nostr` into napplet iframes regardless of sandbox
   - Paragraph 2: legacy-injection mitigation — nonce-based `script-src` (inherited from NUB-CLASS-1 / Browser-Enforced Resource Isolation posture) blocks the common `<script>`-tag-via-content-script pattern; Chromium 144+ fires `securitypolicyviolation` with `violatedDirective: script-src-elem` (cite Phase 136 empirical evidence)
   - Paragraph 3: `world: 'MAIN'` residual acknowledged — extensions using `chrome.scripting.executeScript({world:'MAIN'})` bypass page CSP entirely; no `securitypolicyviolation` fires; no page-side mechanism exists to block
   - Paragraph 4: structural mitigation — NUB-CLASS-1's `connect-src 'none'` traps plaintext inside the frame regardless of how `window.nostr` was obtained; `identity.decrypt` on NUB-IDENTITY is the spec-legal receive-side decrypt path for NUB-CLASS-1 napplets (cite `NUB-IDENTITY.md` and `NUB-CLASS-1.md` by filename per NUB-CLASS §Citation)

3. **Documentation sweeps (DOC-01..04)** are mechanical additions mirroring patterns established by v0.24.0 (NUB-IDENTITY origin) and v0.28.0 (resource API). Each surface gets a short addition — do NOT rewrite existing content. Pattern reuse:
   - `packages/nub/README.md` identity section: add `identity.decrypt()` method entry alongside existing `identity.getPublicKey()` etc. Include: signature, class-gating note, error handling, NIP-17 auto-detect behavior (one sentence each)
   - `packages/sdk/README.md`: one-line entry for `identityDecrypt()` bare-name helper in the identity section
   - Root `README.md`: one bullet in changelog — `v0.29.0: identity.decrypt(event) on NUB-IDENTITY — NIP-17/44/04 auto-detect decrypt gated to NUB-CLASS-1 napplets. See NUB-IDENTITY.md amendment.`
   - `skills/build-napplet/SKILL.md`: one-paragraph block in appropriate section (likely near top, alongside existing identity guidance):
     > **NIP-17 DM / kind-1059 handling.** Napplets receive kind-1059 gift-wrap events via `window.napplet.relay.subscribe`. To decrypt to plaintext, call `await window.napplet.identity.decrypt(event)` — returns `{ rumor, sender }` where `sender` is shell-authenticated. Available ONLY to napplets assigned `class: 1` per `NUB-CLASS-1.md` (strict baseline posture, `connect-src 'none'`). Napplets MUST NOT call `window.nostr.*` for decrypt — even if a NIP-07 browser extension injects `window.nostr` into the iframe, that path is forbidden; the shell enforces via `class-forbidden` error for non-NUB-CLASS-1 napplets.

4. **VER-06 grep gate** — mirror v0.28.0 VER-02/VER-03 methodology: grep `specs/NIP-5D.md` for the required literals, fail if any missing. Required literals:
   - `all_frames` (the injection vector name)
   - `script-src-elem` (empirical Chromium 144+ directive variant) OR `script-src` (the base directive)
   - `world: 'MAIN'` (the residual name)
   - `connect-src 'none'` (the structural mitigation)
   - `NUB-IDENTITY.md` (filename citation)
   - `NUB-CLASS-1.md` (filename citation)
   Evidence to `/tmp/napplet-138-ver-06.log` with `VER06_EXIT=0`.

### Locked decisions (apply without rediscussion)

- **Spec branch hygiene (`feedback_spec_branch_hygiene`):** `specs/NIP-5D.md` amendment commit lands on master (or its own PR) — never bundled into a NUB-WORD branch on the other repo. In-repo file is a reference copy; changes here are independent of the Phase 137 cross-repo amendment PR.
- **Filename citation discipline:** NUB-IDENTITY.md and NUB-CLASS-1.md cited by filename; abstract phrase "Class 1" MUST NOT appear as a primary reference.
- **Cite Phase 136 empirical findings:** Chromium 144+ `violatedDirective: script-src-elem` observation is the empirical basis for paragraph 2 of the NIP-07 subsection. Cite the fact; do NOT re-run the test in this phase.
- **Cite Phase 137 amendment cross-reference:** The NIP-5D amendment points to `NUB-IDENTITY.md` and `NUB-CLASS-1.md` for the MUSTs and policy-latitude. NIP-5D is transport+security-considerations-at-the-protocol-level; detailed conformance is in the NUBs.
- **No shell-side implementation language:** NIP-5D documents the MECHANISM (CSP, sandbox, NUB pointers); shell UX and response policy are shell concerns (matches NUB scope boundary rule).
- **Milestone-close discipline:** Phase 138 completion = milestone ready for audit. Do NOT run `/gsd:audit-milestone` or `/gsd:complete-milestone` from within Phase 138 — those are autonomous-workflow lifecycle steps after phase completion.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `specs/NIP-5D.md` current state — 135 lines post-v0.28.0; `## Security Considerations` section at line 100+ with v0.28.0 `### Browser-Enforced Resource Isolation` subsection at lines 115-130. Existing subsection pattern to mirror.
- `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md` — Phase 136 empirical findings (93 lines) to cite verbatim in paragraph 2 of the NIP-07 subsection.
- `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-PHASE-NOTES.md` — Phase 137 handoff (132 lines) naming the NUB-IDENTITY.md + NUB-CLASS-1.md amendments that Phase 138 cites.
- `packages/nub/README.md` — existing identity section pattern to extend with `identity.decrypt()` entry.
- `packages/sdk/README.md` — existing identity helper section pattern.
- `skills/build-napplet/SKILL.md` — napplet-author guidance file; the one-paragraph NIP-17 block lands here.
- v0.24.0 identity NUB docs + v0.28.0 resource NUB docs — precedent patterns for API surface descriptions.

### Established Patterns

- v0.28.0 Phase 133 docs-sweep pattern: per-task atomic commits, automated grep verification after each edit, workspace `pnpm -r type-check` as load-bearing acceptance gate. For Phase 138 docs surfaces are READMEs + a skill — type-check gate is less relevant but still a sensible final check (no type-breaking changes).
- Verification-phase-at-end-of-milestone pattern (v0.28.0 Phase 134): final VER gate(s) with evidence logs in `/tmp`, grep-verifiable.
- Security Considerations subsection additions: mirror structure of existing subsections (v0.28.0 added `Browser-Enforced Resource Isolation`; v0.29.0 adds `NIP-07 Extension Injection` or similar).

### Integration Points

- **Reads:**
  - Current `specs/NIP-5D.md` (verify superset of nubs master SPEC.md — diff check)
  - `.planning/phases/136-*/136-PHASE-NOTES.md` (Phase 136 empirical findings)
  - `.planning/phases/137-*/137-PHASE-NOTES.md` (Phase 137 amendment summary)
  - Existing `packages/nub/README.md`, `packages/sdk/README.md`, root `README.md`, `skills/build-napplet/SKILL.md` — for integration-point placement

- **Writes:**
  - `specs/NIP-5D.md` (amendment subsection added to `## Security Considerations`)
  - `packages/nub/README.md` (identity section gains `identity.decrypt()` entry)
  - `packages/sdk/README.md` (identity helper entry for `identityDecrypt()`)
  - Root `README.md` (changelog bullet)
  - `skills/build-napplet/SKILL.md` (one-paragraph NIP-17 guidance)
  - `/tmp/napplet-138-ver-06.log` (grep-verifiable amendment-presence evidence)

- **No changes:**
  - `packages/*/src/*` (all shipped in Phase 135)
  - `~/Develop/nubs/*` (Phase 137 territory)
  - Any first-party TypeScript

</code_context>

<specifics>
## Specific Ideas

Phase 138 final deliverable is the milestone-close marker: after this phase verifies, v0.29.0 is ready for audit. The work is:

1. **NIP5D-01 no-op / verify local is AHEAD of nubs master** — a simple diff check; doc-it-and-move-on.
2. **NIP5D-02 / NIP5D-03 authoring** — new Security Considerations subsection with 4 paragraphs + 2 filename citations.
3. **DOC-01..04 sweeps** — 4 files, each a small addition.
4. **VER-06 final grep gate** — confirms Phase 138 authored the subsection correctly; also serves as the Phase 138 shipping gate.

Suggested plan count: 2-3 plans. Shape options:
- **Option A (2 plans):** Plan 01 = NIP-5D sync + amendment + VER-06; Plan 02 = 4 docs surfaces. Clean separation.
- **Option B (3 plans):** Plan 01 = NIP-5D sync + amendment; Plan 02 = 4 docs surfaces; Plan 03 = final VER-06 gate. Matches v0.28.0 Phase 133 + 134 split pattern.

Planner's call. Neither is wrong.

## What the amendment says (concrete)

Suggested subsection heading: `### NIP-07 Extension Injection Residual` (parallels v0.28.0's `### Browser-Enforced Resource Isolation`).

Suggested 4-paragraph body (planner refines prose; substance locked):

**Paragraph 1 (vector):** Extensions implementing NIP-07 commonly install content scripts with `all_frames: true`, causing the browser to inject the extension's page-world `<script>` into every frame — including sandboxed napplet iframes. A common installation pattern is `document.createElement('script'); s.textContent = '…'; head.appendChild(s)`. When this script executes successfully, `window.nostr` becomes defined inside the napplet and the napplet could, in principle, call `window.nostr.nip44.decrypt` directly — bypassing the shell-mediated surface this NIP requires for signing and encryption.

**Paragraph 2 (legacy-injection mitigation):** Shells advertising `perm:strict-csp` (see `### Browser-Enforced Resource Isolation` above) serve napplet HTML under a CSP whose `script-src` directive requires a per-load nonce. The extension-injected `<script>` tag has no nonce, so browsers reject execution and fire a `securitypolicyviolation` event (observed on Chromium 144+ as `violatedDirective: script-src-elem`; older Chromium and other browsers emit the parent `script-src`). The shell MAY observe these violations via `report-to` and correlate to napplet identity per the rules in `NUB-CLASS-1.md`.

**Paragraph 3 (world: 'MAIN' residual):** Extensions using the `chrome.scripting.executeScript({world: 'MAIN'})` API bypass page CSP entirely per the WebExtension specification. No `securitypolicyviolation` fires; no page-side detection mechanism exists. As of 2026 no known NIP-07 extension ships this injection style, but the architecture cannot prevent future migration.

**Paragraph 4 (structural mitigation + spec-legal alternative):** The `connect-src 'none'` directive in the NUB-CLASS-1 baseline ensures that any plaintext a napplet obtains — whether via the legitimate `identity.decrypt(event)` path or via an injected `window.nostr` — is trapped inside the frame: the napplet has no direct network egress. Exfiltration requires calling a shell-mediated NUB (the shell observes), or escaping the frame (the browser sandbox forbids). Napplets that need to decrypt NIP-17 / NIP-44 / NIP-04 events MUST call `identity.decrypt` on NUB-IDENTITY (see `NUB-IDENTITY.md`); shells MUST gate this to napplets assigned `class: 1` per `NUB-CLASS-1.md`.

</specifics>

<deferred>
## Deferred Ideas

None — final phase of v0.29.0 milestone.

Reminder for planner: after Phase 138 completes, the autonomous workflow runs `/gsd:audit-milestone v0.29.0` + `/gsd:complete-milestone v0.29.0` + `/gsd:cleanup`. Phase 138 itself does NOT run any of those — that's lifecycle, not phase work. Phase 138 completes when NIP-5D amendment is authored, 4 docs surfaces updated, and VER-06 gate green.

</deferred>
