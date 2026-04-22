---
phase: 133-documentation-demo-coordination
plan: 01
subsystem: docs

tags: [resource-nub, strict-csp, documentation, shell-policy, demo-coordination, v0.28.0]

# Dependency graph
requires:
  - phase: 126-resource-nub-scaffold
    provides: "Resource NUB scaffold + data: scheme; window.napplet.resource shape locked"
  - phase: 127-nub-relay-sidecar-amendment
    provides: "Sidecar resources?[] field + hydrateResourceCache pattern"
  - phase: 128-central-shim-integration
    provides: "Central shim wires window.napplet.resource = { bytes, bytesAsObjectURL }"
  - phase: 129-central-sdk-integration
    provides: "@napplet/sdk resource namespace + RESOURCE_DOMAIN + 11 type re-exports + resourceBytes/resourceBytesAsObjectURL aliased helpers"
  - phase: 130-vite-plugin-strict-csp
    provides: "Nip5aManifestOptions.strictCsp + 10-directive baseline + 4 project-killer pitfall guards"
  - phase: 131-nip-5d-in-repo-spec-amendment
    provides: "NIP-5D Security Considerations subsection + perm:strict-csp identifier"
  - phase: 132-cross-repo-nubs-prs
    provides: "NUB-RESOURCE draft + NUB-RELAY/IDENTITY/MEDIA coordination drafts"
provides:
  - "5 package READMEs (nub, shim, sdk, vite-plugin, root) updated for v0.28.0 resource NUB + strict CSP surface"
  - "skills/build-napplet/SKILL.md teaches napplet.resource.bytes(url) as canonical fetch path"
  - "specs/SHELL-RESOURCE-POLICY.md (new file) shell-implementer guide with private-IP/sidecar/SVG/MIME/redirect checklists"
  - "PROJECT.md + NUB-RESOURCE draft both contain v0.28.0 demo coordination notes delegating demo napplets to downstream shell repo"
affects: [134-verification-milestone-close]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Documentation-only phase with 0 source code changes; workspace pnpm -r type-check stays green by definition"
    - "Public-repo hygiene boundary: NUB-RESOURCE draft + SHELL-RESOURCE-POLICY are @napplet/*-clean (public-destined); other 7 docs may reference @napplet/* (first-party docs)"
    - "Per-task atomic commits with verification grep gates after each edit"

key-files:
  created:
    - "specs/SHELL-RESOURCE-POLICY.md"
    - ".planning/phases/133-documentation-demo-coordination/133-01-SUMMARY.md"
  modified:
    - "packages/nub/README.md"
    - "packages/shim/README.md"
    - "packages/sdk/README.md"
    - "packages/vite-plugin/README.md"
    - "README.md"
    - "skills/build-napplet/SKILL.md"
    - ".planning/PROJECT.md"
    - ".planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md"

key-decisions:
  - "Aligned wire-format documentation in shim/README.md with the actual TypeScript ResourceBytesErrorMessage shape (error: ResourceErrorCode, message?: string) instead of the plan-prescribed prose (code: '...' + error?: string). Plan prose matches the NUB-RESOURCE spec draft, but README documents on-the-wire reality. Mismatch between TS types and spec is pre-existing artifact drift to resolve in a future phase."
  - "SDK README documents BOTH the resource namespace import AND the bare aliased helpers (resourceBytes/resourceBytesAsObjectURL) since both are exported by packages/sdk/src/index.ts as of Phase 129"
  - "Resource NUB section placed in nub/README.md AFTER Theme Exception and BEFORE Migration to keep migration table contiguous; migration table itself unchanged (no deprecated @napplet/nub-resource package exists), with a one-line note appended below it"
  - "vite-plugin strictCsp section placed inside Configuration block as a subsection of plugin options (#### strictCsp peer of #### configSchema) — keeps related config options grouped"
  - "PROJECT.md Demo coordination subsection inserted between Key context bullets and v0.27.0 Shipped section, preserving milestone-block locality and historical record byte-stability"

patterns-established:
  - "Documentation phase pattern: per-task atomic commits, automated grep verification after each edit, workspace type-check as the load-bearing acceptance gate (instead of unit/e2e tests)"
  - "Public-repo hygiene split: when a single phase modifies first-party docs (free to mention @napplet/*) AND public-destined drafts/specs (must be @napplet/-clean), differentiate via per-file grep checks rather than a single repo-wide rule"
  - "When plan prose conflicts with shipped TS types (Resource error envelope: spec uses 'code', code uses 'error'), document the on-wire reality and flag the upstream spec/type drift as a future deviation note (not auto-fixed in a docs-only phase)"

