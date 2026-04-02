---
phase: 42
plan: 1
title: Scaffold @napplet/sdk workspace package
status: complete
started: 2026-04-02T13:20:00Z
completed: 2026-04-02T13:24:00Z
---

# Summary: 42-01 Scaffold @napplet/sdk workspace package

## What was built

Created the `packages/sdk/` workspace package with all necessary configuration files following existing monorepo conventions.

## Key files

### Created
- `packages/sdk/package.json` — ESM-only package, `sideEffects: false`, `@napplet/core` as sole runtime dependency
- `packages/sdk/tsconfig.json` — Extends root config with DOM lib for window references
- `packages/sdk/tsup.config.ts` — ESM-only output with DTS and source maps

## Decisions

- No `@napplet/shim` dependency (PKG-03) — SDK is an independent sibling package
- No `nostr-tools` peer dependency — SDK delegates to window.napplet at runtime, all crypto happens in the shim
- `sideEffects: false` marks SDK as tree-shakeable (unlike shim which is `sideEffects: true`)

## Self-Check: PASSED

All acceptance criteria verified:
- package.json exists with correct name, sideEffects, and dependencies
- tsconfig.json extends root with DOM lib
- tsup.config.ts produces ESM-only output
- No shim dependency, no nostr-tools dependency
- Core dependency present as `workspace:*`
