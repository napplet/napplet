---
status: complete
quick_task: 260826-jex
branch: feat/nap-resource-server-hints
source_commit: bfaa2428503d1e9d7fa4677998500e6a0b188b28
commits:
  - 47ec6d07
  - 11fdf896
---

# Quick Task 260826-jex Summary

Extracted the NAP-RESOURCE advisory Blossom server-hint amendment into a dedicated main-based branch without carrying PR #205's Vite optimizer implementation.

## Completed Work

- Replayed the public API, transport, conformance, test, documentation, and operator-guidance portion of `bfaa2428`.
- Exported `ResourceBytesRequest`, added `ResourceInfo.maxServers`, preserved optional single-request `servers`, and migrated bulk envelopes to ordered per-resource `requests`.
- Kept conformance structural and deferred origin filtering, fallback, SSRF defenses, caching, and hash verification to resource-capable runtimes as defined by the living NAP-RESOURCE proposal.
- Added minor release metadata for exactly `@napplet/core`, `@napplet/nap`, `@napplet/sdk`, `@napplet/shim`, and `@napplet/conformance`.
- Retained resolved investigation history with an explicit split note; Vite optimizer observations remain provenance only and its four optimizer files and release entry remain with PR #205.

## Commits

- `47ec6d07` — `feat(resource)!: adopt Blossom server hints`
- `11fdf896` — `chore(resource): prepare server-hint release metadata`

## Verification

Passed:

- `pnpm --filter @napplet/nap test:unit -- src/resource/shim.test.ts` — 181 tests
- `pnpm --filter @napplet/conformance test:unit` — 71 tests
- `pnpm --filter @napplet/core type-check`
- `pnpm --filter @napplet/sdk type-check`
- `pnpm --filter @napplet/shim test:unit` — 15 tests
- `pnpm build`
- `pnpm type-check`
- `pnpm -r test:unit`
- `pnpm lint` (no configured lint tasks)
- `pnpm check:jsr`
- `pnpm test:release-tooling`
- `pnpm test:tutorial` (5 pass, 0 fail, 5 documented skips)
- `git diff --check`

Boundary audit passed: the `origin/main` diff contains the plan's 28 intended paths, no `packages/vite-plugin/src/optimizer/` path, and the changeset names exactly five required packages.

## Deviations from Plan

- The main-based worktree does not contain `scripts/check-build-secret-leaks.test.mjs` or `scripts/check-build-secret-leaks.mjs`; they are newer non-protocol tooling outside the 28-path split allowlist, so they were not copied from PR #205.
- `pnpm dlx aislop@0.12.0 scan --changes --base origin/main .` reports 84/100 solely from pre-existing `js-yaml`, `nanoid`, and `postcss` dependency advisories in the main baseline. The scoped diff neither changes those dependencies nor disables the gate.

## Handoff

No remote operation was performed. The branch is ready for the orchestrator to push and open as the dedicated NAP-RESOURCE server-hint PR.
