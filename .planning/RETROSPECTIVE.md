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

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tests | LOC (TS) | Duration |
|-----------|--------|-------|-------|----------|----------|
| v0.1.0 Alpha | 6 | 30 | 66 | ~5,000 | 1 day |
| v0.2.0 Shell Cleanup | 5 | 11 | 122 | ~6,500 | 1 day |
| v0.3.0 Runtime & Core | 6 | 18 | 193 | ~8,000 | 1 day |
| v0.4.0 Service Discovery | 6 | 19 | 220+ | ~10,122 | 1 day |

### Observations

- **Consistent 1-day milestones** — each milestone ships in a single focused session
- **Test count growing healthily** — 66 → 122 → 193 → 220+ reflects increasing surface area
- **Plan counts stabilizing** — v0.3.0 and v0.4.0 both ~18-19 plans; finding a natural milestone scope
- **Documentation debt pattern** — each milestone has had minor doc gaps (stale checkboxes, missing VERIFICATION.md). Worth building into execution templates.
