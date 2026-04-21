---
phase: 141-documentation-sweep
verified: 2026-04-21T00:00:00Z
status: passed
score: 7/7 must-haves verified
---

# Phase 141: Documentation Sweep Verification Report

**Phase Goal:** Every user-facing doc reflects the two-class posture, the connect API surface, and the "default to NUB-RESOURCE" architectural guidance — without rewriting historical changelog bullets.
**Verified:** 2026-04-21
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Root README shows v0.29.0 two-class posture + NUB-RESOURCE-first guidance + connect/class runtime surface | ✓ VERIFIED | README.md L64-82: new `## v0.29.0 — NUB-CONNECT + Shell as CSP Authority` section with NUB-CLASS-1/NUB-CLASS-2/NUB-CONNECT exposition; L74-76: canonical "Default to NUB-RESOURCE" paragraph verbatim; L37-38: architecture diagram with `window.napplet.connect` and `window.napplet.class`; L14: Packages-table row mentions v0.29.0 connect + class |
| 2 | packages/nub/README.md has connect + class rows in domain table, updated entry-point count, class.assigned wire mention | ✓ VERIFIED | packages/nub/README.md L3: "All 12 napplet NUB domains (...connect, class)"; L66: "## 12 Domains" heading; L82-83: connect + class table rows; L100: "46 entry points"; L169-170: class.assigned wire envelope documented |
| 3 | packages/vite-plugin/README.md has connect option section + inline-script diagnostic + strictCsp deprecation note | ✓ VERIFIED | vite-plugin/README.md L185-203: `#### strictCsp (deprecated in v0.29.0)` section; L205-264: `#### connect (optional, v0.29.0+)` with origin format table + aggregateHash fold + conformance fixture `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`; L336-378: `## Build-Time Diagnostics` section with inline-script fail-loud + cleartext warning + dev-mode `napplet-connect-requires` meta; L437-454: Nip5aManifestOptions interface updated with `connect?: string[]` + `strictCsp?: unknown` |
| 4 | packages/shim/README.md documents window.napplet.connect (granted/origins) + window.napplet.class (number or undefined) with graceful-degradation defaults | ✓ VERIFIED | shim/README.md L15: "connect, class" in sub-objects list; L111-121: Quick Start class + connect reads; L191: NUB-CONNECT-has-no-wire comment; L244: `class.assigned` envelope in Inbound wire block; L319-323: `window.napplet` Shape adds `connect: { granted, origins }` + `class?: number`; L443-467: `### window.napplet.connect` subsection with `{ granted: false, origins: [] }` graceful-degradation default; L469-483: `### window.napplet.class` subsection with `undefined` graceful-degradation default |
| 5 | packages/sdk/README.md documents connect + class namespaces with CONNECT_DOMAIN + CLASS_DOMAIN + installers + getters | ✓ VERIFIED | sdk/README.md L29: Quick Start import adds `type NappletConnect`; L96-107: Quick Start gains getClass + connectGranted/connectOrigins flow; L245-270: `### connect (v0.29.0)` subsection with full export table (NappletConnect, CONNECT_DOMAIN, installConnectShim, connectGranted, connectOrigins, normalizeConnectOrigin); L272-295: `### class (v0.29.0)` subsection with full export table (ClassAssignedMessage, NappletClass, ClassMessage/ClassNubMessage, CLASS_DOMAIN, installClassShim, getClass); L409: NUB Domain Constants import adds CONNECT_DOMAIN + CLASS_DOMAIN; L434-443: capability examples for `nub:connect` / `connect:scheme:http` / `nub:class`; L396-399: NUB Message Types table adds ConnectNubMessage (with footnote) + ClassNubMessage |
| 6 | skills/build-napplet/SKILL.md has Step 11 with two-class posture + connect API + cleartext warning + four-state graceful-degradation | ✓ VERIFIED | SKILL.md L3: frontmatter description mentions v0.29.0 NUB-CLASS + NUB-CONNECT; L258: "## Step 11 — Two-class posture + user-gated direct network access"; L262: NUB-CLASS-1 + NUB-CLASS-2 inline; L265: "### Default to NUB-RESOURCE; reach for NUB-CONNECT only when necessary"; L305: NUB-CLASS-2 branch; L310: `window.napplet.connect.granted` read; L320: "### Cleartext / mixed-content warning"; L325: `connect:scheme:http`; L336-339: four-state graceful-degradation priority order; L356: new class-undefined-at-top-level pitfall; L357+: cleartext silent-fail pitfall |
| 7 | Historical changelog bullets preserved byte-identical (v0.28.0 sections + Migration table) | ✓ VERIFIED | README.md L51-62 `## v0.28.0 — Browser-Enforced Resource Isolation` section intact (5 bullets + demo-napplet paragraph); packages/nub/README.md L113-142 `## Resource NUB (v0.28.0)` section intact; packages/nub/README.md L189-209 Migration table + trailing resource-note preserved; packages/shim/README.md L422-441 `### window.napplet.resource` subsection preserved; git diff vs baseline 741f9c8 shows deletions ONLY at intentionally-updated locations (Packages-table row-bodies in root README, H1/H2 domain-count in nub README, strictCsp section in vite-plugin, frontmatter description in SKILL, Nip5aManifestOptions interface in vite-plugin) — no deletions inside v0.27.0/v0.28.0 historical content blocks |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `README.md` | Root README with v0.29.0 two-class posture + connect API + NUB-RESOURCE-first guidance | ✓ VERIFIED | All 5 contains-keys present: window.napplet.connect (L37), window.napplet.class (L38), NUB-CONNECT (L64+), NUB-CLASS (L64+), "default to NUB-RESOURCE" (L74,76) |
| `packages/nub/README.md` | 12-domain table with connect + class rows + 46-entry-point count | ✓ VERIFIED | All 4 contains-keys present: @napplet/nub/connect (L82), @napplet/nub/class (L83), class.assigned (L170), "46 entry points" (L100) |
| `packages/vite-plugin/README.md` | connect option + Build-Time Diagnostics + Nip5aManifestOptions v0.29.0 shape | ✓ VERIFIED | Primary keys present (L205 connect, L336 Build-Time Diagnostics, L185 strictCsp deprecated, L445 `connect?: string[]` in interface, L453 strictCsp `unknown` deprecated) |
| `packages/shim/README.md` | window.napplet.connect + window.napplet.class + class.assigned wire | ✓ VERIFIED | All 4 contains-keys present: window.napplet.connect (L443+), window.napplet.class (L469+), `granted: false, origins: []` (L452), class.assigned (L244, L471) |
| `packages/sdk/README.md` | connect + class namespaces with full exports + DOMAIN constants + helpers | ✓ VERIFIED | All 7 contains-keys present: CONNECT_DOMAIN (L97, L251, L266, L409), CLASS_DOMAIN (L97, L278, L293, L409), installConnectShim (L251, L267), installClassShim (L278, L294), connectGranted (L104, L251, L268), getClass (L97, L278, L295), NappletConnect (L29, L250, L265) |
| `skills/build-napplet/SKILL.md` | Step 11 with two-class posture + connect API + cleartext warning | ✓ VERIFIED | All 5 contains-keys present: NUB-CLASS-1 (L262), NUB-CLASS-2 (L262, L305), window.napplet.connect.granted (L310, L325, L336), "default to NUB-RESOURCE" (L265, L267), mixed-content (L320, cleartext-pitfall bullet) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| README.md | NUB-RESOURCE-first guidance | canonical phrase from CONTEXT.md | ✓ WIRED | "Default to NUB-RESOURCE" header at L74 + verbatim body at L76 matches CONTEXT.md decisions block byte-for-byte |
| packages/nub/README.md | @napplet/nub/connect + @napplet/nub/class subpaths | domain table rows + Tree-Shaking Contract count | ✓ WIRED | Pattern matches on L82-83 (table rows) + L100-105 (updated 46/12/12/11/11 count) |
| packages/shim/README.md | window.napplet.connect + window.napplet.class runtime surfaces | window.napplet Shape block + per-surface subsection | ✓ WIRED | L319-323 Shape block + L443-467 connect subsection + L469-483 class subsection; ASCII-regex `window\.napplet\.(connect\|class)` matches |
| packages/sdk/README.md | connect + class barrel re-exports from @napplet/nub | Types section + NUB Domain Constants section + helper imports | ✓ WIRED | All four identifiers match: CONNECT_DOMAIN (4 occurrences), CLASS_DOMAIN (4 occurrences), installConnectShim (2 occurrences), installClassShim (2 occurrences) |
| skills/build-napplet/SKILL.md | window.napplet.connect runtime surface + vite-plugin connect option | new Network access authoring step (Step 11) | ✓ WIRED | Pattern `napplet\.connect\.granted` matches at L310, L325, L336 inside Step 11 |
| packages/vite-plugin/README.md | NUB-CONNECT aggregateHash fold procedure | connect:origins synthetic xTag entry prose | ✓ WIRED | `connect:origins` appears in L253, L255 citing the synthetic xTag fold; conformance digest cited at L259 |
| packages/vite-plugin/README.md | shell as sole runtime CSP authority | strictCsp deprecation note + inline-script diagnostic rationale | ✓ WIRED | "sole runtime CSP authority" at L189, L338, L356; `script-src 'self'` at L200, L342, L356 |

