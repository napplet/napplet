---
phase: 06-specification-and-publish
plan: 02
status: complete
started: 2026-03-30
completed: 2026-03-30
commits: 1
---

# Plan 06-02: ESM Validation and Version — Summary

## What Was Built

Validated all three packages with industry-standard ESM validation tools and set versions to v0.1.0-alpha.1.

## Results

### publint Results
- `@napplet/shim`: All good!
- `@napplet/shell`: All good!
- `@napplet/vite-plugin`: All good!

### arethetypeswrong Results

All packages show the same pattern:

| Resolution | Status |
|-----------|--------|
| node10 | Pass |
| node16 (from CJS) | ESM (dynamic import only) -- expected for ESM-only packages |
| node16 (from ESM) | Pass (ESM) |
| bundler | Pass |

The `CJSResolvesToESM` is the expected result for ESM-only packages. CJS consumers must use `import()` which is correct.

### Package Changes

1. **Versions**: All set to `0.1.0-alpha.1`
2. **sideEffects**: Added `false` to all packages for tree-shaking
3. **Repository URLs**: Fixed to `git+https://github.com/sandwichfarm/napplet.git`
4. **Vite plugin description**: Updated to `"Vite plugin for napplet development — injects aggregate hash meta tag during dev and optionally generates NIP-5A manifest at build time for local testing"` (clearly dev-only)

### Package Sizes (tarball)
- `@napplet/shim`: 18.9 KB (5 files)
- `@napplet/shell`: 32.8 KB (5 files)
- `@napplet/vite-plugin`: 4.8 KB (5 files)

## Self-Check: PASSED

- [x] All packages build with tsup
- [x] publint exits zero errors for all 3 packages
- [x] arethetypeswrong validates for ESM resolution modes
- [x] Versions set to 0.1.0-alpha.1
- [x] Vite plugin description updated
- [x] sideEffects: false on all packages
- [x] No leftover tarballs

## Key Files

### Modified
- `packages/shim/package.json`
- `packages/shell/package.json`
- `packages/vite-plugin/package.json`

### Commits
- `6f0f2c6` — feat(packages): validate ESM compatibility and set version to 0.1.0-alpha.1
