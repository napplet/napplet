---
phase: 02-test-infrastructure
plan: 04
status: complete
started: 2026-03-30
completed: 2026-03-30
---

## Summary

Created two minimal test napplets exercising distinct protocol capabilities: auth-napplet (AUTH-only) and publish-napplet (publishes events after AUTH).

## What was built

- `tests/fixtures/napplets/auth-napplet/` - Minimal napplet that completes AUTH and signals __TEST_DONE__
- `tests/fixtures/napplets/publish-napplet/` - Napplet that publishes an event after AUTH with configurable kind/content via URL params
- Updated `pnpm-workspace.yaml` to include test napplets and harness

## Key design decisions

- Both napplets use `base: './'` in vite config for relative asset paths (required for sandboxed iframe loading)
- Both use `@napplet/vite-plugin` with `nip5aManifest()` for real manifest generation
- Both signal `['__TEST_DONE__', ...]` to parent for test synchronization
- publish-napplet reads kind/content from URL query params for test flexibility
- No user interaction needed -- fully deterministic

## Key files

- `tests/fixtures/napplets/auth-napplet/src/main.ts`
- `tests/fixtures/napplets/publish-napplet/src/main.ts`
- `pnpm-workspace.yaml`

## Verification

- Both napplets build successfully via `pnpm build`
- Both produce dist/ with index.html and bundled JS
- Workspace:* resolution works for @napplet/shim and @napplet/vite-plugin
