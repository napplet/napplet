# Phase 111 — PR Handoff Instructions

**Date:** 2026-04-17
**Branch:** /home/sandwich/Develop/nubs/ @ nub-config
**HEAD commit SHA:** cc880560487c15b322d9237ca396fd37ebb94330

## Status

PR OPENED as napplet/nubs#13

## Contents

Local branch contains 5 commits relative to master:

- `cc88056` docs: add NUB-CONFIG to registry table
- `15addd6` docs: complete NUB-CONFIG spec (anti-features, security, error envelopes)
- `d7afd07` docs: add Shell Guarantees MUST/SHOULD/MAY tables
- `4a480d7` docs: add Schema Contract -- Core Subset, extensions, $version, pattern exclusion
- `29baaac` docs: add NUB-CONFIG spec skeleton (description, API surface, wire protocol)

Files modified vs master:
- NUB-CONFIG.md — 348 lines
- README.md — registry row added for NUB-CONFIG

## To Push (if not already pushed)

```bash
cd /home/sandwich/Develop/nubs
git push -u origin nub-config
```

## To Open PR (if not already opened)

Use the `gh pr create` command documented in 111-04-PLAN.md Task 3.

## Verification

After the PR is open, run:
```bash
gh pr view --repo napplet/nubs --json number,title,state,body | head -40
gh pr diff --repo napplet/nubs 13 | grep '@napplet/' && echo LEAK || echo CLEAN
```
Expect CLEAN.

## Rollback

If something is wrong after push, DO NOT force-push to master. Instead:
- Close the PR with a comment
- Create a new branch (e.g., `nub-config-v2`) from master
- Re-apply fixes
- Open a replacement PR

## What's Next (milestone v0.25.0)

With NUB-CONFIG spec locked (this phase), the next phases are in /home/sandwich/Develop/napplet/:
- Phase 112: NUB Config Package Scaffold
- Phase 113: NUB Config Shim + SDK
- Phase 114: Vite-Plugin Extension
- Phase 115: Core / Shim / SDK Integration + Wire
- Phase 116: Documentation

These phases implement the spec in the private napplet monorepo. Per project memory, none of these implementations are surfaced in the public nubs repo.
