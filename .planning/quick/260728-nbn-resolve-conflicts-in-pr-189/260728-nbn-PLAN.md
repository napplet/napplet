---
phase: quick-260728-nbn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/docs/packages/nap.md
  - apps/docs/guide/build-note-drafts-napplet-from-boilerplate.md
  - apps/docs/guide/build-note-drafts-napplet.md
  - packages/conformance/src/shell/reference-shell.ts
  - packages/nap/package.json
  - .planning/STATE.md
autonomous: true
requirements: [QUICK-260728-nbn]
---

<objective>
Resolve the merge conflicts in PR #189 by merging the current `origin/main` into `feat/nap-fs`, preserving both the NAP-FS additions and the INC/INTENT corrections already merged through PR #192.

Purpose: make PR #189 mergeable without regressing current protocol behavior or losing its filesystem package, conformance, and documentation surface.

Output: one reviewed merge resolution on the existing PR branch, complete project verification, a pushed branch, and GitHub evidence that PR #189 is no longer conflicting.
</objective>

<canonical_refs>
Protocol decisions in the conflict resolution defer to the living documents:

- NAP-FS draft PR head: <https://github.com/napplet/naps/blob/b640cf337c0481f0f9a0216c00843f797a5c6df6/naps/NAP-FS.md>
- NAP-INC: <https://github.com/napplet/naps/blob/master/naps/NAP-INC.md>
- NAP-INTENT: <https://github.com/napplet/naps/blob/master/naps/NAP-INTENT.md>

The resolution must not restore the superseded INC/INTENT projection previously present on the feature branch.
</canonical_refs>

<tasks>

<task type="auto">
  <name>Task 1: Merge current main and resolve the three conflicts</name>
  <files>apps/docs/packages/nap.md, packages/conformance/src/shell/reference-shell.ts, packages/nap/package.json</files>
  <action>Merge `origin/main` into `feat/nap-fs`. Keep main's released package versions and current INC/INTENT docs/reference behavior, while retaining the feature branch's `fs` package exports, domain documentation, and all NAP-FS reference-shell responders.</action>
  <verify>No unmerged entries or conflict markers remain; JSON parses; the resolved files contain both the mainline INC/INTENT shape and the complete filesystem additions.</verify>
  <done>The merge is committed atomically with only the intended resolution and automatically merged mainline updates.</done>
</task>

<task type="auto">
  <name>Task 2: Verify the reconciled branch and update the PR</name>
  <files>apps/docs/guide/build-note-drafts-napplet-from-boilerplate.md, apps/docs/guide/build-note-drafts-napplet.md, .planning/STATE.md</files>
  <action>Run targeted filesystem/conformance tests, the repository build, type check, recursive unit tests, docs/link checks required by the root test chain, `git diff --check`, and the AI-slop gate. If the newly merged release versions expose stale tutorial dependency ranges, synchronize those documentation examples so the CI tutorial harness exercises the current workspace. Record the quick-task summary and state, commit the workflow artifacts separately, push `feat/nap-fs`, then inspect GitHub's current mergeability and checks.</action>
  <verify>All local required gates pass, the remote head matches the local head, and GitHub reports PR #189 as mergeable rather than conflicting.</verify>
  <done>PR #189 is conflict-free on GitHub with verification evidence recorded.</done>
</task>

</tasks>
