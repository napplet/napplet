---
gsd_state_version: 1.0
milestone: v0.22.0
milestone_name: Media NUB + Kill Services
status: planning
stopped_at: Roadmap created for v0.22.0 -- 5 phases (96-100), 12 requirements mapped
last_updated: "2026-04-09T12:41:02.961Z"
last_activity: 2026-04-09
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-09)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** v0.22.0 Media NUB + Kill Services -- Phase 96 ready to plan

## Current Position

Phase: 96 of 100 (Kill Services)
Plan: --
Status: Ready to plan
Last activity: 2026-04-09

Progress: [..........] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: --

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

## Accumulated Context

### Decisions

- v0.22.0: Domain name is 'media' not 'audio' -- covers audio AND video
- v0.22.0: Explicit session lifecycle (create/destroy), multiple sessions per napplet
- v0.22.0: Dynamic capabilities, dual volume (napplet x shell), shell control list
- v0.22.0: Full metadata (title, artist, album, artwork URL/blossom, duration, mediaType) -- all optional
- v0.22.0: Remove svc: namespace entirely -- everything is a NUB
- v0.22.0: AUDIO_* TOPICS superseded by media NUB messages

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

## Session Continuity

Last session: 2026-04-09
Stopped at: Roadmap created for v0.22.0 -- 5 phases (96-100), 12 requirements mapped
Resume: `/gsd:plan-phase 96` to begin Kill Services
