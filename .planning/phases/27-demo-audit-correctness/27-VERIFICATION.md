---
status: passed
phase: 27-demo-audit-correctness
verified_at: 2026-04-01
---

# Phase 27: Demo Audit & Correctness — Verification

## Phase Goal

Reconcile the demo with the current `@napplet/*` architecture, identify stale integrations and correctness bugs, and make protocol failures understandable enough to distinguish UI issues from real ACL, runtime, or service behavior.

**Result: PASSED** — DEMO-01, DEMO-02, and DEMO-03 are covered by audited host metadata, path-aware diagnostics, automated regression checks, and committed audit notes for the remaining manual scenarios.

## Must-Have Verification

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| DEMO-01 | Demo boots on current `@napplet/*` packages without stale integration paths or broken imports | PASS | Demo host registers signer service explicitly, exports path inventory, and `pnpm --filter @napplet/demo build` passes |
| DEMO-02 | Capability revocation shows the affected path without implying unrelated paths failed | PASS | ACL labels, debugger path tags, and sequence labels distinguish relay publish, relay subscribe, inter-pane, state, and signer flows |
| DEMO-03 | Demo exposes enough detail to classify UI wording vs ACL/runtime/service behavior | PASS | Debugger preserves raw denial strings, audit notes identify likely fault layer, and Playwright scenarios assert exact denial text |

## Automated Checks

```text
pnpm --filter @napplet/demo build → PASS
pnpm vitest run tests/unit/demo-host-audit.test.ts → PASS
pnpm playwright test tests/e2e/demo-audit-correctness.spec.ts → PASS
```

## Behavioral Verification

1. **Host topology is explicit**: `apps/demo/src/shell-host.ts` exports audited path metadata and explicit `DEMO_SIGNER_MODE`, and `apps/demo/src/main.ts` surfaces that metadata at boot.
2. **Debugger is path-aware**: `apps/demo/src/debugger.ts` classifies relay publish, relay subscribe, inter-pane send/receive, state read/write, signer request/response, and auth paths while retaining exact denial strings.
3. **ACL copy is architecture-accurate**: `apps/demo/src/acl-panel.ts` no longer uses stale `Read Shell` / `Write Shell` wording.
4. **Signer denial is immediate**: `packages/shim/src/index.ts` now rejects denied signer requests on `OK false`, preventing misleading 30-second timeouts.
5. **Manual follow-up is documented**: `.planning/phases/27-demo-audit-correctness/27-AUDIT-NOTES.md` captures the remaining scenario matrix with likely fault layers.

## Human Verification Items

None required for phase completion. Manual scenarios remain documented in `27-AUDIT-NOTES.md`, but they are audit follow-ups rather than blockers.

## Issues Found

- Napplet-local denial copy is still less reliable than debugger output for some relay/state denial paths, so automated verification treats the debugger as the canonical evidence surface.
