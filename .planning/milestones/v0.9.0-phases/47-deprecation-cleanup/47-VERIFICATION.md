---
phase: 47
status: passed
verified: 2026-04-02
verifier: inline
---

# Phase 47: Deprecation Cleanup — Verification

## Goal Check

**Goal:** Consumers who depended on RuntimeHooks or ShellHooks aliases get clear build failures pointing them to RuntimeAdapter and ShellAdapter

**Result: PASSED**

## Must-Haves

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `import { RuntimeHooks } from '@napplet/runtime'` fails at compile time | PASS | Type alias deleted from types.ts (line 653-654 removed), re-export removed from index.ts |
| 2 | `import { ShellHooks } from '@napplet/shell'` fails at compile time | PASS | Type alias deleted from types.ts (line 245-246 removed), re-export removed from index.ts |
| 3 | All internal code uses RuntimeAdapter/ShellAdapter exclusively | PASS | `grep -r "RuntimeHooks\|ShellHooks" packages/ apps/ tests/ --include="*.ts"` returns zero matches |

## Automated Checks

- `pnpm build` -- 15/15 packages build successfully
- `pnpm type-check` -- 16/16 type-check tasks pass
- `pnpm --filter @napplet/runtime test:unit` -- 46/46 tests pass
- `grep -r "RuntimeHooks" packages/ apps/ tests/ --include="*.ts"` -- 0 matches
- `grep -r "ShellHooks" packages/ apps/ tests/ --include="*.ts"` -- 0 matches
- `grep -r "createMockRuntimeHooks" packages/ apps/ tests/ --include="*.ts"` -- 0 matches
- `grep -r "RuntimeHooks" packages/ --include="*.md"` -- 0 matches
- `grep -r "ShellHooks" packages/ --include="*.md"` -- 0 matches

## Requirements Traced

| Requirement | Description | Status |
|-------------|-------------|--------|
| DEP-03 | RuntimeHooks deprecated alias removed from @napplet/runtime | VERIFIED |
| DEP-04 | ShellHooks deprecated alias removed from @napplet/shell | VERIFIED |

## Summary

Phase 47 is a pure deletion/rename phase with no behavioral changes. All deprecated type aliases and test utilities have been permanently removed. The build, type-check, and test suite all pass cleanly. Zero occurrences of the deprecated names remain in any TypeScript or Markdown file.
