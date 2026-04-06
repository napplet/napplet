---
phase: 66-publish-pipeline-release
verified: 2026-04-06T18:00:00Z
status: human_needed
score: 3/4 must-haves verified
re_verification: false
human_verification:
  - test: "Confirm npm org exists and NPM_TOKEN GitHub secret is set, then trigger publish workflow and verify all four @napplet packages appear on npm registry"
    expected: "npm view @napplet/core, @napplet/shim, @napplet/sdk, @napplet/vite-plugin each return a version number; packages are installable via npm install"
    why_human: "npm authentication, org creation, and token generation require human login to npmjs.com. The CI/CD infrastructure is fully in place but the first publish cannot be triggered or verified without a live NPM_TOKEN secret in GitHub."
---

# Phase 66: Publish Pipeline & Release Verification Report

**Phase Goal:** @napplet packages are published to npm with automated CI/CD
**Verified:** 2026-04-06
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CI workflow runs type-check and build on every PR | ✓ VERIFIED | `.github/workflows/ci.yml` triggers on PR to main; runs `pnpm type-check`, `pnpm build`, `pnpm test` in that order |
| 2 | Changesets workflow versions and publishes @napplet packages to npm on merge | ✓ VERIFIED | `.github/workflows/publish.yml` triggers on push to main; uses `changesets/action@v1` with `pnpm version-packages` and `pnpm publish-packages`; NPM_TOKEN wired via `secrets.NPM_TOKEN` |
| 3 | Changesets config scoped correctly with public access | ✓ VERIFIED | `.changeset/config.json` has `"access": "public"`, `"baseBranch": "main"`, stale initial-release.md deleted (commit ff5b15f confirms) |
| 4 | All four @napplet packages are live on npm and installable (PUB-04) | ? HUMAN NEEDED | Deferred — requires human npm auth, org creation, and NPM_TOKEN GitHub secret setup before first publish can fire |

**Score:** 3/4 truths verified (PUB-04 deferred by user decision)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.github/workflows/ci.yml` | PR validation pipeline with type-check | ✓ VERIFIED | 23 lines; job named `ci`; runs `pnpm type-check` → `pnpm build` → `pnpm test`; targets Node 22, pnpm, frozen-lockfile |
| `.github/workflows/publish.yml` | Automated npm publish via changesets | ✓ VERIFIED | 36 lines; uses `changesets/action@v1`; concurrency group set; `cancel-in-progress: false`; `permissions: contents: write, pull-requests: write`; NPM_TOKEN env wired |
| `.changeset/config.json` | Changesets scope configuration | ✓ VERIFIED | `"access": "public"`, `"baseBranch": "main"`, `"updateInternalDependencies": "patch"` — all correct |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `.github/workflows/publish.yml` | `changesets/action@v1` | GitHub Action step | ✓ WIRED | `uses: changesets/action@v1` present at line 29 |
| `.github/workflows/publish.yml` | `pnpm version-packages` | `with.version` | ✓ WIRED | Script exists in root `package.json` as `changeset version` |
| `.github/workflows/publish.yml` | `pnpm publish-packages` | `with.publish` | ✓ WIRED | Script exists in root `package.json` as `turbo run build && changeset publish` |
| `.changeset/config.json` | main branch | `baseBranch` | ✓ WIRED | `"baseBranch": "main"` confirmed |
| `.github/workflows/publish.yml` | npm registry | `secrets.NPM_TOKEN` | ? HUMAN NEEDED | Pattern `secrets.NPM_TOKEN` present in workflow; actual secret must be configured in GitHub repository settings by user |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces CI/CD configuration files, not components or pages that render dynamic data.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| CI workflow has type-check step | `grep "pnpm type-check" .github/workflows/ci.yml` | Match found (line 20) | ✓ PASS |
| CI workflow has build step | `grep "pnpm build" .github/workflows/ci.yml` | Match found (line 21) | ✓ PASS |
| Publish workflow uses changesets action | `grep "changesets/action" .github/workflows/publish.yml` | Match found (line 29) | ✓ PASS |
| Publish workflow has NPM_TOKEN | `grep "NPM_TOKEN" .github/workflows/publish.yml` | Match found (line 35) | ✓ PASS |
| All 4 packages at v0.1.0 | `node -e "..."` checking all package.json versions | shim: 0.1.0, vite-plugin: 0.1.0, core: 0.1.0, sdk: 0.1.0 | ✓ PASS |
| Stale changeset deleted | `ls .changeset/` | Only `config.json` and `README.md` present | ✓ PASS |
| version-packages script wired | `grep "version-packages" package.json` | `"changeset version"` confirmed | ✓ PASS |
| publish-packages script wired | `grep "publish-packages" package.json` | `"turbo run build && changeset publish"` confirmed | ✓ PASS |
| Commit ff5b15f exists | `git show --stat ff5b15f` | Confirmed: deleted initial-release.md, normalized shim + vite-plugin versions | ✓ PASS |
| Commit d8b50f8 exists | `git show --stat d8b50f8` | Confirmed: updated ci.yml, created publish.yml | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PUB-01 | 66-01 | GitHub Actions runs type-check and build on every PR | ✓ SATISFIED | `ci.yml` triggers on `pull_request: branches: [main]`; runs type-check, build, test |
| PUB-02 | 66-01 | Changesets workflow versions and publishes on merge | ✓ SATISFIED | `publish.yml` triggers on `push: branches: [main]`; changesets/action@v1 wired with version + publish scripts |
| PUB-03 | 66-01 | All four packages at consistent versions, changesets configured | ✓ SATISFIED | All four at v0.1.0; config.json has public access + main base branch; stale changeset removed |
| PUB-04 | 66-02 | All four @napplet packages live on npm and installable | ? HUMAN NEEDED | Deferred by user — requires npm org, NPM_TOKEN, and first publish trigger |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No anti-patterns found in the workflow files or changeset config.

### Human Verification Required

#### 1. npm Publish (PUB-04)

**Test:** Complete the npm publish pipeline:
1. Create the @napplet npm organization at https://www.npmjs.com/org/create
2. Generate an npm Automation token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
3. Add `NPM_TOKEN` as a GitHub repository secret at https://github.com/sandwichfarm/napplet/settings/secrets/actions
4. Create a fresh changeset (`pnpm changeset`) for the initial publish and push to main
5. Merge the "Version Packages" PR created by the changesets action
6. After the subsequent push to main triggers the publish job, run: `npm view @napplet/core version` (and for shim, sdk, vite-plugin) to confirm all return a version number

**Expected:** All four packages (@napplet/core, @napplet/shim, @napplet/sdk, @napplet/vite-plugin) appear on the npm registry and resolve via `npm install --dry-run`

**Why human:** npm organization creation and token generation require authenticated browser sessions on npmjs.com. The NPM_TOKEN must be set as a GitHub Actions secret by a repository maintainer. Claude cannot perform these steps.

### Gaps Summary

No automated gaps. PUB-01, PUB-02, and PUB-03 are fully satisfied — both workflow files are substantive, correctly wired, and the supporting scripts (`version-packages`, `publish-packages`) exist in the root `package.json`. All four packages are at consistent v0.1.0 and the stale changeset that referenced the no-longer-present `@napplet/shell` package has been removed.

PUB-04 (packages live on npm) is deferred by user decision and gated entirely on human npm authentication. The CI/CD infrastructure is ready to execute the publish the moment NPM_TOKEN is configured.

---

_Verified: 2026-04-06_
_Verifier: Claude (gsd-verifier)_
