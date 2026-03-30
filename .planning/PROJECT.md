# Napplet Protocol SDK

## What This Is

A portable SDK for the napplet protocol — sandboxed Nostr mini-apps that run in restrictive iframes and delegate functionality (signing, storage, relay access) to a host shell via NIP-01 postMessage wire format. Extracted from [hyprgate](https://github.com/sandwichfarm/hyprgate) into standalone `@napplet/*` npm packages. Includes a 66-test protocol conformance suite and an interactive Chat + Bot demo playground.

## Core Value

Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## Requirements

### Validated

- ✓ Pseudo-relay message router (NIP-01 REQ/EVENT/CLOSE/COUNT dispatch) — existing
- ✓ NIP-42 AUTH handshake with ephemeral session keypairs — existing
- ✓ ACL capability system (relay:read, relay:write, sign:*, storage:*) — existing
- ✓ NIP-07/NIP-44 signer proxy (napplet requests signatures from shell) — existing
- ✓ Storage proxy with scoped keys (pubkey:dTag:aggregateHash isolation) — existing
- ✓ Inter-pane pubsub via kind 29003 topic events — existing
- ✓ Napplet-side SDK (subscribe, publish, query, emit, on, nappStorage) — existing
- ✓ Shell-side runtime (createPseudoRelay factory, ShellHooks DI) — existing
- ✓ Vite plugin for NIP-5A dev-mode manifest injection — existing
- ✓ Replay attack detection on incoming events — existing
- ✓ ConsentRequest flow for destructive signing kinds — existing
- ✓ Decoupled packages working end-to-end with wiring fixes — v0.1.0
- ✓ 66 behavioral tests covering full protocol surface (AUTH, routing, replay, lifecycle, ACL, storage, signer, IPC) — v0.1.0
- ✓ Interactive Chat + Bot demo with visual protocol debugger — v0.1.0
- ✓ Refined NIP-5A specification with implementation learnings — v0.1.0
- ✓ Packages validated (publint + arethetypeswrong) at v0.1.0-alpha.1 — v0.1.0

### Active

- [ ] Rename pseudo-relay → ShellBridge across all packages, tests, spec, demo
- [ ] Redesign ACL as pure WASM-ready module — deterministic (identity, capability, action) → allow | deny
- [ ] Single ACL enforcement point in ShellBridge — every message passes through one gate
- [ ] Exhaustive behavioral ACL test suite — capability × action matrix
- [ ] Shell code cleanup — consistent method names, clean interfaces
- [ ] Complete storage → state rename across all tests
- [ ] Publish @napplet/shim, @napplet/shell, @napplet/vite-plugin to npm (needs npm auth)
- [ ] Napplet boilerplate / starter template (@napplet/create CLI)
- [ ] Deploy demo as production nsite (blossom + relay + NIP-5A gateway)
- [ ] Event-ID triggered aggregate hash revalidation
- [ ] Salt-based deterministic keypair derivation

### Out of Scope

- Mobile native wrapper — web-first protocol, native later
- Framework-specific bindings (Svelte/React components) — SDK is framework-agnostic by design
- Multi-shell federation — single shell per page for v1
- IndexedDB storage backend — localStorage sufficient for v1
- Key rotation for ephemeral keypairs — complexity not justified yet
- Rate limiting on signer requests — document expected behavior, don't enforce yet
- Restrictive ACL default mode — permissive default for developer adoption (v0.2.0 adds proper enforcement, restrictive mode later)
- Manifest signature verification in shell — deferred to post-v1 security hardening
- NIP PR submission — spec needs iterations before community submission

## Context

- **Current state**: v0.1.0-alpha.1 with 8,690 LOC TypeScript across 3 packages + demo app + test suite. 78 commits, 201 files.
- **Tech stack**: TypeScript 5.9, Vite 6.3, tsup 8.5, turborepo 2.5, pnpm 10.8, Vitest 4 + Playwright for testing, UnoCSS for demo styling.
- **Test coverage**: 66 Playwright e2e tests covering AUTH (9), message routing (9), replay (5), lifecycle (5), ACL (9), storage (9), signer (7), inter-pane (6), infrastructure (7).
- **Known remaining issues**: ACL enforcement gaps (delivery-time checks missing). Permissive ACL default. postMessage origin '*' trust boundary. Fake event IDs on shell-injected events. pseudo-relay naming needs cleanup.
- **NIP-5A spec**: Refined SPEC.md at repo root (41KB+). References NIP-5A and nostr-protocol/nips#2287 for aggregate hash.

## Constraints

- **ESM-only**: No CJS output — all packages are ESM
- **Zero framework deps**: No Svelte, React, Vue — framework-agnostic SDK
- **nostr-tools peer dep**: shim and shell depend on nostr-tools >=2.23.3 <3.0.0
- **iframe sandbox**: No allow-same-origin — everything proxied via postMessage
- **Monorepo tooling**: pnpm workspaces + turborepo + tsup + changesets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extract from hyprgate rather than rewrite | Proven protocol implementation, minimize risk | ✓ Good — packages working with targeted fixes |
| Behavioral tests over unit tests first | Visually confirm protocol works end-to-end before testing internals | ✓ Good — 66 Playwright tests prove the protocol |
| Refine existing NIP-5A spec, not write new | Spec already captures protocol; implementation surfaced 11 needed changes | ✓ Good — SPEC.md refined with all implementation learnings |
| Permissive ACL default kept for v0.1 | Ease of development; document risk, add restrictive mode later | ✓ Good — tests verify permissive behavior, restrictive mode deferred |
| Relay URI `shell://` | Clear direction signal (napplet → shell) | ✓ Good |
| Storage keys() uses repeated NIP tags | Follows Nostr convention, eliminates comma-join delimiter bug | ✓ Good |
| Missing AUTH tags fail (strict) | Napplets must build correctly; prevents misconfigured apps | ✓ Good — AUTH-08/09 tests verify |
| Pre-AUTH queue capped at 50 | Prevents memory abuse, configurable globally and per-napp | ✓ Good |
| Vite plugin is dev-only | Community deploy tools handle production manifests | ✓ Good — clear separation of concerns |
| Chat + Bot demo napplets | Interactive, demonstrates all capabilities, teachable bot | ✓ Good |
| UnoCSS for demo styling | Tailwind-compatible, Vite ecosystem, easy to modify | ✓ Good |
| UTF-8 byte count for storage quota | Consistent cross-platform, replaces inconsistent Blob approach | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

## Current Milestone: v0.2.0 Shell Architecture Cleanup

**Goal:** Redesign the shell's core architecture — rename pseudo-relay to ShellBridge, extract ACL into a pure WASM-ready module with a single enforcement point, write exhaustive behavioral tests, and clean up code quality.

**Target features:**
- Rename pseudo-relay → ShellBridge
- Pure ACL module (WASM-compilable, deterministic)
- Single enforcement point — all messages through one gate
- Capability × action behavioral test matrix
- Consistent naming and clean interfaces throughout shell

---
*Last updated: 2026-03-30 after v0.2.0 milestone kickoff*
