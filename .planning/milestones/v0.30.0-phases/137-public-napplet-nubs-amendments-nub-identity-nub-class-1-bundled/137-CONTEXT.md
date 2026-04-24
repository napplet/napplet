# Phase 137: Public `napplet/nubs` Amendments (NUB-IDENTITY + NUB-CLASS-1 bundled) - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Mode:** Auto-generated (spec-authoring phase — pattern locked by v0.28.0 Phase 132 cross-repo PR drafts; locked decisions in STATE.md propagate without rediscussion)

<domain>
## Phase Boundary

Draft a single PR on the public `napplet/nubs` repo (~/Develop/nubs) amending **NUB-IDENTITY.md** with the `identity.decrypt` envelope triad + Security Considerations, AND amending **NUB-CLASS-1.md** with a `report-to` SHOULD row + violation-correlation MUST. Public-repo hygiene verified clean: zero `@napplet/*`, zero `kehto`, zero `hyprgate` in diff, commit messages, or PR body. Filename citations (`NUB-CLASS-1.md`) replace abstract phrases (`Class 1`) as primary references per NUB-CLASS §Citation discipline. The PR is opened by the human; this phase ships "diff authored and hygiene-clean on a local branch".

Phase boundary excludes:
- Any changes to the @napplet/ source tree (types, shim, SDK all shipped in Phase 135)
- NIP-5D in-repo amendment in `specs/NIP-5D.md` (Phase 138 territory)
- Package READMEs / root README / skill updates (Phase 138 territory)
- Any shell-side implementation (downstream shell repo)
- `relay.publishEncrypted` rewording per PR #15's deferred debt (separate milestone)

Branch strategy: create a new branch `nub-identity-decrypt` (or similar) on `~/Develop/nubs` based from existing `nub-identity` branch. Commits to that branch but do NOT push and do NOT open the PR — human opens the PR as the gated shared-state action per `feedback_no_private_refs_commits`.

</domain>

<decisions>
## Implementation Decisions

### Locked from STATE.md / REQUIREMENTS.md (apply without rediscussion)

1. **Home:** NUB-IDENTITY.md and NUB-CLASS-1.md on `~/Develop/nubs` public repo — NOT @napplet/ first-party.
2. **Bundle strategy:** CLASS1-03 says "MAY be merged into NUB-IDENTITY amendment PR if review convenience prevails OR opened as its own PR" — **bundle into one PR**. Two adjacent amendments, same milestone, same security surface. One PR is lower review overhead.
3. **Filename citation discipline (NUB-CLASS §Citation):** MUST cite class documents by file name (`NUB-CLASS-1.md`) in prose. The abstract phrase "Class 1" MUST NOT appear as a primary reference anywhere in either amendment's body. Prose says "napplets assigned `class: 1`" or "NUB-CLASS-1 napplets".
4. **Return shape (DEC-02):** `{ rumor: Rumor, sender: string }` where `Rumor = UnsignedEvent & { id: string }`; `sender` is shell-authenticated from seal signature, never napplet-derived from `rumor.pubkey`.
5. **IdentityDecryptErrorCode vocabulary (DEC-04):** 8 codes in the amendment, one sentence per code naming the failure surface:
   - `class-forbidden` — napplet is not assigned class: 1 (NUB-CLASS-1); identity.decrypt unavailable
   - `signer-denied` — user explicitly denied the signer prompt
   - `signer-unavailable` — no signer is configured or reachable
   - `decrypt-failed` — crypto operation failed (bad ciphertext, wrong recipient, etc.)
   - `malformed-wrap` — outer wrap event missing fields / bad signature / invalid structure
   - `impersonation` — NIP-17 seal.pubkey does not match rumor.pubkey (attacker-controlled rumor)
   - `unsupported-encryption` — event shape does not match any supported encryption (NIP-04 / direct NIP-44 / NIP-17)
   - `policy-denied` — shell policy refuses the decrypt request (rate limit, deny-list, etc.)
6. **Shell MUSTs (4):**
   - **GATE-01 class gating:** Shell MUST reject `identity.decrypt` from any napplet not assigned `class: 1` with `class-forbidden` error. Cites NUB-CLASS-1.md by filename.
   - **DEC-08 outer-sig-verify:** Shell MUST verify outer wrap event signature before attempting seal decrypt; bad sig returns `malformed-wrap`.
   - **DEC-07 impersonation-check:** Shell MUST verify `seal.pubkey === rumor.pubkey` for NIP-17 flows before delivering rumor; mismatch returns `impersonation`.
   - **DEC-06 outer-created_at-hiding:** Shell MUST NOT surface outer `created_at` on the result envelope (NIP-59 intentional ±2-day randomization — privacy floor preserved). Rumor carries its own real `created_at`.
