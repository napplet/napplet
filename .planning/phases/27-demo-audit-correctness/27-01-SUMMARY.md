---
phase: 27-demo-audit-correctness
plan: "01"
subsystem: demo
tags: [demo, runtime, signer, audit, protocol]
provides:
  - audited demo protocol-path inventory exported from the host
  - explicit signer mode metadata for demo host boot flow
  - unit coverage for host audit metadata
affects:
  - apps/demo/src/shell-host.ts
  - apps/demo/src/main.ts
  - apps/demo/src/signer-demo.ts
  - tests/unit/demo-host-audit.test.ts
tech-stack:
  patterns:
    - Host metadata exported as typed constants for UI and tests
    - Demo signer wired through registered service path, not implicit fallback wording
key-files:
  modified:
    - apps/demo/src/shell-host.ts
    - apps/demo/src/main.ts
    - apps/demo/src/signer-demo.ts
    - apps/demo/package.json
    - apps/demo/vite.config.ts
    - vitest.config.ts
    - tests/unit/demo-host-audit.test.ts
key-decisions:
  - "Used the runtime's registered signer service path for the demo so host metadata reflects current architecture"
  - "Exported audited path metadata from shell-host.ts so later UI and tests share one source of truth"
requirements-completed:
  - DEMO-01
  - DEMO-03
duration: "35 min"
completed: "2026-04-01"
---

# Phase 27 Plan 01: Demo host audit metadata and signer topology summary

The demo host now exports a typed protocol-path inventory, announces audited host readiness at boot, and exposes an explicit signer mode backed by the registered signer service path instead of ambiguous shell-era wording.

## Verification

- `pnpm --filter @napplet/demo build` — PASS
- `pnpm vitest run tests/unit/demo-host-audit.test.ts` — PASS

## Deviations from Plan

None. The only supporting change was adding local workspace resolution for `@napplet/services` in demo/Vitest config so the new signer service path builds from source.

## Issues Encountered

- Demo and Vitest could not resolve `@napplet/services` from workspace source until explicit aliases were added.

## Self-Check: PASSED
