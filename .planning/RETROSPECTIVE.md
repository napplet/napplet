# Retrospective: Napplet Protocol SDK

---

## Milestone: v0.4.0 — Feature Negotiation & Service Discovery

**Shipped:** 2026-03-31
**Phases:** 6 (18–22.1, including 1 inserted decimal) | **Plans:** 19 | **Tasks:** 43

### What Was Built

- **Phase 18**: `ServiceDescriptor` in @napplet/core; `ServiceHandler`, `ServiceRegistry`, topic-prefix routing in @napplet/runtime — dispatch backbone
- **Phase 19**: Kind 29010 REQ/EVENT/EOSE synthetic protocol; live subscription updates when services register dynamically
- **Phase 20**: `@napplet/services` package with `createAudioService` and `createNotificationService` — two concrete ServiceHandler proofs
- **Phase 21**: `window.napplet` global with `discoverServices()`, `hasService()`, `hasServiceVersion()` and session-scoped cache
- **Phase 22**: Vite plugin `requires` injection; runtime compatibility check at AUTH; `CompatibilityReport` via `onCompatibilityIssue`; strict/permissive mode; undeclared service consent at INTER_PANE dispatch
- **Phase 22.1** (inserted): Signer, relay pool, cache extracted as `ServiceHandler`s; `RuntimeHooks.relayPool`/`.cache` now optional; dual-path dispatch with hook fallback

### What Worked

- **Decimal phase insertion** (22.1) handled the scope expansion cleanly — SVC-04 moved from Phase 20 to dedicated phase without disrupting the existing plan
- **Reusing ConsentRequest for undeclared service consent** — zero new API surface, shell hosts get one integration point for all consent scenarios
- **Dual-path dispatch** for core infra migration — backwards-compatible, no breaking changes while completing the unified service model
- **handleMessage(windowId, message, send) interface** proved simple enough that all 5 concrete services (audio, notifications, signer, relay, cache) fit the pattern without adaptation
- **Session-scoped cache** in discovery shim prevented redundant REQ round-trips and simplified napplet-side code

### What Was Inefficient

- **Stale REQUIREMENTS.md checkboxes** required a retroactive fix pass before archival — 15 of 27 checkboxes were unchecked despite implementations being complete. Root cause: the traceability table was seeded with "Pending" and not updated during execution. Fix: update checkboxes as part of each phase's UAT or SUMMARY step.
- **Missing VERIFICATION.md for phases 18 and 22.1** — doc gaps noted in audit. Phase 18 was the first phase executed and skipped the VERIFICATION step; 22.1 was added urgently and also skipped it. Low severity but pattern worth correcting.
- **Nyquist VALIDATION.md not applied** to any v0.4.0 phase — the workflow existed but was not part of the execution pattern this milestone.

### Patterns Established

- `ServiceHandler` as the universal extension point — audio, notifications, signer, relay, cache all fit the same `handleMessage` interface
- Reuse of existing consent machinery (ConsentRequest) for new consent scenarios rather than new hooks
- Decimal phase insertion as a first-class mechanism for urgent scope additions mid-milestone

### Key Lessons

- **Update requirement checkboxes during execution, not retroactively** — the traceability table is cheapest to maintain per-plan
- **VERIFICATION.md for every phase** — even simple phases. The audit found missing artifacts for phases 18 and 22.1 specifically because they were either the first or urgently inserted
- **Dual-path migration pattern** (service → hook fallback) is effective for backwards-compatible API evolution — worth applying to future migrations

### Cost Observations

- Sessions: concentrated single-day effort (all phases 2026-03-31)
- Decimal phase (22.1) added ~4 plans but closed a critical gap (SVC-04) that would have left core infra non-discoverable
- No significant rework required — plan quality was high, execution was clean

---

## Milestone: v0.5.0 — Documentation & Developer Skills

**Shipped:** 2026-04-01
**Phases:** 4 (23-26) | **Plans:** 12

