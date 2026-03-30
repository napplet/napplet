# Phase 6: Specification and Publish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 6-Specification and Publish
**Areas discussed:** Spec location & format, Manifest hash problem, Package publishing scope

---

## Spec Location & Format

### Spec home

| Option | Description | Selected |
|--------|-------------|----------|
| This repo (napplet) | specs/ directory | |
| Hyprgate (existing) | Keep in hyprgate | |
| NIP PR to nostr-protocol/nips | Submit as proper NIP | |
| Both — local + NIP PR | Dual track | |

**User's input:** "I copied it to the root of this directory earlier, I think it's at SPEC.md" — confirmed at repo root, 41KB, NIP-formatted.

### NIP PR goal

| Option | Description | Selected |
|--------|-------------|----------|
| Submit as NIP PR | Refine then submit | |
| Keep as project spec | Stay in this repo | |
| Both | Parallel tracks | |

**User's input:** "end goal is PR, but that's not in the scope of this milestone, or any milestone in the near future. will likely require iterations."

---

## Manifest Hash Problem

**User clarification:** "the hash is found not from the HTML but from the x tag of the NIP-5A event"

Pointed to: https://github.com/nostr-protocol/nips/pull/2287 (aggregate hash PR, not yet merged)

Algorithm from PR:
1. Collect path tags
2. Format as `<sha256> <path>\n`
3. Sort lexicographically
4. Concatenate as UTF-8
5. SHA-256 → aggregate hash in `["x", "<hex>", "aggregate"]` tag

**Conclusion:** No chicken-and-egg problem. Hash computed from event tags, not HTML. Meta tag is informational.

### Spec scope for hash

| Option | Description | Selected |
|--------|-------------|----------|
| Reference NIP-5A | Don't duplicate algorithm | ✓ |
| Include in our spec | Self-contained | |
| Reference + clarify usage | | |

**User's correction:** "reference the PR because it's not merged yet"

---

## Package Publishing Scope

### Packages to publish

**User selected:** @napplet/shim, @napplet/shell

**User questioned @napplet/vite-plugin:** "I don't understand why @napplet/vite-plugin 'manifest generation' exists, is this for development? Otherwise, 'site manifest' is created by a deploy tool that is outside the context of this project."

**Clarification exchange:** Plugin is dev-only (meta tag injection for local testing). Build-time manifest is out of scope — community deploy tools handle it.

**User's conclusion:** "The purpose of this plugin should be to make it possible to test napplets locally, that's it." → Still publish, but clearly document dev-only purpose.

### Version tag

| Option | Description | Selected |
|--------|-------------|----------|
| v0.1.0 stable | Semver <1.0 is unstable anyway | |
| v0.1.0-alpha.1 | Explicit pre-release tag | ✓ |
| You decide | | |

**User's choice:** v0.1.0-alpha.1

---

## Claude's Discretion

- README structure and API documentation depth
- Which implementation changes warrant spec updates
- publint/arethetypeswrong fix strategies

## Deferred Ideas

- NIP PR submission (future milestone)
- @napplet/devtools extraction
- @napplet/create CLI
