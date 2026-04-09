---
gsd_state_version: 1.0
milestone: v0.22.0
milestone_name: Media NUB + Kill Services
status: defining-requirements
stopped_at: null
last_updated: "2026-04-09"
last_activity: 2026-04-09
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-09)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Defining requirements for v0.22.0

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-09 — Milestone v0.22.0 started

## Accumulated Context

### Decisions

- v0.22.0: Domain name is 'media' not 'audio' — covers audio AND video
- v0.22.0: Explicit session lifecycle (create/destroy)
- v0.22.0: Multiple sessions per napplet (sessionId)
- v0.22.0: Dynamic capabilities (can change mid-session)
- v0.22.0: Dual volume model (napplet × shell)
- v0.22.0: Shell sends capability list so napplet adapts UI
- v0.22.0: Full metadata (title, artist, album, artwork URL/blossom hash, duration, mediaType) — all optional
- v0.22.0: Remove svc: namespace — everything is a NUB
- v0.22.0: AUDIO_* TOPICS superseded by media NUB messages

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

## Session Continuity

Last session: 2026-04-09
Stopped at: Milestone v0.22.0 started — defining requirements
Resume: Continue with requirements definition
