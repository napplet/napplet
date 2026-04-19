---
quick_id: 260419-i6c
date: 2026-04-19
description: Republish napplet packages as 0.2.1 with resolved workspace:* deps
status: committed-pending-gha
commit: ec677fb
---

# Quick Task 260419-i6c: Republish 0.2.1

## Problem

The 0.2.0 publish shipped 8 of 13 @napplet/* packages with unresolved
`workspace:*` dep specs in their published package.json, breaking npm
installs for external consumers (`npm install @napplet/shim` fails on
unknown protocol).

Likely cause: 0.2.0 was published outside the `.github/workflows/publish.yml`
GHA pipeline (no `chore: version packages` commit in the history around
the 0.2.0 tag), so pnpm's workspace-protocol rewrite never ran.

## What was done

1. **Single patch changeset** — wrote `.changeset/republish-0-2-1.md` listing
   all 13 packages as `patch`, then ran `pnpm changeset version` to bump
   every package 0.2.0 → 0.2.1 in lockstep and generate per-package
   `CHANGELOG.md` entries.
2. **Dry-run verification** — ran `pnpm build` (13/13 green) then
   `pnpm publish -r --access public --no-git-checks --dry-run` to confirm
   pnpm rewrites `workspace:*` → `"0.2.1"` at pack time. Log at
   `/tmp/napplet-publish-dryrun.log`: 13 `+ @napplet/*@0.2.1` lines,
   **zero `workspace:` substrings**.
3. **Extra audit** — packed the real `@napplet/shim` tarball via
   `pnpm pack` and inspected `package/package.json`; all 9 `@napplet/*`
   deps present as concrete `"0.2.1"` strings. Rewrite definitively works.
4. **User pivot at human-verify gate** — user chose to commit + push to
   main and let GHA (`.github/workflows/publish.yml`,
   `changesets/action@v1`) run the real publish instead of publishing
   locally. Rationale: keep release path through CI.
5. **Committed** — `chore: bump packages to 0.2.1` (ec677fb): 13
   package.json bumps, 13 new CHANGELOG.md files. pnpm-lock.yaml
   intentionally unchanged (workspace-protocol links don't require
   lockfile mutation on version-only bumps).

## Packages bumped (13)

| Package | Before | After | Workspace deps |
|---|---|---|---|
| @napplet/core | 0.2.0 | 0.2.1 | 0 |
| @napplet/vite-plugin | 0.2.0 | 0.2.1 | 0 |
| @napplet/shim | 0.2.0 | 0.2.1 | 9 |
| @napplet/sdk | 0.2.0 | 0.2.1 | 10 |
| @napplet/nub-config | 0.2.0 | 0.2.1 | 1 |
| @napplet/nub-identity | 0.2.0 | 0.2.1 | 1 |
| @napplet/nub-ifc | 0.2.0 | 0.2.1 | 1 |
| @napplet/nub-keys | 0.2.0 | 0.2.1 | 1 |
| @napplet/nub-media | 0.2.0 | 0.2.1 | 1 |
| @napplet/nub-notify | 0.2.0 | 0.2.1 | 1 |
| @napplet/nub-relay | 0.2.0 | 0.2.1 | 1 |
| @napplet/nub-storage | 0.2.0 | 0.2.1 | 1 |
| @napplet/nub-theme | 0.2.0 | 0.2.1 | 1 |

## Pending verification (post-push)

Once GHA publish completes, confirm registry tarballs are clean:

```
curl -fsSL https://registry.npmjs.org/@napplet/shim/0.2.1 | python3 -m json.tool | grep -c 'workspace:'
curl -fsSL https://registry.npmjs.org/@napplet/sdk/0.2.1  | python3 -m json.tool | grep -c 'workspace:'
```

Both should output `0`.

## Anomalies

- `pnpm-lock.yaml` did not change during `pnpm install` after version
  bumps — expected behavior when internal deps use `workspace:*` and no
  external deps changed. Lockfile encodes workspace links by package
  reference, not version string.
- Changesets' `updateInternalDependencies: "patch"` config did not
  rewrite `workspace:*` in source `package.json` files — fine; pnpm
  rewrites at pack time regardless.
