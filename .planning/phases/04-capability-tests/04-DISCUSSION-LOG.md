# Phase 4: Capability Tests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 4-Capability Tests
**Areas discussed:** Signer consent UX, Storage quota edge cases, ACL persistence format

---

## Signer Consent UX

### Consent mock approach

| Option | Description | Selected |
|--------|-------------|----------|
| Mock ShellHooks callback | Auto-resolve approve/deny | |
| Configurable per-test | test sets mock.consentBehavior | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide

---

## Storage Quota Edge Cases

### Quota calculation method

| Option | Description | Selected |
|--------|-------------|----------|
| UTF-8 byte count | TextEncoder().encode(key + value).length | ✓ |
| Keep Blob approach | Current method, document variance | |
| You decide | | |

**User's choice:** UTF-8 byte count (code change required)

### Quota error format

| Option | Description | Selected |
|--------|-------------|----------|
| NIP tag error | ['error', 'quota exceeded: 512KB limit'] | ✓ |
| Structured quota info | Multiple tags with used/limit values | |
| You decide | | |

**User's choice:** NIP tag error — follows existing pattern

---

## ACL Persistence Format

### Test depth

| Option | Description | Selected |
|--------|-------------|----------|
| Black-box only | Test behavior round-trip only | |
| Assert format too | Verify localStorage key + JSON structure | ✓ |
| You decide | | |

**User's choice:** Assert format too — locks persistence format as protocol contract

---

## Claude's Discretion

- Signer consent mock implementation
- Test file organization
- Test napplet reuse vs new creation

## Deferred Ideas

None
