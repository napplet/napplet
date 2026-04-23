# Phase 21: Shim Discovery API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 21-shim-discovery-api
**Areas discussed:** Window global shape, Discovery timing, Internal caching

---

## Window Global Shape

| Option | Description | Selected |
|--------|-------------|----------|
| window.napplet | New namespace. Clean separation from NIP-07. | ✓ |
| window.nostr.napplet | Nested under existing nostr. Mixes with NIP-07. | |
| Flat on window | window.discoverServices(). Pollutes global. | |

**User's choice:** window.napplet

---

## Discovery Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Queue like everything else | Pre-AUTH buffer handles it. Consistent, zero special casing. | ✓ |
| Error before AUTH | Throw/reject. More explicit but breaks "just works." | |

**User's choice:** Queue through pre-AUTH buffer.

---

## Internal Caching

| Option | Description | Selected |
|--------|-------------|----------|
| Cache after first query | First call does REQ. Subsequent calls use cache. | ✓ |
| No cache | Every call fires a REQ. Simpler but wasteful. | |

**User's choice:** Cache after first query, session-scoped.

---

## Claude's Discretion

- ServiceInfo type location
- Cache invalidation beyond session scope
- Installation timing (load vs lazy)
- Error/timeout handling
