---
phase: 3
slug: core-protocol-tests
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright Test 1.58.x (e2e), Vitest 4.x (unit) |
| **Config file** | `playwright.config.ts`, `vitest.config.ts` |
| **Quick run command** | `npx playwright test --grep "AUTH\|MSG\|RPL\|LCY"` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --grep "{REQ-ID pattern}"`
- **After every plan wave:** Run `pnpm test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | harness ext | e2e helper | `pnpm test:e2e` | W0 | pending |
| 03-02-01 | 02 | 2 | AUTH-01 | e2e | `npx playwright test auth.spec.ts` | W0 | pending |
| 03-02-02 | 02 | 2 | AUTH-02..09 | e2e | `npx playwright test auth.spec.ts` | W0 | pending |
| 03-03-01 | 03 | 2 | MSG-01..05 | e2e | `npx playwright test routing.spec.ts` | W0 | pending |
| 03-03-02 | 03 | 2 | MSG-06..09 | e2e | `npx playwright test routing.spec.ts` | W0 | pending |
| 03-04-01 | 04 | 2 | RPL-01..05 | e2e | `npx playwright test replay.spec.ts` | W0 | pending |
| 03-05-01 | 05 | 2 | LCY-01..05 | e2e | `npx playwright test lifecycle.spec.ts` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/harness/harness.ts` — extended with __injectMessage__, __createSubscription__, __publishEvent__, __closeSubscription__, __getChallenge__
- [ ] `tests/helpers/auth-event-builder.ts` — helper to construct valid/defective AUTH events with real signatures
- [ ] Existing Playwright + Vitest infrastructure from Phase 2 covers framework needs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RPL-04 seen ID cleanup timing | RPL-04 | May need manual time verification if Date.now mock fails | Run test, verify cleanup log entry after simulated time advance |

*All other behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
