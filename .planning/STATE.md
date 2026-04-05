---
gsd_state_version: 1.0
milestone: v0.12.0
milestone_name: Draft Final "Nostr Web Applets" NIP
status: planning
stopped_at: Phase 57 context gathered
last_updated: "2026-04-05T12:07:39.335Z"
last_activity: 2026-04-05 — Roadmap created for v0.12.0
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-05)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** v0.12.0 Phase 57 — NIP Resolution & Pre-Engagement

## Current Position

Phase: 57 (1 of 5 in v0.12.0) — NIP Resolution & Pre-Engagement
Plan: 0 of 0 in current phase (not yet planned)
Status: Ready to plan
Last activity: 2026-04-05 — Roadmap created for v0.12.0

Progress: [..........] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v0.12.0)
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: (from v0.11.0 -- see milestone archive)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v0.12.0: NIP-5C filename claimed by PR#2281 (Scrolls) -- must resolve number before writing
- v0.12.0: Declarative-first capability negotiation (NIP-91 interactive pattern rejected by community)
- v0.12.0: Channel protocol needs design + implementation before spec section can be finalized
- v0.12.0: Runtime internals (ACL, hooks, session management) explicitly excluded from NIP
- v0.12.0: 5 phases derived from 22 requirements -- Resolution -> Core NIP -> Channel Design -> Channel Impl -> Packaging

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260401-w49 | Fix KINDS.INTER_PANE regression and @napplet/runtime module resolution in demo | 2026-04-01 | ff91cb9 | [260401-w49-fix-kinds-inter-pane-regression-and-napp](.planning/quick/260401-w49-fix-kinds-inter-pane-regression-and-napp/) |
| 260402-krp | Replace inter-pane with ipc in demo UI labels, logs, comments, and path names | 2026-04-02 | 320ef58 | [260402-krp-replace-inter-pane-with-ipc-in-demo-ui-l](.planning/quick/260402-krp-replace-inter-pane-with-ipc-in-demo-ui-l/) |
| 260403-lck | Fix Phase 51 split-border node implementation -- padding-frame approach | 2026-04-03 | 8347912 | [260403-lck-fix-phase-51-split-border-node-implement](.planning/quick/260403-lck-fix-phase-51-split-border-node-implement/) |
| 260403-mc5 | Post-phase color refinements: remove old borders, wire overlays to color state, simplify to red/green, add flash mode, fix decay/trace/persistence | 2026-04-03 | df21008 | [260403-mc5-update-planning-artifacts-for-out-of-wor](.planning/quick/260403-mc5-update-planning-artifacts-for-out-of-wor/) |

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth. Target for future milestone.
- NIP number conflict with PR#2281 must be resolved before spec writing (Phase 57)
- PR#2287 (aggregate hash extension) is unmerged -- NIP-5C depends on it for manifest identity
- "Channels" naming may collide with NIP-28/29 -- needs finalization in Phase 59

## Session Continuity

Last session: 2026-04-05T12:07:39.332Z
Stopped at: Phase 57 context gathered
Resume file: .planning/phases/57-nip-resolution-pre-engagement/57-CONTEXT.md
