---
phase: 35
slug: wire-protocol-rename
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit/integration) |
| **Config file** | `vitest.config.ts` per package |
| **Quick run command** | `pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~15 seconds (type-check), ~60 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check`
- **After Plan 35-01 completes:** Run full negative grep on production files
- **After Plan 35-02 completes:** Run full negative grep including test files — must be zero
- **Before `/gsd:verify-work`:** Full suite green + zero grep hits in packages/ + zero grep hits in SPEC.md

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 35-01-01 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE' packages/core/src/constants.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-01 | 01 | 1 | WIRE-01 | grep | `grep 'IPC_PEER' packages/core/src/constants.ts \| wc -l` ≥ 2 | ⬜ pending |
| 35-01-02 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE\|inter-pane' packages/core/src/topics.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-03 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE' packages/runtime/src/runtime.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-04 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE\|inter-pane' packages/runtime/src/enforce.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-05 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE' packages/runtime/src/service-dispatch.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-06 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE' packages/runtime/src/state-handler.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-07 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE' packages/services/src/audio-service.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-08 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE' packages/services/src/notification-service.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-09 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE' packages/shell/src/audio-manager.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-10 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE' packages/shell/src/state-proxy.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-11 | 01 | 1 | WIRE-01 | grep | `grep 'INTER_PANE\|inter-pane' packages/shim/src/index.ts \| wc -l` → 0 | ⬜ pending |
| 35-01-ALL | 01 | 1 | WIRE-01 | type-check | `pnpm type-check` → exits 0 | ⬜ pending |
| 35-02-01 | 02 | 2 | WIRE-01 | grep | `grep 'INTER_PANE' packages/core/src/index.test.ts \| wc -l` → 0 | ⬜ pending |
| 35-02-02 | 02 | 2 | WIRE-01 | grep | `grep 'INTER_PANE\|inter-pane' packages/runtime/src/dispatch.test.ts \| wc -l` → 0 | ⬜ pending |
| 35-02-03 | 02 | 2 | WIRE-01 | grep | `grep 'INTER_PANE' packages/services/src/notification-service.test.ts \| wc -l` → 0 | ⬜ pending |
| 35-02-ALL | 02 | 2 | WIRE-01 | grep | `grep -r 'INTER_PANE\|INTER-PANE\|inter-pane' packages/ --include="*.ts" --exclude-dir=node_modules --exclude-dir=dist \| wc -l` → 0 | ⬜ pending |
| 35-03-01 | 03 | 3 | WIRE-02 | grep | `grep -c 'INTER_PANE\|INTER-PANE\|inter-pane\|Inter-Pane' SPEC.md` → 0 | ⬜ pending |
| 35-03-02 | 03 | 3 | WIRE-02 | grep | `grep -c 'IPC-\* Namespace' SPEC.md` ≥ 1 | ⬜ pending |
| 35-03-02 | 03 | 3 | WIRE-02 | grep | `grep -c 'IPC_BROADCAST' SPEC.md` ≥ 1 | ⬜ pending |
| 35-03-03 | 03 | 3 | WIRE-02 | grep | `grep -n 'Blocked Napplet Behavior' SPEC.md \| wc -l` ≥ 1 | ⬜ pending |
| 35-03-03 | 03 | 3 | WIRE-02 | grep | `grep 'napp:audio-muted' SPEC.md \| wc -l` ≥ 1 (topic string preserved) | ⬜ pending |
| 35-03-03 | 03 | 3 | WIRE-02 | grep | `grep 'napp-state:' SPEC.md \| wc -l` ≥ 1 (storage key preserved) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No new test infrastructure needed. This is a rename phase. The existing `pnpm type-check` and negative grep pipeline validates all changes. Wave 0 is complete by design.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `BusKind.IPC_PEER` numeric value is still 29003 | WIRE-01 | Runtime behavior | `node -e "import('@napplet/core/dist/index.js').then(m => console.log(m.BusKind.IPC_PEER))"` should print 29003 |
| dist/ files regenerate correctly after build | WIRE-01 | Build output | Run `pnpm build`; verify `packages/core/dist/index.d.ts` contains `IPC_PEER: 29003` not `INTER_PANE` |
| SPEC.md topic strings preserved | WIRE-02 | Doc review | Manually confirm `napp:audio-muted`, `napp:state-response`, `napp-state:` still appear in SPEC.md where they describe wire protocol values |

---

## Final Gate Command

```bash
cd /home/sandwich/Develop/napplet

# WIRE-01: Zero INTER_PANE in all source files
grep -r 'INTER_PANE\|INTER-PANE\|inter-pane' packages/ \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=dist

# WIRE-02: Zero INTER_PANE in SPEC.md
grep -c 'INTER_PANE\|INTER-PANE\|inter-pane\|Inter-Pane' SPEC.md

# Type safety
pnpm type-check 2>&1 | tail -3
```

Expected: all three commands return 0 / exit 0.
