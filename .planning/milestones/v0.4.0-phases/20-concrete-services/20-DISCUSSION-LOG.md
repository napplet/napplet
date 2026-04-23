# Phase 20: Concrete Services - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 20-concrete-services
**Areas discussed:** Service package location, Audio service shape, Notification service scope, Core infra as services

---

## Service Package Location

| Option | Description | Selected |
|--------|-------------|----------|
| @napplet/shell | Keep in shell. Simplest for alpha, but contradicts "services are pluggable." | |
| @napplet/services | New package. Correctly communicates architecture for reference implementation. | ✓ |
| Per-service packages | Maximum composability. Package sprawl for alpha. | |

**User's choice:** @napplet/services
**Notes:** User clarified this repo has no consumers — it's a reference implementation for a spec. Package structure IS the spec's story about composability. Initial recommendation of @napplet/shell was revised after understanding the project's purpose.

---

## Audio Service Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Browser-agnostic | Uses handleMessage/send, callbacks for shell UI. Lives in @napplet/services. | ✓ |

**User's choice:** Browser-agnostic in @napplet/services.
**Notes:** Existing audio-manager.ts uses browser APIs (window.dispatchEvent, postMessage). New service uses send() callback instead. Shell host provides browser-specific wiring.

---

## Notification Service Scope

| Option | Description | Selected |
|--------|-------------|----------|
| State registry | Track notifications per napplet. Shell host decides presentation. | ✓ |
| Broader scope | Browser notifications, cross-napplet routing, etc. | |
| You decide | Claude designs minimal version. | |

**User's choice:** State registry — same pattern as audio.

---

## Core Infrastructure as Services

| Option | Description | Selected |
|--------|-------------|----------|
| This phase | Everything in Phase 20 — big but complete. | |
| Split out | Phase 20 = audio + notifications. New phase = core infra migration. | ✓ |
| Discovery only | Core infra appears in discovery but keeps RuntimeHooks internally. | |

**User's choice:** Split out — separate phase for core infra migration.

---

## Claude's Discretion

- Factory function vs class pattern for services
- State management internals
- Callback interface shape for shell host notifications
- Test strategy

## Deferred Ideas

- Core infra services (relay pool, cache, signer) — new phase
- Browser Notification API — shell host concern
- Notification persistence — shell host concern