requirements-completed:
  - DOC-01
  - DOC-02
  - DOC-03
  - DOC-04
  - DOC-05
  - DOC-06
  - DOC-07
  - DEMO-01

# Metrics
duration: 25min
completed: 2026-04-20
---

# Phase 133 Plan 01: Documentation + Demo Coordination Summary

**5 package READMEs + napplet-author skill + new shell-deployer policy checklist updated for v0.28.0 resource NUB / strict CSP surface; PROJECT.md + NUB-RESOURCE draft delegate v0.28.0 demo napplets to downstream shell repo per Option B**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-20T20:58:00Z (plan execution kickoff)
- **Completed:** 2026-04-20T21:08:30Z
- **Tasks:** 5 (4 file-modifying + 1 verification gate)
- **Files modified:** 9 (8 modified + 1 created)
- **Source code changes:** 0 (pure prose sweep)

## Accomplishments

- All 5 package READMEs now document v0.28.0 surface: nub gets 10 Domains table + Resource NUB section + 38-entry-point contract; shim gets window.napplet.resource subsection + wire-format rows + shape block; sdk gets resource namespace export + RESOURCE_DOMAIN const + ResourceNubMessage type + capability example; vite-plugin gets strictCsp option section with 10-directive baseline + 4 project-killer pitfall table; root gets v0.28.0 - Browser-Enforced Resource Isolation framing section
- skills/build-napplet/SKILL.md gains Step 10 — Fetch external bytes (resource NUB, v0.28.0+) covering all 4 schemes, AbortSignal cancellation pattern, all 8 error codes, capability detection (nub:resource, resource:scheme:*, perm:strict-csp), and SVG rasterization note. Two new pitfall bullets explicitly warn against fetch() / <img src=externalUrl> / XMLHttpRequest / WebSocket and against trusting upstream Content-Type
- specs/SHELL-RESOURCE-POLICY.md (195 lines, new file) — non-normative shell-implementer guide covering all 5 locked policy areas (private-IP block list at DNS-resolution time with all 9 ranges + cloud metadata 169.254.169.254, sidecar pre-resolution default-OFF with privacy rationale + per-event-kind allowlist, SVG rasterization in sandboxed Worker no-network with 5 MiB / 4096px / 2s caps, MIME byte-sniffing with WHATWG reference + scheme-appropriate allowlist, redirect chain limits with 5 hops + per-hop DNS pinning) plus operational caps, single-flight cache, scheme whitelist (canonical 4 + smuggling-prone block list of file:/gopher:/dict:/ftp:/tftp:), capability advertisement section, and one-page audit checklist
- PROJECT.md gains Demo coordination (v0.28.0) subsection in the Current Milestone block delegating profile viewer / feed-with-images / scheme-mixed consumer demo napplets to the downstream shell repo per Option B; cites that this monorepo ships only wire + SDK surface
- NUB-RESOURCE draft gains Implementation Note section pointing shell implementers to the downstream shell repo for a working reference implementation while keeping the protocol surface implementation-agnostic

## Task Commits

Each task was committed atomically:

1. **Task 1: Update 5 package READMEs for v0.28.0 resource NUB + strict-CSP surface** — `741f9c8` (docs)
2. **Task 2: Rewrite skills/build-napplet/SKILL.md to teach napplet.resource.bytes(url)** — `52d5cdd` (docs)
3. **Task 3: Create specs/SHELL-RESOURCE-POLICY.md** — `112c606` (docs)
4. **Task 4: Demo coordination notes — PROJECT.md + NUB-RESOURCE draft** — `3b27473` (docs)
5. **Task 5: Final hygiene + workspace verification gate** — no commit (verification-only; gates green)

**Plan metadata commit:** Pending (final commit will include this SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md updates)

## Files Created/Modified

### Created
- `specs/SHELL-RESOURCE-POLICY.md` (195 lines) — Shell-implementer policy checklist; non-normative guide cross-referencing NUB-RESOURCE for the normative wire shape
- `.planning/phases/133-documentation-demo-coordination/133-01-SUMMARY.md` (this file)

