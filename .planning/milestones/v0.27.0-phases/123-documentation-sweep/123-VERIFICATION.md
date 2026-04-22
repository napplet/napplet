---
phase: 123-documentation-sweep
verified: 2026-04-19T23:15:00Z
status: passed
score: 8/8 must-haves verified
requirements_satisfied: [DOC-01, DOC-02, PLAN-01]
---

# Phase 123: Documentation Sweep Verification Report

**Phase Goal:** Every non-archival doc a developer actually reads when onboarding to napplet — 4 READMEs, the `build-napplet` skill, and active `.planning/` — uses IFC terminology in prose and code samples, so the docs match the source shipped in Phase 122.

**Verified:** 2026-04-19T23:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Root + 3 package READMEs have zero `\bipc\b` / `IPC-PEER` / `inter-pane` / `inter-napplet` in current-API sections | VERIFIED | `grep -nE "..." README.md packages/{core,shim,sdk}/README.md` returns zero matches; positive assertions present (`window.napplet.ifc` diagram line, `ifc.on()` JSDoc, `### window.napplet.ifc` heading, `### ifc` SDK section) |
| 2 | `skills/build-napplet/SKILL.md` has zero `\bipc\b` / `inter-pane` / `inter-napplet` and positive IFC assertions | VERIFIED | Zero-leakage grep clean; `inter-frame events` appears 2x; Step 8 heading = `## Step 8 — Inter-frame events (emit / on)`; 4 `window.napplet.ifc.(emit\|on)` call-sites; dead `import { emit, on } from '@napplet/shim'` removed |
| 3 | `.planning/codebase/*.md` (minus preserved INTEGRATIONS.md line 168) + 2 research docs use IFC in current-tense prose | VERIFIED | Zero matches across ARCHITECTURE.md, STRUCTURE.md, CONCERNS.md; INTEGRATIONS.md has exactly 1 preserved residual (line 168); research/ARCHITECTURE.md has `ifc:   { ... };` byte-stable; FEATURES-CHANNELS.md Status row has `window.napplet.ifc.emit/on` |
| 4 | `.planning/codebase/TESTING.md` lines 83 and 152 say `postMessage` not generic `IPC` | VERIFIED | Line 83 reads `- \`window.parent.postMessage()\` — Core postMessage transport in shim`; Line 152 reads `- Scope: Napplet ↔ Shell postMessage via pseudo-relay`; zero `\bIPC\b` matches in TESTING.md |
| 5 | Preserved files byte-identical to pre-Phase-123 state (or updated only by bookkeeping, not sweep) | VERIFIED | `PROJECT.md`, `research/ONTOLOGY.md`, `research/SDK_NAMING_PATTERNS.md`, `research/SUMMARY.md`, `SPEC-GAPS.md` had ZERO commits during Phase 123 window. `STATE.md` and `ROADMAP.md` touched ONLY by bookkeeping commits (`docs(123-NN): complete ...` — status/checkbox updates, not content sweep edits). See preserved-file commit log check. |
| 6 | `.planning/codebase/INTEGRATIONS.md` line 168 `INTER_PANE` historical constant preserved | VERIFIED | `sed -n 168p` returns `- 29003: INTER_PANE (napplet-to-napplet events)` — unchanged from pre-phase |
| 7 | SUMMARY.md files exist for plans 01, 02, 03 | VERIFIED | All three files present, with substantive frontmatter (dependency graph, tech-stack, key-files) and body content |
| 8 | `123-03-NOTES.md` exists as Phase 124 residuals handoff | VERIFIED | File present at `.planning/phases/123-documentation-sweep/123-03-NOTES.md`, ~9.7KB, contains "What this plan rewrote" table (28 edits / 7 files), "What this plan PRESERVED" historical-preservation map, "Phase 124 trade-off" residual-matches enumeration, and Rule-2 deviation record |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `README.md` | IFC-only terminology in package table + diagram | VERIFIED | Exists; line 13 `\`relay\`, \`ifc\`, \`services\`, \`storage\``; line 34 `window.napplet.ifc   (emit/on)` (column alignment preserved) |
| `packages/core/README.md` | `ifc.on()` in Subscription JSDoc | VERIFIED | Line 272: `Handle returned by \`relay.subscribe()\` and \`ifc.on()\`.` |
| `packages/shim/README.md` | `ifc` namespace in shape block + `### window.napplet.ifc` heading | VERIFIED | Shape block has `ifc: {`; heading has `### \`window.napplet.ifc\``; `ifcSub` var + cleanup; 10 scoped edits per plan |
| `packages/sdk/README.md` | `### ifc` section + Inter-frame prose | VERIFIED | `### \`ifc\`` heading present; `Inter-frame communication... Mirrors \`window.napplet.ifc\`.`; Quick Start import includes `ifc` |
| `skills/build-napplet/SKILL.md` | Frontmatter + Step 8 + pitfalls IFC-aligned | VERIFIED | Line 3 frontmatter has `inter-frame events`; Line 10 Overview has `inter-frame messaging`; Step 8 heading + 4 call-sites use `window.napplet.ifc.(emit\|on)`; out-of-scope preservation confirmed (12× `window.nostr`, 12× `nappletState`, 4× `discoverServices`) |
| `.planning/codebase/ARCHITECTURE.md` | IFC in current-API descriptions | VERIFIED | `inter-frame pubsub`, `Inter-frame Pubsub (topics):`, `inter-frame routing`; zero residuals |
| `.planning/codebase/STRUCTURE.md` | IFC in pubsub API list | VERIFIED | `inter-frame pubsub` on lines 68, 149; zero residuals |
| `.planning/codebase/INTEGRATIONS.md` | IFC in current integration descriptions + preserved line 168 | VERIFIED | `Inter-Frame Events (NIP-29003):` heading (line 25); `inter-frame subscriptions` / `inter-frame messages`; line 168 `INTER_PANE` historical constant preserved (exactly 1 residual) |
| `.planning/codebase/CONCERNS.md` | IFC in fragile-areas + scaling prose | VERIFIED | 6 `inter-frame` occurrences; zero residuals |
| `.planning/codebase/TESTING.md` | `postMessage` replacing generic `IPC` on lines 83, 152 | VERIFIED | Both lines byte-stable to plan spec; zero `\bIPC\b` residuals |
| `.planning/research/ARCHITECTURE.md` | `ifc:` in NappletGlobal snippet | VERIFIED | Line 387: `  ifc:   { ... };` (column alignment byte-stable) |
| `.planning/research/FEATURES-CHANNELS.md` | `window.napplet.ifc` in Status row | VERIFIED | Line 140 `**Shipped** (kind 29003, \`window.napplet.ifc.emit/on\`)`; plus 7 additional current-tense IPC references swept per Rule-2 deviation noted in 123-03-NOTES.md |
| `.planning/phases/123-documentation-sweep/123-01-SUMMARY.md` | Plan-01 execution record | VERIFIED | Present, substantive frontmatter + body |
| `.planning/phases/123-documentation-sweep/123-02-SUMMARY.md` | Plan-02 execution record | VERIFIED | Present, substantive frontmatter + body |
| `.planning/phases/123-documentation-sweep/123-03-SUMMARY.md` | Plan-03 execution record | VERIFIED | Present, substantive frontmatter + body |
| `.planning/phases/123-documentation-sweep/123-03-NOTES.md` | Phase 124 residuals handoff | VERIFIED | Present; contains preservation map, Rule-2 deviation, and Phase 124 recommendation |

