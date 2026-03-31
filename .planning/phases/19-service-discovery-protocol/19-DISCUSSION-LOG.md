# Phase 19: Service Discovery Protocol - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 19-service-discovery-protocol
**Areas discussed:** Synthetic event generation, Core infra in discovery, Discovery subscription lifecycle, Event identity fields

---

## Core Infra in Discovery (Tension Resolution)

**Tension:** Milestone scoping said "unified discovery" but Phase 18 D-05 said "core infra is NOT in ServiceRegistry."

| Option | Description | Selected |
|--------|-------------|----------|
| Two sources, one response | Runtime enumerates ServiceRegistry + auto-detects core capabilities from hooks | |
| Core infra registers as services | Relay pool, cache, signer ARE services with ServiceHandler wrappers | ✓ |
| Drop core infra from discovery | Only optional services in discovery; core infra always assumed available | |

**User's choice:** Core infra ARE services. The "not a service" distinction from Phase 18 D-05 was about enforcement gates (ACL, negotiation), not capabilities.
**Notes:** User clarified that relay pool, cache, and signer should be services — shell implementors choose their implementations (Applesauce, NDK, etc.). A shell with zero services (no relay pool, no cache, no signer) should be valid for local-only inter-pane napplets.

**This led to a major architectural insight:** ServiceHandler should handle raw NIP-01 messages, not just INTER_PANE topic events. Relay pool receives `['REQ', ...]`, audio receives `['EVENT', ...]` with topic prefix — same interface.

---

## ServiceHandler Interface (Emerged from Core Infra Discussion)

| Option | Description | Selected |
|--------|-------------|----------|
| High-level integration | Runtime coordinates subscription lifecycle, dedup, EOSE. Services provide primitives. | |
| Low-level integration | Services get raw NIP-01 messages and handle everything themselves. | ✓ |
| Both | Offer both integration levels. | |

**User's choice:** Start with low-level only.
**Notes:** Low-level is simpler runtime core. High-level coordination can be built as helpers on top later. This changes the Phase 18 plans — flagged for replanning.

---

## Synthetic Event Generation

| Option | Description | Selected |
|--------|-------------|----------|
| Runtime handles it | Discovery is runtime infrastructure, not a service. Runtime enumerates its own registry. | ✓ |

**User's choice:** Runtime handles discovery internally.
**Notes:** Straightforward — the runtime knows what services are registered.

---

## Discovery Subscription Lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-close after EOSE | One-shot query, subscription ends. | |
| Leave open | Push new service descriptors to open subs. | |
| Follow NIP-01 semantics | query() auto-closes, subscribe() stays open. Runtime behavior matches NIP-01. | ✓ |

**User's choice:** Follow standard NIP-01 semantics — query() closes after EOSE, subscribe() stays open for live updates.
**Notes:** User pointed out that the shim already exposes both subscribe() and query(). The runtime doesn't need to make the choice — it follows the NIP-01 verb lifecycle.

---

## Event Identity Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Sentinel values | Zero-padded pubkey/sig, random id. Matches existing injectEvent() pattern. | ✓ |

**User's choice:** Sentinel values, consistent with existing patterns.

---

## Claude's Discretion

- Internal routing logic for matching messages to services
- Discovery subscription tracking data structures
- Descriptor field validation on registerService()

## Deferred Ideas

- High-level coordination helper (createCoordinatedRelay) — future utility, not runtime core
- Per-service ACL — v0.5.0+
- Semver matching — when needed
