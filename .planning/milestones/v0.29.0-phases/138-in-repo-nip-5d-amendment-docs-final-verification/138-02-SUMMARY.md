---
phase: 138-in-repo-nip-5d-amendment-docs-final-verification
plan: 02
subsystem: docs
tags: [docs, identity-decrypt, nub-identity, class-gating, v0.29.0, docs-sweep, parallel-wave-1]

# Dependency graph
requires:
  - phase: 135
    plan: 01
    provides: "IdentityDecryptMessage / IdentityDecryptResultMessage / IdentityDecryptErrorMessage / IdentityDecryptErrorCode types; Rumor + UnsignedEvent on @napplet/core barrel — referenced by the nub/README.md 8-code error table and the sdk/README.md type-reference prose"
  - phase: 135
    plan: 02
    provides: "Live window.napplet.identity.decrypt runtime mount — referenced by the SKILL.md Step 11 code example and the nub/README.md quick-start block"
  - phase: 135
    plan: 03
    provides: "identityDecrypt bare-name helper + identity.decrypt namespace method on @napplet/sdk — referenced by the sdk/README.md new `### identity` subsection"
  - phase: 133-v0.28.0-docs-sweep-precedent
    provides: "v0.28.0 Resource NUB subsection pattern in packages/nub/README.md — mirrored by the new Identity NUB (v0.29.0) subsection"
provides:
  - "packages/nub/README.md `## Identity NUB (v0.29.0)` subsection — 54 new lines. Documents identity.decrypt(event) signature, Rumor type, NIP-04/44/17 auto-detect behavior, class-gating via NUB-CLASS-1.md filename citation, 8-code IdentityDecryptErrorCode vocabulary (class-forbidden, signer-denied, signer-unavailable, decrypt-failed, malformed-wrap, impersonation, unsupported-encryption, policy-denied), window.nostr prohibition, NUB-IDENTITY spec link"
  - "packages/sdk/README.md `### identity` API Reference subsection — 27 new lines. Method table with window.napplet.identity.getPublicKey() + window.napplet.identity.decrypt(event); bare-helper aliases code block with identityGetPublicKey + identityDecrypt imports + Rumor type import; class-gating reference + cross-link to packages/nub/README.md identity-nub-v0290 anchor. Inserted between `### keys` and `### shell` subsections"
  - "README.md (root) `## Changelog` section — 4 new lines. Single v0.29.0 bullet naming identity.decrypt, shell-authenticated sender, class: 1 gating, NUB-CLASS-1 filename, and link to specs/NIP-5D.md#security-considerations. Inserted between `## Packages` and `## Architecture`"
  - "skills/build-napplet/SKILL.md `## Step 11 — Decrypt NIP-17 / NIP-44 / NIP-04 events (NUB-IDENTITY, v0.29.0+)` section — 55 new lines. One-paragraph guidance + typed code example (relay.subscribe([{kinds:[1059]}]) → identity.decrypt), class-gating block, window.nostr prohibition block, capability-detection snippet with nub:identity + perm:strict-csp literals. Inserted between Step 10 (resource NUB fetching) and `## Common pitfalls`"
affects:
  - 138-03  # final VER-06 gate — verifies the 4 docs additions exist (via workspace-wide grep)
  - milestone-close-v0.29.0  # 4/4 DOC requirements closed by this plan
  - future-author-training  # SKILL.md Step 11 becomes the canonical napplet-author NIP-17 decrypt reference

# Tech tracking
tech-stack:
  added: []  # zero runtime additions; zero dependency changes; pure documentation
  patterns:
    - "v0.28.0 Phase 133 docs-sweep pattern mirrored: one atomic commit across 4 docs surfaces, each a pure addition, workspace type-check still green (0 exit across 14 packages)"
    - "v0.28.0 Resource NUB subsection structure in packages/nub/README.md used as the template for the new Identity NUB (v0.29.0) subsection — H2 heading + intro paragraph + ts code fence + error-code table + external NUB spec link"
    - "v0.28.0 Resource SDK subsection in packages/sdk/README.md used as the template for the new `### identity` subsection — methods table + bare-helper aliases code block + cross-reference back to packages/nub/README.md"
    - "Step 10 (resource NUB fetching) structure mirrored for Step 11 — sequential step title format, intro paragraph, code example, capability-detection snippet"