**Artifact score:** 16/16 PASSED (all exist, substantive, wired, data-flowing)

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| shim README `### \`window.napplet.ifc\`` | shape-block `ifc: { emit, on }` | heading + shape consistency | WIRED | Both present; `ifc: {` shape block (line 233) and `### \`window.napplet.ifc\`` heading (line 304) in same file; name-consistent |
| sdk README Quick Start import | API Reference `### ifc` heading | named-export consistency | WIRED | Line 29 `import { relay, ifc, storage, keys, media, notify, config, type NostrEvent }`; Line 110 `### \`ifc\`` section; 2× `ifc` imports (Quick Start + SDK-vs-Shim Typical usage) match section name |
| skill frontmatter `description` | Step 8 heading + body | frontmatter promise → body fulfillment | WIRED | Line 3 describes `inter-frame events`; Step 8 heading (line 152) reads `## Step 8 — Inter-frame events (emit / on)` — promise fulfilled |
| skill Step 8 samples | `packages/shim/src/index.ts` installer shape | sample matches source shipped in Phase 122 | WIRED | `window.napplet.ifc.(emit\|on)` — 4 occurrences in skill; `ifc` key present in core `NappletGlobal` type (`packages/core/src/types.ts`) |
| research/ARCHITECTURE.md NappletGlobal snippet | `packages/core/src/types.ts` NappletGlobal | research snippet in sync with source of truth | WIRED | Snippet has `ifc:   { ... };`; source has `ifc` key in interface — kept in sync |
| `.planning/codebase/*.md` `inter-frame` prose | shim+sdk README `inter-frame` prose | planning docs match published docs terminology | WIRED | All 4 codebase/*.md files contain `inter-frame`; READMEs contain matching `Inter-frame` prose |
| TESTING.md `postMessage` prose | shim source `postMessage` call sites | testing doc describes transport accurately | WIRED | TESTING.md 2× `postMessage` on lines 83, 152; shim+nub packages have postMessage across 12 source files (nipdb-shim.ts + 7 nub/*/shim.ts files) — actual transport terminology matches testing-doc claim |

**Key-link score:** 7/7 WIRED

*(Note: gsd-tools `verify key-links` treated the `from`/`to` strings as file paths and flagged "Source file not found" — those are conceptual references, not file paths. All links verified manually via pattern matching above.)*

### Data-Flow Trace (Level 4)

Not applicable — Phase 123 produces documentation files, no dynamic-data rendering artifacts.

### Behavioral Spot-Checks

