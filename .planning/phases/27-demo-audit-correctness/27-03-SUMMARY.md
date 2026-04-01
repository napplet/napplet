---
phase: 27-demo-audit-correctness
plan: "03"
subsystem: testing
tags: [demo, playwright, vitest, audit, regression]
requires:
  - phase: 27-demo-audit-correctness
    provides: path-aware demo host and debugger wording
provides:
  - demo-specific Playwright regression coverage for relay, state, and signer denial scenarios
  - expanded unit audit coverage for ACL wording and debugger path labels
  - reusable manual audit checklist for remaining interpretation-heavy scenarios
affects:
  - tests/e2e/demo-audit-correctness.spec.ts
  - tests/unit/demo-host-audit.test.ts
  - .planning/phases/27-demo-audit-correctness/27-AUDIT-NOTES.md
  - packages/shim/src/index.ts
tech-stack:
  patterns:
    - Playwright spec self-hosts the demo dev server so demo e2e coverage is independent from the harness app
    - Shim rejects denied signer requests immediately on OK false instead of timing out
key-files:
  created:
    - tests/e2e/demo-audit-correctness.spec.ts
    - .planning/phases/27-demo-audit-correctness/27-AUDIT-NOTES.md
  modified:
    - tests/unit/demo-host-audit.test.ts
    - packages/shim/src/index.ts
key-decisions:
  - "Fixed signer-request timeout handling in the shim because sign:event denial was otherwise too misleading for the demo to audit correctly"
  - "Documented remaining manual diagnosis scenarios in a committed audit table instead of leaving them as tribal knowledge"
requirements-completed:
  - DEMO-01
  - DEMO-02
  - DEMO-03
duration: "55 min"
completed: "2026-04-01"
---

# Phase 27 Plan 03: Regression coverage and audit notes for demo correctness

Phase 27 now leaves behind durable evidence: focused Playwright scenarios for relay, state, and signer denials, expanded unit assertions for wording/path metadata, a committed manual audit checklist, and a shim fix that turns denied signer requests into immediate, understandable failures.

## Verification

- `pnpm vitest run tests/unit/demo-host-audit.test.ts` — PASS
- `pnpm playwright test tests/e2e/demo-audit-correctness.spec.ts` — PASS

## Deviations from Plan

The shim signer-denial fix expanded slightly beyond the demo app because phase 27 exposed a real correctness bug: denied signer requests were timing out instead of failing immediately.

## Issues Encountered

- The Playwright spec needed to self-host the demo app because the default e2e harness server does not serve the demo UI.

## Self-Check: PASSED
