---
quick_id: 260424-o1k
description: Implement default shell.supports() in shim so napplets can be tested without a shell
date: 2026-04-24
commit: 5ad9cdb
status: Complete
---

# Quick Task 260424-o1k — Summary

## What changed

`packages/shim/src/index.ts` (+24 / −5):

1. Split `import type { NappletGlobal } from '@napplet/core'` into a value import (`NUB_DOMAINS`) plus a type-only import (`NappletGlobal`, `NamespacedCapability`).
2. Added module-local `defaultShellSupports(capability: NamespacedCapability): boolean`:
   - `perm:*` → `false` (shim has nothing to grant)
   - `nub:<domain>` → `true` iff `<domain>` is in `NUB_DOMAINS`
   - bare shorthand (`'relay'`, etc.) → `true` iff in `NUB_DOMAINS`
   - unknown → `false`
3. Replaced the stubbed `shell: { supports(_capability) { return false; } }` with `shell: { supports: defaultShellSupports }` (reference form — leaves the slot writeable so a shell can still overwrite it at runtime).

## Why

The shim mounts every NUB shim unconditionally on `window.napplet`, so reporting `false` for everything left napplets unable to be developed or tested in a bare browser tab — every `if (window.napplet.shell.supports('relay'))` short-circuited to the no-shell fallback. The default now matches what the shim actually installs. Per user direction: it's a fallback, not a contract — a host shell may still overwrite `window.napplet.shell.supports` at runtime with its own capability-injection logic.

## Verification

| Gate | Command | Result |
|---|---|---|
| Type-check | `pnpm --filter @napplet/shim type-check` | exit 0 |
| Build | `pnpm --filter @napplet/shim build` | exit 0 |
| Helper survives bundling | `grep -q 'NUB_DOMAINS' packages/shim/dist/index.js` | exit 0 |
| Stub TODO removed | `grep -q 'TODO: Shell populates' packages/shim/src/index.ts` | exit 1 (expected) |

No tests were added — `packages/shim/` has no vitest setup (`"test:unit": "echo 'no unit tests'"` in package.json) and the constraints forbade introducing a runner just for this.

## Spec posture

NIP-5D defines `shell.supports()` as a runtime query and says nothing about a default. The shim's default is therefore additive — purely a developer-experience improvement for shell-less iframes. Shells that inject their own `window.napplet.shell` (or replace `supports` directly) are fully unaffected.

## Commits

- `5ad9cdb` — feat(shim): default shell.supports() for shell-less napplet testing

## Anti-scope (held)

No feature negotiation, no install-time NUB registry, no version flags, no developer-mode toggle, no `Object.defineProperty`/`freeze` on the slot, no `console.warn` diagnostics, no helper export, no changes to `@napplet/core`, no test runner introduced.

## Execution note

The executor's commit landed cleanly (`5ad9cdb`). Its first attempt to write this SUMMARY.md hit a transient `ENOSPC` (disk briefly hit 100% full); space cleared during the same session and the orchestrator wrote the summary on the resume pass. No fix-up commits were needed for the implementation.
