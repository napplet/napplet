---
phase: 18-core-types-runtime-dispatch
plan: 01
status: complete
completed: 2026-03-31
commit: 15d65cf
---

# Plan 18-01: Move ServiceDescriptor to @napplet/core

## Outcome

`ServiceDescriptor` interface added to `packages/core/src/types.ts` and re-exported from `packages/core/src/index.ts`. Importable as `import { type ServiceDescriptor } from '@napplet/core'`.

## Verification

- `pnpm build` passes for @napplet/core
- `pnpm type-check` passes across all packages
- CORE-03 note: service matching is name-only (no semver utility); this is intentional per D-07