7. **Security Considerations names 3 concerns (NUB-IDENTITY-05):**
   (a) NIP-17/59 gift-wrap flow + the spec MUSTs that prevent impersonation (points 6.1–6.4 above);
   (b) NIP-07 extension `all_frames: true` content-script injection + the fact that NUB-CLASS-1 strict-CSP nonce-based `script-src` blocks legacy `<script>` injection (cite 136-PHASE-NOTES.md empirical evidence: Chromium 144+ fires `securitypolicyviolation` with `violatedDirective: 'script-src-elem'` — document BOTH sub-directive variants `script-src` and `script-src-elem`);
   (c) the `world: 'MAIN'` extension-API residual with NUB-CLASS-1 `connect-src 'none'` as structural mitigation trapping plaintext inside the frame regardless of how it was obtained.
8. **NUB-CLASS-1 amendment content (CLASS1-01/02):**
   - Shell Responsibilities gains SHOULD row: shells SHOULD emit `report-to` / `Report-To` pointing at a shell-owned reporting endpoint alongside the `connect-src 'none'` baseline (SHOULD, not MUST, to avoid imposing reporting infrastructure on minimalist shells).
   - Shell Responsibilities gains MUST row: shell MUST process received CSP violation reports by correlating to napplet identity via `(dTag, aggregateHash)` through the napplet HTML URL path (cite 136-PHASE-NOTES.md for observed 4-field shape).
9. **Shim-side GATE-04 documentation:** Mention in NUB-IDENTITY Security Considerations that the shim-side observability helper (`class !== 1` short-circuit) is OBSERVABILITY and defense-in-depth ONLY — shell enforcement is authoritative. Napplets are untrusted; shim code is part of the untrusted surface.
10. **Cross-repo public-hygiene (NUB-IDENTITY-06, VER-02):** zero `@napplet/*`, zero `kehto`, zero `hyprgate` across diff, commit messages, PR body. Grep-verifiable gate.
11. **PR opening (NUB-IDENTITY-07, CLASS1-03):** Phase ships diff authored and hygiene-clean on the local branch. Human opens the PR per the in-repo convention. Do NOT push without user direction; do NOT open PR.

### Claude's Discretion (spec-authoring craft)

All prose-style choices are at Claude's discretion within the locked constraints:
- Section heading names and ordering within each amendment
- Conformance table granularity (per-envelope vs per-MUST vs combined)
- Error-code presentation style (table vs bulleted list — precedent: v0.25.0 NUB-CONFIG used a table, v0.28.0 NUB-RESOURCE used a table; favor table for readability)
- Example envelopes / JSON snippets inline vs separate section
- Cross-reference style (inline citations in each MUST row vs a dedicated "References" section at the end vs both)
- Commit granularity on `~/Develop/nubs` (one big commit per amendment file OR per-section commits)
- Branch name — suggested `nub-identity-decrypt` based off `nub-identity`; final name planner's call

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets (for spec-authoring pattern reuse)

- `~/Develop/nubs/NUB-IDENTITY.md` on `nub-identity` branch — 212 lines; existing NUB-IDENTITY structure to extend. Current structure includes: setext header, Description, API Surface, Wire Protocol, Shell Guarantees, Security Considerations, Capability Advertisement, References.
- `~/Develop/nubs/NUB-CLASS-1.md` on `nub-class-1` branch — 60 lines; already defines Description + CSP Posture + Manifest Prerequisites + Shell Responsibilities + Security Considerations + References. The amendment ADDS rows to Shell Responsibilities (SHOULD `report-to` + MUST violation-correlation).
- v0.28.0 Phase 132 `.planning/phases/132-cross-repo-nubs-prs/` — the reference pattern: 4 draft amendments authored as local artifacts at `.planning/phases/132-cross-repo-nubs-prs/drafts/` before the user opened the PRs. v0.29.0 Phase 137 should use the same pattern — produce the amendment text locally in the phase directory (e.g., `137-NUB-IDENTITY-AMENDMENT.md` and `137-NUB-CLASS-1-AMENDMENT.md`) AND/OR directly on a local branch of `~/Develop/nubs` as commits. Planner picks.
- v0.28.0 NUB-RESOURCE.md spec (MERGED) — 300 lines with 4 schemes, 8-code error vocabulary, 4 MUSTs on schemes, SVG sandboxed-Worker-no-network MUST. Pattern for 8-code error tables + MUST row structure.
- v0.25.0 NUB-CONFIG.md (MERGED) — 9-code error vocabulary presentation precedent.
- `136-PHASE-NOTES.md` at `.planning/phases/136-empirical-csp-injection-block-verification/` — empirical evidence for the NIP-07 injection + `world: 'MAIN'` residual language. **Cite verbatim.**

### Established Patterns