### What Was Built

- **Phase 23**: READMEs for 4 new packages (@napplet/acl, @napplet/core, @napplet/runtime, @napplet/services) — complete API documentation from source
- **Phase 24**: Root README rewrite and 3 existing package README updates (shim, shell, vite-plugin) for 7-package v0.4.0 SDK
- **Phase 25**: SPEC.md rewrite — Section 11 (kind 29010 service discovery), ShellBridge rename completion, Sections 2.9/2.10/15.6 (requires/compat/consent)
- **Phase 26**: 3 agentskills.io-format skill files: build-napplet, integrate-shell, add-service

### What Worked

- **Source-first README writing** — all READMEs written by reading actual source, not paraphrasing the spec. Caught real API discrepancies early.
- **Skill files as portable knowledge** — agentskills.io format proved well-suited for agent consumption. Skills reference exact imports and types.
- **Background agent parallelism** — Phase 26 plan + execute ran as background agents while manager dashboard stayed interactive. Clean async coordination.

### What Was Inefficient

- **Phase 24 has no execution record** — no SUMMARY.md or VERIFICATION.md. Work was done but the GSD execution tracking was bypassed. Deliverables confirmed on disk but no formal verification.
- **REQUIREMENTS.md traceability stale again** — all 14 requirements still showed "Pending" checkboxes despite being complete. Same pattern as v0.4.0.
- **SKILL-01/02/03 never added to traceability table** — requirements were defined but the traceability section wasn't updated to include the Skills row.
- **originRegistry.register() argument order bug in shell README** — caught by integration checker during milestone audit, not during phase execution.

### Patterns Established

- **Documentation milestones follow code milestones** — separating docs from code work produces focused, higher-quality output
- **Integration checker as quality gate** — cross-phase wiring checks caught real bugs (argument order inversion) that per-phase verification missed
- **Skills as a first-class deliverable** — portable, agent-consumable documentation alongside traditional READMEs

### Key Lessons

- **VERIFICATION.md for EVERY phase, including docs-only phases** — Phase 24's missing record was the biggest audit gap
- **Update traceability table during execution** — same lesson from v0.4.0; still not automated
- **Cross-reference documentation** — per-phase verification doesn't catch cross-document inconsistencies (nappState vs nappStorage). Integration checker fills this gap.

### Cost Observations

- Sessions: concentrated 2-day effort (2026-03-29 → 2026-04-01)
- 44 files changed, 6,819 lines added — almost entirely documentation
- Milestone audit found 3 fixable bugs (HIGH: register() order, MEDIUM: missing runtime property, MEDIUM: Section 3.8 table gap)

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tests | LOC (TS) | Duration |
|-----------|--------|-------|-------|----------|----------|
| v0.1.0 Alpha | 6 | 30 | 66 | ~5,000 | 1 day |
| v0.2.0 Shell Cleanup | 5 | 11 | 122 | ~6,500 | 1 day |
| v0.3.0 Runtime & Core | 6 | 18 | 193 | ~8,000 | 1 day |
| v0.4.0 Service Discovery | 6 | 19 | 220+ | ~10,122 | 1 day |
| v0.5.0 Docs & Skills | 4 | 12 | 220+ | ~16,941 | 2 days |

### Observations

- **Consistent short milestones** — each milestone ships in 1-2 focused sessions
- **Test count stable** — v0.5.0 was docs-only, no new tests added. 220+ tests remain the baseline.
- **LOC growing via documentation** — 6,819 lines of docs/skills added. Documentation is now a significant portion of the repo.
- **Documentation debt is a recurring pattern** — v0.4.0 and v0.5.0 both had stale traceability tables and missing VERIFICATION.md files. Integration checker helps but the root cause is per-phase tracking gaps.
- **Cross-phase integration checking is essential** — caught the originRegistry.register() argument order bug that per-phase verification missed.
