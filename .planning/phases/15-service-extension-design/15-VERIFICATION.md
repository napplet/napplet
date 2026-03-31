---
status: passed
phase: 15
phase_name: service-extension-design
verified: 2026-03-31
---

# Phase 15 Verification: Service Extension Design

## Phase Goal
The RuntimeHooks.services interface is defined and documented so v0.4.0 can implement audio, notifications, and custom services without protocol changes.

## Success Criteria

### 1. RuntimeHooks has an optional `services` field with a typed interface (not just Record<string, unknown>)
**Status:** PASS
- `ShellHooks.services?: ServiceRegistry` defined in `packages/shell/src/types.ts` (line 335)
- `ServiceRegistry` is a typed interface with `[serviceName: string]: ServiceHandler`
- `ServiceHandler` requires `descriptor: ServiceDescriptor` and `handleRequest()` method
- NOT a bare `Record<string, unknown>` — properly typed with ServiceHandler contract

### 2. Event kind 29010 is reserved as a constant in @napplet/core for service discovery
**Status:** PASS
- `BusKind.SERVICE_DISCOVERY: 29010` defined in `packages/core/src/constants.ts` (line 63)
- JSDoc comment: "Service discovery responses — napplets query available shell services via kind 29010"
- Re-exported from `@napplet/shell` via the existing BusKind re-export chain

### 3. SPEC.md contains a "Service Discovery" section describing the message format
**Status:** PASS
- Section 11 "Service Discovery [OPEN]" with 7 subsections (11.1-11.7) in `SPEC.md` (line 804)
- Defines kind 29010 REQ/EVENT/EOSE flow
- Specifies tag schema: `s` (MUST), `v` (MUST), `d` (MAY)
- Documents topic-prefix routing pattern
- Describes service lifecycle (registration, discovery, interaction, cleanup)
- Addresses backwards compatibility (Section 11.7)
- Kind 29010 also documented in Section 15.5 (Provisional Kinds)

## Requirement Traceability

| Requirement | Status | Evidence |
|-------------|--------|----------|
| SVC-01 | PASS | `services?: ServiceRegistry` on ShellHooks interface |
| SVC-02 | PASS | `BusKind.SERVICE_DISCOVERY: 29010` in @napplet/core |
| SVC-03 | PASS | SPEC.md Section 11 with complete message format |

## Build Verification

| Check | Result |
|-------|--------|
| `pnpm build` | PASS — all 13 packages build |
| `pnpm type-check` | PASS — zero TypeScript errors |
| ServiceDescriptor exported | PASS — in @napplet/shell index.ts |
| ServiceHandler exported | PASS — in @napplet/shell index.ts |
| ServiceRegistry exported | PASS — in @napplet/shell index.ts |
| SPEC.md section numbering consistent | PASS — 17 sections, no gaps |
| SPEC.md cross-references updated | PASS — verified via grep |

## Notes

- Phase 15 is design-only: types and documentation, no behavioral changes
- Service implementation is deferred to v0.4.0
- BusKind lives in @napplet/core (moved in Phase 12), not in shell's types.ts as plans originally assumed
- Plan 15-01 adapted to add SERVICE_DISCOVERY to the correct file (packages/core/src/constants.ts)
- The `services` field will migrate from ShellHooks to RuntimeHooks when Phase 14 executes
