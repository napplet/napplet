---
phase: 06-specification-and-publish
plan: 01
status: complete
started: 2026-03-30
completed: 2026-03-30
commits: 1
---

# Plan 06-01: Refine SPEC.md — Summary

## What Was Built

Refined SPEC.md with all 11 implementation learnings from Phases 1-5, comprehensive protocol message examples, and updated reference implementation pointers.

## Key Changes

1. **AUTH failure behavior** (Section 2.5): Documented that AUTH failure sends OK false followed by NOTICE about dropped messages. All rejection paths clear the pre-AUTH queue.

2. **Mandatory AUTH tags** (Section 2.6): Missing `type` and `aggregateHash` tags now cause AUTH failure with specific error messages. Shells MUST NOT use default values.

3. **Pre-AUTH queue cap** (Section 2.8): Queue capped at 50 messages (configurable globally and per-napp).

4. **NIP-01 error prefix conventions** (Section 2.5): Documented `auth-required:`, `error:`, and `blocked:` prefixes.

5. **Sender exclusion scope** (Section 3.6): Clarified sender exclusion applies ONLY to kind 29003 (inter-pane topic events).

6. **Blocked napp behavior** (Section 3.6.1): Documented CLOSED with `blocked:` prefix for blocked napp operations.

7. **Storage keys() format** (Section 5.3): Updated to repeated `["key", name]` NIP tags instead of comma-joined strings.

8. **Storage quota** (Section 5.4): Documented UTF-8 byte counting via `TextEncoder.encode()`.

9. **ACL persistence format** (Section 12.8): Documented localStorage key `"napplet:acl"` and JSON schema, marked as [LOCKED].

10. **Manifest format** (Section 14.3): Documented kind 35128 event structure, aggregate hash computation algorithm, shell verification model, and NIP-5A/PR#2287 references. Noted vite-plugin is dev convenience, not production deploy tool.

11. **Protocol message examples** (Section 1.8): Added JSON examples for all 12 protocol message types (5 napplet-to-shell, 7 shell-to-napplet), plus inter-pane and storage request/response examples.

12. **Reference implementation** (Section 16.1): Updated from hyprgate internal paths to @napplet SDK package paths.

## Deviations

- **Relay URI unchanged**: The plan expected changing from `hyprgate://shell` to `shell://` per CONTEXT D-01, but both the actual implementation (types.ts) and existing spec already use `napplet://shell`. Kept `napplet://shell` to match implementation.

## Self-Check: PASSED

- [x] All 11 implementation changes from RESEARCH.md table reflected
- [x] Concrete examples for all 12 protocol message types
- [x] Security model section covers ACL, consent, isolation boundaries
- [x] Manifest section covers hash computation and NIP-5A references
- [x] No stale hyprgate references
- [x] No FIXME/TODO markers remain
- [x] Protocol version 2.0.0 confirmed

## Key Files

### Modified
- `SPEC.md` — Refined specification (+249 lines, -24 lines)

### Commits
- `9284813` — docs(spec): refine NIP-5A specification with implementation learnings