key-files:
  created: []
  modified:
    - "packages/nub/README.md — +54 lines. New `## Identity NUB (v0.29.0)` subsection inserted between existing `## Resource NUB (v0.28.0)` and `## Migration`"
    - "packages/sdk/README.md — +27 lines. New `### identity` API Reference subsection inserted between `### keys` and `### shell`"
    - "README.md (root) — +4 lines. New `## Changelog` H2 section inserted between `## Packages` table and `## Architecture` H2"
    - "skills/build-napplet/SKILL.md — +55 lines. New `## Step 11 — Decrypt NIP-17 / NIP-44 / NIP-04 events (NUB-IDENTITY, v0.29.0+)` section inserted between Step 10 resource block and `## Common pitfalls`"

key-decisions:
  - "Single atomic commit across all 4 files (per plan Task 5 default; executor stuck with that choice rather than one-commit-per-file alternative). Rationale: DOC-01..04 are semantically one docs-sweep; splitting into 4 commits would add churn without downstream value and diverge from the v0.28.0 Phase 133 single-commit precedent"
  - "Plan-scoped staging only — git add enumerated the 4 target files explicitly; did NOT run `git add -A` or `git add .` because a parallel executor (Plan 138-01) was actively modifying specs/NIP-5D.md and .planning/STATE.md was pre-modified. Hygiene-clean boundary preserved"
  - "Used `--no-verify` on the commit per parallel-execution instructions — avoids pre-commit-hook contention with the parallel 138-01 executor. No hooks bypassed maliciously; this is the documented parallel-wave pattern"
  - "Used anchor `(#identity-nub-v0290)` for the sdk→nub cross-link. GitHub-flavored-markdown auto-slugs `## Identity NUB (v0.29.0)` by lowercasing, stripping parens, replacing dots with empty, and replacing spaces with hyphens — matches the link format"
  - "Preserved plan's exact proposed wording where practical. The 4 proposed subsection bodies in the plan were substantively precise and well-calibrated; minor deviations would have introduced drift without adding value"

patterns-established:
  - "For future NUB-version docs sweeps (next likely: v0.30.0 on whichever NUB ships): mirror this plan's 4-surface layout — packages/nub/README.md (authoritative full subsection) + packages/sdk/README.md (short SDK subsection with cross-link) + README.md (one-line changelog bullet) + skills/build-napplet/SKILL.md (one-paragraph author guidance). Single atomic commit closes all 4 DOC requirements"
  - "When a parallel executor has claimed a shared file (specs/NIP-5D.md in this run), NEVER stage the shared file with `git add -A`. Always enumerate files explicitly. This plan demonstrates the clean boundary"

requirements-completed: [DOC-01, DOC-02, DOC-03, DOC-04]

# Metrics
duration: 2.5min
completed: 2026-04-23
---

# Phase 138 Plan 02: v0.29.0 Docs Sweep — identity.decrypt Surface Across 4 Docs Surfaces Summary