- Conformance table: MUST/SHOULD/MAY rows with one-liner descriptions. v0.28.0 NUB-RESOURCE.md and v0.25.0 NUB-CONFIG.md are the two best precedents to read.
- Error-code table: one row per code, 1-sentence failure-surface description per code. 8 codes from DEC-04 go here.
- Security Considerations subsection: one paragraph per named concern, grouped under a single `## Security Considerations` section or split into 3 `### Subsection`s. Precedent: v0.28.0 NUB-RESOURCE.md used 3 subsections.
- Filename citations: inline when naming the class ("napplets assigned `class: 1` per `NUB-CLASS-1.md`"), NOT "Class 1 napplets" anywhere as primary reference.
- Example envelopes: JSON code blocks inline after the relevant section paragraph.
- Cross-repo commit prefix: `nub-identity:` or `nub-class-1:` depending on file touched; follow existing nubs repo convention (check `git log --oneline master..nub-identity` for pattern).

### Integration Points

- **Reads:**
  - `~/Develop/nubs/NUB-IDENTITY.md` on `nub-identity` branch
  - `~/Develop/nubs/NUB-CLASS-1.md` on `nub-class-1` branch (or master if already merged — check)
  - `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md` (cite for NIP-07 empirical language)
  - `.planning/REQUIREMENTS.md` (for DEC-01..08 / GATE-01..04 / NUB-IDENTITY-01..07 / CLASS1-01..03 / VER-02 / VER-03 requirement text)
  - v0.28.0 NUB-RESOURCE.md (pattern reference — already merged on master)

- **Writes:**
  - `~/Develop/nubs/NUB-IDENTITY.md` on new branch `nub-identity-decrypt` (or similar)
  - `~/Develop/nubs/NUB-CLASS-1.md` on same new branch
  - `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-NUB-IDENTITY-AMENDMENT.md` — local draft artifact (copy of the cross-repo diff for audit)
  - `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-NUB-CLASS-1-AMENDMENT.md` — local draft artifact
  - `/tmp/napplet-137-hygiene-grep.log` — zero-grep evidence for `@napplet/*` / `kehto` / `hyprgate` across diff + commits + PR body preview

- **No changes:**
  - @napplet/ first-party source (types, shim, SDK) — all shipped in Phase 135
  - `specs/NIP-5D.md` — Phase 138 territory
  - Any package README / root README — Phase 138 territory

### Branch discovery

Check `git log --oneline nub-class-1` and `git branch -a | grep class` to see if NUB-CLASS-1 is already on master or still on draft branch. If draft, the amendment branch bases off `nub-class-1` for that file and `nub-identity` for the other — probably requires a branch that merges both, or two PRs. This is a craft decision for the planner.

</code_context>

<specifics>
## Specific Ideas

The amendment is the deliverable. Two grep-verifiable literal strings must appear at specific locations:

- `NUB-IDENTITY.md` (after amendment) — new MUST row: "Shell MUST reject `identity.decrypt` from napplets not assigned `class: 1` with `class-forbidden` error. See `NUB-CLASS-1.md`." — grep target: `NUB-CLASS-1.md` present; `Class 1` absent as primary reference.
- `NUB-IDENTITY.md` Security Considerations: MUST cite the 3 concerns (NIP-17 impersonation MUSTs, NIP-07 `all_frames: true` legacy injection + nonce-based `script-src` mitigation, `world: 'MAIN'` residual + `connect-src 'none'` structural mitigation). Grep targets: `world: 'MAIN'`, `all_frames`, `connect-src 'none'`, `script-src-elem` (or `script-src` with Chromium-variant mention).
- `NUB-CLASS-1.md` Shell Responsibilities: new SHOULD `report-to` row + new MUST `violation correlation (dTag, aggregateHash)` row. Grep targets: `report-to`, `(dTag, aggregateHash)`.

Example envelope triad to include in the amendment (one each for request/result/error):

```json
// request
{ "type": "identity.decrypt", "id": "<uuid>", "event": { /* NostrEvent */ } }

// result
{ "type": "identity.decrypt.result", "id": "<same uuid>", "rumor": { /* Rumor — UnsignedEvent & { id } */ }, "sender": "<hex pubkey, shell-authenticated>" }

// error
{ "type": "identity.decrypt.error", "id": "<same uuid>", "error": "class-forbidden" | "signer-denied" | "signer-unavailable" | "decrypt-failed" | "malformed-wrap" | "impersonation" | "unsupported-encryption" | "policy-denied", "message": "<optional human-readable detail>" }
```

</specifics>

<deferred>
## Deferred Ideas

None that affect this phase's scope.

Reminder for planner: NIP-5D in-repo amendment (Phase 138's NIP5D-02), package README updates (Phase 138's DOC-01..04), and `specs/NIP-5D.md` sync against nubs master post-PR-15 (Phase 138's NIP5D-01) are ALL Phase 138 territory. This phase touches only `~/Develop/nubs` + local draft artifacts.

If planner finds itself tempted to author `specs/NIP-5D.md` prose or package READMEs, STOP — wrong phase.

</deferred>
