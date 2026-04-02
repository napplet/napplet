# Phase 44: Documentation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 44-documentation
**Areas discussed:** SPEC.md update strategy, Migration guide, SDK README depth

---

## SPEC.md Update Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Surgical updates only | Update Section 16.1 and other old API refs. No new section — spec covers wire format, not JS API. | ✓ |
| Add new window.napplet section | New section documenting full shape and methods. Self-contained but blurs spec vs SDK docs. | |
| You decide | Claude decides the right balance. | |

**User's choice:** Surgical updates only
**Notes:** Protocol spec describes wire format and behavior, not the JavaScript convenience API.

---

## Migration Guide

| Option | Description | Selected |
|--------|-------------|----------|
| Skip it | v0.8.0 not published. No external consumers migrating. Only hyprgate (same author). Add later if needed. | ✓ |
| Brief section in shim README | Short before/after table. Low effort, useful if anyone tracks the repo. | |
| You decide | Claude judges audience needs. | |

**User's choice:** Skip it
**Notes:** No external consumers to migrate yet.

---

## SDK README Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Focused | Quick start, API overview, type exports, brief shim relationship. Match existing @napplet style. | ✓ |
| Comprehensive | Full architecture, detailed comparison, every method documented. May overexplain a thin package. | |
| You decide | Claude matches other @napplet READMEs. | |

**User's choice:** Focused
**Notes:** SDK is thin — README should be proportionally thin.

---

## Claude's Discretion

- **README section ordering and heading structure**
- **SPEC.md section discovery** — find all old API references beyond 16.1

## Deferred Ideas

None.