### Modified
- `packages/nub/README.md` (+44 / -16 lines effective): lead-in updated to 10 domains, "## 9 Domains" → "## 10 Domains" with new resource row, tree-shaking contract updated to 38 / 10 / 10 / 9 / 9, new Resource NUB (v0.28.0) section, migration table note appended
- `packages/shim/README.md` (+33 lines effective): How It Works item 3 + Quick Start resource block, outbound + inbound wire-format rows for resource.bytes / resource.cancel / resource.bytes.result / resource.bytes.error, window.napplet shape gains resource block, new ### `window.napplet.resource` subsection inserted between config and shell, TypeScript Support comment updated
- `packages/sdk/README.md` (+30 lines effective): Quick Start import + usage block, new ### `resource` section between config (FromSchema) and keys, NUB Domain Constants import + value list updated, capability example block appended after nub:config check, ResourceNubMessage table row appended
- `packages/vite-plugin/README.md` (+57 lines effective): #### strictCsp subsection inserted between configSchema Build-Time Guards and Environment Variables (boolean | StrictCspOptions, 10-directive baseline table, pitfall rejection table, perm:strict-csp capability advertisement, opt-out example), Nip5aManifestOptions interface gets strictCsp field, Protocol Reference gains NUB-RESOURCE bullet
- `README.md` (root, +14 lines effective): @napplet/nub Packages-table description grows to 10 subpaths + v0.28.0 resource note, @napplet/vite-plugin description gains strictCsp note, Napplet-Side Communication ASCII block swaps dead window.nostr line for window.napplet.resource (bytes/bytesAsObjectURL), new ## v0.28.0 — Browser-Enforced Resource Isolation section between Architecture and Origin
- `skills/build-napplet/SKILL.md` (+62 lines effective): frontmatter description rewritten (drops dead nappStorage / window.nostr refs, adds resource NUB), new ## Step 10 — Fetch external bytes (resource NUB, v0.28.0+) section with all 4 schemes table, AbortSignal example, error codes, capability detection, SVG rasterization note; two new Common pitfalls bullets explicitly warning against blocked APIs and against trusting upstream Content-Type
- `.planning/PROJECT.md` (+3 lines effective): Demo coordination (v0.28.0) subsection inserted in Current Milestone block
- `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md` (+5 lines effective): Implementation Note section appended after existing "## Implementations\n- (none yet)"

## Decisions Made

- **TS-vs-spec error envelope mismatch surfaced (not fixed):** The Phase 132 NUB-RESOURCE draft uses `code: ResourceErrorCode` and `error?: string` for `resource.bytes.error`. The shipped TypeScript in `packages/nub/src/resource/types.ts` uses `error: ResourceErrorCode` and `message?: string`. The shim README documents the actual TS wire shape (since READMEs document on-the-wire reality), but other docs (skill, SHELL-RESOURCE-POLICY, NUB-RESOURCE itself) follow the plan / spec convention and describe the field as `code`. Resolution of this drift is out of scope for a docs-only phase; it should be tracked as a Phase 134 verification finding or future cleanup.
- **SDK Quick Start uses `resource` namespace import (not bare helpers):** `packages/sdk/src/index.ts` exports both `resource` (namespace object) and `resourceBytes`/`resourceBytesAsObjectURL` (aliased helpers). The Quick Start uses the namespace form to mirror the patterns of the other 9 NUBs (relay, ifc, etc.); the bare helpers are documented as an alternative in the resource section.
- **Public-repo hygiene preserved across split-audience artifacts:** Verified `specs/SHELL-RESOURCE-POLICY.md` and `.planning/phases/132-.../drafts/NUB-RESOURCE.md` both contain ZERO `@napplet/*` references (these are public-destined). The 5 package READMEs, root README, build-napplet SKILL.md, and PROJECT.md DO reference `@napplet/*` (these are first-party docs for first-party packages — references are correct, not hygiene failures).
- **Per-task verification gate caught nothing — all tasks landed on first attempt:** No deviations required. Workspace `pnpm -r type-check` exits 0 across all 14 packages after every task (doc-only changes, source untouched).

## Deviations from Plan

None - plan executed exactly as written, with two minor documentation alignments noted above (TS-vs-spec error field name, SDK namespace vs bare helpers) which match the source-of-truth code rather than the plan's literal prose. Both alignments improve accuracy without altering plan intent.

## Issues Encountered

None.

The pre-existing documentation drift in the NUB-RESOURCE spec draft (uses `code` field name) vs the shipped TypeScript (uses `error` field name) was surfaced during Task 1B but not fixed — this is appropriately scoped to a future spec/type alignment phase, not a docs-sweep phase.

