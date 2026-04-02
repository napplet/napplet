---
plan: 44-01
title: "Update SPEC.md for shim/SDK split"
status: complete
started: 2026-04-02T16:40:00.000Z
completed: 2026-04-02T16:45:00.000Z
---

# Summary: 44-01 Update SPEC.md for Shim/SDK Split

## What was built

Three surgical edits to SPEC.md to reflect the v0.8.0 shim/SDK split:

1. **Section 4.1** updated to describe both `@napplet/shim` (side-effect-only window installer) and `@napplet/sdk` (named TypeScript exports) with the `window.napplet` shape
2. **Section 16.1** gained a blockquote note after the raw wire protocol example, directing developers to the convenience packages
3. **Section 17.1** package list expanded from 3 to 8 packages (shim, sdk, core, runtime, acl, services, shell, vite-plugin) with accurate descriptions

## Key decisions

- No new section added per CONTEXT D-01 -- only existing sections updated
- Raw wire protocol example preserved unchanged -- the note supplements, not replaces

## Key files

- `SPEC.md` (modified)

## Self-Check: PASSED