Documentation-only phase; no runnable code introduced. Build/type-check verification is explicitly Phase 124's job per 123-CONTEXT.md Deferred Ideas and the phase prompt's out-of-scope list. Step 7b: SKIPPED (no runnable entry points introduced by this phase).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| DOC-01 | 123-01-PLAN.md | Root `README.md` + `packages/core/README.md` + `packages/shim/README.md` + `packages/sdk/README.md` updated — no `ipc` / `IPC-PEER` / `inter-pane` / `inter-napplet` (except historical "shipped" changelog lines). Sample code uses `ifc`. | SATISFIED | Zero-leakage grep clean across all 4 READMEs; positive IFC assertions verified (diagram, JSDoc, headings, import list). No historical "Shipped: vX.Y.Z" sections exist in these READMEs, so preservation clause is vacuous but the grep gate enforces no accidental drift. |
| DOC-02 | 123-02-PLAN.md | `skills/build-napplet/SKILL.md` updated — description frontmatter, body prose, and all code samples aligned with `ifc` / "inter-frame" terminology. | SATISFIED | Zero-leakage grep clean; frontmatter `description` line 3 has `inter-frame events`; Step 8 heading + body + code samples all use `window.napplet.ifc.(emit\|on)`; pitfalls bullet rewritten. Out-of-scope staleness (window.nostr, nappletState, discoverServices, dead named-export pattern elsewhere) preserved per phase scope boundary. |
| PLAN-01 | 123-03-PLAN.md | Active planning docs — `PROJECT.md`, `STATE.md`, `ROADMAP.md`, `.planning/codebase/*.md`, `.planning/research/*.md`, `.planning/SPEC-GAPS.md` — reflect IFC terminology. Archived directories left as historical record. | SATISFIED | 4 codebase/*.md + 2 research/*.md files fully IFC-clean for current-tense content. TESTING.md lines 83/152 rewritten to `postMessage`. Preserved files (PROJECT.md, research/ONTOLOGY.md, research/SDK_NAMING_PATTERNS.md, research/SUMMARY.md, SPEC-GAPS.md) had zero content changes during phase 123; STATE.md/ROADMAP.md touched only for milestone/phase bookkeeping. INTEGRATIONS.md line 168 preserved as documented historical-constant exception. 123-03-NOTES.md enumerates Phase 124 residual-matches trade-off. |

**Orphaned requirements check:** Phase 123 requirements from REQUIREMENTS.md are DOC-01, DOC-02, PLAN-01 (per Traceability table line 55-57). All three are declared in plan frontmatter (DOC-01 in 123-01-PLAN, DOC-02 in 123-02-PLAN, PLAN-01 in 123-03-PLAN). Zero orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `.planning/codebase/STRUCTURE.md` | 185 | `(not yet implemented; see TESTING.md)` | Info | Pre-existing dated documentation note about test files; predates Phase 123 (STRUCTURE.md was last content-touched by Phase 123 only for the 2 `inter-pane` → `inter-frame` swaps on lines 68 + 149). Not a stub introduced by this phase; leave for future STRUCTURE.md refresh. |

No blockers, no warnings requiring action. No TODO/FIXME/XXX/HACK/PLACEHOLDER patterns found in any of the 12 in-scope modified files. No empty-return or console.log-only stubs (these are documentation files).

### Human Verification Required

None. All phase 123 deliverables are documentation-only and verifiable via pattern matching / byte-stable line checks. The phase explicitly defers repo-wide grep acceptance + monorepo build gate to Phase 124.

### Gaps Summary

None. Phase 123 achieved its stated goal:

1. The four package READMEs (root, core, shim, sdk) are IFC-clean in current-API content; historical changelog preservation is vacuously satisfied (no such sections in these files) and enforced by the zero-leakage grep gate.
2. `skills/build-napplet/SKILL.md` frontmatter advertises "inter-frame events", Step 8 body and code samples use `window.napplet.ifc.(emit|on)`, and the pitfalls bullet is IFC-aligned. Out-of-scope pre-v0.16.0 staleness (window.nostr, nappletState, discoverServices, NIP-01 references, dead named-export pattern elsewhere) is explicitly deferred to a future skill-rewrite milestone per 123-02-PLAN scope boundary.
3. Active planning surface — 4 codebase/*.md + 2 research/*.md — uses IFC terminology in current-tense API descriptions. TESTING.md lines 83/152 use the accurate transport term `postMessage`. Preserved dated-history files (PROJECT.md, 3 research docs, SPEC-GAPS.md) are byte-identical to pre-phase state; STATE.md/ROADMAP.md touched only for milestone bookkeeping. INTEGRATIONS.md line 168 preserved as documented `INTER_PANE` historical-constant exception. 123-03-NOTES.md provides Phase 124 with a complete residual-matches trade-off record.
4. All 3 SUMMARY.md files and the 123-03-NOTES.md Phase 124 handoff artifact exist with substantive frontmatter + body content.
5. Phase 122's source territory (`packages/*/src/`) was not touched during Phase 123 — confirmed by `git log 8be9acf..HEAD -- packages/` returning only README-sweep commits.

The docs shipped with Phase 122's source rename now genuinely match the source, closing the cold-read contract the phase goal specifies.

---

_Verified: 2026-04-19T23:15:00Z_
_Verifier: Claude (gsd-verifier)_
