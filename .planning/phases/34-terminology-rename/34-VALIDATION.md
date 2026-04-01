---
phase: 34
slug: terminology-rename
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit/integration) + Playwright (e2e) |
| **Config file** | `vitest.config.ts` per package, `packages/*/vitest.config.ts` |
| **Quick run command** | `pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~15 seconds (type-check), ~60 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite must be green + `grep -r 'napp[^l]' packages/ --include="*.ts" --exclude-dir=node_modules --exclude-dir=dist` returns zero production-code hits
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 34-01-01 | 01 | 1 | TERM-01 | type-check | `pnpm type-check` | ✅ | ⬜ pending |
| 34-01-02 | 01 | 1 | TERM-01 | grep | `grep -r 'NappKeyEntry' packages/runtime/src/types.ts \| wc -l` → 0 | ✅ | ⬜ pending |
| 34-01-03 | 01 | 1 | TERM-01 | grep | `grep -r 'NappKeyEntry' packages/shell/src/types.ts \| wc -l` → 0 | ✅ | ⬜ pending |
| 34-02-01 | 02 | 2 | TERM-01 | file-exists | `test -f packages/runtime/src/session-registry.ts` | ❌ W0 | ⬜ pending |
| 34-02-02 | 02 | 2 | TERM-01 | file-exists | `test ! -f packages/runtime/src/napp-key-registry.ts` | ✅ | ⬜ pending |
| 34-02-03 | 02 | 2 | TERM-01 | type-check | `pnpm type-check` | ✅ | ⬜ pending |
| 34-03-01 | 03 | 3 | TERM-01 | grep | `grep -r 'nappKeyRegistry' packages/runtime --include="*.ts" \| grep -v session \| wc -l` → 0 | ✅ | ⬜ pending |
| 34-03-02 | 03 | 3 | TERM-02 | grep | `grep -r 'napp-state:' packages/runtime/src/state-handler.ts \| wc -l` → 0 | ✅ | ⬜ pending |
| 34-03-03 | 03 | 3 | TERM-02 | grep | `grep -r 'napplet-state:' packages/runtime/src/state-handler.ts \| wc -l` ≥ 1 | ✅ | ⬜ pending |
| 34-04-01 | 04 | 3 | TERM-03 | grep | `grep 'napplet-napp-type' packages/shim/src/index.ts \| wc -l` → 0 (only `napplet-type` now primary) | ✅ | ⬜ pending |
| 34-04-02 | 04 | 3 | TERM-03 | grep | `grep 'napplet-type' packages/shim/src/index.ts \| wc -l` ≥ 1 | ✅ | ⬜ pending |
| 34-05-01 | 05 | 4 | TERM-01 | grep | `grep -r 'napp:state-response' packages/core/src/index.test.ts` → expects `napplet:state-response` | ✅ | ⬜ pending |
| 34-05-02 | 05 | 4 | TERM-05 | grep | `grep 'napp:audio-muted' packages/services/README.md \| wc -l` → 0 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No new test stubs needed — this is a rename phase. Existing type-check + build pipeline validates all changes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `nappState` deprecated alias still works | TERM-01, DOC-02 | Runtime behavior | In shim, verify `import { nappState } from '@napplet/shim'` resolves without TS error; JSDoc shows `@deprecated` |
| Dual-read fallback for old `napp-state:` keys | TERM-02 | localStorage state | In a browser, set a key with old prefix; verify shell runtime reads it via fallback |
| Vite-plugin backward compat meta attr | TERM-03 | Build output inspection | Build a napplet with old `napplet-napp-type` in index.html; verify shim reads it |
| `SessionEntry` deprecated alias exported | TERM-01 | Type resolution | Verify `import type { NappKeyEntry } from '@napplet/runtime'` still works via alias |

---

## Final Gate Command

```bash
cd /home/sandwich/Develop/napplet
pnpm type-check 2>&1 | tail -3
grep -r 'napp[^l]' packages/ --include="*.ts" --exclude-dir=node_modules --exclude-dir=dist | grep -v '\.test\.' | wc -l
# Expected: 0
```
