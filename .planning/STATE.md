---
gsd_state_version: 1.0
milestone: v0.12.0
milestone_name: Draft Final "Nostr Web Applets" NIP
status: executing
stopped_at: Completed 59-01-PLAN.md
last_updated: "2026-04-05T14:18:00.463Z"
last_activity: 2026-04-05
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 11
  completed_plans: 4
  percent: 30
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-05)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 59 — channel-protocol-design (NIP simplification + NUB)

## Current Position

Phase: 59 (channel-protocol-design) -- EXECUTING
Plan: 2 of 2
Status: Ready to execute
Last activity: 2026-04-05

Progress: [###.......] 30%

## Performance Metrics

**Velocity:**

- Total plans completed: 3 (v0.12.0)
- Average duration: ~7min
- Total execution time: ~21min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 57 | 2 | ~14min | ~7min |
| 58 | 1 | 7min | 7min |

**Recent Trend:**

- Last 3 plans: 57-01, 57-02, 58-01
- Trend: Stable

*Updated after each plan completion*
| Phase 59 P01 | 6min | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v0.12.0: NIP-5C filename claimed by PR#2281 (Scrolls) -- must resolve number before writing
- v0.12.0: Declarative-first capability negotiation (NIP-91 interactive pattern rejected by community)
- v0.12.0: Channel protocol needs design + implementation before spec section can be finalized
- v0.12.0: Runtime internals (ACL, hooks, session management) explicitly excluded from NIP
- v0.12.0: 5 phases derived from 22 requirements -- Resolution -> Core NIP -> Channel Design -> Channel Impl -> Packaging
- [Phase 58]: AUTH handshake + service discovery are MUST; relay, IPC, storage, signer, nostrdb are MAY
- [Phase 58]: NIP-5D is 499 lines with 38 MUSTs, 18 MAYs, 9 sections, zero banned implementation terms
- [Phase 58]: Security section uses defensive framing for postMessage * origin (correct approach, not weakness)
- [Phase 59]: NIP-5D v2 compressed AUTH section from H3 subsections to inline bold-step format; Security Considerations from numbered paragraphs to inline format; Transport headings removed
- [Phase 59]: NUB dual-track system established: NUB-WORD for interfaces (NUB-RELAY, NUB-STORAGE, etc.), NUB-NN for numbered message protocols

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
- "Channels" naming resolved: using "pipes" to avoid NIP-28 collision (decided in Phase 59 discuss)

## Session Continuity

Last session: 2026-04-05T14:18:00.460Z
Stopped at: Completed 59-01-PLAN.md
Resume file: None
