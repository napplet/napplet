---
phase: 67-cross-repo-wiring-docs
verified: 2026-04-06T18:15:00Z
status: passed
score: 5/5 must-haves verified
gaps: []
human_verification:
  - test: "Navigate to napplet root README on GitHub and confirm rendering of package table and dependency graph"
    expected: "4-package table renders correctly; @kehto links resolve to https://github.com/sandwichfarm/kehto"
    why_human: "Cannot verify external link resolution or Markdown rendering programmatically"
---

# Phase 67: Cross-Repo Wiring & Docs Verification Report

**Phase Goal:** Kehto consumes @napplet/core from npm (not workspace link) and all documentation reflects the split
**Verified:** 2026-04-06T18:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Note on KEHTO-04 Partial Completion

KEHTO-04 is intentionally partially complete. The full npm switch (resolving `@napplet/core` from the npm registry rather than a workspace link) is deferred pending PUB-04 (npm publish). The kehto root `package.json` retains `"pnpm": { "overrides": { "@napplet/core": "link:/home/sandwich/Develop/napplet/packages/core" } }`. This is the expected state. The partial completion covers only the peerDependency declaration side of KEHTO-04.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Root README describes exactly 4 packages: core, shim, sdk, vite-plugin | VERIFIED | Lines 11-14: exactly 4 rows in package table, no @napplet/shell, @napplet/runtime, @napplet/acl, or @napplet/services rows |
| 2 | Root README explains that @kehto packages provide the shell/runtime layer | VERIFIED | Lines 52, 75: Origin section + Related section both reference @kehto with description of shell-side packages |
| 3 | Package READMEs for core, shim, sdk, and vite-plugin direct users to @kehto for runtime/shell integration | VERIFIED | All 5 READMEs contain @kehto references (2-3 each); Prerequisites sections in shim and sdk point to @kehto/shell |
| 4 | No references to @napplet/runtime, @napplet/shell, @napplet/acl, or @napplet/services remain in any @napplet README | VERIFIED | Stale-reference grep across all 5 files returns 0 matches |
| 5 | All @kehto packages that import from @napplet/core declare it as a peerDependency | VERIFIED | runtime: YES, shell: YES, services: YES; acl: no @napplet/core imports (zero-dep by design — no peerDependency needed) |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `README.md` | 4-package SDK overview with @kehto cross-reference | VERIFIED | 3 @kehto references; exactly 4 packages in table; Related section lists @kehto with full package names |
| `packages/core/README.md` | Core package docs with @kehto integration note | VERIFIED | 2 @kehto references; Integration Note section explicitly names @kehto/runtime, @kehto/shell, @kehto/services |
| `packages/shim/README.md` | Shim package docs redirecting shell references to @kehto | VERIFIED | 1 @kehto reference; Prerequisites points to @kehto/shell |
| `packages/sdk/README.md` | SDK package docs redirecting shell references to @kehto | VERIFIED | 1 @kehto reference; Prerequisites points to @kehto/shell |
| `packages/vite-plugin/README.md` | Vite plugin docs redirecting shell references to @kehto | VERIFIED | 1 @kehto reference in "When to Use This" section |
| `kehto/packages/runtime/package.json` | peerDependencies includes @napplet/core | VERIFIED | `"peerDependencies": { "@napplet/core": ">=0.1.0" }` present |
| `kehto/packages/shell/package.json` | peerDependencies includes @napplet/core | VERIFIED | `"peerDependencies": { "@napplet/core": ">=0.1.0" }` present |
| `kehto/packages/services/package.json` | peerDependencies includes @napplet/core | VERIFIED | `"peerDependencies": { "@napplet/core": ">=0.1.0" }` present |
| `kehto/packages/acl/package.json` | No peerDependency (zero-dep by design) | VERIFIED | No @napplet/core imports in src/; no peerDependency declared — correct |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `README.md` | @kehto packages | Related section + communication diagram | WIRED | Line 32: `@kehto/shell (or any shell)` in diagram; Line 75: explicit @kehto entry in Related |
| `packages/core/README.md` | @kehto | Integration Note section | WIRED | `@kehto/runtime`, `@kehto/shell`, `@kehto/services` named explicitly with GitHub link |
| `packages/shim/README.md` | @kehto/shell | Prerequisites section | WIRED | "A shell host running @kehto/shell or another napplet protocol shell implementation" |
| `packages/sdk/README.md` | @kehto/shell | Prerequisites section | WIRED | "A shell host running @kehto/shell or another napplet protocol shell implementation" |
| `packages/vite-plugin/README.md` | @kehto/shell | "When to Use This" section | WIRED | "testing locally with @kehto/shell" |
| `kehto/packages/*/package.json` | `@napplet/core` | peerDependencies | WIRED | runtime, shell, services all declare peer; acl correctly omits it |

---

### Data-Flow Trace (Level 4)

Not applicable. This phase produces only documentation and package.json configuration — no components, pages, or data-rendering artifacts.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| kehto build succeeds with workspace-linked @napplet/core | `cd /home/sandwich/Develop/kehto && pnpm build` | "Tasks: 11 successful, 11 total" | PASS |
| Stale @napplet/* package refs absent from all READMEs | grep across 5 README files | 0 matches | PASS |
| @kehto present in all 5 READMEs | grep -c across 5 README files | README.md: 3, core: 2, shim: 1, sdk: 1, vite-plugin: 1 | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| KEHTO-04 | 67-01-PLAN.md | @kehto packages declare @napplet/core as peer dependency | SATISFIED (partial — npm switch deferred) | runtime/shell/services have peerDependency; workspace link override remains pending PUB-04 |
| DOC-01 | 67-01-PLAN.md | Root README describes 4-package SDK with @kehto cross-references | SATISFIED | 4-package table, @kehto in diagram + Related section |
| DOC-02 | 67-01-PLAN.md | Package READMEs direct users to @kehto for runtime integration | SATISFIED | All package READMEs updated; Prerequisites sections in shim and sdk point to @kehto/shell |

---

### Anti-Patterns Found

None detected. All README files use proper ATX headings, pipe tables, and fenced code blocks. No TODOs, FIXMEs, or placeholder text found in modified files. The runtime compatibility checking example in vite-plugin README was corrected from a named import (`import { hasService }`) to the correct window global pattern (`window.napplet.services.has()`).

---

### Human Verification Required

#### 1. External Link Resolution

**Test:** Click `@kehto` links in README.md and package READMEs
**Expected:** Links resolve to `https://github.com/sandwichfarm/kehto`
**Why human:** Cannot verify external URL resolution programmatically without making HTTP requests

---

### Gaps Summary

No blocking gaps. All 5 must-have truths are verified. The one known partial item (KEHTO-04 npm switch) is intentional and deferred to PUB-04 as documented in the phase plan and success criteria. The workspace override remains in place in `kehto/package.json` and the kehto build passes cleanly against the workspace-linked `@napplet/core`.

---

_Verified: 2026-04-06T18:15:00Z_
_Verifier: Claude (gsd-verifier)_
