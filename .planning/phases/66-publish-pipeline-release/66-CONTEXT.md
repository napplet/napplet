# Phase 66: Publish Pipeline & Release - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Create GitHub Actions CI workflow (type-check, build on PR) and publish workflow (changesets version + npm publish). Configure changesets for @napplet scope. Publish @napplet packages to npm (core, shim, sdk, vite-plugin).

Working directory: /home/sandwich/Develop/napplet/

NOTE: PUB-04 (actual npm publish) requires human npm auth — this is a known blocker. The CI/CD workflow and changesets config can be created, but the actual publish step needs the user to set up NPM_TOKEN as a GitHub secret and/or run `npm login` locally.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase.

Key rules:
- CI workflow: .github/workflows/ci.yml — runs on PR, type-check + build
- Publish workflow: .github/workflows/publish.yml — runs on push to main, uses changesets
- changesets already configured in .changeset/ directory
- The repo already has changesets set up from initial creation
- npm org is @napplet (public packages)
- Packages: @napplet/core, @napplet/shim, @napplet/sdk, @napplet/vite-plugin
- All at v0.1.0 currently

</decisions>

<code_context>
## Existing Code Insights

### Existing CI
- .github/workflows/ci.yml may already exist from earlier milestones
- Check current state before creating

### Changesets
- .changeset/ directory exists with config.json
- package.json has version-packages and publish-packages scripts
- @changesets/cli 2.30.0 is a devDependency

### Package Access
- All packages should be published as public npm packages
- @napplet npm org needs to exist (user may need to create it)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