### Data-Flow Trace (Level 4)

N/A — documentation-only phase; no runtime data flows to verify. The artifacts render static text; no dynamic data sources exist.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Type-check passes after doc-only edits | `pnpm -r type-check` | All 13 packages exit 0 (Done) | ✓ PASS |
| Canonical "Default to NUB-RESOURCE" phrase present in root + skill | `grep -c "[Dd]efault to NUB-RESOURCE" README.md skills/build-napplet/SKILL.md` | README.md: 2 (L74, L76); SKILL.md: 2 (L265, L267) | ✓ PASS |
| No stale v0.28.0 strict-CSP terminology remains in vite-plugin README | `grep -iE "StrictCspOptions\|buildBaselineCsp\|10-directive baseline\|perm:strict-csp"` | Zero matches in vite-plugin/README.md | ✓ PASS |
| Historical v0.28.0 resource NUB sections preserved | `grep -c "## v0.28.0 — Browser-Enforced" README.md && grep -c "Resource NUB (v0.28.0)" packages/nub/README.md` | README.md: 1; packages/nub/README.md: 1 | ✓ PASS |
| Normative conformance fixture digest cited verbatim | `grep "cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742" packages/vite-plugin/README.md` | Present at L259 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DOC-01 | 141-01 | Update root README for two-class posture + connect API + "default to NUB-RESOURCE" guidance | ✓ SATISFIED | README.md L64-82 new v0.29.0 section + architecture diagram L37-38 + canonical phrase L74,76 |
| DOC-02 | 141-01 | Update packages/nub/README.md to add connect row + types-only vs full-surface | ✓ SATISFIED | packages/nub/README.md L82-83 table rows + L100 46-entry-point count + L144-187 Connect + Class NUBs section |
| DOC-03 | 141-02 | Update packages/vite-plugin/README.md — remove strict-CSP active docs; add connect + inline-script diagnostic | ✓ SATISFIED | vite-plugin/README.md L185-203 strictCsp deprecated + L205-264 connect option + L336-378 Build-Time Diagnostics |
| DOC-04 | 141-01 | Update packages/shim/README.md to document window.napplet.connect + graceful-degradation defaults | ✓ SATISFIED | shim/README.md L319-323 Shape + L443-467 connect subsection with `{granted: false, origins: []}` default + L469-483 class subsection |
| DOC-05 | 141-01 | Update packages/sdk/README.md to document connect namespace + CONNECT_DOMAIN + installConnectShim | ✓ SATISFIED | sdk/README.md L245-270 connect subsection + L272-295 class subsection + L409 NUB Domain Constants import + L434-443 capability examples |
| DOC-06 | 141-01 | Update skills/build-napplet/SKILL.md for two classes + connect API + "default to NUB-RESOURCE" + cleartext warning | ✓ SATISFIED | SKILL.md L3 frontmatter + L258-343 Step 11 + L265-267 canonical phrase + L320-326 cleartext warning + L336-339 four-state graceful degradation + 3 new pitfalls |
| DOC-07 | 141-01, 141-02 | Preserve v0.28.0 historical changelog bullets byte-identical | ✓ SATISFIED | v0.28.0 sections intact in README.md (L51-62), packages/nub/README.md (L113-142), Migration table preserved (L189-209); git diff vs baseline 741f9c8 shows deletions only at intentionally-updated locations (two Packages-table rows updated for v0.29.0 content, strictCsp section fully replaced per plan, Nip5aManifestOptions interface replaced per plan) — zero deletions inside preserved historical blocks |

