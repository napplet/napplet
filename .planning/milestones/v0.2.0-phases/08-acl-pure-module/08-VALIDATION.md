---
phase: 08
slug: acl-pure-module
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-30
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (Node.js mode — no browser needed for pure functions) |
| **Config file** | packages/acl/vitest.config.ts (Wave 0 creates if needed) |
| **Quick run command** | `pnpm --filter @napplet/acl type-check` |
| **Full suite command** | `pnpm --filter @napplet/acl build && pnpm --filter @napplet/acl type-check` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @napplet/acl type-check`
- **After every plan wave:** Run `pnpm --filter @napplet/acl build && pnpm --filter @napplet/acl type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | ACL-04 | file check | `test -f packages/acl/package.json && grep -q '"dependencies": {}' packages/acl/package.json` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | ACL-04 | file check | `grep -q '"ES2022"' packages/acl/tsconfig.json && ! grep -q '"DOM"' packages/acl/tsconfig.json` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | ACL-04 | file check | `test -f packages/acl/tsup.config.ts` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | ACL-03,ACL-04 | grep | `grep -c 'CAP_RELAY_READ' packages/acl/src/types.ts` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | ACL-01,ACL-02 | grep | `grep -q 'export function check' packages/acl/src/check.ts` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | ACL-03,ACL-05 | grep | `grep -c 'export function' packages/acl/src/mutations.ts` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 3 | ACL-01 | grep | `grep -q 'export { check }' packages/acl/src/index.ts` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 3 | ACL-04 | build | `pnpm --filter @napplet/acl build` | ❌ W0 | ⬜ pending |
| 08-03-03 | 03 | 3 | ACL-04 | type-check | `pnpm --filter @napplet/acl type-check` | ❌ W0 | ⬜ pending |
| 08-03-04 | 03 | 3 | ACL-04 | grep | `grep -rn "^import" packages/acl/src/ \| grep -v "from '\./" \| wc -l` → must be 0 | ❌ W0 | ⬜ pending |
| 08-03-05 | 03 | 3 | ACL-06 | manual | Module behavior describable in <100 words | N/A | ⬜ pending |

*Status: ⬜ pending / ✅ green / ❌ red / ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/acl/` directory created
- [ ] All source files created by plans 01-03

*Existing infrastructure covers test framework needs (vitest available at monorepo root).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Module describable in <100 words | ACL-06 | Subjective simplicity metric | Read index.ts JSDoc, write a description, count words. Must be <=100. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
