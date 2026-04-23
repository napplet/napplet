# Phase 3: Core Protocol Tests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 3-Core Protocol Tests
**Areas discussed:** AUTH failure expectations, Test organization, Message routing edge cases

---

## AUTH Failure Expectations

### Error reason format

| Option | Description | Selected |
|--------|-------------|----------|
| Machine-parseable prefixes | 'auth-failed: invalid signature' | |
| Human-readable only | Free-form strings | |
| NIP-01 prefix convention | 'auth-required: reason' / 'error: reason' | ✓ |

**User's choice:** NIP-01 prefix convention

### Missing tags behavior (AUTH-08, AUTH-09)

| Option | Description | Selected |
|--------|-------------|----------|
| Succeed with defaults | Missing type → 'unknown', missing hash → '' | |
| Succeed but log NOTICE | Succeed + warning NOTICE | |
| Fail as invalid | AUTH rejected — napplet didn't build correctly | ✓ |

**User's choice:** Fail as invalid
**Notes:** Changes current permissive behavior. Code must be updated.

---

## Test Organization

### Runner split

| Option | Description | Selected |
|--------|-------------|----------|
| All browser (Playwright) | Every test in real Chromium | ✓ |
| Unit + integration split | Pure functions in Node, protocol in browser | |
| You decide | | |

**User's choice:** All browser (Playwright)

### File layout

| Option | Description | Selected |
|--------|-------------|----------|
| One file per category | 4 files with describe blocks | |
| One file per test | 28 files | |
| You decide | | ✓ |

**User's choice:** You decide

---

## Message Routing Edge Cases

### Sender exclusion scope (MSG-06)

| Option | Description | Selected |
|--------|-------------|----------|
| Only kind 29003 | Sender excluded only from topic events | ✓ |
| All inter-pane events | Excluded from all shell-routed events | |
| You decide | | |

**User's choice:** Only kind 29003

### Pre-AUTH queue limit (MSG-08)

| Option | Description | Selected |
|--------|-------------|----------|
| Unlimited queue | No cap | |
| Cap at 50 | Reject beyond 50 with NOTICE | ✓ |
| Cap at 10 | Tight limit | |
| You decide | | |

**User's choice:** Default 50, configurable globally and per-napp

### Blocked napp CLOSED format (MSG-09)

| Option | Description | Selected |
|--------|-------------|----------|
| NIP-01 CLOSED format | 'error: relay:read capability denied' | |
| ACL-specific prefix | 'blocked: capability denied' | ✓ |
| You decide | | |

**User's choice:** ACL-specific prefix

---

## Claude's Discretion

- Test file organization
- Test napplet selection per test
- Whether replay tests need real iframes

## Deferred Ideas

None
