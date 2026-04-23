---
phase: 5
slug: demo-playground
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-30
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual visual verification + Playwright smoke test |
| **Config file** | `playwright.config.ts` (existing) |
| **Quick run command** | `pnpm --filter @napplet/demo dev` (visual check) |
| **Full suite command** | `pnpm build && pnpm --filter @napplet/demo build` |
| **Estimated runtime** | ~15 seconds (build), manual for visual |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @napplet/demo build` (build succeeds)
- **After every plan wave:** Start dev server, visual check of demo
- **Before `/gsd:verify-work`:** Full build + visual walkthrough of all 7 demo scenarios
- **Max feedback latency:** 15 seconds (build check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | - | build | `pnpm build` | n/a | pending |
| 05-01-02 | 01 | 1 | - | build | `pnpm --filter @napplet/demo build` | n/a | pending |
| 05-02-01 | 02 | 2 | DEMO-01, DEMO-02 | visual | Start dev server, verify 2 iframes load + AUTH | n/a | pending |
| 05-02-02 | 02 | 2 | DEMO-03 | visual | Verify color-coded messages in debugger live log | n/a | pending |
| 05-03-01 | 03 | 2 | - | build | `pnpm --filter @napplet/demo-chat build` | n/a | pending |
| 05-03-02 | 03 | 2 | - | build | `pnpm --filter @napplet/demo-bot build` | n/a | pending |
| 05-04-01 | 04 | 3 | DEMO-04 | visual | Chat sends message, bot receives via inter-pane | n/a | pending |
| 05-04-02 | 04 | 3 | DEMO-05 | visual | Toggle ACL, verify immediate effect in debugger | n/a | pending |
| 05-04-03 | 04 | 3 | DEMO-06 | visual | Trigger signer request, verify flow in debugger | n/a | pending |
| 05-04-04 | 04 | 3 | DEMO-07 | visual | Set/get storage, verify isolation between napplets | n/a | pending |
| 05-05-01 | 05 | 3 | DEMO-03 | visual | Sequence diagram renders correctly | n/a | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers build verification
- No new test framework installation needed
- Phase 5 is primarily visual -- manual verification via dev server is the primary test method

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Two napplets load and AUTH | DEMO-01, DEMO-02 | Visual iframe loading | Start dev server, open in browser, verify two iframes render and AUTH OK appears in debugger |
| Message debugger shows traffic | DEMO-03 | Visual rendering | Verify color-coded messages scroll in live log, filter controls work |
| Inter-pane communication visible | DEMO-04 | Visual message flow | Type message in chat, verify bot receives and debugger shows the flow |
| ACL controls produce visible effect | DEMO-05 | Interactive toggle | Revoke relay:write on chat, verify next publish shows CLOSED/denied in debugger |
| Signer delegation visible | DEMO-06 | Visual flow | Trigger signature request, verify request/response appears in debugger |
| Storage operations visible | DEMO-07 | Visual isolation | Set key in chat, verify bot cannot read it, verify values in debugger |

---

## Validation Sign-Off

- [x] All tasks have automated build verify or manual visual verification
- [x] Sampling continuity: every wave has build + visual check
- [x] Wave 0 not needed -- existing build infrastructure sufficient
- [x] No watch-mode flags
- [x] Feedback latency < 15s for build checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

*Phase: 05-demo-playground*
*Validation strategy: 2026-03-30*
