---
phase: 02-test-infrastructure
plan: 01
status: complete
started: 2026-03-30
completed: 2026-03-30
---

## Summary

Configured Vitest 4 for Node-mode unit tests and Playwright Test for browser-based protocol tests with system Chromium.

## What was built

- Root `vitest.config.ts` with Node environment, package/unit test includes, e2e excludes
- Per-package `packages/shell/vitest.config.ts` with test script
- Root `playwright.config.ts` targeting system Chromium at `/usr/bin/chromium`
- Updated `turbo.json` with `test:unit` (cached) and `test:e2e` (uncached) tasks
- Root `package.json` scripts: `test`, `test:unit`, `test:e2e`, `test:build`, `test:serve`
- Test directory structure: `tests/e2e/`, `tests/unit/`, `tests/helpers/`, `tests/fixtures/napplets/`

## Key files

- `vitest.config.ts` - Root Vitest configuration
- `playwright.config.ts` - Root Playwright configuration with system Chromium
- `turbo.json` - Turborepo with test task granularity
- `packages/shell/vitest.config.ts` - Per-package Vitest config

## Verification

- `npx vitest run --passWithNoTests` exits 0
- `pnpm build` succeeds (no regressions)
- All test directories created
