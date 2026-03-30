# Phase 1: Wiring Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 1-Wiring Fixes
**Areas discussed:** Naming convention, Storage serialization, Verification approach, AUTH rejection behavior, Source validation strictness, Backwards compatibility

---

## Naming Convention

### Relay URI

| Option | Description | Selected |
|--------|-------------|----------|
| napplet://shell | Matches package name | |
| nip5a://shell | Ties to NIP number | |
| wss://pseudo.relay | Looks like normal relay URL | |
| shell:// | User's suggestion — "from the napplet to the shell" | ✓ |

**User's choice:** `shell://` (free text — user suggested this over the provided options)
**Notes:** User felt the URI should describe the direction: napplet → shell.

### Meta Tag Prefix

| Option | Description | Selected |
|--------|-------------|----------|
| napplet-* | napplet-napp-type, napplet-aggregate-hash — matches package brand | ✓ |
| nip5a-* | nip5a-napp-type, nip5a-aggregate-hash — ties to spec | |
| napp-* | napp-type, napp-aggregate-hash — shorter | |

**User's choice:** napplet-*

### Rename Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Public-facing only | URIs, meta tags, user-visible strings | |
| Everything hyprgate | Replace every occurrence in all files | ✓ |
| Public + localStorage | URIs, meta tags, strings, AND localStorage key prefixes | |

**User's choice:** Everything — full sweep.

---

## Storage Serialization

### Keys Format

| Option | Description | Selected |
|--------|-------------|----------|
| JSON array string | JSON.stringify/parse — universal | |
| Repeated NIP tags | One ['key', name] tag per key — follows Nostr convention | ✓ |
| Null-byte delimiter | userKeys.join('\0') — simple | |

**User's choice:** Repeated NIP tags
**Notes:** User needed elaboration on the bug context before deciding. Chose NIP tags for protocol consistency.

---

## Verification Approach

### Method

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal HTML smoke test | Single HTML page with iframe | |
| Automated script | Playwright script asserting AUTH + message flow | |
| Build + type-check only | Just pnpm build/type-check | |
| Both (automated + smoke test) | User's selection — both approaches | ✓ |

**User's choice:** Both automated Playwright script + HTML smoke test page

### Location

| Option | Description | Selected |
|--------|-------------|----------|
| examples/smoke/ | Dedicated examples directory | |
| tests/e2e/ | Under tests, co-located with Playwright | ✓ |
| You decide | Claude picks | |

**User's choice:** tests/e2e/

### Reuse for Demo

| Option | Description | Selected |
|--------|-------------|----------|
| Seed for demo | Build as minimal demo, Phase 5 expands | |
| Keep separate | Disposable verification, demo built fresh | ✓ |
| You decide | Claude picks | |

**User's choice:** Keep separate

---

## AUTH Rejection Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| OK false + NOTICE | Send OK false with reason, then NOTICE about dropped messages | ✓ |
| OK false only | Just OK false, keep simple | |
| OK false + CLOSED per sub | Send CLOSED for each queued REQ | |

**User's choice:** OK false + NOTICE
**Notes:** Napplet should know what happened to queued messages.

---

## Source Validation Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Source check only | event.source === window.parent | |
| Source + format check | source + Array.isArray + valid verb | ✓ |
| You decide | Claude picks | |

**User's choice:** Strict — source + format check. User also described a deeper event-ID-triggered hash revalidation mechanism (captured in CONTEXT.md as deferred protocol work).

---

## Backwards Compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Hard cut | No backwards compat, old values rejected | ✓ |
| Accept both temporarily | Accept old and new, remove fallback before v1 | |
| You decide | Claude picks | |

**User's choice:** Hard cut — clean break pre-v1.

---

## Claude's Discretion

- Specific variable/type renames beyond hyprgate references
- Playwright script structure and assertion patterns

## Deferred Ideas

- Event-ID triggered aggregate hash revalidation — protocol-level identity verification (spec refinement phase)
- Salt-based deterministic keypair derivation — alternative to ephemeral keypairs (spec refinement phase)
