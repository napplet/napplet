---
phase: 32-fix-demo-ui-ux-bugs
plan: 03
subsystem: docs
tags: [claude-md, nappkeypair, documentation]

requires: []
provides:
  - Corrected NappKeypair description in CLAUDE.md (ephemeral in-memory, not sessionStorage)
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - CLAUDE.md

key-decisions:
  - "Only the Pattern line in the NappKeypair Key Abstractions entry was changed"
  - "No other content in CLAUDE.md touched"
---

## What was done

Fixed stale CLAUDE.md documentation for NappKeypair.

**CLAUDE.md line 235**: Changed from `"Stored in sessionStorage; loaded/created deterministically per nappType; used to sign all outbound events"` to `"Ephemeral in-memory keypair per page load (no persistence). Generated fresh on every page load via generateSecretKey(). Used to sign all outbound events from this napplet instance."`

This reflects the actual behavior of `packages/shim/src/napp-keypair.ts`, which calls `generateSecretKey()` on every invocation with no sessionStorage access.

## Verification

- grep 'Ephemeral in-memory' CLAUDE.md → line 235 present
- grep 'sessionStorage' CLAUDE.md | grep -i 'napp.*key' → empty (no stale reference)
