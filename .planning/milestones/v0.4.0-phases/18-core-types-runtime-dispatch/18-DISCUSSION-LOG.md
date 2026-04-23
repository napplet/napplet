# Phase 18: Core Types & Runtime Dispatch - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 18-core-types-runtime-dispatch
**Areas discussed:** Type migration strategy, Service dispatch routing, Semver utility scope, RuntimeHooks.services shape

---

## Type Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Hard cut | Delete from shell, add to core/runtime. Clean break, matches v0.2.0 approach. | ✓ |
| Re-export for compat | Move but keep shell re-exporting. Gentler but adds coupling. | |
| You decide | Claude picks based on external consumer analysis. | |

**User's choice:** Hard cut
**Notes:** Consistent with past practice (ShellBridge rename was also a hard cut).

---

## Service Dispatch Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Before shell: prefix | Services get first crack. Risk of intercepting core protocol. | |
| After shell: prefix | All shell:* routing untouched. Services only handle non-shell topics. | ✓ |
| Replace shell:audio | Service dispatch replaces the audio-specific case. | |

**User's choice:** After shell: prefix (Option 2 simplified)
**Notes:** User requested detailed explanation of each option's system impact before deciding. Key insight from user: "audio should be registered, not hardcoded — it should be `services[requestedService].handler()`." This led to the generic dispatch design. User also clarified no backwards compat needed (alpha software). User corrected the assumption that shell:state-*/shell:acl-* could "eventually become services" — they are core protocol infrastructure (filters that affect routing), not optional services (input/output endpoints).

---

## Semver Utility Scope

| Option | Description | Selected |
|--------|-------------|----------|
| ^, >=, exact only | Covers 95% of usage. ~60 lines. | |
| Name-only for now | Just check existence. Add semver later. | ✓ |
| Full semver ranges | ~, ^, >=, <=, ||. ~200 lines. | |

**User's choice:** Name-only for now
**Notes:** User questioned whether semver makes sense at all for service versioning. Services are protocol-defined, not independently published. Dropped CORE-03 requirement for this phase.

---

## RuntimeHooks.services Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Method on runtime | runtime.registerService('audio', handler). Dynamic. | |
| Static on hooks | Pass services in RuntimeHooks at creation. Simple but immutable. | |
| Both | Initial services on hooks + registerService() for late addition. | ✓ |

**User's choice:** Both
**Notes:** Common case (declare everything up front) stays simple via hooks. Escape hatch for late registration via method.

---

## Claude's Discretion

- Internal naming of dispatch function
- Map vs plain object for internal registry
- Overwrite vs error on duplicate registration

## Deferred Ideas

- Per-service ACL capabilities (v0.5.0+)
- Migrating core protocol commands to services (explicitly rejected — architectural distinction)
- Semver version matching (deferred until real need)