**Shipped the v0.29.0 milestone docs sweep for `identity.decrypt()`: the authoritative `## Identity NUB (v0.29.0)` subsection in `packages/nub/README.md` (54 lines; 8-code error table, NIP-04/44/17 auto-detect, NUB-CLASS-1 class gating, window.nostr prohibition), the `### identity` API Reference subsection in `packages/sdk/README.md` (27 lines; method table + bare-helper aliases + cross-link to the nub README), the v0.29.0 changelog bullet in the root `README.md` (4 lines; first-ever Changelog H2 section on this file), and the `## Step 11 — Decrypt NIP-17 / NIP-44 / NIP-04 events` section in `skills/build-napplet/SKILL.md` (55 lines; relay.subscribe→identity.decrypt code example + class-gating + window.nostr prohibition + perm:strict-csp capability detection). All 4 surfaces committed atomically on napplet main as commit ade7b65 (`docs(138-02): ...`). 140 total insertions, 0 deletions. Workspace-wide `pnpm -r type-check` exits 0 across 14 packages post-commit; nubs repo untouched; no push executed; Plan 138-01 parallel executor's specs/NIP-5D.md work unaffected.**

## Performance

- **Duration:** ~2.5 min
- **Started:** 2026-04-23T15:13:41Z
- **Completed:** 2026-04-23T15:16:12Z
- **Tasks:** 5 (4 docs edits + 1 commit task)
- **Files modified:** 4 (packages/nub/README.md, packages/sdk/README.md, README.md, skills/build-napplet/SKILL.md)
- **Lines added:** 140 total (54 + 27 + 4 + 55)
- **Lines deleted:** 0 (pure additions — no existing content rewrites)

## Accomplishments

### DOC-01 — packages/nub/README.md Identity NUB (v0.29.0) subsection

Added a new `## Identity NUB (v0.29.0)` H2 subsection between the existing `## Resource NUB (v0.28.0)` (line 111) and `## Migration` (formerly line 142) subsections. The subsection:

- Opens with a two-paragraph orientation naming `identity.decrypt(event)` as the class-gated receive-side primitive closing the NIP-17 / NIP-59 gift-wrap gap
- Includes a TypeScript code example importing `Rumor` from `@napplet/nub/identity`, destructuring `{ rumor, sender }` from `await window.napplet.identity.decrypt(giftWrapEvent)`, and documenting `sender` as shell-authenticated from the seal signature (not napplet-derived from `rumor.pubkey`)
- Names NIP-04 (kind-4 content), direct NIP-44 (kind-44 or NIP-44-shaped payload), and NIP-17 / NIP-59 gift-wrap (kind-1059 → kind-13 seal → rumor) as the three auto-detected encryption shapes in a dedicated "Shape auto-detection" paragraph
- Names `NUB-CLASS-1.md` by filename (per feedback_spec_branch_hygiene class-citation discipline) in the "Class gating (shell-enforced)" paragraph — identifies the strict baseline posture, `connect-src 'none'`, `class-forbidden` error for non-class-1 napplets, and shim-side observability as defense-in-depth only
- Enumerates all 8 `IdentityDecryptErrorCode` values in a markdown table: `class-forbidden`, `signer-denied`, `signer-unavailable`, `decrypt-failed`, `malformed-wrap`, `impersonation`, `unsupported-encryption`, `policy-denied` — with one-line meaning per code
- Calls out the `window.nostr.*` architectural prohibition explicitly (cross-references NIP-5D §Security Considerations for the injection vector)
- Closes with a [NUB-IDENTITY](https://github.com/napplet/nubs) spec link for the authoritative envelope + conformance table

### DOC-02 — packages/sdk/README.md `### identity` API Reference subsection

Added a new `### identity` subsection between `### keys` (line 232) and `### shell` (line 242). This is the SDK README's FIRST dedicated identity subsection — before Plan 138-02, identity only appeared in the Types table (IdentityNubMessage, line 323) and capability-check examples (lines 259, 352). The new subsection:

- Opens with one paragraph noting that the identity namespace is NOT a top-level SDK export (unlike `relay`, `ifc`, `storage`, etc.) — use `window.napplet.identity.*` or the bare-name helpers
- Method table with 2 rows: `window.napplet.identity.getPublicKey()` (already shipped) and `window.napplet.identity.decrypt(event)` (new in v0.29.0) — each with return-type signature and one-line description
- Bare-helper aliases TypeScript code block showing `import { identityGetPublicKey, identityDecrypt } from '@napplet/sdk'` + `import type { Rumor } from '@napplet/sdk'` with concrete usage
- Closing paragraph naming `NUB-CLASS-1` class gating + `class-forbidden` error code + [@napplet/nub identity section](../nub/README.md#identity-nub-v0290) cross-link for the full 8-code error vocabulary

### DOC-03 — README.md (root) `## Changelog` section

Added a new `## Changelog` H2 section between `## Packages` table (line 15) and `## Architecture` H2 (formerly line 17). This is the FIRST Changelog section on this file (preferred option per plan structural_landmarks). Single v0.29.0 bullet:

- Names the milestone as "Class-Gated Decrypt Surface"
- Identifies `identity.decrypt(event)` shipping on NUB-IDENTITY with NIP-04 / NIP-44 / NIP-17 auto-detect
- Names the return shape `{ rumor, sender }` with `sender` shell-authenticated
- Calls out `class: 1` gating per `NUB-CLASS-1` (strict baseline posture with `connect-src 'none'`)
- Cross-links to `packages/nub/README.md` and `specs/NIP-5D.md#security-considerations`

Deliberately NO backfill of v0.28.0, v0.27.0, or earlier bullets — plan scope was v0.29.0 only; future milestones extend the section.

### DOC-04 — skills/build-napplet/SKILL.md Step 11

Added `## Step 11 — Decrypt NIP-17 / NIP-44 / NIP-04 events (NUB-IDENTITY, v0.29.0+)` between Step 10 (resource NUB byte fetching) and `## Common pitfalls`. Step-numbering convention preserved (Step 10 was the last step pre-plan; this becomes Step 11 — no renumbering). The step:

- Opens with the NIP-17 gift-wrap flow — napplets receive kind-1059 via `window.napplet.relay.subscribe`, decrypt to plaintext via `window.napplet.identity.decrypt(event)`, shell auto-detects shape, returns `{ rumor, sender }` with shell-authenticated sender
- TypeScript code example imports `@napplet/shim`, opens a `relay.subscribe` on `{ kinds: [1059], '#p': [myPubkey] }`, calls `identity.decrypt` on each gift-wrap inside the subscription callback, try/catches with the 8-code error vocabulary inline as a comment
- Dedicated "Class gating" paragraph — `class: 1` per `NUB-CLASS-1`, strict baseline (`default-src 'none'`, `connect-src 'none'`, nonce-based `script-src`, zero direct network egress), `class-forbidden` for other classes, deployment-time decision keyed on `(dTag, aggregateHash)`, runtime observability via `window.napplet.class`
- Dedicated "Do NOT attempt `window.nostr.*`" paragraph — names the NIP-07 content-script `all_frames: true` injection vector (references NIP-5D §Security Considerations), instructs authors to treat residual `window.nostr` as extension noise, explains `connect-src 'none'` as the trap-plaintext structural mitigation
- Closes with "Capability detection" TypeScript snippet — `window.napplet.shell.supports('nub:identity')` + `window.napplet.shell.supports('perm:strict-csp')` checks

Deliberately LEFT UNCHANGED:
- YAML frontmatter (lines 1-4) — `description:` predates v0.29.0; expanding scope would have bled into DOC-04 territory
- Step 7 (`## Step 7 — Use window.nostr (NIP-07 proxy)`) — v0.24.0-stale; cleanup is out-of-scope for Phase 138. Step 11's `window.nostr.*` prohibition language serves as the in-document redirect signal for readers who hit Step 7
- `## Common pitfalls` — no new pitfall entry for `window.nostr.*` decrypt; Step 11 already covers it and a duplicate entry would blur the message
- Step 1 through Step 10 — all unmodified; step numbers preserved

## Task Commits

One atomic commit closes all 4 DOC requirements:

1. **Task 5: atomic commit across 4 docs surfaces** — `ade7b65` (docs)

Per the plan's Task 5 default: a single atomic commit minimizes churn and keeps the DOC-01..04 story together. Mirrors the v0.28.0 Phase 133 docs-sweep precedent.

## Files Created/Modified

- `packages/nub/README.md` — +54 lines.
  - Inserted `## Identity NUB (v0.29.0)` subsection between `## Resource NUB (v0.28.0)` (ends with `SVG rasterization MUSTs.` line) and `## Migration` (H2). The subsection follows the v0.28.0 Resource NUB structural pattern: H2 heading + 2-paragraph intro + ts code fence + structured paragraphs (Shape auto-detection / Class gating / Errors table) + external NUB spec link.
  - No edits to: the 10-domain table (lines 66-81), the Subpath Patterns section, the Tree-Shaking Contract section, the Theme Exception section, the existing `## Resource NUB (v0.28.0)` section (byte-identical pre/post), the `## Migration` section (byte-identical pre/post), the Optional Peer Dependency section, the Protocol Reference section, or the License line.

- `packages/sdk/README.md` — +27 lines.
  - Inserted `### identity` subsection between the `### keys` subsection (ends with `registerAction / unregisterAction / onAction` table) and the `### shell` subsection. This is the sdk/README.md's FIRST identity subsection — pre-plan, identity was referenced only in the NUB Message Types table (IdentityNubMessage row) and capability-check examples.
  - No edits to: Getting Started, Installation, Quick Start block (lines 27-101 — NOT extended with identity.decrypt per plan explicit instruction), `### relay`, `### ifc`, `### storage`, `### media`, `### notify`, `### config`, FromSchema type inference block, `### resource`, `### keys`, `### shell`, `### Namespace Import`, `## Types` header or body, Core Protocol Types table, NUB Message Types table (the existing IdentityNubMessage row at line 323 was preserved byte-identical), `## NUB Domain Constants`, `## Runtime Guard`, `## SDK vs Shim`, `## Protocol Reference`, or the License line.

- `README.md` (root) — +4 lines.
  - Inserted `## Changelog` H2 section + single v0.29.0 bullet between the `## Packages` table closing row (`@napplet/vite-plugin`) and `## Architecture` H2.
  - No edits to: the top description paragraph (lines 1-5), the `## Packages` table (lines 7-15; all 5 rows byte-identical pre/post), the `## Architecture` H2 + Package Dependency Graph + Napplet-Side Communication block (lines 17-47 pre-plan), the `## Origin` section, the `## Development` + Publishing subsection, the `## Related` section, or the `## License` line.

- `skills/build-napplet/SKILL.md` — +55 lines.
  - Inserted `## Step 11 — Decrypt NIP-17 / NIP-44 / NIP-04 events (NUB-IDENTITY, v0.29.0+)` section between Step 10 (ends with `shell-classified via byte-sniffing, never the upstream Content-Type header.`) and `## Common pitfalls` (H2).
  - No edits to: YAML frontmatter (lines 1-4), Overview section, Prerequisites section, Steps 1-10 (all titles + bodies byte-identical pre/post), or `## Common pitfalls` section (byte-identical pre/post).

## Grep-Verifiable Acceptance Checks

Each task's `<verify>` grep gate was executed after the corresponding edit; all 4 passed:

| Task | Required literals (all present) |
|------|---------------------------------|
| DOC-01 | `## Identity NUB (v0.29.0)`, `identity.decrypt`, `NUB-CLASS-1`, `class-forbidden`, `impersonation`, `malformed-wrap`, `## Migration` (unchanged), `## Resource NUB` (unchanged) |
| DOC-02 | `### \`identity\``, `identityDecrypt`, `window.napplet.identity.decrypt`, `class-forbidden`, `NUB-CLASS-1`, `### \`shell\`` (unchanged), `### \`keys\`` (unchanged) |
| DOC-03 | `## Changelog`, `v0.29.0`, `identity.decrypt`, `NUB-CLASS-1`, `class: 1`, `## Packages` (unchanged), `## Architecture` (unchanged) |
| DOC-04 | `## Step 11 — Decrypt NIP-17`, `window.napplet.identity.decrypt`, `NUB-CLASS-1`, `class-forbidden`, `class: 1`, `## Common pitfalls` (unchanged), `## Step 10 — Fetch external bytes` (unchanged), `## Step 7 — Use window.nostr` (stale but deliberately unchanged) |

## Workspace-Wide Sanity Check

Post-commit:

```
$ pnpm -r type-check
EXIT=0
```

All 14 packages exit 0. No type-breaking changes (expected — docs-only). Log at `/tmp/138-02-typecheck.log`.

## Decisions Made

- **Single atomic commit across all 4 docs surfaces.** The plan's Task 5 allowed either one commit (default) or per-file commits. Stuck with the default: DOC-01..04 form one coherent docs sweep, and a single commit keeps the milestone-close story readable in git log. Matches v0.28.0 Phase 133 precedent.
- **`--no-verify` on the commit.** Per the parallel-execution prompt instructions, pre-commit hooks were skipped to avoid contention with the parallel 138-01 executor. This is a documented parallel-wave pattern, not a hook-bypass. No hooks were bypassed for convenience.
- **Plan-scoped staging — explicit file list, not `git add -A`.** At commit time the working tree showed `.planning/STATE.md` (pre-modified) and `specs/NIP-5D.md` (parallel plan 138-01's territory) as modified alongside the 4 plan-scoped files. Used `git add packages/nub/README.md packages/sdk/README.md README.md skills/build-napplet/SKILL.md` explicitly — this preserved the clean boundary between parallel plans.
- **Preserved the plan's proposed prose substantively verbatim.** The 4 proposed subsection bodies in the plan were calibrated carefully (signature, 8-code table, class-gating language, window.nostr prohibition, cross-references). Executor-level rewording would have added drift without value. Minor formatting touch-ups only where needed for prose flow.
- **Used GitHub-flavored-markdown anchor `#identity-nub-v0290` for the sdk→nub cross-link.** GitHub's header auto-slugging rules (lowercase + strip parens/dots + hyphenate spaces) resolve `## Identity NUB (v0.29.0)` to `#identity-nub-v0290`. Verified mentally; the link pattern matches GitHub's live documentation rendering.

## Deviations from Plan

None — plan executed exactly as written.

- No auto-fixed bugs (Rule 1): docs-only edits, no code behavior
- No missing critical functionality (Rule 2): docs content was fully specified in the plan
- No blocking issues (Rule 3): prior phases shipped all referenced APIs; prior sections provided structural landmarks
- No architectural changes (Rule 4): pure additions, no rewrites, no new patterns

## Parallel Execution Notes

Plan 138-02 ran in parallel with Plan 138-01 (specs/NIP-5D.md amendment). Clean boundary maintained:

- 138-02 touched only: `packages/nub/README.md`, `packages/sdk/README.md`, `README.md`, `skills/build-napplet/SKILL.md`
- 138-01 territory (untouched by this plan): `specs/NIP-5D.md`
- Neither plan modified: `.planning/STATE.md` (left for parallel_execution wrap-up), `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` (state update step below handles these)

`--no-verify` used on the commit to avoid pre-commit-hook contention with the parallel executor. Standard parallel-wave pattern.

## Issues Encountered

None. Clean execution across all 5 tasks. Workspace type-check exits 0 post-commit.

## Exact Line Counts Added Per File

| File                                     | +lines |
| ---------------------------------------- | ------ |
| `packages/nub/README.md`                 | 54     |
| `packages/sdk/README.md`                 | 27     |
| `README.md` (root)                       | 4      |
| `skills/build-napplet/SKILL.md`          | 55     |
| **Total**                                | **140** |

## Commit Details

- **Commit:** `ade7b65`
- **Title:** `docs(138-02): document identity.decrypt() surface across 4 docs surfaces`
- **Files:** 4 (exactly the plan's files_modified list)
- **Insertions:** 140
- **Deletions:** 0
- **Body:** enumerates which subsection was added to each file; closes DOC-01, DOC-02, DOC-03, DOC-04
- **Branch:** `main` (napplet repo; no nub-* branch, no cross-repo push)
- **Push:** NOT executed (Phase 138 is in-repo; pushes are human-gated milestone-close lifecycle)

## User Setup Required

None — pure documentation additions, no external service configuration, no sudo commands, no credentials, no new dependencies.

## Next Phase Readiness

- **Plan 138-03 (final VER-06 gate) is partially unblocked by this plan.** VER-06 verifies the NIP-5D Security Considerations subsection — that's Plan 138-01's deliverable. This plan's 4 docs additions are orthogonal to VER-06 grep literals and do not affect its pass condition.
- **Milestone audit (v0.29.0) is unblocked on the DOC-01..04 axis.** The audit will verify:
  - `packages/nub/README.md` has the Identity NUB (v0.29.0) subsection — satisfied by this plan
  - `packages/sdk/README.md` has the `### identity` API Reference subsection — satisfied by this plan
  - `README.md` has a v0.29.0 changelog bullet — satisfied by this plan
  - `skills/build-napplet/SKILL.md` has NIP-17 decrypt guidance — satisfied by this plan
- **Future NUB-version docs sweeps (v0.30.0+)** can reuse this plan's 4-surface layout as the template: packages/nub/README.md (authoritative subsection) + packages/sdk/README.md (short SDK subsection with cross-link) + README.md (one-line changelog bullet) + skills/build-napplet/SKILL.md (one-paragraph author guidance). Single atomic commit closes 4 DOC requirements.

## Self-Check: PASSED

- `packages/nub/README.md` contains `## Identity NUB (v0.29.0)` — FOUND
- `packages/nub/README.md` contains `identity.decrypt` — FOUND
- `packages/nub/README.md` contains all 8 error codes (`class-forbidden`, `signer-denied`, `signer-unavailable`, `decrypt-failed`, `malformed-wrap`, `impersonation`, `unsupported-encryption`, `policy-denied`) — FOUND
- `packages/sdk/README.md` contains `### \`identity\`` — FOUND
- `packages/sdk/README.md` contains `identityDecrypt` — FOUND
- `packages/sdk/README.md` contains `window.napplet.identity.decrypt` — FOUND
- `packages/sdk/README.md` contains cross-link `../nub/README.md#identity-nub-v0290` — FOUND
- `README.md` contains `## Changelog` — FOUND
- `README.md` contains `v0.29.0` and `class: 1` and `NUB-CLASS-1` — FOUND
- `skills/build-napplet/SKILL.md` contains `## Step 11 — Decrypt NIP-17` — FOUND
- `skills/build-napplet/SKILL.md` contains `window.napplet.identity.decrypt` — FOUND
- `skills/build-napplet/SKILL.md` Step 7 (`## Step 7 — Use window.nostr`) — UNCHANGED (verified stale section intact per plan scope)
- `skills/build-napplet/SKILL.md` `## Common pitfalls` — UNCHANGED
- Commit `ade7b65` — FOUND in `git log -1`
- Commit touches exactly 4 files (README.md, packages/nub/README.md, packages/sdk/README.md, skills/build-napplet/SKILL.md) — VERIFIED via `git show --name-only`
- `~/Develop/nubs` — UNTOUCHED (verified via `git -C ~/Develop/nubs status --porcelain` — empty output)
- No push executed — CONFIRMED

---
*Phase: 138-in-repo-nip-5d-amendment-docs-final-verification*
*Completed: 2026-04-23*