All 7 DOC requirements satisfied. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | None found |

Scan covered all 6 modified files (README.md, packages/nub/README.md, packages/shim/README.md, packages/sdk/README.md, packages/vite-plugin/README.md, skills/build-napplet/SKILL.md). No TODO/FIXME/placeholder comments introduced; no "coming soon" / "not yet implemented" language; no stub patterns. All removed v0.28.0 terminology (StrictCspOptions, buildBaselineCsp, perm:strict-csp, 10-directive baseline, Pitfall 1/2/18/19) confirmed absent as intended.

### Human Verification Required

None. All checks are programmatic literal-string / count-based grep assertions against shipped code and spec sources. No visual / real-time / external-service integration concerns for documentation-only edits.

### Gaps Summary

No gaps. Phase 141 completed its goal: all user-facing documentation (6 files across both plans) now reflects the v0.29.0 two-class posture, the connect/class API surface, and the canonical "default to NUB-RESOURCE" architectural guidance. Historical v0.28.0 + v0.27.0 changelog content is preserved byte-identical per DOC-07. Type-check exits 0. All 7 DOC REQ-IDs (DOC-01..07) are satisfied and marked complete in REQUIREMENTS.md.

v0.29.0 documentation is ready for Phase 142 verification/milestone close.

---

*Verified: 2026-04-21*
*Verifier: Claude (gsd-verifier)*
