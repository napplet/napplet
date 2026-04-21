---
phase: 132-cross-repo-nubs-prs
verified: 2026-04-20T21:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 132: Cross-Repo Nubs PRs — Verification Report

**Phase Goal:** Four draft PRs are open against `napplet/nubs` capturing the protocol-level surface for v0.28.0 — NUB-RESOURCE as a new spec, NUB-RELAY sidecar amendment with default-OFF privacy, NUB-IDENTITY and NUB-MEDIA clarifications routing picture / artwork URLs through the resource NUB. Every PR is `@napplet/*`-clean.
**Scope note:** Per CONTEXT.md, "PRs" are local draft files at `.planning/phases/132-cross-repo-nubs-prs/drafts/`. Actual git ops on `~/Develop/nubs` are deferred to a manual step.
**Verified:** 2026-04-20T21:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | NUB-RESOURCE.md draft exists with message catalog, 4 scheme protocol surfaces, 8-code error vocabulary, MUST/SHOULD/MAY shell behavior contract | VERIFIED | File exists at 300 lines; 4 envelopes in Wire Protocol table; 8 error codes in Error Codes table; MUST/SHOULD/MAY tables in Shell Guarantees section |
| 2 | Default shell resource policy locked: private-IP block list MUST at DNS-resolution time covering all required ranges; size cap, timeout, rate limit, redirect chain cap as SHOULD; MIME byte-sniffing MUST with explicit ban on upstream Content-Type passthrough | VERIFIED | Lines 129-163 cover all 6 IP range categories (10/8, 172.16/12, 192.168/16, 127/8, ::1, 169.254/16, fe80::/10, fc00::/7, 169.254.169.254) with MUST at DNS-resolution time; MIME byte-sniffing MUST at line 145; Content-Type passthrough explicitly banned; all 4 SHOULDs present |
| 3 | SVG handling locked: shell-side rasterization MUST, prohibition on delivering image/svg+xml MUST, rasterization caps SHOULD with sandboxed-Worker-no-network requirement | VERIFIED | Line 171: "Shells MUST NOT deliver raw `image/svg+xml` bytes to napplets"; line 177: "Rasterizers MUST run in a **sandboxed Worker** with **no network** access"; caps table at lines 181-185 (5 MiB / 4096x4096 / 2s) |
| 4 | NUB-RELAY-AMENDMENT.md draft exists with sidecar field as OPTIONAL, default OFF, privacy rationale, opt-in per shell + per-event-kind allowlist | VERIFIED | File exists at 135 lines; line 14: "OPTIONAL with **default OFF**"; line 99: "Conformant shells MUST default sidecar pre-resolution to OFF"; 4 enumerated privacy harms at lines 103-106; per-event-kind allowlist guidance at lines 110-116 |
| 5 | NUB-IDENTITY-AMENDMENT.md and NUB-MEDIA-AMENDMENT.md exist (no wire change; doc clarifications routing picture/banner/artwork URLs through resource.bytes()) | VERIFIED | NUB-IDENTITY-AMENDMENT.md: 41 lines; Wire change: none; picture/banner -> resource.bytes() stated explicitly. NUB-MEDIA-AMENDMENT.md: 40 lines; Wire change: none; artwork.url -> resource.bytes() stated explicitly |
| 6 | All 4 drafts zero-grep clean of @napplet/* private package references | VERIFIED | grep -c '@napplet/' returns 0 across all 4 files; kehto: 0; hyprgate: 0; packages/(nub\|shim\|sdk\|vite-plugin): 0 |

**Score:** 6/6 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md` | New spec, ~300 lines | VERIFIED | Exists, 300 lines, substantive (complete spec with all required sections) |
| `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RELAY-AMENDMENT.md` | Sidecar amendment, ~135 lines | VERIFIED | Exists, 135 lines, substantive |
| `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-IDENTITY-AMENDMENT.md` | Doc clarification, ~41 lines | VERIFIED | Exists, 41 lines, substantive |
| `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-MEDIA-AMENDMENT.md` | Doc clarification, ~40 lines | VERIFIED | Exists, 40 lines, substantive |

---

## Key Link Verification

These are spec drafts, not source code. Wiring verification applies to cross-references between drafts rather than import/usage chains.

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| NUB-RELAY-AMENDMENT.md | NUB-RESOURCE | ResourceSidecarEntry type import + sidecar-not-a-bypass statement | VERIFIED | Line 36: shape owned by NUB-RESOURCE; line 127: "sidecar is not a bypass" for any safety MUST |
| NUB-IDENTITY-AMENDMENT.md | NUB-RESOURCE | resource.bytes() call reference | VERIFIED | Line 29: explicit `window.napplet.resource.bytes(url)` reference with NUB-RESOURCE named |
| NUB-MEDIA-AMENDMENT.md | NUB-RESOURCE | resource.bytes() call reference | VERIFIED | Line 28: explicit `window.napplet.resource.bytes(url)` reference with NUB-RESOURCE named |
| NUB-RESOURCE.md | NUB-RELAY/IDENTITY/MEDIA | Coexistence section | VERIFIED | Lines 251-257: explicit cross-references to all 3 companion drafts |

---

## Data-Flow Trace (Level 4)

Not applicable. This phase produces specification markdown files (not runnable code with dynamic data). No component renders data from a store or API.

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable entry points. Phase artifacts are markdown draft files, not executable code.

---

## Requirements Coverage

| REQ-ID | Description | Status | Evidence |
|--------|-------------|--------|----------|
| SPEC-02 | NUB-RESOURCE spec drafted | SATISFIED | NUB-RESOURCE.md exists at 300 lines with complete spec |
| SPEC-03 | NUB-RELAY amendment drafted | SATISFIED | NUB-RELAY-AMENDMENT.md exists at 135 lines |
| SPEC-04 | NUB-IDENTITY amendment drafted | SATISFIED | NUB-IDENTITY-AMENDMENT.md exists at 41 lines |
| SPEC-05 | NUB-MEDIA amendment drafted | SATISFIED | NUB-MEDIA-AMENDMENT.md exists at 40 lines |
| SPEC-06 | All drafts zero @napplet/* | SATISFIED | grep -c '@napplet/' returns 0 across all 4 files |
| SCH-02 | https: scheme with full Default Resource Policy | SATISFIED | Lines 105-109 of NUB-RESOURCE.md |
| SCH-03 | blossom: scheme with sha256 hash form and hash verification | SATISFIED | Lines 111-115 of NUB-RESOURCE.md |
| SCH-04 | nostr: scheme with NIP-19 bech32 + single-hop semantics | SATISFIED | Lines 117-123 of NUB-RESOURCE.md |
| POL-01 | Private-IP block list MUST at DNS-resolution time | SATISFIED | Lines 129-143 of NUB-RESOURCE.md; all 6 IP range categories present |
| POL-02 | Response size cap SHOULD (~10 MiB) | SATISFIED | Line 149-151 of NUB-RESOURCE.md |
| POL-03 | Fetch timeout SHOULD (~30s) | SATISFIED | Lines 153-155 of NUB-RESOURCE.md |
| POL-04 | Per-napplet concurrency + rate limit SHOULD | SATISFIED | Lines 157-159 of NUB-RESOURCE.md |
| POL-05 | MIME byte-sniffing MUST, no upstream Content-Type passthrough | SATISFIED | Lines 145-147 of NUB-RESOURCE.md |
| POL-06 | Redirect chain cap SHOULD (≤5 hops, per-hop re-validation) | SATISFIED | Lines 161-163 of NUB-RESOURCE.md |
| SVG-01 | Shell-side rasterization MUST | SATISFIED | Lines 169-173 of NUB-RESOURCE.md |
| SVG-02 | Prohibition on delivering image/svg+xml MUST | SATISFIED | Line 171: "Shells MUST NOT deliver raw `image/svg+xml` bytes to napplets" |
| SVG-03 | sandboxed Worker with no network MUST; rasterization caps SHOULD | SATISFIED | Lines 175-187 of NUB-RESOURCE.md |
| SIDE-05 | Sidecar default OFF MUST + 4 enumerated privacy harms + per-event-kind allowlist | SATISFIED | Lines 95-123 of NUB-RELAY-AMENDMENT.md |

**All 18 REQ-IDs: SATISFIED**

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | — |

No TODO, FIXME, placeholder, or stub patterns found across any of the 4 draft files. All `Implementations` footers correctly read `- (none yet)` per the public-repo hygiene rule (no `@napplet/*` package listed).

---

## Human Verification Required

### 1. Spec prose quality and public-repo readiness

**Test:** Copy NUB-RESOURCE.md into the `napplet/nubs` repo and open a draft PR. Review for prose clarity, heading hierarchy match to existing NUBs (NUB-CONFIG.md structural mirror), and NUB maintainer acceptance criteria.
**Expected:** Spec reads as a natural addition to the nubs repo; reviewers find no structural or naming inconsistencies.
**Why human:** Prose quality, stylistic consistency with existing NUB specs, and PR reviewer acceptance cannot be verified programmatically.

### 2. Per-event-kind allowlist scope review

**Test:** Review the recommended allowlist in NUB-RELAY-AMENDMENT.md (kind 0 / 31337 / 31938 pre-fetch; kind 1 / 4 / 1059 excluded).
**Expected:** Reviewers confirm the named kinds align with the v0.28.0 milestone policy intent and no additional kinds require inclusion or exclusion.
**Why human:** Policy intent alignment requires domain knowledge and stakeholder agreement, not code analysis.

### 3. Cross-repo git ops (manual follow-up)

**Test:** Execute the deferred manual steps: create branches on `~/Develop/nubs`, copy draft content, open 4 PRs, update README.md registry table.
**Expected:** 4 PRs open at `napplet/nubs` using the draft files as content; PRs have no `@napplet/*` / `kehto` / `hyprgate` in commit messages or PR bodies; README registry table includes NUB-RESOURCE row.
**Why human:** Cross-repo git operations are explicitly deferred per CONTEXT.md scope decision; autonomous workflow is bounded to this repo.

---

## Gaps Summary

No gaps found. All 6 observable truths verified, all 4 artifacts exist and are substantive, all cross-draft links are wired, all 18 REQ-IDs are satisfied, and the hygiene gate passes with zero private-ref matches across all files.

The three human verification items above are known follow-up actions documented in the SUMMARY.md (deferred manual cross-repo git ops) and quality-assurance items (prose review) — none block the phase goal as scoped by CONTEXT.md.

---

_Verified: 2026-04-20T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
