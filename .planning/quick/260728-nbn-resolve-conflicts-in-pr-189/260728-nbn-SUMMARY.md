---
phase: quick-260728-nbn
plan: 01
subsystem: git-integration
tags: [merge-conflicts, nap-fs, protocol-fidelity, ci]
status: complete
requires: []
provides:
  - "Conflict-free feat/nap-fs branch containing current main"
  - "Combined NAP-FS and current INC/INTENT reference-shell behavior"
affects:
  - apps/docs
  - packages/conformance
  - packages/nap
key-files:
  modified:
    - apps/docs/packages/nap.md
    - packages/conformance/src/shell/reference-shell.ts
    - packages/nap/package.json
    - apps/docs/guide/build-note-drafts-napplet-from-boilerplate.md
    - apps/docs/guide/build-note-drafts-napplet.md
decisions:
  - "Preserve main's current NAP-INC and NAP-INTENT contracts rather than restoring the retired feature-branch projection"
  - "Retain every additive NAP-FS export, reference responder, and documentation entry"
  - "Keep @napplet/nap at main's released 0.30.0 version and synchronize tutorial ranges with all newly released workspace packages"
metrics:
  duration: ~10 min
  completed: 2026-07-28
---

# Quick Task 260728-nbn: Resolve PR #189 Conflicts Summary

Resolved all three merge conflicts in PR #189 and pushed the reconciled `feat/nap-fs` branch. GitHub reported the code head `3984600b61d72c8ba95abcd4a2dc2376a548b2e4` as `MERGEABLE` before the final workflow-artifact commit.

## Resolution

- `apps/docs/packages/nap.md`: retained the NAP-FS domain note and main's archetype-based NAP-INTENT documentation.
- `packages/conformance/src/shell/reference-shell.ts`: retained all 14 NAP-FS request responders and main's current INC/INTENT reference behavior.
- `packages/nap/package.json`: retained the four `fs` subpath exports and main's released `0.30.0` package version.
- `apps/docs/guide/build-note-drafts-napplet*.md`: synchronized `@napplet/sdk`, `@napplet/vite-plugin`, and `@napplet/conformance-cli` ranges after the merged release commit exposed stale tutorial versions.

## Commits

| Commit | Scope |
|--------|-------|
| `40cd0a0e` | `chore: merge main into feat/nap-fs` — merge and protocol-aware conflict resolution |
| `3984600b` | `docs(tutorial): sync released package ranges` — restore the CI tutorial version contract |

## Verification

- `pnpm build` — passed, 13/13 tasks.
- `pnpm type-check` — passed.
- `pnpm -r test:unit` — passed.
- `pnpm test` — passed, including JSR export checks, 23/23 Turbo unit-test tasks, tutorial build, and tutorial conformance (5 passed, 0 failed, 5 documented skips).
- Targeted tests — `@napplet/core` 36/36, `@napplet/nap` 180/180, `@napplet/conformance` 69/69, and `@napplet/shim` 15/15 passed.
- `pnpm lint` — passed with no configured lint tasks.
- `pnpm dlx aislop@0.12.0 scan --changes --base origin/main .` — passed with 90/100, zero errors, and eight existing PR size/complexity warnings.
- `git diff --check`, conflict-marker scan, stale tutorial-version scan, `git merge-base --is-ancestor origin/main HEAD`, and `git merge-tree --write-tree HEAD origin/main` — passed.
- GitHub PR state after the code push — `mergeable: MERGEABLE`; CI, conformance, link-check, and AI-slop jobs queued on the new head.