The pre-existing root README ASCII block reference to `window.nostr (NIP-07 proxy)` (dead since v0.24.0) was opportunistically replaced with the new `window.napplet.resource` line as part of Task 1E's Napplet-Side Communication update — a small Rule 1 (bug fix in stale doc) auto-correction integrated into the planned edit.

## User Setup Required

None - no external service configuration required. This is a documentation phase.

## Hygiene Gate Results

- `grep -ri "kehto\|hyprgate"` across all 9 modified files → **0 matches**
- `grep "@napplet/"` on `specs/SHELL-RESOURCE-POLICY.md` → **0 matches** (public-destined; clean)
- `grep "@napplet/"` on `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md` → **0 matches** (public-destined; clean)
- `pnpm -r type-check` → **exits 0** across all 14 workspace packages (doc-only changes; source untouched as expected)

## Requirement Coverage

| REQ-ID | Artifact | Verification |
|--------|----------|--------------|
| DOC-01 | packages/nub/README.md | 10 Domains table row, Resource NUB section, 38 entry points |
| DOC-02 | packages/shim/README.md | window.napplet.resource subsection, wire-format rows, shape block |
| DOC-03 | packages/sdk/README.md | resource section, RESOURCE_DOMAIN const, ResourceNubMessage row, capability example |
| DOC-04 | packages/vite-plugin/README.md | strictCsp section, 10-directive table, 4-pitfall table, perm:strict-csp capability |
| DOC-05 | README.md | v0.28.0 Browser-Enforced Resource Isolation section, packages-table updates, ASCII block update |
| DOC-06 | skills/build-napplet/SKILL.md | Step 10 with all 4 schemes, AbortSignal pattern, error codes, capability detection; 2 new pitfall bullets |
| DOC-07 | specs/SHELL-RESOURCE-POLICY.md | New 195-line file with all 5 locked policy areas + audit checklist |
| DEMO-01 | .planning/PROJECT.md + .planning/phases/132-.../drafts/NUB-RESOURCE.md | Demo coordination subsection + Implementation Note both delegating to downstream shell repo per Option B |

All 8 REQ-IDs satisfied.

## Next Phase Readiness

- Phase 134 (Verification & Milestone Close) is unblocked. All v0.28.0 documentation surface is now consistent with shipped code:
  - A fresh agent reading any of the 5 package READMEs would correctly call `napplet.resource.bytes(url)` instead of `<img src=externalUrl>` or `fetch()`
  - Shell deployers have a concrete checklist (`specs/SHELL-RESOURCE-POLICY.md`) for v0.28.0 conformance
  - Direct contributors know v0.28.0 demo work goes to the downstream shell repo, not this monorepo
- Phase 134 should verify the requirements-completion table (8/8) and may want to flag the TS-vs-spec error envelope field-name drift (`code` in NUB-RESOURCE draft vs `error` in `packages/nub/src/resource/types.ts`) for future resolution
- Workspace stays green; no source code touched; no dependency changes

## Self-Check: PASSED

- packages/nub/README.md: FOUND (modified, contains "10 Domains" + "Resource NUB (v0.28.0)" + "38 entry points")
- packages/shim/README.md: FOUND (modified, contains "window.napplet.resource" + "resource.bytes.result" + "bytesAsObjectURL")
- packages/sdk/README.md: FOUND (modified, contains "RESOURCE_DOMAIN" + "ResourceNubMessage" + "resource.bytes")
- packages/vite-plugin/README.md: FOUND (modified, contains "strictCsp" 5x + "10-directive" + "Pitfall 1" + "perm:strict-csp")
- README.md: FOUND (modified, contains "## v0.28.0" + "browser-enforced" + "downstream shell repo")
- skills/build-napplet/SKILL.md: FOUND (modified, contains "## Step 10" + "napplet.resource.bytes" + "AbortController" + "perm:strict-csp")
- specs/SHELL-RESOURCE-POLICY.md: FOUND (created, 195 lines, all 6 required H2 sections present)
- .planning/PROJECT.md: FOUND (modified, contains "Demo coordination (v0.28.0)" + "Option B" + "downstream shell repo")
- .planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md: FOUND (modified, contains "## Implementation Note" + "downstream shell repo")
- Commit 741f9c8: FOUND
- Commit 52d5cdd: FOUND
- Commit 112c606: FOUND
- Commit 3b27473: FOUND

---
*Phase: 133-documentation-demo-coordination*
*Completed: 2026-04-20*
