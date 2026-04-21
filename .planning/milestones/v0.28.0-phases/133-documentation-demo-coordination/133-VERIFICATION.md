---
phase: 133-documentation-demo-coordination
verified: 2026-04-20T21:30:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 133: Documentation + Demo Coordination Verification Report

**Phase Goal:** Five package READMEs, the napplet-author skill, the root README, and a shell-deployer resource policy checklist all reflect the v0.28.0 surface; demo napplets are explicitly delegated to the downstream shell repo via a coordination note.
**Verified:** 2026-04-20T21:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Developer landing on packages/nub/README.md sees /resource subpath with four-scheme overview and bytes(url)→Blob primitive | VERIFIED | Line 81: domain table row with `@napplet/nub/resource`, "Sandboxed byte fetching (https/blossom/nostr/data)"; lines 111-160: full Resource NUB section with all 4 schemes, typed error codes, bytes/bytesAsObjectURL examples |
| 2  | Developer landing on packages/shim/README.md sees window.napplet.resource in API shape table and wire format section with bytes() and bytesAsObjectURL() signatures | VERIFIED | Line 301: shape block with `bytesAsObjectURL(url): { url: string; revoke: () => void }`; line 401: `### window.napplet.resource` subsection; lines 176/227-228: wire-format table rows for resource.bytes/resource.cancel/resource.bytes.result/resource.bytes.error |
| 3  | Developer landing on packages/sdk/README.md sees resource named export with RESOURCE_DOMAIN const and resource type re-exports alongside other 9 NUB domains | VERIFIED | Line 340: RESOURCE_DOMAIN in 10-constant import; line 212: `### resource` section; line 330: ResourceNubMessage table row; line 360-361: nub:resource capability example |
| 4  | Developer landing on packages/vite-plugin/README.md sees strictCsp with dev/prod CSP behavior split, 10-directive baseline, and build-time pitfalls | VERIFIED | Line 185: `#### strictCsp` section; lines 207-230: 10-directive table with prod/dev columns showing connect-src 'none' vs ws://localhost; 4-pitfall rejection table; perm:strict-csp capability advertisement |
| 5  | Reader of root README.md understands v0.28.0 ships browser-enforced resource isolation and resource is the canonical fetch path | VERIFIED | Lines 49-60: `## v0.28.0 — Browser-Enforced Resource Isolation` section covering all new NUBs, strict CSP, sidecar, SVG rasterization, specs, shell-deployer guide, and delegation note |
| 6  | Cold-reading agent reading skills/build-napplet/SKILL.md learns to call napplet.resource.bytes(url) for external resources and is warned that fetch() and <img src=externalUrl> are blocked | VERIFIED | Line 202: explicit statement that fetch()/img src/XHR/WebSocket "are all blocked by the browser"; line 268: pitfall bullet warning against blocked APIs with redirect to resource.bytes(); frontmatter description also explicitly states the deprecation |
| 7  | Shell deployer landing on specs/SHELL-RESOURCE-POLICY.md gets concrete checklist covering all 5 policy areas | VERIFIED | 195-line file; `## Private-IP Block List` (9 ranges + cloud metadata singleton); `## Sidecar Pre-Resolution`; `## SVG Rasterization Caps`; `## MIME Byte-Sniffing Allowlist`; `## Redirect Chain Limits`; `## Audit Checklist` at line 174 |
| 8  | Reader of .planning/PROJECT.md sees explicit coordination note delegating v0.28.0 demo napplets to downstream shell repo | VERIFIED | Lines 25-27: "Demo coordination (v0.28.0)" subsection explicitly delegating profile viewer/feed/scheme-mixed consumer demos to downstream shell repo; cites Option B and explains why (shell-side responsibilities) |
| 9  | Reader of NUB-RESOURCE draft sees Implementation Note delegating demos/reference impl to downstream shell repo | VERIFIED | Lines 302-307: `## Implementation Note` section stating reference implementations "live in the downstream shell repo alongside v0.28.0's first set of demo napplets" |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/nub/README.md` | /resource subpath section, 10 Domains table | VERIFIED | "## 10 Domains" heading; `@napplet/nub/resource` in domain table; "## Resource NUB (v0.28.0)" section |
| `packages/shim/README.md` | window.napplet.resource subsection + wire rows | VERIFIED | `### window.napplet.resource` at line 401; resource.bytes/bytesAsObjectURL in shape block and wire-format table |
| `packages/sdk/README.md` | resource namespace + RESOURCE_DOMAIN + type table | VERIFIED | `### resource` at line 212; RESOURCE_DOMAIN in 10-constant import; ResourceNubMessage row in NUB message types table |
| `packages/vite-plugin/README.md` | strictCsp section + 10-directive table + pitfalls | VERIFIED | `#### strictCsp` at line 185; prod/dev 10-directive table; 4-pitfall rejection table; perm:strict-csp advertised |
| `README.md` | v0.28.0 section + @napplet/nub/resource in packages table | VERIFIED | @napplet/nub row mentions resource subpath; `## v0.28.0 — Browser-Enforced Resource Isolation` section present |
| `skills/build-napplet/SKILL.md` | Step 10 with bytes(url), AbortSignal, 8 error codes, capability detection, blocked-API warnings | VERIFIED | `## Step 10` at line 200; AbortController pattern at line 232; all 8 error codes at line 238; nub:resource/resource:scheme:*/perm:strict-csp capability checks at lines 245-251 |
| `specs/SHELL-RESOURCE-POLICY.md` | 80+ lines; all 5 H2 policy sections + audit checklist | VERIFIED | 195 lines; all 5 required H2 sections present; `## Audit Checklist` at line 174 |
| `.planning/PROJECT.md` | Demo coordination subsection with downstream shell repo delegation | VERIFIED | "Demo coordination (v0.28.0)" subsection with "downstream shell repo" citation and Option B reference |
| `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md` | Implementation Note delegating demos to downstream shell repo | VERIFIED | `## Implementation Note` at line 302 with explicit downstream shell repo delegation |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/nub/README.md` | `@napplet/nub/resource` subpath | domain table row + barrel/types/shim/sdk paths | WIRED | Pattern `@napplet/nub/resource` found 3 times in file |
| `packages/vite-plugin/README.md` | `perm:strict-csp` capability identifier | documented under strictCsp option | WIRED | Pattern `perm:strict-csp` found 1 time; explicitly stated: "Shells that enforce this CSP advertise it via `shell.supports('perm:strict-csp')`" |
| `specs/SHELL-RESOURCE-POLICY.md` | NUB-RESOURCE in napplet/nubs | external link + cross-reference | WIRED | Pattern `napplet/nubs` found 3 times; normative spec cross-referenced |
| `skills/build-napplet/SKILL.md` | window.napplet.resource API | Step 10 section with bytes(url) usage | WIRED | Pattern `napplet.resource.bytes` found 4 times; bytes() and bytesAsObjectURL() both shown |

### Data-Flow Trace (Level 4)

Not applicable — documentation-only phase. All artifacts are prose/markdown, not components rendering dynamic data. No Level 4 data-flow trace required.

### Behavioral Spot-Checks

This is a documentation-only phase (no runnable entry points introduced). Behavioral spot-checks are limited to verifiable content correctness.

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| SHELL-RESOURCE-POLICY.md has all 9 private-IP ranges | `grep` for 10.0.0.0, 172.16.0.0, 192.168.0.0, 127.0.0.0, 169.254.0.0, 169.254.169.254 | All found with checklist items | PASS |
| vite-plugin README dev/prod table has 10 directives | Count table rows in 10-directive baseline | 10 directives, 2 columns (prod/dev) | PASS |
| SKILL.md warns against fetch()/img src/XHR/WebSocket explicitly | `grep` for blocked API names | All 4 APIs called out explicitly as blocked | PASS |
| All 4 commits documented in SUMMARY.md exist in git history | `git log` for 741f9c8 52d5cdd 112c606 3b27473 | All 4 commits found | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| DOC-01 | 133-01-PLAN | @napplet/nub README updated with /resource subpath | SATISFIED | 10 Domains table + Resource NUB section in packages/nub/README.md |
| DOC-02 | 133-01-PLAN | @napplet/shim README updated for resource NUB integration | SATISFIED | window.napplet.resource subsection + wire-format rows in packages/shim/README.md |
| DOC-03 | 133-01-PLAN | @napplet/sdk README updated for resource namespace + RESOURCE_DOMAIN | SATISFIED | resource section + RESOURCE_DOMAIN in packages/sdk/README.md |
| DOC-04 | 133-01-PLAN | @napplet/vite-plugin README updated for strictCsp + dev/prod CSP | SATISFIED | strictCsp section with 10-directive prod/dev table in packages/vite-plugin/README.md |
| DOC-05 | 133-01-PLAN | Root README updated for v0.28.0 surface | SATISFIED | v0.28.0 Browser-Enforced Resource Isolation section in README.md |
| DOC-06 | 133-01-PLAN | skills/build-napplet/SKILL.md teaches napplet.resource.bytes(url) | SATISFIED | Step 10 with bytes(url), error codes, cancellation, capability detection, blocked-API warnings |
| DOC-07 | 133-01-PLAN | Shell-deployer resource policy checklist created | SATISFIED | specs/SHELL-RESOURCE-POLICY.md (195 lines, all 5 policy areas + audit checklist) |
| DEMO-01 | 133-01-PLAN | Demo napplets delegated to downstream shell repo | SATISFIED | Coordination notes in PROJECT.md and NUB-RESOURCE.md draft both delegate to downstream shell repo |

All 8 requirements satisfied.

### Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|-----------|
| None found | — | — | Zero TODO/FIXME/placeholder patterns in any of the 9 modified files |
| Zero kehto/hyprgate references | — | — | Hygiene gate: 0 matches across all 9 modified files |
| Zero @napplet/* in public-destined files | — | — | specs/SHELL-RESOURCE-POLICY.md and NUB-RESOURCE.md draft both clean (0 @napplet/* references) |

### Observation: Pre-Existing TS-vs-Spec Drift (Out of Scope)

The SUMMARY.md surfaces a pre-existing mismatch: `packages/nub/src/resource/types.ts` uses `error: ResourceErrorCode, message?: string` in `ResourceBytesErrorMessage`, while the NUB-RESOURCE.md draft uses `code: ResourceErrorCode, error?: string`. This was explicitly noted as out of scope for Phase 133 (docs sweep) and is documented as a future cleanup item. Phase 133 verification does not fail on this drift — the shim README correctly documents the on-wire TS reality; other docs follow the spec draft prose. The drift should be resolved in a future spec/type alignment phase.

### Human Verification Required

None — all success criteria are verifiable programmatically via content search. Visual appearance, real-time behavior, and external service integration are not relevant to a documentation-only phase.

### Gaps Summary

No gaps. All 9 observable truths verified, all 9 artifacts exist and are substantive, all 4 key links wired, all 8 requirements satisfied, zero anti-patterns found, zero hygiene violations. Phase goal achieved.

---

_Verified: 2026-04-20T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
