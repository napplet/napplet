---
phase: quick-260803-qdc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/cli/src/cli.ts
  - packages/cli/src/standalone.ts
  - packages/cli/deno.json
  - packages/cli/tests/cli_test.ts
  - packages/cli/tests/resolver_free_test.ts
  - packages/skills/src/cli-help.ts
  - packages/skills/src/cli.ts
  - packages/skills/src/deno-cli.ts
  - packages/skills/src/cli.test.ts
  - .changeset/resolver-free-standalone-cli.md
autonomous: true
requirements: [QUICK-260803-qdc]
must_haves:
  truths:
    - "The published JSR CLI graph contains no dependency on unpublished workspace-only package entrypoints."
    - "The standalone release binary still runs create and skills without Node.js, npx, network access, or a package resolver."
    - "Existing @napplet/cli/cli consumers can still import and inject runPackageCli."
    - "The bundled and npm skills CLIs render the same complete help contract."
  artifacts:
    - path: "packages/cli/src/standalone.ts"
      provides: "Resolver-free standalone-only dependency injection entrypoint"
    - path: "packages/cli/src/cli.ts"
      provides: "JSR-safe default dispatcher and restored public runPackageCli helper"
    - path: "packages/skills/src/cli-help.ts"
      provides: "Shared skills CLI help renderer"
  key_links:
    - from: "packages/cli/deno.json"
      to: "packages/cli/src/standalone.ts"
      via: "compile tasks"
    - from: "packages/cli/src/standalone.ts"
      to: "@napplet/boilerplate and @napplet/skills/cli"
      via: "build-time injected runners"
    - from: "packages/cli/src/cli.ts"
      to: "npx package dispatch"
      via: "JSR/default runner compatibility"
---

# Quick Task 260803-qdc: Preserve CLI JSR Compatibility While Keeping Standalone Create and Skills Resolver-Free

## Objective

Prevent the `@napplet/cli@0.5.2` release from depending on an unpublished JSR workspace package or removing a public helper, without weakening the resolver-free standalone binary contract.

## Tasks

### Task 1: Lock the compatibility contracts with regression tests

**Files:** `packages/cli/tests/cli_test.ts`, `packages/cli/tests/resolver_free_test.ts`, `packages/skills/src/cli.test.ts`

**Action:** Restore coverage for `runPackageCli`, add injected-runner dispatch coverage, require the compiled binary to expose full skills help, and prove the published CLI entry remains isolated from standalone-only package imports.

**Verify:** Focused CLI and skills unit tests fail before implementation and pass afterward.

**Done:** Tests express the JSR, public API, standalone binary, and help-parity requirements.

### Task 2: Split distribution entrypoints and share the skills help contract

**Files:** `packages/cli/src/cli.ts`, `packages/cli/src/standalone.ts`, `packages/cli/deno.json`, `packages/skills/src/cli-help.ts`, `packages/skills/src/cli.ts`, `packages/skills/src/deno-cli.ts`

**Action:** Restore `runPackageCli` as the default JSR-safe dispatcher, allow `main` runner injection, compile a non-published standalone entrypoint with direct package runners, and render both skills CLIs from one help definition.

**Verify:** `deno task check`, focused tests, resolver-free compiled integration, and JSR dry-run.

**Done:** JSR consumers preserve prior behavior/API while release binaries remain resolver-free and help output is identical.

### Task 3: Synchronize release metadata and run the full release gate

**Files:** `.changeset/resolver-free-standalone-cli.md`

**Action:** Clarify the existing unreleased changeset rather than adding another version bump. Run build, type-check, unit, release-tooling, JSR, AI-slop, and diff checks; commit atomically and open a PR.

**Verify:** Root quality gates pass and the release PR can be regenerated without the identified compatibility defects.

**Done:** A green upstream fix PR is open and ready to update Version Packages PR #202.
