---
phase: 122-source-rename
verified: 2026-04-19T22:13:07Z
status: passed
score: 5/5 must-haves verified
---

# Phase 122: Source Rename Verification Report

**Phase Goal:** The developer-facing runtime API surface is IFC-named end-to-end — `window.napplet.ifc` resolves (and `.ipc` does not), `@napplet/sdk` exports `ifc`, and every surviving JSDoc / section comment in `@napplet/core` + `@napplet/nub/ifc` uses IFC-PEER / "inter-frame" phrasing.

**Verified:** 2026-04-19T22:13:07Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A napplet calling `window.napplet.ifc.emit(...)` dispatches through the shim to the IFC NUB | VERIFIED | `packages/core/src/types.ts:147` declares `ifc: {` namespace on `NappletGlobal`; `packages/shim/src/index.ts:125-128` assigns `ifc: { emit, on }` from `@napplet/nub/ifc/shim` imports (line 38); routing via `handleIfcEvent` preserved at `shim/index.ts:105-108`. |
| 2 | `window.napplet.ipc` is undefined at runtime (hard break — no alias) | VERIFIED | Zero `napplet.ipc`, `napplet['ipc']`, or `napplet?.ipc` matches anywhere in `packages/**/*.ts`. Zero `^\s+ipc:` property-key matches in any TS file under `packages/`. Zero `\bipc\b` matches across the 6 in-scope source files. Built `packages/core/dist/index.d.ts` also contains zero `ipc` identifiers. |
| 3 | `import { ifc } from '@napplet/sdk'` type-checks; `import { ipc } from '@napplet/sdk'` fails at compile time | VERIFIED | `packages/sdk/src/index.ts:150` declares `export const ifc = {`. Zero `export const ipc` in the file. Localized `pnpm --filter @napplet/sdk type-check` exits 0 with the renamed export. |
| 4 | Every JSDoc / section comment in `@napplet/core` + `@napplet/nub/ifc` uses IFC-PEER / inter-frame phrasing — zero IPC-PEER, zero .ipc, zero Inter-napplet | VERIFIED | `grep -nE "\bipc\b\|IPC-PEER\|IPC_PEER\|Inter-napplet\|IPC peer bus"` across the 6 in-scope source files returns zero matches. IFC-PEER present in types.ts (2x), topics.ts (4x), nub/ifc/sdk.ts (2x). "IFC peer bus" present in envelope.ts (1x). Section header at `sdk/src/index.ts:134` reads `// ─── IFC namespace ───`. |
| 5 | Localized build + type-check across `@napplet/core`, `@napplet/shim`, `@napplet/sdk`, `@napplet/nub` both exit 0 | VERIFIED | Re-ran both commands at verification time: `pnpm --filter @napplet/core --filter @napplet/nub --filter @napplet/shim --filter @napplet/sdk build` exit 0; `... type-check` exit 0. All four packages report Done with no errors. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/core/src/types.ts` | `NappletGlobal.ifc` namespace type declaration — contains `ifc: {` | VERIFIED | Exists; `ifc: {` at line 147; Subscription JSDoc at line 52 says `relay.subscribe() and ifc.on()`; namespace JSDoc at line 145 says "Inter-frame pubsub ... IFC-PEER"; emit JSDoc line 149 and on JSDoc line 156 both say IFC-PEER. |
| `packages/core/src/topics.ts` | Topic constants module — JSDoc references IFC-PEER | VERIFIED | Exists; 4 `IFC-PEER` references (lines 2, 4, 10, 16); module header, TOPICS JSDoc, and @example comment all IFC-named. |
| `packages/core/src/envelope.ts` | `NubDomain` JSDoc table — `ifc` row says "IFC peer bus" | VERIFIED | Exists; line 53 reads `` | `ifc`      | Inter-frame communication (IFC peer bus)  | ``; column alignment preserved. `NUB_DOMAINS` already contains `'ifc'` (line 79). |
| `packages/shim/src/index.ts` | Installed `window.napplet` object with `ifc:` key | VERIFIED | Exists; line 125 `ifc: { emit, on }` assigns the namespace from `@napplet/nub/ifc/shim` imports (line 38); `installIfcShim()` at line 114 and `handleIfcEvent` routing at lines 105-108 untouched. |
| `packages/sdk/src/index.ts` | Exported `ifc` const for bundler consumers | VERIFIED | Exists; line 150 `export const ifc = {`; module-doc line 3 advertises `'ifc'`; @example line 9 imports `{ relay, ifc }`; section header line 134 `// ─── IFC namespace ───`; emit body line 158 calls `requireNapplet().ifc.emit(...)`; on body line 171 calls `requireNapplet().ifc.on(...)`. |
| `packages/nub/src/ifc/sdk.ts` | `requireIfc` helper reading `window.napplet.ifc` | VERIFIED | Exists; line 12 `function requireIfc(): NappletGlobal['ifc']`; guard line 14 reads `w.napplet?.ifc`; error string line 15 says `'window.napplet.ifc not installed -- import @napplet/shim first'`; return line 17 `return w.napplet.ifc`; `ifcEmit` (line 36) and `ifcOn` (line 57) bodies call `requireIfc()`. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `packages/core/src/types.ts` (NappletGlobal.ifc) | `packages/shim/src/index.ts` (ifc: { emit, on }) | Structural typing against NappletGlobal | WIRED | Both files declare `ifc: {` (types.ts line 147, shim line 125). Shim imports `NappletGlobal` from `@napplet/core` (line 48) and casts the installed object literal to `{ napplet: NappletGlobal }` (line 118) — TypeScript enforces structural match; type-check green. |
| `packages/sdk/src/index.ts` (export const ifc) | `packages/core/src/types.ts` (NappletGlobal.ifc) | `requireNapplet().ifc` delegation | WIRED | Two `requireNapplet().ifc.*` call-sites (lines 158, 171). `requireNapplet()` returns `NappletGlobal` (typed via import from `@napplet/core` at line 24). Type-check passes. |
| `packages/nub/src/ifc/sdk.ts` (requireIfc) | `packages/core/src/types.ts` (NappletGlobal.ifc) | `w.napplet.ifc` guard + return | WIRED | Guard at line 14 `if (!w.napplet?.ifc)`, return at line 17 `return w.napplet.ifc`; function return type `NappletGlobal['ifc']` at line 12. Error string literal (line 15) refers to the new key exactly. Type-check passes. |

Note: The gsd-tools `verify key-links` JSON output reported `verified: false` for all three links due to a parser limitation — the `from`/`to` fields in the PLAN's must_haves include parenthetical descriptors (e.g., `packages/core/src/types.ts (NappletGlobal.ifc)`) that the tool treats as literal filenames. Manual grep verification against the declared `pattern` values confirms all three links are WIRED.

### Data-Flow Trace (Level 4)

Not applicable — this phase is a pure source rename with no dynamic data rendering. Artifacts are type declarations, installer code, SDK helpers, and JSDoc. No component renders upstream-fetched data.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| `@napplet/core` + `@napplet/nub` + `@napplet/shim` + `@napplet/sdk` build under the renamed type contract | `pnpm --filter @napplet/core --filter @napplet/nub --filter @napplet/shim --filter @napplet/sdk build` | All four packages report Done; shim ESM 7.88 KB; sdk ESM 15.86 KB; exit 0 | PASS |
| All four packages type-check clean against `NappletGlobal.ifc` | `pnpm --filter @napplet/core --filter @napplet/nub --filter @napplet/shim --filter @napplet/sdk type-check` | All four tsc --noEmit runs report Done; exit 0 | PASS |
| Zero `\bipc\b` / IPC-PEER / IPC_PEER / Inter-napplet / IPC peer bus leakage across 6 in-scope source files | `grep -nE "\bipc\b\|IPC-PEER\|IPC_PEER\|Inter-napplet\|IPC peer bus" <6 files>` | No output from any file | PASS |
| Zero `.ipc` access or `ipc:` property-key anywhere in `packages/**/*.ts` | `grep -nE "\.ipc\b\|\bipc:\s*\{\|\bipc\s*=\|export\s+const\s+ipc\b\|requireIpc"` across packages | No matches | PASS |
| Built `packages/core/dist/index.d.ts` contains zero `ipc` identifiers but contains IFC-PEER | `grep -nE "\bipc\b\|IPC-PEER"` on dist then `grep -nE "\bifc\b\|IFC-PEER"` | Zero ipc matches; 12 ifc matches (NubDomain union, JSDoc table, namespace block, topic header) | PASS |
| The 4 task commits exist and are reachable | `gsd-tools verify commits e659673 3629958 1d7b3b3 bd2fe98` | `{ all_valid: true, valid: [4 shas], invalid: [] }` | PASS |
| Only the 6 declared files were touched across the 4 task commits | `git show --name-only e659673` + `git log --name-only e659673..bd2fe98` | Task 1 touched types.ts + topics.ts + envelope.ts; Task 2 touched shim/index.ts; Task 3 touched sdk/index.ts; Task 4 touched nub/ifc/sdk.ts — exactly the `files_modified` set | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| API-01 | 122-01-PLAN.md | `window.napplet.ipc` namespace renamed to `window.napplet.ifc` across `packages/core/src/types.ts` and `packages/shim/src/index.ts`; no backward-compat alias | SATISFIED | `NappletGlobal.ifc` declared (types.ts:147); shim installer assigns `ifc:` key (shim:125); zero `ipc:` property keys or `.ipc` accesses anywhere in `packages/**/*.ts`; localized type-check green. Truth #1 + #2. |
| API-02 | 122-01-PLAN.md | `@napplet/sdk` exports `ifc` (not `ipc`) as named namespace export; section header, @example blocks, const identifier all renamed | SATISFIED | `export const ifc = {` at sdk:150; `// ─── IFC namespace ───` at sdk:134; @example blocks at sdk:9, 141-148 import/invoke `ifc`; zero `export const ipc` in file. Truth #3. |
| SRC-01 | 122-01-PLAN.md | `@napplet/core` JSDoc in types.ts, topics.ts, envelope.ts use IFC-PEER / "inter-frame" phrasing — zero IPC-PEER leakage; `packages/nub/src/ifc/sdk.ts` JSDoc references `window.napplet.ifc` | SATISFIED | Six-file zero-leakage grep returns zero matches for the IPC token family; IFC-PEER occurrences: types.ts (2), topics.ts (4), nub/ifc/sdk.ts (2); "IFC peer bus" in envelope.ts (1); nub/ifc/sdk.ts header + guard + return + error string all reference `window.napplet.ifc`. Truth #4. |

REQUIREMENTS.md line 52-54 maps all three IDs to "Phase 122 (Source Rename) | Complete". No orphaned requirements for Phase 122 — all three declared in the single Plan 01 frontmatter.

### Anti-Patterns Found

None in the 6 modified source files.

Scans performed:
- TODO/FIXME/XXX/HACK/PLACEHOLDER: one TODO exists at `packages/shim/src/index.ts:181` inside the `shell.supports()` stub, but it pre-dates Phase 122 and is outside the rename's line hunks (git diff shows no edits to that region).
- Empty implementations / hardcoded empty returns: none introduced.
- `console.log` stubs: none introduced.
- Stub prop defaults: none — phase produces no component code.

### Human Verification Required

None. All observable truths are verifiable programmatically via grep + localized type-check/build, and all three requirements are either type-enforced (API-01, API-02) or static-textually verifiable (SRC-01).

### Gaps Summary

No gaps. The phase achieved its goal end-to-end:
- `NappletGlobal` contract is IFC-named at the type layer.
- Shim installer assigns `ifc:` on `window.napplet` — no alias.
- SDK exports `ifc` const with matching `requireNapplet().ifc.*` delegations.
- NUB/ifc SDK guard reads `window.napplet.ifc` and throws an error string referencing the new key exactly.
- All surviving JSDoc / section comments in the 6 in-scope files use IFC-PEER / inter-frame phrasing.
- Localized build + type-check across the four affected packages both exit 0.
- Zero IPC-PEER / Inter-napplet / `\bipc\b` leakage in the 6 in-scope source files and zero `.ipc` access anywhere in `packages/**/*.ts`.

READMEs (`packages/shim/README.md`, `packages/sdk/README.md`) still reference `window.napplet.ipc` — explicitly out-of-scope for Phase 122 (scope_guard + verification brief flag these as Phase 123's responsibility). The full-monorepo zero-grep gate and `pnpm -r build` are Phase 124's acceptance.

Phase 122 is ready for handoff to Phase 123 (Documentation Sweep).

---

*Verified: 2026-04-19T22:13:07Z*
*Verifier: Claude (gsd-verifier)*
