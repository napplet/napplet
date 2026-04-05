---
gsd_state_version: 1.0
milestone: v0.12.0
milestone_name: Initial NUB Interface Specs
status: active
stopped_at: "Completed 60-01-PLAN.md"
last_updated: "2026-04-05T18:20:33Z"
last_activity: 2026-04-05
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 3
  completed_plans: 1
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-05)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 60 - Initial NUB Interface Specs

## Current Position

Phase: 60-channel-protocol-implementation
Plan: 1 of 3
Status: Plan 60-01 complete
Last activity: 2026-04-05

Progress: [███-------] 33%

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v0.11.0: 3 phases derived from 8 requirements -- Data Layer -> Tab Reorganization -> Contextual Filtering
- Research recommends explicit relevantRoles field on ConstantDef rather than implicit pkg-to-role mapping
- Kinds tab scope: BusKind.* (8) + AUTH_KIND (1) = 9 read-only protocol kind constants
- [Phase 54]: Import TopologyNodeRole from topology.ts; getByRole includes globals by default; no separate getKindsDefs method
- [Phase 55]: Kinds panel splits getReadOnlyDefs() by domain: protocol kinds (9) vs other read-only (1)
- [Phase 55]: Constants panel uses getEditableDefs() in flat mode and d.editable filter in grouped mode
- [Phase 55]: Polling timer guarded with _activeTab === 'node' check to prevent input destruction
- [Phase 55]: Tab persistence via removing _activeTab = 'node' reset from showInspector
- [Phase 56]: Role filter uses getByRole(role).filter(editable) with session-scoped _showAll toggle and resetShowAll() cross-module contract
- [Phase 60]: NUB-WORD spec format established: setext heading, draft badge, NUB ID/Namespace/Discovery header, 6 sections
- [Phase 60]: NUB-RELAY documents scoped relay operations alongside NIP-01 verb forwarding
- [Phase 60]: NUB-SIGNER kept minimal per D-01 -- delegates entirely to NIP-07

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260401-w49 | Fix KINDS.INTER_PANE regression and @napplet/runtime module resolution in demo | 2026-04-01 | ff91cb9 | [260401-w49-fix-kinds-inter-pane-regression-and-napp](.planning/quick/260401-w49-fix-kinds-inter-pane-regression-and-napp/) |
| 260402-krp | Replace inter-pane with ipc in demo UI labels, logs, comments, and path names | 2026-04-02 | 320ef58 | [260402-krp-replace-inter-pane-with-ipc-in-demo-ui-l](.planning/quick/260402-krp-replace-inter-pane-with-ipc-in-demo-ui-l/) |
| 260403-lck | Fix Phase 51 split-border node implementation -- padding-frame approach | 2026-04-03 | 8347912 | [260403-lck-fix-phase-51-split-border-node-implement](.planning/quick/260403-lck-fix-phase-51-split-border-node-implement/) |
| 260403-mc5 | Post-phase color refinements: remove old borders, wire overlays to color state, simplify to red/green, add flash mode, fix decay/trace/persistence | 2026-04-03 | df21008 | [260403-mc5-update-planning-artifacts-for-out-of-wor](.planning/quick/260403-mc5-update-planning-artifacts-for-out-of-wor/) |

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth. Target for future milestone.
- Polling timer (1500ms updateInspectorPane) destroys active input state -- must be guarded in Phase 55
- 280px inspector width is tight for 3 tab buttons -- verify label widths in Phase 55

## Session Continuity

Last session: 2026-04-05T18:20:33Z
Stopped at: Completed 60-01-PLAN.md
Resume: Continue with 60-02-PLAN.md
