---
status: passed
phase: 07-nomenclature
verified: 2026-03-30
verifier: inline (1M context orchestrator)
---

# Phase 7: Nomenclature — Verification Report

## Goal
All code, tests, spec, and demo use the canonical names (ShellBridge, state) so that new architecture work builds on correct terminology from day one.

## Must-Have Verification

### REN-01: createShellBridge is the sole factory function name
- **Status:** PASS
- **Evidence:** `grep -r "createShellBridge" packages/shell/src/index.ts` matches; `grep -r "createPseudoRelay" packages/ apps/ tests/ --include="*.ts"` returns zero matches

### REN-02: ShellBridge is the sole type name
- **Status:** PASS
- **Evidence:** `grep "ShellBridge" packages/shell/src/shell-bridge.ts` returns 7 matches; `grep -r "PseudoRelay" packages/ apps/ tests/ --include="*.ts"` returns zero matches

### REN-03: shell-bridge.ts is the sole source file name
- **Status:** PASS
- **Evidence:** `packages/shell/src/shell-bridge.ts` exists; `packages/shell/src/pseudo-relay.ts` does not exist

### REN-04: All test imports use new names
- **Status:** PASS
- **Evidence:** `grep "createShellBridge" tests/e2e/harness/harness.ts` returns 2 matches; `grep "ShellBridge" tests/e2e/harness/harness.ts` returns 3+ matches; zero old references in any test file

### REN-05: Demo app uses new names
- **Status:** PASS
- **Evidence:** `grep "createShellBridge" apps/demo/src/shell-host.ts` returns 2 matches; `grep "ShellBridge" apps/demo/src/shell-host.ts` returns 3+ matches

### REN-06: SPEC.md uses ShellBridge throughout
- **Status:** PASS
- **Evidence:** `grep -c "pseudo-relay" SPEC.md` returns 0; `grep "ShellBridge" SPEC.md` returns 3 matches

### REN-07: SHELL_BRIDGE_URI is the constant name
- **Status:** PASS
- **Evidence:** `grep "SHELL_BRIDGE_URI" packages/shell/src/types.ts` matches `export const SHELL_BRIDGE_URI = 'napplet://shell' as const;`; `grep "PSEUDO_RELAY_URI" packages/shell/src/types.ts` returns zero matches

### REN-08: README uses new API names
- **Status:** PASS
- **Evidence:** `grep -c "createShellBridge" packages/shell/README.md` returns 4; `grep -c "createPseudoRelay" packages/shell/README.md` returns 0

### STA-01: All test capability strings use state:read/state:write
- **Status:** PASS
- **Evidence:** `grep -r "storage:read\|storage:write" tests/ --include="*.ts"` returns zero matches

### STA-02: Test file is named state-isolation.spec.ts
- **Status:** PASS
- **Evidence:** `tests/e2e/state-isolation.spec.ts` exists; `tests/e2e/storage-isolation.spec.ts` does not exist

### STA-03: All test topic strings use shell:state-*
- **Status:** PASS
- **Evidence:** `grep -r "shell:storage-" tests/ --include="*.ts"` returns zero matches; `grep "shell:state-get" tests/e2e/acl-enforcement.spec.ts` returns 1 match; `grep "shell:state-set" tests/e2e/acl-enforcement.spec.ts` returns 1 match

### STA-04: Test harness has no remaining storage capability references
- **Status:** PASS
- **Evidence:** `grep -r "napp:storage-" tests/ --include="*.ts"` returns zero matches

## Build Verification

| Check | Result |
|-------|--------|
| `pnpm build` | PASS (exit 0, 10/10 packages built) |
| `pnpm type-check` | PASS (exit 0, 6/6 type-checks clean) |

## Comprehensive Grep Check

```
grep -r "createPseudoRelay\|PseudoRelay\|PSEUDO_RELAY_URI\|pseudo-relay" packages/ apps/ tests/ SPEC.md --include="*.ts" --include="*.md"
```
Result: **Zero matches** (excluding .planning/ directory)

## Summary

| Category | Must-Haves | Passed | Failed |
|----------|-----------|--------|--------|
| REN (ShellBridge rename) | 8 | 8 | 0 |
| STA (storage-to-state) | 4 | 4 | 0 |
| **Total** | **12** | **12** | **0** |

**Verdict: PASSED** — All 12 requirements verified. Phase goal achieved.
