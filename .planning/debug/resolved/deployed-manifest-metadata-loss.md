---
status: resolved
trigger: "resolve https://github.com/napplet/web/issues/185"
created: 2026-08-02T00:00:00Z
updated: 2026-08-02T13:05:00Z
---

## Current Focus

hypothesis: Confirmed — current main retained the unsigned-manifest early return and omitted count from the CLI allow-list; the archetype convention defect was already fixed by PR #186.
test: Added focused regressions for unsigned metadata emission, count preservation, and synchronization with every active @napplet/nap domain, then ran package and repository-wide gates.
expecting: Unsigned builds write requires/archetype metadata and CLI deploy templates preserve every active domain.
next_action: Push the completed branch, open the issue-closing PR, and verify its checks.

## Symptoms

expected: |
  A build and `napplet deploy --all --dry-run --json` preserve every declared NIP-5D `requires` tag and every canonical NAAT `archetype` tag in the kind 35129 manifest template.

actual: |
  The reported deployed event contains only `d`, aggregate `x`, `server`, and `title`; `requires` and `archetype` metadata are lost.

errors: |
  No explicit error is reported. The metadata loss is silent.

reproduction: |
  Configure `nip5aManifest` with multiple `requires` values including `count` and an archetype convention such as `napplet:object-detail/open`, build without `VITE_DEV_PRIVKEY_HEX`, then inspect `napplet deploy --all --dry-run --json`.

started: Reported against @napplet/cli 0.2.0 and @napplet/vite-plugin 0.11.3 in napplet/web#185.

## Eliminated

## Evidence

- timestamp: 2026-08-02T00:00:00Z
  checked: "Canonical NIP-5D Manifest section and current NAAT registry"
  found: "NIP-5D defines repeated bare-domain requires tags; ARCHETYPES.md defines the third archetype element as an unnumbered napplet:<archetype>/<intent> convention."
  implication: "The CLI must preserve these canonical forms and must not require the archetype convention field to be a NAP-N identifier."

- timestamp: 2026-08-02T13:01:00Z
  checked: "Fail-first Vite plugin regression without VITE_DEV_PRIVKEY_HEX"
  found: "The build produced no .nip5a-manifest.json; reading the expected sidecar failed with ENOENT while the other 30 plugin tests passed."
  implication: "The signing-key early return was the direct cause of all build-owned metadata disappearing before deploy."

- timestamp: 2026-08-02T13:01:00Z
  checked: "Fail-first CLI manifest tests with count and the active @napplet/nap export domains"
  found: "Both tests dropped only count; every other active non-compatibility domain survived."
  implication: "The CLI hardcoded allow-list had exactly the reported drift, and a package-export synchronization regression can prevent recurrence."

- timestamp: 2026-08-02T13:02:00Z
  checked: "Current archetype parsing and regression coverage"
  found: "PR #186 already replaced the NAP-N check with queryless napplet:<archetype>/<intent> validation in plugin options, CLI config, and plugin-sidecar ingestion."
  implication: "Issue defect 2 required no new production change on current main, but remains covered by existing tests."

- timestamp: 2026-08-02T13:05:00Z
  checked: "Targeted and repository-wide verification"
  found: "Vite plugin 31/31, CLI 118/118, pnpm build, pnpm type-check, pnpm -r test:unit, docs build, lint, git diff --check, and changed-file AI-slop 100/100 all passed."
  implication: "The complete metadata path and surrounding repository gates are green."

## Resolution

root_cause: |
  `writeBundleManifest` returned before building or writing `.nip5a-manifest.json` whenever `VITE_DEV_PRIVKEY_HEX` was absent, even though signing alone was optional. The CLI then filtered `count` from any available sidecar because its local NAP-domain allow-list had drifted behind `@napplet/nap`. The issue's archetype NAP-N mismatch existed historically but was already corrected by PR #186 before this work began.
fix: |
  Always build and write the manifest sidecar, using an unsigned template when no development key is configured. Add `count` to CLI metadata ingestion and a regression that derives every active top-level @napplet/nap domain from the package export map. Update package/docs guidance and add patch changesets for @napplet/vite-plugin and @napplet/cli.
verification: |
  `pnpm build`; `pnpm type-check`; `pnpm -r test:unit`; `pnpm lint`; `pnpm --filter @napplet/docs build`; targeted Vite plugin build/type/unit; CLI check and 118 unit tests; Deno format check; `git diff --check`; `pnpm dlx aislop@0.12.0 scan --changes --base origin/main .` (100/100).
files_changed:
  - packages/vite-plugin/src/manifest.ts
  - packages/vite-plugin/src/index.test.ts
  - packages/vite-plugin/src/index.ts
  - packages/vite-plugin/README.md
  - apps/docs/packages/vite-plugin.md
  - packages/cli/src/manifest-metadata.ts
  - packages/cli/tests/manifest_test.ts
  - packages/cli/README.md
  - .changeset/manifest-metadata-survives.md
