# Phase 135: Deferred Items

## Out-of-Scope Discovery — pre-existing unstaged archive deletions

**Discovered during:** Plan 135-04 Task 3 (2026-04-21).

**Symptom:** `git status` shows ~44 files with status `D` (deleted from working tree, still tracked in HEAD) across:

- `.planning/phases/125-core-type-surface/` (5 files)
- `.planning/phases/126-resource-nub-scaffold-data-scheme/` (4 files)
- `.planning/phases/127-nub-relay-sidecar-amendment/` (4 files)
- `.planning/phases/128-central-shim-integration/` (4 files)
- `.planning/phases/129-central-sdk-integration/` (4 files)
- `.planning/phases/130-vite-plugin-strict-csp/` (4 files)
- `.planning/phases/131-nip-5d-in-repo-spec-amendment/` (4 files)
- `.planning/phases/132-cross-repo-nubs-prs/` (4+4 files, including drafts/)
- `.planning/phases/133-documentation-demo-coordination/` (4 files)
- `.planning/phases/134-verification-milestone-close/` (4 files)
- `.planning/v0.27.0-MILESTONE-AUDIT.md`
- `.planning/v0.28.0-MILESTONE-AUDIT.md`

**Root cause:** Commit `eb06ddc chore: archive v0.28.0 Browser-Enforced Resource Isolation milestone` copied the v0.28.0 phase directories into `.planning/milestones/v0.28.0-phases/` (added those as new tracked files) but did not `git rm` the originals. The deletions have been carried in the working tree since that commit and survived through all Phase 135 plan executions.

**Why not fixed in Phase 135:** Per the GSD executor SCOPE BOUNDARY rule ("Only auto-fix issues DIRECTLY caused by the current task's changes. Pre-existing warnings, linting errors, or failures in unrelated files are out of scope"), Phase 135 does not touch these files. Fixing them would require either (a) staging the deletions as a standalone chore commit, or (b) reverting + redoing `eb06ddc` cleanly. Either is a meaningful commit of its own that the operator should consciously request — not something a spec-authoring phase's terminal verifier should slip into the phase-close commit.

**Suggested fix (future):** One-line chore commit:

```bash
git add -u .planning/phases/125-core-type-surface/ \
          .planning/phases/126-resource-nub-scaffold-data-scheme/ \
          .planning/phases/127-nub-relay-sidecar-amendment/ \
          .planning/phases/128-central-shim-integration/ \
          .planning/phases/129-central-sdk-integration/ \
          .planning/phases/130-vite-plugin-strict-csp/ \
          .planning/phases/131-nip-5d-in-repo-spec-amendment/ \
          .planning/phases/132-cross-repo-nubs-prs/ \
          .planning/phases/133-documentation-demo-coordination/ \
          .planning/phases/134-verification-milestone-close/ \
          .planning/v0.27.0-MILESTONE-AUDIT.md \
          .planning/v0.28.0-MILESTONE-AUDIT.md
git commit -m "chore: finalize v0.28.0 archive by staging deferred path deletions"
```

(Verify `.planning/milestones/v0.28.0-phases/` contents match before staging.)

**Impact on Phase 135:** None. All Phase 135 artifacts are committed and correct; the pre-existing D files only affect the shape of `git status` output while Phase 135 is executing. They do not touch NUB-CLASS, NUB-CLASS-1, NUB-CLASS-2, NUB-CONNECT, NIP-5D, or any Phase-135 PLAN/SUMMARY/CONTEXT file.

## Out-of-Scope Discovery — empty untracked `amp` file at repo root

**Discovered during:** Plan 135-04 Task 3 (2026-04-21).
**Symptom:** `ls amp` → empty 0-byte file in the napplet repo root.
**Why not fixed:** Pre-existing (touched on 2026-04-21 at 14:27 before Plan 04 started). Not caused by any Phase 135 task. Unrelated to SDK or spec work.
**Suggested fix:** Delete the file (`rm amp`) if it's not intentional — but first check whether it's a scratch artifact from the operator that should be preserved.
